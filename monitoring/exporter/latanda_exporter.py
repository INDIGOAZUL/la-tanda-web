#!/usr/bin/env python3
"""Prometheus exporter for La Tanda Chain validator state.

CometBFT's own metrics only describe the node that serves them. Jail status,
missed blocks, voting power and governance are chain state, so this exporter
reads them from the Cosmos REST API (and block proposers from CometBFT RPC)
and publishes them as Prometheus metrics. It only reads public endpoints and
never needs keys.

Configuration is environment-only, see example.env.
"""

import base64
import hashlib
import json
import logging
import os
import re
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

from prometheus_client import start_http_server
from prometheus_client.core import REGISTRY, CounterMetricFamily, GaugeMetricFamily

log = logging.getLogger("latanda_exporter")

# Cosmos SDK default: 1 unit of voting power = 10^6 base denom (1 LTD = 10^6 ultd).
POWER_REDUCTION = 10**6
# CometBFT RPC returns at most 20 block metas per /blockchain call.
BLOCKCHAIN_PAGE = 20
# Upper bound of blocks fetched per poll, so a long outage doesn't trigger a burst
# of RPC calls. Proposer counts skip ahead after that (documented in README).
MAX_BLOCKS_PER_POLL = 400


def env_str(name, default=""):
    return os.environ.get(name, default).strip()


def env_list(name):
    return [item.strip() for item in env_str(name).split(",") if item.strip()]


# --- bech32 (BIP-173), needed to derive ltdvalcons addresses -------------------

_CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l"


def _polymod(values):
    gen = [0x3B6A57B2, 0x26508E6D, 0x1EA119FA, 0x3D4233DD, 0x2A1462B3]
    chk = 1
    for value in values:
        top = chk >> 25
        chk = (chk & 0x1FFFFFF) << 5 ^ value
        for i in range(5):
            chk ^= gen[i] if ((top >> i) & 1) else 0
    return chk


def _hrp_expand(hrp):
    return [ord(c) >> 5 for c in hrp] + [0] + [ord(c) & 31 for c in hrp]


def _convertbits(data, frombits, tobits):
    acc, bits, out = 0, 0, []
    maxv = (1 << tobits) - 1
    for value in data:
        acc = (acc << frombits) | value
        bits += frombits
        while bits >= tobits:
            bits -= tobits
            out.append((acc >> bits) & maxv)
    if bits:
        out.append((acc << (tobits - bits)) & maxv)
    return out


def bech32_encode(hrp, raw):
    data = _convertbits(raw, 8, 5)
    polymod = _polymod(_hrp_expand(hrp) + data + [0] * 6) ^ 1
    checksum = [(polymod >> 5 * (5 - i)) & 31 for i in range(6)]
    return hrp + "1" + "".join(_CHARSET[d] for d in data + checksum)


# --- helpers --------------------------------------------------------------------

def parse_time(value):
    """RFC 3339 with nanoseconds ("2026-10-29T10:00:00.123456789Z") -> unix seconds."""
    if not value:
        return 0.0
    match = re.match(r"(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(\.\d+)?Z?$", value)
    if not match:
        return 0.0
    base = datetime.strptime(match.group(1), "%Y-%m-%dT%H:%M:%S").replace(tzinfo=timezone.utc)
    fraction = float(match.group(2)) if match.group(2) else 0.0
    return base.timestamp() + fraction


def clean_label(value, limit=64):
    value = re.sub(r"[\x00-\x1f]", " ", str(value or "")).strip()
    return value[:limit]


class ChainClient:
    def __init__(self, rest_url, rpc_url, timeout):
        self.rest_url = rest_url.rstrip("/")
        self.rpc_url = rpc_url.rstrip("/") if rpc_url else ""
        self.timeout = timeout

    def _get(self, url):
        req = urllib.request.Request(url, headers={"Accept": "application/json",
                                                   "User-Agent": "latanda-exporter"})
        with urllib.request.urlopen(req, timeout=self.timeout) as resp:
            return json.load(resp)

    def rest(self, path, **params):
        query = ("?" + urllib.parse.urlencode(params)) if params else ""
        return self._get(f"{self.rest_url}{path}{query}")

    def rpc(self, path, **params):
        query = ("?" + urllib.parse.urlencode(params)) if params else ""
        return self._get(f"{self.rpc_url}{path}{query}")


