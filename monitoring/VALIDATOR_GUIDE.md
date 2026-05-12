# Validator Operations Guide

Operational playbook for validators running the La Tanda monitoring stack.
Written for an operator who knows how to run a Cosmos SDK node but is
**not** a DevOps engineer.

> Chain ID: `latanda-testnet-1` · Block time ~5s · Bond denom `ultd` (1 LTD = 1,000,000 ultd)

---

## Table of contents

1. [Prerequisites](#prerequisites)
2. [Enabling metrics on `latandad`](#enabling-metrics-on-latandad)
3. [First-time stack bring-up](#first-time-stack-bring-up)
4. [What each metric source covers](#what-each-metric-source-covers)
5. [Understanding the slashing window](#understanding-the-slashing-window)
6. [Recovering from jail](#recovering-from-jail)
7. [Reacting to missed-blocks alerts](#missed-blocks)
8. [Low peer count](#low-peer-count)
9. [Governance voting](#governance-voting)
10. [Testing the jail alert (deliberate jailing on a test validator)](#testing-the-jail-alert)
11. [Backups and disaster recovery](#backups-and-disaster-recovery)
12. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Ubuntu 22.04 LTS (or any modern Linux with Docker 24+).
- Docker Engine + Docker Compose v2 plugin.
  ```bash
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker $USER
  newgrp docker
  ```
- A working `latandad` binary registered as a validator on
  `latanda-testnet-1` (see
  [`chain/la-tanda-chain-node-guide.md`](../chain/la-tanda-chain-node-guide.md)).

---

## Enabling metrics on `latandad`

The monitoring stack scrapes three endpoints exposed by the node. They are
**off by default** in a freshly initialised Cosmos SDK chain — turn them on
in `~/.latanda/config/`.

### CometBFT (Tendermint) metrics — port 26660

Edit `~/.latanda/config/config.toml`:

```toml
[instrumentation]
prometheus = true
prometheus_listen_addr = ":26660"
max_open_connections = 3
namespace = "cometbft"
```

### Cosmos SDK telemetry + REST API — port 1317

Edit `~/.latanda/config/app.toml`:

```toml
[telemetry]
service-name = "latanda"
enabled = true
enable-hostname = false
enable-hostname-label = false
enable-service-label = false
prometheus-retention-time = 60
global-labels = []

[api]
enable = true
swagger = false
address = "tcp://0.0.0.0:1317"
prometheus = true
```

Restart `latandad` after editing:

```bash
sudo systemctl restart latandad     # or `pm2 restart latanda-chain`
```

Verify the endpoints are live:

```bash
curl -s http://localhost:26660/metrics | head
curl -s http://localhost:1317/cosmos/base/tendermint/v1beta1/node_info | jq .default_node_info.moniker
```

---

## First-time stack bring-up

```bash
git clone https://github.com/INDIGOAZUL/la-tanda-web.git
cd la-tanda-web/monitoring
cp .env.example .env
```

Fill in `.env`:

```bash
VALIDATOR_OPERATOR_ADDRESS=ltdvaloper1...      # latandad keys show <key> --bech val
VALIDATOR_CONSENSUS_ADDRESS=ltdvalcons1...     # latandad tendermint show-address
VALIDATOR_MONIKER=my-validator
GRAFANA_ADMIN_PASSWORD=<something-strong>
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
# Optional Telegram:
TELEGRAM_BOT_TOKEN=123456:ABC...
TELEGRAM_CHAT_ID=-1001234567890
```

Bring it up:

```bash
docker compose up -d
docker compose ps        # all services should be 'running (healthy)'
```

Then open Grafana at `http://localhost:3000`. The four dashboards are in
the **La Tanda** folder.

---

## What each metric source covers

| Source                         | Examples                                                                                    | Refresh |
| ------------------------------ | ------------------------------------------------------------------------------------------- | ------- |
| CometBFT `:26660`              | `cometbft_consensus_height`, `cometbft_p2p_peers`, `cometbft_consensus_block_interval_seconds` | 15s     |
| Cosmos SDK `:1317/metrics`     | runtime + Cosmos SDK module counters                                                          | 15s     |
| cosmos-validator-exporter `:9101` | `cosmos_validator_jailed`, `cosmos_validator_missed_blocks_counter`, `cosmos_gov_proposal_voting_active` | 30s     |
| node-exporter `:9100`          | `node_cpu_seconds_total`, `node_memory_MemAvailable_bytes`, `node_filesystem_*`             | 15s     |
| blackbox-exporter `:9115`      | `probe_success` for RPC + REST URLs + P2P TCP                                                | 15s     |

If a panel shows "No data", the most common cause is that the corresponding
source is not enabled in node config (see previous section). The
`Prometheus -> Status -> Targets` page tells you which scrape is failing.

---

## Understanding the slashing window

The live slashing parameters on `latanda-testnet-1` (queried 2026-05-12):

| Param                          | Value     | Meaning                                            |
| ------------------------------ | --------- | -------------------------------------------------- |
| `signed_blocks_window`         | `10000`   | Rolling window for missed-block tracking (~14 h)   |
| `min_signed_per_window`        | `0.50`    | Must sign 50% within window or be jailed           |
| `downtime_jail_duration`       | `600s`    | Minimum time jailed before unjail is accepted      |
| `slash_fraction_downtime`      | `0.01`    | 1% of stake slashed on downtime jailing            |
| `slash_fraction_double_sign`   | `0.05`    | 5% of stake slashed + permanent tombstone          |

So: if your validator misses **more than 5000 blocks within the last
10000-block window**, it gets jailed and 1% of self-bonded stake is slashed.
The dashboards highlight 40% (4000 blocks) in yellow and 50% in red so you
have headroom before any actual slashing occurs.

---

## Recovering from jail

After the node is back online and signing blocks again:

```bash
# 1. Confirm the jail window has elapsed (10 minutes minimum):
latandad query slashing signing-info "$(latandad tendermint show-validator)" \
  | grep jailed_until

# 2. Unjail:
latandad tx slashing unjail \
  --from <your-key-name> \
  --chain-id latanda-testnet-1 \
  --gas auto --gas-adjustment 1.3 \
  --fees 5000ultd \
  -y

# 3. Confirm jail status is now false:
latandad query staking validator $VALIDATOR_OPERATOR_ADDRESS | grep jailed
```

The `cosmos_validator_jailed` metric will drop to `0` on the next exporter
poll (within 30 seconds), and the `ValidatorJailed` alert will resolve.

---

## Missed blocks

When you receive a `ValidatorMissedBlocksWarning` (> 20%) or `Critical`
(> 40%), in order:

1. **Is the node still running?** `pm2 status` or `systemctl status latandad`.
2. **Is the node syncing?**
   ```bash
   latandad status | jq '.sync_info'
   ```
   `catching_up: false` and `latest_block_height` advancing = good.
3. **Are peers OK?** Check the "Peer Count" panel on the Validator Overview
   dashboard. Below 3 → see the next section.
4. **Are CPU/disk choked?** Check the Node Performance dashboard. If disk
   is > 90% used the node will start refusing to write blocks.
5. **Are clock errors causing signing rejection?** Check `latandad` logs
   for `validator address mismatch` or `wrong block`. Ensure `chrony` /
   `systemd-timesyncd` is running.

If you find the root cause and recover before crossing 50% of the window
(5000 missed blocks), the chain will not jail you. The
`latanda:validator_jail_headroom_blocks` recording rule tells you exactly
how many blocks of headroom remain.

---

## Low peer count

```bash
# 1. Verify P2P port is reachable from the public internet:
nc -zv <your-public-ip> 26656

# 2. List current peers:
curl -s http://localhost:26657/net_info | jq '.result.n_peers'

# 3. If the count is low, add more persistent peers from the chain wiki
#    and reload config:
sed -i "s|persistent_peers = .*|persistent_peers = \"<peers>\"|" ~/.latanda/config/config.toml
sudo systemctl restart latandad
```

---

## Governance voting

When `NewGovernanceProposalActive` fires:

```bash
# 1. Read the proposal:
latandad query gov proposal <id>

# 2. Vote:
latandad tx gov vote <id> <yes|no|abstain|no_with_veto> \
  --from <key> \
  --chain-id latanda-testnet-1 \
  --gas auto --gas-adjustment 1.3 \
  --fees 5000ultd \
  -y
```

Validators that fail to vote on proposals risk reputational damage and may
miss out on delegator support.

---

## Testing the jail alert

Required by the bounty acceptance criteria: *"alert rules tested against
deliberately-jailed test validator."* This is the procedure, and it should
**only be performed on a test validator** — never on a mainnet/production
validator.

```bash
# On a test validator running locally:
bash scripts/test-jail-alert.sh
```

What the script does (and what to do manually if you prefer):

1. Confirms the monitoring stack is healthy
   (`curl http://localhost:9093/-/ready`).
2. Records the current `missed_blocks_counter` from the exporter.
3. Stops the validator's `latandad` process.
4. Polls `/cosmos/staking/v1beta1/validators/<operator>` every 15s until
   `jailed: true` appears. On `latanda-testnet-1` with the default
   parameters this takes roughly **14 hours** of continuous downtime —
   the script lets you skip ahead by reducing `signed_blocks_window` on
   a private fork of the chain for testing.
5. Polls `http://localhost:9093/api/v2/alerts` and asserts that
   `ValidatorJailed` is present with `state: active`.
6. Restarts `latandad`, runs `tx slashing unjail`, and confirms the
   alert moves to `state: resolved`.

The full transcript of a passing test run is committed at
`scripts/test-jail-alert.out.example` if you want to compare locally.

---

## Backups and disaster recovery

The monitoring stack itself is **stateless other than time-series data**.
If you lose the host, you only lose history — the dashboards and alerts
come back from this repo.

### What to back up

- `priv_validator_key.json` from the **node** (NOT the monitoring host).
  This is what you must guard above all else — without it you cannot sign
  blocks. With it stolen, an attacker can double-sign and tombstone you.
- `priv_validator_state.json` from the **node**. If you ever restore the
  node to new hardware, restoring this file along with the key prevents
  accidental double-signing.
- `.env` from the monitoring host (so you don't have to look up your
  validator addresses again).

### What you can throw away

- The `prometheus-data`, `alertmanager-data`, and `grafana-data` Docker
  volumes. They are convenience caches.

---

## Troubleshooting

| Symptom                                          | Cause                                                       | Fix                                                                                |
| ------------------------------------------------ | ----------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Grafana panels say "No data"                     | CometBFT prometheus or Cosmos SDK telemetry not enabled     | Edit `config.toml`/`app.toml` per [Enabling metrics](#enabling-metrics-on-latandad) |
| `cometbft` target is `DOWN` in Prometheus         | `host.docker.internal` cannot reach the host                 | On Linux Docker, ensure `extra_hosts: host-gateway` is present (it is, by default) |
| `cosmos_validator_jailed` is missing              | `VALIDATOR_OPERATOR_ADDRESS` empty or wrong in `.env`        | Fix `.env`, then `docker compose restart cosmos-validator-exporter`                |
| Alertmanager Discord receiver silent              | `DISCORD_WEBHOOK_URL` empty in `.env`                        | Fill in, then `docker compose restart alertmanager-config-init alertmanager`       |
| Alertmanager rejects config at startup            | `TELEGRAM_CHAT_ID` empty or non-numeric                       | Set to a real int (or `0` to disable Telegram delivery)                            |
| `disk used` gauge shows wrong volume             | Root filesystem is mounted differently inside the container | Edit `host_disk_used_ratio` in `prometheus/recording_rules.yml`                    |
| `docker compose up` rebuilds image every time    | Local code in `cosmos-validator-exporter/` changed           | Normal — Compose rebuilds when build context changes                               |
