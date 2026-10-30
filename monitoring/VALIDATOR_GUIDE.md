# Monitoring your La Tanda validator: step by step

This guide adds the monitoring stack to a validator set up with [chain/testnet-validator-guide.md](../chain/testnet-validator-guide.md). It uses the same paths (`/home/latanda/.latanda`), service name (`latandad`) and fee settings. Plan about 30 minutes.

The stack runs on the validator server itself. Everything listens on `127.0.0.1`, so **no new firewall ports are needed**. You reach Grafana through an SSH tunnel.

## 1. Enable metrics on your node

Three settings, all bound to localhost. Run them as the service account:

```bash
sudo -iu latanda
CONFIG="$HOME/.latanda/config/config.toml"
APP="$HOME/.latanda/config/app.toml"

# CometBFT metrics on 127.0.0.1:26660. The default ":26660" would listen on
# every interface.
sed -i '/^\[instrumentation\]/,/^\[/ {
  s|^prometheus = .*|prometheus = true|
  s|^prometheus_listen_addr = .*|prometheus_listen_addr = "127.0.0.1:26660"|
}' "$CONFIG"

# REST API on 127.0.0.1:1317. latanda-exporter reads chain state from it.
sed -i '/^\[api\]/,/^\[/ {
  s|^enable = .*|enable = true|
  s|^address = .*|address = "tcp://127.0.0.1:1317"|
}' "$APP"

# Cosmos SDK telemetry, served by the API at /metrics. A retention time of 0
# disables the Prometheus output.
sed -i '/^\[telemetry\]/,/^\[/ {
  s|^enabled = .*|enabled = true|
  s|^prometheus-retention-time = .*|prometheus-retention-time = 60|
}' "$APP"

grep -E '^(prometheus|prometheus_listen_addr|namespace) =' "$CONFIG"
exit
```

Keep `namespace = "cometbft"` in `[instrumentation]`. The dashboards and alerts expect metric names starting with `cometbft_`.

Restart the node. A restart costs a few missed blocks, far below any alert threshold:

```bash
sudo systemctl restart latandad
sleep 20
curl -s http://127.0.0.1:26660/metrics | grep -m1 '^cometbft_consensus_height'
curl -s 'http://127.0.0.1:1317/metrics?format=prometheus' | grep -c '^# TYPE'
curl -s http://127.0.0.1:1317/cosmos/slashing/v1beta1/params | jq .params
```

The first command prints the current height, the second a number above 0, the third the slashing parameters.

## 2. Find your operator address

Alerts and dashboards follow the validators listed in `WATCH_VALIDATORS`. It needs the operator address (`ltdvaloper1...`), not the wallet address (`ltd1...`):

```bash
sudo -iu latanda
KEY_NAME="validator"
latandad keys show "$KEY_NAME" --bech val --address --keyring-backend file
exit
```

The keyring asks for its passphrase. The address it prints is public, it is safe to put into `.env`.

## 3. Create a Discord webhook

In Discord: **Server Settings → Integrations → Webhooks → New Webhook**, pick the channel, then **Copy Webhook URL**.

Treat the URL like a password. Anyone who has it can post into that channel. It goes into `.env` only, never into a commit or a chat.

## 4. Install Docker

Install Docker Engine with the compose plugin from Docker's repository, following the [official guide for Ubuntu](https://docs.docker.com/engine/install/ubuntu/). Then check:

```bash
docker compose version
```

## 5. Configure and start the stack

```bash
git clone https://github.com/INDIGOAZUL/la-tanda-web.git
cd la-tanda-web/monitoring
cp example.env .env
chmod 600 .env
nano .env
```

Set three values in `.env`:

- `GRAFANA_ADMIN_PASSWORD`: a long random password, e.g. from `openssl rand -base64 18`.
- `ALERT_WEBHOOK_URL`: the Discord webhook URL from step 3.
- `WATCH_VALIDATORS`: your operator address from step 2.

The defaults for everything else match a validator set up with the testnet guide. Start the stack:

```bash
docker compose up -d
docker compose ps
```

All five services should show `running`. If `node-exporter` keeps restarting, node_exporter already runs on the server: `docker compose up -d --scale node-exporter=0`.

## 6. Open Grafana

On your own computer, open a tunnel to the server and keep it running:

```bash
ssh -L 3000:localhost:3000 -L 19090:localhost:19090 user@your-validator
```