class Poller:
    """Polls the chain in the background; scrapes only read the last snapshot."""

    def __init__(self, client, watch_list, interval):
        self.client = client
        self.watch_list = set(watch_list)
        self.interval = interval
        self.lock = threading.Lock()
        self.snapshot = None
        self.up = 0
        self.last_success = 0.0
        self.last_duration = 0.0
        self.proposed = {}            # operator_address -> blocks proposed since start
        self.last_seen_height = 0
        self.block_time = None        # average seconds per block over the last page
        self.latest_height = 0
        self.latest_block_time = 0.0

    def run(self):
        while True:
            started = time.time()
            try:
                snapshot = self.collect_chain_state()
                with self.lock:
                    self.snapshot = snapshot
                    self.up = 1
                    self.last_success = time.time()
            except (urllib.error.URLError, OSError, ValueError, KeyError) as exc:
                log.warning("poll failed: %s", exc)
                with self.lock:
                    self.up = 0
            with self.lock:
                self.last_duration = time.time() - started
            time.sleep(max(1.0, self.interval - (time.time() - started)))

    def collect_chain_state(self):
        c = self.client
        slashing = c.rest("/cosmos/slashing/v1beta1/params")["params"]
        pool = c.rest("/cosmos/staking/v1beta1/pool")["pool"]
        validators = c.rest("/cosmos/staking/v1beta1/validators",
                            **{"pagination.limit": "1000"})["validators"]
        infos = c.rest("/cosmos/slashing/v1beta1/signing_infos",
                       **{"pagination.limit": "1000"})["info"]
        proposals = c.rest("/cosmos/gov/v1/proposals",
                           proposal_status="PROPOSAL_STATUS_VOTING_PERIOD",
                           **{"pagination.limit": "100"})["proposals"]

        info_by_cons = {i["address"]: i for i in infos}
        rows, by_hex = [], {}
        for v in validators:
            operator = v["operator_address"]
            # "ltdvaloper1..." -> "ltd"; the consensus prefix follows from it.
            prefix = operator.split("1", 1)[0].removesuffix("valoper")
            pubkey = v.get("consensus_pubkey") or {}
            info = None
            if pubkey.get("@type", "").endswith("ed25519.PubKey"):
                addr = hashlib.sha256(base64.b64decode(pubkey["key"])).digest()[:20]
                info = info_by_cons.get(bech32_encode(prefix + "valcons", addr))
                by_hex[addr.hex().upper()] = operator
            rows.append({
                "operator": operator,
                "moniker": clean_label((v.get("description") or {}).get("moniker")),
                "jailed": 1 if v.get("jailed") else 0,
                "bonded": 1 if v.get("status") == "BOND_STATUS_BONDED" else 0,
                "status": v.get("status", ""),
                "voting_power": int(v.get("tokens", "0")) / POWER_REDUCTION,
                "missed": int(info["missed_blocks_counter"]) if info else None,
                "tombstoned": 1 if info and info.get("tombstoned") else 0,
                "jailed_until": parse_time(info.get("jailed_until")) if info else 0.0,
            })

        if self.client.rpc_url:
            self.update_blocks(by_hex)
        else:
            latest = c.rest("/cosmos/base/tendermint/v1beta1/blocks/latest")
            header = (latest.get("sdk_block") or latest.get("block"))["header"]
            with self.lock:
                self.latest_height = int(header["height"])
                self.latest_block_time = parse_time(header["time"])

        return {
            "signed_blocks_window": int(slashing["signed_blocks_window"]),
            "min_signed_per_window": float(slashing["min_signed_per_window"]),
            "downtime_jail_duration": float(slashing["downtime_jail_duration"].rstrip("s")),
            "bonded_tokens": int(pool["bonded_tokens"]) / POWER_REDUCTION,
            "not_bonded_tokens": int(pool["not_bonded_tokens"]) / POWER_REDUCTION,
            "validators": rows,
            "proposals": [{
                "id": str(p["id"]),
                "title": clean_label(p.get("title") or p.get("summary") or f"proposal {p['id']}"),
                "voting_end": parse_time(p.get("voting_end_time")),
            } for p in proposals],
        }

    def update_blocks(self, by_hex):
        status = self.client.rpc("/status")["result"]["sync_info"]
        latest = int(status["latest_block_height"])
        start = self.last_seen_height + 1
        # First poll or long gap: read only the latest page (for block time) and
        # don't count its proposers, they may have been counted before.
        count_proposers = self.last_seen_height != 0 and latest - start < MAX_BLOCKS_PER_POLL
        if not count_proposers:
            start = max(1, latest - BLOCKCHAIN_PAGE + 1)
        metas = []
        low = start
        while low <= latest:
            high = min(latest, low + BLOCKCHAIN_PAGE - 1)
            page = self.client.rpc("/blockchain", minHeight=low, maxHeight=high)["result"]
            metas.extend(page["block_metas"])
            low = high + 1
        headers = sorted((m["header"] for m in metas), key=lambda h: int(h["height"]))
        with self.lock:
            if count_proposers:
                for h in headers:
                    operator = by_hex.get(h["proposer_address"].upper())
                    if operator:
                        self.proposed[operator] = self.proposed.get(operator, 0) + 1
            recent = headers[-BLOCKCHAIN_PAGE:]
            if len(recent) >= 2:
                span = parse_time(recent[-1]["time"]) - parse_time(recent[0]["time"])
                self.block_time = span / (len(recent) - 1)
            if headers:
                self.latest_height = int(headers[-1]["height"])
                self.latest_block_time = parse_time(headers[-1]["time"])
            self.last_seen_height = latest


