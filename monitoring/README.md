# La Tanda Chain validator monitoring

A self-contained Prometheus + Grafana + Alertmanager stack for La Tanda Chain validators. It runs next to your `latandad` node on a single server, or as one central instance for many nodes.

- **Prometheus** scrapes `latandad` (CometBFT metrics, Cosmos SDK telemetry), node_exporter and `latanda-exporter`. Retention: 30 days.
- **latanda-exporter** (in `exporter/`) reads jail status, missed blocks, voting power, bonded stake and governance proposals from the chain's REST API. CometBFT's own metrics only describe the node that serves them, so this chain-wide state needs a separate exporter. It needs no keys.
- **Grafana** provisions the datasource and 4 dashboards automatically: Validator Overview, Block Production, Network Health, Node Performance.
- **Alertmanager** sends alerts to a Discord webhook.

New validator? Start with [VALIDATOR_GUIDE.md](VALIDATOR_GUIDE.md), a step-by-step walkthrough.

## Quick start

Requirements: Ubuntu 22.04 or newer and Docker Engine with the compose plugin. Install Docker from Docker's own repository as described in the [official guide](https://docs.docker.com/engine/install/ubuntu/). The older `docker-compose` 1.29 from Ubuntu's apt works too. The stack needs about 300 MB of RAM and 2.7 GB of disk for the images (Grafana alone is 1.9 GB).

```bash
cd monitoring
cp example.env .env
chmod 600 .env
nano .env                # set GRAFANA_ADMIN_PASSWORD, ALERT_WEBHOOK_URL, WATCH_VALIDATORS
docker compose up -d     # or: docker-compose up -d
```

`docker compose up` refuses to start without `GRAFANA_ADMIN_PASSWORD`. This is on purpose: otherwise Grafana would start with the default login admin/admin.

Grafana only listens on `127.0.0.1:3000`. From your own computer, open an SSH tunnel and browse to http://localhost:3000 (user `admin`):

```bash
ssh -L 3000:localhost:3000 user@your-server
```

