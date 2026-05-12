"""
Cosmos validator exporter for La Tanda Chain.

Polls the chain's REST API (Cosmos SDK / gRPC-gateway) at a configurable
interval and exposes a small set of Prometheus metrics not available from
CometBFT's native instrumentation port:

  cosmos_validator_jailed{moniker,operator_address,chain_id}                  gauge
  cosmos_validator_tokens{moniker,operator_address,chain_id}                  gauge
  cosmos_validator_voting_power{moniker,operator_address,chain_id}            gauge
  cosmos_validator_commission_rate{moniker,operator_address,chain_id}         gauge
  cosmos_validator_missed_blocks_counter{moniker,consensus_address,chain_id}  gauge
  cosmos_validator_tombstoned{moniker,consensus_address,chain_id}             gauge
  cosmos_validators_total{chain_id,status}                                    gauge
  cosmos_staking_bonded_tokens{chain_id}                                      gauge
  cosmos_network_block_height{chain_id}                                       gauge
  cosmos_gov_proposal_voting_active{proposal_id,title,voting_end_time}        gauge
  cosmos_exporter_poll_errors_total{endpoint}                                 counter
  cosmos_exporter_last_poll_timestamp                                         gauge

This file is intentionally self-contained — no plugins, no per-chain forks.
"""

from __future__ import annotations

import logging
import os
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, HTTPServer

import requests
from prometheus_client import (
    REGISTRY,
    CollectorRegistry,
    Counter,
    Gauge,
    generate_latest,
    CONTENT_TYPE_LATEST,
)

LOG = logging.getLogger("cosmos-validator-exporter")

# ---------------------------------------------------------------------------
# Configuration (env-driven)
# ---------------------------------------------------------------------------

NODE_API_URL = os.environ.get("NODE_API_URL", "http://host.docker.internal:1317").rstrip("/")
OPERATOR_ADDRESS = os.environ.get("VALIDATOR_OPERATOR_ADDRESS", "").strip()
CONSENSUS_ADDRESS = os.environ.get("VALIDATOR_CONSENSUS_ADDRESS", "").strip()
MONIKER = os.environ.get("VALIDATOR_MONIKER", "unknown").strip()
CHAIN_ID = os.environ.get("CHAIN_ID", "latanda-testnet-1").strip()
POLL_INTERVAL = max(5, int(os.environ.get("POLL_INTERVAL", "30")))
LISTEN_PORT = int(os.environ.get("LISTEN_PORT", "9101"))
REQUEST_TIMEOUT = float(os.environ.get("REQUEST_TIMEOUT", "8"))

LABELS_VAL = ("moniker", "operator_address", "chain_id")
LABELS_CONS = ("moniker", "consensus_address", "chain_id")

# ---------------------------------------------------------------------------
# Metrics (one process-wide registry, no per-scrape collection)
# ---------------------------------------------------------------------------

g_val_jailed = Gauge(
    "cosmos_validator_jailed",
    "1 if the validator is currently jailed, 0 otherwise.",
    LABELS_VAL,
)
g_val_tokens = Gauge(
    "cosmos_validator_tokens",
    "Total tokens (in base denom) bonded to this validator.",
    LABELS_VAL,
)
g_val_power = Gauge(
    "cosmos_validator_voting_power",
    "Validator voting power (tokens / power_reduction).",
    LABELS_VAL,
)
g_val_commission = Gauge(
    "cosmos_validator_commission_rate",
    "Validator commission rate (0..1).",
    LABELS_VAL,
)

g_val_missed = Gauge(
    "cosmos_validator_missed_blocks_counter",
    "Missed blocks counter from slashing signing-info.",
    LABELS_CONS,
)
g_val_tombstoned = Gauge(
    "cosmos_validator_tombstoned",
    "1 if validator is tombstoned (permanently slashed), 0 otherwise.",
    LABELS_CONS,
)

