# La Tanda Chain — Validator Monitoring Stack

A turnkey Prometheus + Grafana + Alertmanager stack for La Tanda Chain validators.

Brings up a complete, deployable monitoring stack alongside a `latandad`
validator with a single `docker compose up -d`. Targets are scraped from the
node's CometBFT instrumentation port, Cosmos SDK telemetry, the host kernel
(via node_exporter), and HTTP/TCP liveness probes (via blackbox_exporter).
Validator-specific state that is not on the CometBFT metrics endpoint —
**jail status, signing-info missed_blocks, governance proposals, bonded pool
totals, network height** — is collected by a small Python sidecar
(`cosmos-validator-exporter/`) that polls the chain's REST API.

---

## Why this exists

CometBFT's `/metrics` endpoint exposes consensus, p2p, and mempool stats but
**does not export a validator's jail status, signing-info missed_blocks
counter, or chain-wide staking / governance state**. Operators have to either:

- write ad-hoc bash scripts polling `latandad query …` and pipe them into a
  textfile collector, or
- run a community tool whose dependencies they cannot audit.

The included `cosmos-validator-exporter` is ~250 lines of self-contained
Python. It hits documented Cosmos SDK REST endpoints, has no plugins, and is
built and pinned in this same repo so a reviewer can read every line.

---

## What's in the stack

| Service                       | Image                              | Port (host)     | Purpose                                          |
| ----------------------------- | ---------------------------------- | --------------- | ------------------------------------------------ |
| Prometheus                    | `prom/prometheus:v2.54.1`          | 9090            | Scrape + alert evaluation (30d retention)        |
| Alertmanager                  | `prom/alertmanager:v0.27.0`        | 9093            | Discord + Telegram routing                       |
| Grafana                       | `grafana/grafana-oss:11.2.2`       | 3000            | 4 auto-provisioned dashboards                    |
| node-exporter                 | `prom/node-exporter:v1.8.2`        | 9100            | Host CPU/memory/disk/network                     |
| blackbox-exporter             | `prom/blackbox-exporter:v0.25.0`   | 9115            | RPC + REST + P2P liveness probes                 |
| cosmos-validator-exporter     | (built locally, pinned at `0.1.0`) | 9101            | Jail / signing-info / gov / pool / network height|

All ports are bound to `127.0.0.1` by default. To expose Grafana or
Prometheus externally, edit `docker-compose.yml` or put a reverse proxy
(Caddy, nginx, Cloudflare Tunnel) in front.

All images are pinned to explicit versions — no `:latest` anywhere.

---

## Quick start

```bash
# 1. On the validator host, enable CometBFT prometheus + Cosmos SDK telemetry:
#    ~/.latanda/config/config.toml
#       [instrumentation]
#       prometheus = true
#       prometheus_listen_addr = ":26660"
#
#    ~/.latanda/config/app.toml
#       [telemetry]
#       enabled = true
#       prometheus-retention-time = 60
#       [api]
#       enable = true
#       prometheus = true

# 2. Restart latandad so the changes take effect.

# 3. Clone this repo on the same host (or a host that can reach the node on
#    ports 26656/26657/26660/1317) and bring up the stack.
git clone https://github.com/INDIGOAZUL/la-tanda-web.git
cd la-tanda-web/monitoring

cp .env.example .env
# Edit .env — at minimum fill in:
#   VALIDATOR_OPERATOR_ADDRESS, VALIDATOR_CONSENSUS_ADDRESS, VALIDATOR_MONIKER
#   GRAFANA_ADMIN_PASSWORD
#   DISCORD_WEBHOOK_URL and/or TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID

docker compose up -d

# 4. Open Grafana
open http://localhost:3000   # login with admin + GRAFANA_ADMIN_PASSWORD
```

Tested on a fresh Ubuntu 22.04 LTS server with Docker 27 + the Compose v2
plugin. No extra packages required.

---

## How to find your validator addresses

On the node host:

```bash
# Operator address (ltdvaloper...)
latandad keys show <your-key-name> --bech val | grep address

# Consensus address (ltdvalcons...)
latandad tendermint show-address
```

Put both into `.env` as `VALIDATOR_OPERATOR_ADDRESS` and
`VALIDATOR_CONSENSUS_ADDRESS`.

---

## Alert rules

Six alerts ship configured against the **live slashing parameters of
`latanda-testnet-1`** as queried 2026-05-12:

```json
{
  "signed_blocks_window":      "10000",
  "min_signed_per_window":     "0.500000000000000000",
  "downtime_jail_duration":    "600s",
  "slash_fraction_double_sign":"0.050000000000000000",
  "slash_fraction_downtime":   "0.010000000000000000"
}
```