The node must expose its metrics first: [VALIDATOR_GUIDE.md](VALIDATOR_GUIDE.md#1-enable-metrics-on-your-node) shows the three settings.

## Configuration

All settings live in `.env` (template: [`example.env`](example.env)). Nothing else needs editing.

| Variable | Default | Meaning |
|---|---|---|
| `GRAFANA_ADMIN_PASSWORD` | – (required) | Grafana `admin` password, applied on the first start only |
| `ALERT_WEBHOOK_URL` | empty | Discord webhook URL. Empty: alerts are only shown in the Alertmanager UI |
| `WATCH_VALIDATORS` | empty | Your `ltdvaloper1...` address(es), comma-separated. Empty: network-wide mode (see [Alert rules](#alert-rules)) |
| `COMETBFT_TARGETS` | `localhost:26660` | CometBFT metrics endpoints, `host:port`, comma-separated |
| `COSMOS_API_TARGETS` | `localhost:1317` | Cosmos SDK API endpoints for telemetry (`/metrics?format=prometheus`). That endpoint also repeats all CometBFT metrics; Prometheus drops the copies |
| `NODE_EXPORTER_TARGETS` | `localhost:9100` | node_exporter endpoints |
| `CHAIN_REST_URL` | `http://localhost:1317` | REST API that latanda-exporter reads chain state from |
| `CHAIN_RPC_URL` | `http://localhost:26657` | CometBFT RPC, used for blocks proposed and block time. Empty: height from REST only |
| `POLL_INTERVAL` | `30` | Seconds between two latanda-exporter polls |
| `PROMETHEUS_RETENTION` | `30d` | How long Prometheus keeps data |
| `GRAFANA_LISTEN` / `GRAFANA_PORT` | `127.0.0.1` / `3000` | Where Grafana listens |
| `PROMETHEUS_PORT`, `ALERTMANAGER_PORT`, `NODE_EXPORTER_PORT`, `EXPORTER_PORT` | `19090`, `9093`, `9100`, `9561` | Local ports of the other services |

Every service uses host networking and listens on `127.0.0.1` only. That way the stack can scrape a node that keeps its metrics on localhost, and the stack opens no new public ports. Prometheus uses `19090`, because `9090` is the default gRPC port of `latandad`.

After changing `.env`, apply it with `docker compose up -d`.

### One central instance for many nodes

Set `WATCH_VALIDATORS` empty and list every node in the target variables, for example `COMETBFT_TARGETS=10.0.0.11:26660,10.0.0.12:26660`. `CHAIN_REST_URL` can point to any synced node, because chain state is the same everywhere. The public endpoint `https://latanda.online/chain/api` works too.

Remote nodes must then listen on an interface the monitoring host can reach. Allow only the monitoring host's IP in their firewall, e.g. `ufw allow from <monitoring-ip> to any port 26660 proto tcp`.

## Dashboards

| Dashboard | Shows |
|---|---|
| Validator Overview (home) | Jail status, active set, voting power, missed blocks as share of the window (with the alert levels), uptime, peers, table of the watched validators |
| Block Production | Chain and node height, block time, blocks proposed per validator, transactions and consensus rounds per block |
| Network Health | Validator set by status, bonded stake, jailed validators, proposals in voting period, voting power of the active set |
| Node Performance | CPU, memory, disk space, disk and network I/O of every node_exporter target |

The dashboards use the look of the La Tanda chain explorer: its color palette (cyan, purple, green/amber/red for status) and a header with the La Tanda logo (embedded in the JSON, from `chain/logos/latanda.png` in this repository) and the chain ID. Status values are shown as colored text with a status dot instead of filled boxes. In the Missed blocks, Uptime and Peers graphs, a line turns amber or red when it crossed the warning or critical level in the selected time range. Grafana's own sidebar logo and the theme stay unchanged; changing them needs Grafana Enterprise. Each dashboard links to the other three.

## Alert rules

All rules are in [`prometheus/alerts.yml`](prometheus/alerts.yml). Missed-block thresholds are computed from the chain's slashing parameters, which latanda-exporter exports. If governance changes `signed_blocks_window`, the alerts follow automatically.

Current testnet parameters (`/cosmos/slashing/v1beta1/params`): `signed_blocks_window = 10000`, `min_signed_per_window = 0.5`, `downtime_jail_duration = 600s`. Block time is about 5.7 s. A validator is jailed once it has missed **more than 5,000** of the last 10,000 blocks.

| Alert | Severity | Fires when | Why this threshold |
|---|---|---|---|
| `ValidatorJailed` | critical | a watched validator is jailed | A jailed validator earns nothing and leaves the active set. It has to fix the node and send `unjail` after `downtime_jail_duration`. |
| `ValidatorMissedBlocksCritical` | critical | missed blocks > 40% of `signed_blocks_window` (> 4,000) for 1 min | The validator is 1,000 blocks (≈ 1.6 h of downtime) away from the 50% jail line. Act now. |
| `ValidatorMissedBlocksWarning` | warning | missed blocks > 20% of `signed_blocks_window` (> 2,000) for 1 min | About 3.2 h of accumulated downtime. Still 3,000 blocks (≈ 4.7 h) of room, enough to investigate calmly. |
| `LowPeerCount` | warning | `cometbft_p2p_peers < 3` for 5 min | With 1–2 peers, losing one of them can isolate the node. 5 minutes ignore short reconnects. |
| `GovernanceProposalActive` | info | a proposal is in voting period | One alert per proposal, repeated at most once a day, so validators don't miss a vote. |

`for: 1m` on the missed-block alerts filters single noisy polls. The counter itself only moves one block at a time, so the alert is not delayed meaningfully.

**Watched vs. network-wide mode.** With `WATCH_VALIDATORS` set, jail and missed-block alerts cover only those validators, and `ValidatorJailed` keeps firing for as long as the jail lasts. With `WATCH_VALIDATORS` empty, every validator is covered. In that mode `ValidatorJailed` only fires for jails of the **last 24 hours**, computed from `jailed_until`. Otherwise each long-abandoned jailed validator would alert forever (19 of 54 testnet validators were jailed on 2026-10-29). Tombstoned validators (jailed forever after a double sign) are left out in that mode.

**Additional rules** (not in the original scope, but without them the rules above can go silent):

| Alert | Severity | Fires when |
|---|---|---|
| `NodeDown` | critical | the node's metrics endpoint is unreachable for 2 min. A stopped node has no peer metric, so `LowPeerCount` cannot fire. |
| `NodeHeightStalled` | warning | the node did not advance a block in 5 minutes |
| `ScrapeTargetDown` | warning | a telemetry, node_exporter or latanda-exporter target is unreachable for 5 min |
| `ChainApiUnreachable` | warning | latanda-exporter cannot read `CHAIN_REST_URL` for 5 min. Jail alerts use stale data until then. |
| `WatchedValidatorNotFound` | warning | an address in `WATCH_VALIDATORS` does not exist on chain (typo). No alerts would fire for it. |

**Grouping and inhibition** ([`alertmanager/alertmanager.yml`](alertmanager/alertmanager.yml)): a critical missed-block alert suppresses the warning for the same validator. `ValidatorJailed` suppresses both missed-block alerts, because the counter resets at the jail. `NodeDown` suppresses `NodeHeightStalled` and `LowPeerCount` of the same node, and `ScrapeTargetDown` of every target on the same host (the `host` label is the part of the target before the port, so write a machine the same way in all target lists). Unresolved alerts are repeated every 4 h (info: 24 h). Resolved notifications are sent.

**Discord or generic webhook.** The receiver uses Alertmanager's native Discord integration. For any other webhook (Slack-compatible bridges, ntfy, your own service), replace `discord_configs` with `webhook_configs` and `webhook_url_file` with `url_file`, as the comment in `alertmanager.yml` shows.

**Try it without breaking anything:** send a test alert and check that it arrives in Discord:

```bash
docker compose exec alertmanager amtool alert add TestAlert severity=info \
  --annotation='summary="Test from the La Tanda monitoring stack"' \
  --alertmanager.url=http://127.0.0.1:9093
```

### How the rules were tested

- `prometheus/alerts.test.yml`: `promtool` unit tests for every rule, including the 24 h logic of the network-wide mode and tombstoned validators. Run: `docker run --rm -v "$PWD/prometheus":/w -w /w --entrypoint promtool prom/prometheus:v3.15.0 test rules alerts.test.yml`
- [`test/devnet-jail-test.sh`](test/devnet-jail-test.sh): starts a throwaway 2-validator devnet with `signed_blocks_window = 600` and stops the smaller validator. It then checks that warning, critical and jailed fire in that order, and that the Discord payloads reach a local webhook. It never touches the public testnet, and it runs its own copy of the stack with separate volumes that are removed at the end. It needs a `latandad` binary built from the chain source, `jq` and the stack stopped, and takes about 35 minutes: `LATANDAD=/path/to/latandad bash test/devnet-jail-test.sh`

## latanda-exporter metrics

| Metric | Labels | Meaning |
|---|---|---|
| `latanda_validator_jailed`, `_bonded`, `_tombstoned` | `operator_address`, `moniker`, `watched` | 0/1 |
| `latanda_validator_voting_power` | same | Stake in LTD |
| `latanda_validator_missed_blocks` | same | Missed blocks in the current window |
| `latanda_validator_jailed_until_timestamp_seconds` | same | Unix time, 0 if never jailed |
| `latanda_validator_blocks_proposed_total` | same | Blocks proposed since the exporter started (needs `CHAIN_RPC_URL`) |
| `latanda_validators{status}`, `latanda_validators_jailed` | | Validator set size by status, jailed count |
| `latanda_staking_bonded_tokens`, `latanda_staking_not_bonded_tokens` | | In LTD |
| `latanda_gov_proposal_active`, `latanda_gov_proposal_voting_end_timestamp_seconds` | `proposal_id` (`title`) | Proposals in voting period |
| `latanda_slashing_signed_blocks_window`, `_min_signed_per_window`, `_downtime_jail_duration_seconds` | | Slashing params |
| `latanda_chain_latest_block_height`, `latanda_chain_block_time_seconds` | | Height, average block time over the last 20 blocks |
| `latanda_exporter_up`, `latanda_exporter_watched_validator_missing` | | Health of the exporter itself |

Blocks proposed are counted from new blocks while the exporter runs, there is no history before its start. After a gap of more than 400 blocks (exporter down for ~40 min) it skips ahead instead of fetching the backlog.

## Operations

- **Status and logs:** `docker compose ps`, `docker compose logs -f prometheus` (or `alertmanager`, `grafana`, `latanda-exporter`).
- **Are all targets up?** Tunnel to Prometheus with `ssh -L 19090:localhost:19090 user@server` and open http://localhost:19090/targets.
- **Updates:** raise the image tags in `docker-compose.yml`, then `docker compose pull && docker compose up -d --build`.
- **Disk:** the 2-node devnet test produced about 1,650 series. At a 15 s scrape interval that is roughly 0.5 GB for 30 days. A central instance grows with the number of targets. Grafana's plugin auto-install is disabled, so its volume stays at a few MB.
- **Remove:** `docker compose down` (keeps data), `docker compose down -v` (deletes Prometheus, Alertmanager and Grafana data).

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `GRAFANA_ADMIN_PASSWORD` error on start | `.env` missing or password empty: `cp example.env .env` and set it. |
| `node-exporter` keeps restarting, "address already in use" | node_exporter already runs on the host. Start without it: `docker compose up -d --scale node-exporter=0`. The existing one is still scraped on `localhost:9100`. |
| `cometbft` target down | `prometheus = true` not set in `config.toml`, or `latandad` not restarted (see VALIDATOR_GUIDE). |
| `cosmos-sdk` target down or HTTP 501 | API or telemetry not enabled in `app.toml`. |
| Dashboards empty for a validator | `WATCH_VALIDATORS` must contain the operator address (`ltdvaloper1...`), not the account address (`ltd1...`). The `WatchedValidatorNotFound` alert points this out. |
| Changed the Grafana password in `.env`, login fails | The variable only applies on the first start. Use the password set back then, or reset it: `docker compose exec grafana grafana cli admin reset-admin-password '<new>'` |

## Files

```
monitoring/
├── docker-compose.yml
├── example.env                     template for .env
├── prometheus/
│   ├── prometheus.yml
│   ├── alerts.yml                  alert rules
│   ├── alerts.test.yml             promtool unit tests
│   └── render-targets.sh           writes the target lists from .env
├── alertmanager/
│   ├── alertmanager.yml
│   └── start.sh                    keeps the webhook URL out of the config
├── grafana/
│   ├── provisioning/               datasource + dashboard providers
│   └── dashboards/*.json           4 dashboards
├── exporter/                       latanda-exporter (Python, prometheus_client)
└── test/devnet-jail-test.sh        reproducible jail test on a local devnet
```