g_validators_total = Gauge(
    "cosmos_validators_total",
    "Total validators on the chain by status.",
    ("chain_id", "status"),
)
g_bonded_tokens = Gauge(
    "cosmos_staking_bonded_tokens",
    "Total bonded tokens in base denom.",
    ("chain_id",),
)
g_network_height = Gauge(
    "cosmos_network_block_height",
    "Network block height reported by the REST API.",
    ("chain_id",),
)
g_gov_active = Gauge(
    "cosmos_gov_proposal_voting_active",
    "1 for each proposal currently in voting period.",
    ("proposal_id", "title", "voting_end_time", "chain_id"),
)

c_errors = Counter(
    "cosmos_exporter_poll_errors_total",
    "Number of poll errors by endpoint.",
    ("endpoint",),
)
g_last_poll = Gauge(
    "cosmos_exporter_last_poll_timestamp",
    "Unix timestamp of the last successful poll.",
)
g_info = Gauge(
    "cosmos_exporter_info",
    "Static info (always 1).",
    ("version", "chain_id", "node_api_url"),
)
g_info.labels("0.1.0", CHAIN_ID, NODE_API_URL).set(1)

# ---------------------------------------------------------------------------
# REST API helpers
# ---------------------------------------------------------------------------

session = requests.Session()
session.headers.update({"User-Agent": "latanda-cosmos-validator-exporter/0.1.0"})