- Grafana: http://localhost:3000, user `admin`, the password from `.env`. The **Validator Overview** dashboard opens first; the other three are in the **La Tanda** folder.
- Prometheus: http://localhost:19090/targets. Every target should be `UP`.

## 7. Send a test alert

Check that alerts reach Discord before you need them:

```bash
docker compose exec alertmanager amtool alert add TestAlert severity=info \
  --annotation='summary="Test from the La Tanda monitoring stack"' \
  --alertmanager.url=http://127.0.0.1:9093
```

The message arrives within about a minute.

## 8. When an alert fires

The thresholds and their reasoning are in [README.md](README.md#alert-rules). With the testnet's current parameters a validator is jailed after **more than 5,000 missed blocks** in the 10,000-block window, about 7.9 hours of downtime in total.

**ValidatorMissedBlocksWarning (> 20%) or ValidatorMissedBlocksCritical (> 40%).** Your node is not signing. Start with the health checks of the testnet guide:

```bash
sudo systemctl is-active latandad
sudo journalctl -u latandad --since "15 minutes ago" --no-pager
curl -fsSL http://127.0.0.1:26657/status \
  | jq '.result.sync_info | {latest_block_height, catching_up}'
```

Missed blocks only leave the window slowly. Once the node signs again, the counter stops growing, and the alert clears after the missed blocks have aged out of the window (up to 10,000 blocks, about 16 hours).

**ValidatorJailed.** The validator is out of the active set and earns nothing. Fix the cause first, then wait until `jailed_until` has passed (`downtime_jail_duration`, 10 minutes on the testnet), then unjail:

```bash
sudo -iu latanda
KEY_NAME="validator"
CONS_PUBKEY=$(latandad comet show-validator)
latandad query slashing signing-info "$CONS_PUBKEY"

latandad tx slashing unjail \
  --from "$KEY_NAME" --keyring-backend file \
  --chain-id latanda-testnet-1 --gas auto --gas-adjustment 1.5 --fees 5000ultd
```

Confirm the node is caught up and has peers before you send it. An unjail on a node that still cannot sign leads straight to the next jail.

> **Never start a second copy of your validator to get it signing faster.** Two machines with the same `priv_validator_key.json` double-sign, and a double sign is punished with a permanent jail (tombstone) that no unjail lifts.

**LowPeerCount (< 3 peers for 5 minutes).** Check that P2P is reachable and peers are configured:

```bash
sudo ufw status | grep 26656
grep -E '^(persistent_peers|seeds) ' /home/latanda/.latanda/config/config.toml
curl -fsSL http://127.0.0.1:26657/net_info | jq '.result.n_peers'
```

**NodeDown or NodeHeightStalled.** `latandad` stopped or stopped advancing. Check `sudo systemctl status latandad --no-pager` and the journal, then section 17 of the testnet guide.

**GovernanceProposalActive.** A proposal is in its voting period. The alert names the proposal ID. Read it, then vote as the `latanda` user (`yes`, `no`, `abstain` or `no_with_veto`):

```bash
sudo -iu latanda
KEY_NAME="validator"
latandad query gov proposal <proposal-id>
latandad tx gov vote <proposal-id> yes \
  --from "$KEY_NAME" --keyring-backend file \
  --chain-id latanda-testnet-1 --gas auto --gas-adjustment 1.5 --fees 5000ultd
```

**ChainApiUnreachable or ScrapeTargetDown.** Part of the monitoring itself is blind. Check that the `[api]` and `[telemetry]` settings from step 1 are still in place, then `docker compose logs --tail 50 latanda-exporter`.

## 9. Firewall

The stack opens no ports to the outside. Keep it that way:

- Do **not** open `26660`, `1317`, `3000`, `9093`, `9100`, `9561` or `19090` in `ufw`. Use the SSH tunnel from step 6.
- Port `26656` (P2P) stays the only La Tanda port open to the internet, as in the testnet guide.
- If one central monitoring server watches several validators instead, allow only that server's IP, e.g. `sudo ufw allow from <monitoring-ip> to any port 26660 proto tcp`, and set `prometheus_listen_addr` to the private interface. See [README.md](README.md#one-central-instance-for-many-nodes).

## 10. Updates and removal

- Update the stack: `git pull`, then `docker compose pull && docker compose up -d --build`.
- Stop it, keeping its data: `docker compose down`. Remove it including all data: `docker compose down -v`.
- The node settings from step 1 can stay. They only listen on localhost.