class Collector:
    def __init__(self, poller):
        self.poller = poller

    def collect(self):
        p = self.poller
        with p.lock:
            snap, up, last_success, duration = p.snapshot, p.up, p.last_success, p.last_duration
            proposed = dict(p.proposed)
            block_time, height, block_ts = p.block_time, p.latest_height, p.latest_block_time

        yield GaugeMetricFamily("latanda_exporter_up",
                                "1 if the last poll of the chain API succeeded.", value=up)
        yield GaugeMetricFamily("latanda_exporter_last_success_timestamp_seconds",
                                "Unix time of the last successful poll.", value=last_success)
        yield GaugeMetricFamily("latanda_exporter_poll_duration_seconds",
                                "Duration of the last poll.", value=duration)
        yield GaugeMetricFamily("latanda_exporter_watch_list_configured",
                                "1 if WATCH_VALIDATORS is set (alerts only for those validators).",
                                value=1 if p.watch_list else 0)
        if snap is None:
            return

        yield GaugeMetricFamily("latanda_slashing_signed_blocks_window",
                                "Slashing param signed_blocks_window.", value=snap["signed_blocks_window"])
        yield GaugeMetricFamily("latanda_slashing_min_signed_per_window",
                                "Slashing param min_signed_per_window.", value=snap["min_signed_per_window"])
        yield GaugeMetricFamily("latanda_slashing_downtime_jail_duration_seconds",
                                "Slashing param downtime_jail_duration.", value=snap["downtime_jail_duration"])
        yield GaugeMetricFamily("latanda_staking_bonded_tokens",
                                "Bonded stake of the whole chain, in LTD.", value=snap["bonded_tokens"])
        yield GaugeMetricFamily("latanda_staking_not_bonded_tokens",
                                "Not bonded stake of the whole chain, in LTD.", value=snap["not_bonded_tokens"])
        if height:
            yield GaugeMetricFamily("latanda_chain_latest_block_height",
                                    "Latest block height seen by the exporter.", value=height)
            yield GaugeMetricFamily("latanda_chain_latest_block_timestamp_seconds",
                                    "Header time of the latest block.", value=block_ts)
        if block_time is not None:
            yield GaugeMetricFamily("latanda_chain_block_time_seconds",
                                    "Average block time over the last 20 blocks.", value=block_time)

        labels = ["operator_address", "moniker", "watched"]
        g = {name: GaugeMetricFamily(f"latanda_validator_{name}", doc, labels=labels) for name, doc in [
            ("jailed", "1 if the validator is jailed."),
            ("bonded", "1 if the validator is in the active (bonded) set."),
            ("voting_power", "Validator stake in LTD."),
            ("missed_blocks", "Missed blocks in the current signed_blocks_window."),
            ("tombstoned", "1 if the validator is tombstoned (double sign)."),
            ("jailed_until_timestamp_seconds", "Unix time until which the validator is jailed (0 if never)."),
        ]}
        proposed_metric = CounterMetricFamily(
            "latanda_validator_blocks_proposed",
            "Blocks proposed since the exporter started (needs CHAIN_RPC_URL).", labels=labels)
        counts = {}
        found = set()
        for row in snap["validators"]:
            watched = "true" if not p.watch_list or row["operator"] in p.watch_list else "false"
            if row["operator"] in p.watch_list:
                found.add(row["operator"])
            lv = [row["operator"], row["moniker"], watched]
            g["jailed"].add_metric(lv, row["jailed"])
            g["bonded"].add_metric(lv, row["bonded"])
            g["voting_power"].add_metric(lv, row["voting_power"])
            g["tombstoned"].add_metric(lv, row["tombstoned"])
            g["jailed_until_timestamp_seconds"].add_metric(lv, row["jailed_until"])
            if row["missed"] is not None:
                g["missed_blocks"].add_metric(lv, row["missed"])
            if p.client.rpc_url:
                proposed_metric.add_metric(lv, proposed.get(row["operator"], 0))
            key = row["status"].removeprefix("BOND_STATUS_").lower() or "unknown"
            counts[key] = counts.get(key, 0) + 1
        yield from g.values()
        if p.client.rpc_url:
            yield proposed_metric

        by_status = GaugeMetricFamily("latanda_validators", "Number of validators by status.",
                                      labels=["status"])
        for status, n in sorted(counts.items()):
            by_status.add_metric([status], n)
        yield by_status
        yield GaugeMetricFamily("latanda_validators_jailed", "Number of jailed validators.",
                                value=sum(r["jailed"] for r in snap["validators"]))

        missing = GaugeMetricFamily("latanda_exporter_watched_validator_missing",
                                    "1 if an address from WATCH_VALIDATORS is not on chain (typo?).",
                                    labels=["operator_address"])
        for operator in sorted(p.watch_list):
            missing.add_metric([operator], 0 if operator in found else 1)
        yield missing

        active = GaugeMetricFamily("latanda_gov_proposal_active",
                                   "1 for every proposal in voting period.",
                                   labels=["proposal_id", "title"])
        ends = GaugeMetricFamily("latanda_gov_proposal_voting_end_timestamp_seconds",
                                 "Voting end time of proposals in voting period.",
                                 labels=["proposal_id"])
        for prop in snap["proposals"]:
            active.add_metric([prop["id"], prop["title"]], 1)
            ends.add_metric([prop["id"]], prop["voting_end"])
        yield active
        yield ends
        yield GaugeMetricFamily("latanda_gov_proposals_active",
                                "Number of proposals in voting period.", value=len(snap["proposals"]))


def main():
    logging.basicConfig(level=env_str("LOG_LEVEL", "INFO").upper(),
                        format="%(asctime)s %(levelname)s %(message)s")
    client = ChainClient(env_str("CHAIN_REST_URL", "http://localhost:1317"),
                         env_str("CHAIN_RPC_URL", "http://localhost:26657"),
                         float(env_str("REQUEST_TIMEOUT", "10")))
    poller = Poller(client, env_list("WATCH_VALIDATORS"), float(env_str("POLL_INTERVAL", "30")))
    REGISTRY.register(Collector(poller))
    listen = env_str("EXPORTER_LISTEN", "127.0.0.1")
    port = int(env_str("EXPORTER_PORT", "9561"))
    start_http_server(port, addr=listen)
    log.info("listening on %s:%d, REST %s, RPC %s, watching %s", listen, port,
             client.rest_url, client.rpc_url or "-", ",".join(sorted(poller.watch_list)) or "all")
    poller.run()


if __name__ == "__main__":
    main()