| Severity | Alert                            | Condition                                          |
| -------- | -------------------------------- | -------------------------------------------------- |
| critical | `ValidatorJailed`                | `cosmos_validator_jailed == 1`                     |
| critical | `ValidatorMissedBlocksCritical`  | missed > 4000 (40% of 10000 window)                |
| warning  | `ValidatorMissedBlocksWarning`   | missed > 2000 (20% of 10000 window)                |
| warning  | `ValidatorLowPeerCount`          | `cometbft_p2p_peers < 3` for 5m                    |
| critical | `NodeDown` / `RpcUnreachable`    | scrape failure / blackbox probe failure            |
| info     | `NewGovernanceProposalActive`    | `cosmos_gov_proposal_voting_active == 1`           |

Plus chain-liveness alerts (`BlockProductionStalled`, `NodeBehindNetwork`)
that are not strictly required by the bounty issue but are needed in
practice — they fire if the node halts or falls behind the network head.

See [`prometheus/alerts.yml`](./prometheus/alerts.yml) for full rule
definitions and runbook links.

---

## Dashboards

Auto-provisioned to the **La Tanda** folder in Grafana. No manual import.

1. **Validator Overview** (`latanda-validator-overview`) — jail status,
   uptime %, missed blocks, peer count, voting power, commission, tombstone.
2. **Block Production** (`latanda-block-production`) — latest height, block
   time, network vs local height lag, block size, mempool, TPS.
3. **Network Health** (`latanda-network-health`) — bonded/unbonded validator
   counts, total bonded LTD, active governance proposals table.
4. **Node Performance** (`latanda-node-performance`) — CPU, memory, disk,
   network I/O, CometBFT p2p bandwidth, disk IOPS.

Each dashboard refreshes every 15-30s and defaults to the most useful time
range for that view.

---

## Testing alert rules against a jailed validator

See [`VALIDATOR_GUIDE.md`](./VALIDATOR_GUIDE.md#testing-the-jail-alert) for
the step-by-step procedure. The short version:

```bash
# Stop the validator and wait for downtime jailing.
sudo systemctl stop latandad   # or `pm2 stop latanda-chain`

# Watch the alert fire on Alertmanager:
curl -s http://localhost:9093/api/v2/alerts | jq '.[] | .labels.alertname'
```

The `scripts/test-jail-alert.sh` helper automates the verification (it polls
the slashing endpoint and confirms `jailed: true`, then confirms the
`ValidatorJailed` alert reached Alertmanager).

---

## Layout

```
monitoring/
├── README.md                              # this file
├── VALIDATOR_GUIDE.md                     # operational guide for validators
├── .env.example                           # env template (copy to .env)
├── docker-compose.yml                     # full stack
├── prometheus/
│   ├── prometheus.yml                     # scrape config (no hardcoded latanda.online)
│   ├── alerts.yml                         # 6 required alerts + chain-liveness
│   ├── recording_rules.yml                # SLO recording rules
│   └── blackbox.yml                       # blackbox-exporter modules
├── alertmanager/
│   └── alertmanager.yml.template          # rendered at startup from .env
├── grafana/
│   ├── provisioning/
│   │   ├── datasources/prometheus.yml
│   │   └── dashboards/default.yml
│   └── dashboards/
│       ├── validator-overview.json
│       ├── block-production.json
│       ├── network-health.json
│       └── node-performance.json
├── cosmos-validator-exporter/
│   ├── Dockerfile                         # pinned python:3.12.5-alpine3.20
│   ├── requirements.txt                   # pinned prometheus-client + requests
│   └── exporter.py                        # ~250 lines, self-contained
└── scripts/
    └── test-jail-alert.sh                 # alert verification helper
```

---

## Security notes

- All ports are bound to `127.0.0.1` — nothing on the monitoring stack is
  publicly reachable unless you put a reverse proxy in front.
- Containers run as non-root where the base image allows it.
- No hardcoded references to `latanda.online`. Targets default to
  `host.docker.internal:<port>` which Docker Compose maps to the host
  gateway on both Linux and Docker Desktop.
- Grafana anonymous access is disabled, sign-up is disabled, analytics
  reporting is disabled.
- The cosmos-validator-exporter image is built locally from the
  `cosmos-validator-exporter/` directory in this repo. There is no opaque
  third-party container in the pipeline.

---

## Roadmap (not required by bounty, but useful)

- Optional `loki` + `promtail` sidecars for log aggregation.
- Optional reverse-proxy with TLS for remote Grafana access.
- Kubernetes manifests (Kustomize) for validators running on K8s.
- A second profile that scrapes multiple validators from one stack.