def _get(endpoint: str) -> dict | None:
    """GET a Cosmos SDK REST path. Returns parsed JSON or None on error."""
    url = f"{NODE_API_URL}{endpoint}"
    try:
        resp = session.get(url, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        return resp.json()
    except Exception as exc:
        c_errors.labels(endpoint).inc()
        LOG.warning("GET %s failed: %s", url, exc)
        return None


def _val_labels() -> dict:
    return {
        "moniker": MONIKER,
        "operator_address": OPERATOR_ADDRESS or "unset",
        "chain_id": CHAIN_ID,
    }


def _cons_labels() -> dict:
    return {
        "moniker": MONIKER,
        "consensus_address": CONSENSUS_ADDRESS or "unset",
        "chain_id": CHAIN_ID,
    }


# ---------------------------------------------------------------------------
# Pollers
# ---------------------------------------------------------------------------

def poll_validator() -> None:
    """Stake / commission / jailed status from /cosmos/staking/v1beta1/validators/{addr}."""
    if not OPERATOR_ADDRESS:
        return
    data = _get(f"/cosmos/staking/v1beta1/validators/{OPERATOR_ADDRESS}")
    if not data or "validator" not in data:
        return
    v = data["validator"]
    labels = _val_labels()
    try:
        tokens = float(v.get("tokens", "0"))
    except (TypeError, ValueError):
        tokens = 0.0
    g_val_tokens.labels(**labels).set(tokens)
    # Voting power = tokens / 1_000_000 for Cosmos SDK chains using default
    # power_reduction. La Tanda uses ultd (1 LTD = 1e6 ultd).
    g_val_power.labels(**labels).set(tokens / 1_000_000.0)
    try:
        rate = float(v.get("commission", {}).get("commission_rates", {}).get("rate", "0"))
    except (TypeError, ValueError, AttributeError):
        rate = 0.0
    g_val_commission.labels(**labels).set(rate)
    g_val_jailed.labels(**labels).set(1.0 if v.get("jailed") else 0.0)


def poll_signing_info() -> None:
    """Missed blocks + tombstoned flag from slashing signing-info."""
    if not CONSENSUS_ADDRESS:
        return
    data = _get(f"/cosmos/slashing/v1beta1/signing_infos/{CONSENSUS_ADDRESS}")
    if not data or "val_signing_info" not in data:
        return
    info = data["val_signing_info"]
    labels = _cons_labels()
    try:
        missed = float(info.get("missed_blocks_counter", "0"))
    except (TypeError, ValueError):
        missed = 0.0
    g_val_missed.labels(**labels).set(missed)
    g_val_tombstoned.labels(**labels).set(1.0 if info.get("tombstoned") else 0.0)


def poll_validators_total() -> None:
    """Count of validators by status across the chain."""
    counts = {"BOND_STATUS_BONDED": 0, "BOND_STATUS_UNBONDED": 0, "BOND_STATUS_UNBONDING": 0}
    next_key = None
    for _ in range(5):  # cap pagination at 5 pages to be safe
        params = {"pagination.limit": "200"}
        if next_key:
            params["pagination.key"] = next_key
        try:
            resp = session.get(
                f"{NODE_API_URL}/cosmos/staking/v1beta1/validators",
                params=params,
                timeout=REQUEST_TIMEOUT,
            )
            resp.raise_for_status()
            data = resp.json()
        except Exception as exc:
            c_errors.labels("/cosmos/staking/v1beta1/validators").inc()
            LOG.warning("validators list failed: %s", exc)
            return
        for v in data.get("validators", []):
            counts[v.get("status", "BOND_STATUS_BONDED")] = counts.get(v.get("status"), 0) + 1
        next_key = (data.get("pagination") or {}).get("next_key")
        if not next_key:
            break
    for status, n in counts.items():
        g_validators_total.labels(chain_id=CHAIN_ID, status=status).set(n)


def poll_staking_pool() -> None:
    data = _get("/cosmos/staking/v1beta1/pool")
    if not data or "pool" not in data:
        return
    try:
        bonded = float(data["pool"].get("bonded_tokens", "0"))
    except (TypeError, ValueError):
        bonded = 0.0
    g_bonded_tokens.labels(chain_id=CHAIN_ID).set(bonded)


def poll_network_height() -> None:
    data = _get("/cosmos/base/tendermint/v1beta1/blocks/latest")
    if not data:
        return
    try:
        h = int(data["block"]["header"]["height"])
    except (KeyError, TypeError, ValueError):
        return
    g_network_height.labels(chain_id=CHAIN_ID).set(h)


def poll_governance() -> None:
    """Active (voting-period) proposals."""
    data = _get("/cosmos/gov/v1/proposals?proposal_status=2")  # 2 = PROPOSAL_STATUS_VOTING_PERIOD
    if not data:
        return
    g_gov_active.clear()
    for p in data.get("proposals", []):
        title = (p.get("title") or "").strip()[:80] or "(no title)"
        pid = str(p.get("id") or p.get("proposal_id") or "0")
        end = (p.get("voting_end_time") or "").strip() or "unknown"
        g_gov_active.labels(
            proposal_id=pid,
            title=title,
            voting_end_time=end,
            chain_id=CHAIN_ID,
        ).set(1.0)


POLLERS = (
    poll_validator,
    poll_signing_info,
    poll_validators_total,
    poll_staking_pool,
    poll_network_height,
    poll_governance,
)


def poll_loop() -> None:
    while True:
        start = time.time()
        for fn in POLLERS:
            try:
                fn()
            except Exception:
                LOG.exception("poller %s crashed", fn.__name__)
        g_last_poll.set(time.time())
        elapsed = time.time() - start
        sleep_for = max(1.0, POLL_INTERVAL - elapsed)
        time.sleep(sleep_for)


# ---------------------------------------------------------------------------
# HTTP server
# ---------------------------------------------------------------------------

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_args) -> None:  # noqa: D401
        # Silence access log noise; structured logs go through the LOG logger.
        return

    def do_GET(self) -> None:  # noqa: N802
        if self.path == "/health":
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(b"ok")
            return
        if self.path.startswith("/metrics"):
            output = generate_latest(REGISTRY)
            self.send_response(200)
            self.send_header("Content-Type", CONTENT_TYPE_LATEST)
            self.send_header("Content-Length", str(len(output)))
            self.end_headers()
            self.wfile.write(output)
            return
        self.send_response(404)
        self.end_headers()


def main() -> int:
    logging.basicConfig(
        level=os.environ.get("LOG_LEVEL", "INFO"),
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    LOG.info(
        "starting cosmos-validator-exporter: api=%s operator=%s consensus=%s "
        "moniker=%s chain=%s interval=%ss listen=:%d",
        NODE_API_URL, OPERATOR_ADDRESS or "(unset)", CONSENSUS_ADDRESS or "(unset)",
        MONIKER, CHAIN_ID, POLL_INTERVAL, LISTEN_PORT,
    )

    thread = threading.Thread(target=poll_loop, name="poll", daemon=True)
    thread.start()

    server = HTTPServer(("0.0.0.0", LISTEN_PORT), Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        LOG.info("shutting down")
    return 0


if __name__ == "__main__":
    sys.exit(main())
