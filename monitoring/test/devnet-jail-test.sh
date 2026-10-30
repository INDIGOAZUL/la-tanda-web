#!/usr/bin/env bash
# Deliberately jails a validator on a throwaway local devnet and checks that the
# monitoring stack alerts in the expected order:
#   ValidatorMissedBlocksWarning -> ValidatorMissedBlocksCritical -> ValidatorJailed
# plus LowPeerCount and GovernanceProposalActive.
#
# Nothing here touches the public testnet: fresh keys, chain-id latanda-devnet-1,
# no seeds, no persistent peers outside this machine.
#
# Requirements: a latandad binary (built like chain/node-setup.sh does), jq, curl,
# python3, docker with the compose plugin, and this repo's monitoring/ directory.
# The monitoring stack must NOT be running yet (same ports); the script starts
# its own copy with a devnet .env (the existing .env is backed up and restored).
# That copy runs as compose project "latanda-devnet-test" with its own volumes,
# removed afterwards: your Prometheus data stays clean, and Alertmanager's
# notification log from an earlier run cannot hold back repeated alerts.
#
# Usage (from monitoring/): LATANDAD=/path/to/latandad bash test/devnet-jail-test.sh
# KEEP_RUNNING=1 keeps the devnet and the stack up after the checks (for a look
# at the dashboards); Ctrl+C then stops everything.
set -euo pipefail

LATANDAD=${LATANDAD:-latandad}
WORK=${WORK:-$HOME/latanda-devnet}
CHAIN_ID=latanda-devnet-1
DENOM=ultd
# Small signing window so the test takes minutes instead of hours. The gap
# between 40% (critical) and 50% (jail) must be longer than poll interval +
# scrape interval + the rule's "for: 1m", so 600 blocks at ~3 s = 3 minutes.
WINDOW=600
BLOCK_TIME=3s
HOOK_PORT=18080
MON_DIR=$(cd "$(dirname "$0")/.." && pwd)

log() { printf '%s  %s\n' "$(date -u +%H:%M:%S)" "$*"; }
need() { command -v "$1" >/dev/null || { echo "missing: $1" >&2; exit 1; }; }
need "$LATANDAD"; need jq; need curl; need python3; need docker

if [ -e "$WORK" ]; then
  echo "$WORK exists, remove it first (rm -rf $WORK)" >&2
  exit 1
fi
mkdir -p "$WORK"

# --- 1. Two validators: validator_1 holds >2/3 of the power, so the chain keeps
#        producing blocks when validator_2 stops. Ports of validator_2 are shifted by 100.
init_node() { # $1 = name, $2 = port offset
  local home=$WORK/$1 off=$2
  "$LATANDAD" init "$1" --chain-id "$CHAIN_ID" --default-denom "$DENOM" --home "$home" >/dev/null 2>&1
  "$LATANDAD" keys add "$1" --keyring-backend test --home "$home" >/dev/null 2>&1
  local cfg=$home/config/config.toml app=$home/config/app.toml
  sed -i \
    -e "s#^laddr = \"tcp://127.0.0.1:26657\"#laddr = \"tcp://127.0.0.1:$((26657 + off))\"#" \
    -e "s#^laddr = \"tcp://0.0.0.0:26656\"#laddr = \"tcp://127.0.0.1:$((26656 + off))\"#" \
    -e "s#^proxy_app = \"tcp://127.0.0.1:26658\"#proxy_app = \"tcp://127.0.0.1:$((26658 + off))\"#" \
    -e "s#^pprof_laddr = \"localhost:6060\"#pprof_laddr = \"localhost:$((6060 + off))\"#" \
    -e "s#^prometheus = false#prometheus = true#" \
    -e "s#^prometheus_listen_addr = \":26660\"#prometheus_listen_addr = \"127.0.0.1:$((26660 + off))\"#" \
    -e "s#^timeout_commit = \".*\"#timeout_commit = \"$BLOCK_TIME\"#" \
    -e "s#^addr_book_strict = true#addr_book_strict = false#" \
    -e "s#^allow_duplicate_ip = false#allow_duplicate_ip = true#" \
    "$cfg"
  # API on, telemetry on (Cosmos SDK /metrics), gRPC on a free port.
  python3 - "$app" "$off" <<'PY'
import re, sys
path, off = sys.argv[1], int(sys.argv[2])
text = open(path).read()
def section(name, body):
    global text
    m = re.search(rf"(?ms)^\[{re.escape(name)}\]\n(.*?)(?=^\[|\Z)", text)
    block = m.group(1)
    for key, value in body.items():
        block = re.sub(rf"(?m)^{key} = .*$", f"{key} = {value}", block)
    text = text[:m.start(1)] + block + text[m.end(1):]
section("api", {"enable": "true", "address": f'"tcp://127.0.0.1:{1317 + off}"'})
section("telemetry", {"enabled": "true", "prometheus-retention-time": "60"})
section("grpc", {"address": f'"127.0.0.1:{9090 + off}"'})
text = re.sub(r'(?m)^minimum-gas-prices = .*$', 'minimum-gas-prices = "0ultd"', text)
open(path, "w").write(text)
PY
}
log "initialising validator_1 and validator_2 in $WORK"
init_node validator_1 0
init_node validator_2 100

V1=$WORK/validator_1; V2=$WORK/validator_2
ADDR1=$("$LATANDAD" keys show validator_1 -a --keyring-backend test --home "$V1")
ADDR2=$("$LATANDAD" keys show validator_2 -a --keyring-backend test --home "$V2")

# --- 2. Genesis: short window, short jail, fast governance.
G=$V1/config/genesis.json
jq --arg w "$WINDOW" --arg d "$DENOM" '
  .app_state.slashing.params.signed_blocks_window = $w
  | .app_state.slashing.params.min_signed_per_window = "0.500000000000000000"
  | .app_state.slashing.params.downtime_jail_duration = "60s"
  | .app_state.staking.params.bond_denom = $d
  | .app_state.gov.params.min_deposit = [{"denom": $d, "amount": "1000000"}]
  | .app_state.gov.params.voting_period = "600s"
  | .app_state.gov.params.max_deposit_period = "600s"
  | if .app_state.gov.params | has("expedited_min_deposit")
    then .app_state.gov.params.expedited_min_deposit = [{"denom": $d, "amount": "2000000"}] else . end
  | if .app_state.gov.params | has("expedited_voting_period")
    then .app_state.gov.params.expedited_voting_period = "300s" else . end
  | if .app_state.mint then .app_state.mint.params.mint_denom = $d else . end
  | if .app_state.crisis then .app_state.crisis.constant_fee.denom = $d else . end
' "$G" > "$G.tmp" && mv "$G.tmp" "$G"
"$LATANDAD" genesis add-genesis-account "$ADDR1" 100000000000$DENOM --home "$V1" >/dev/null
"$LATANDAD" genesis add-genesis-account "$ADDR2" 10000000000$DENOM --home "$V1" >/dev/null
"$LATANDAD" genesis gentx validator_1 90000000000$DENOM --chain-id "$CHAIN_ID" --keyring-backend test --home "$V1" >/dev/null 2>&1
cp "$G" "$V2/config/genesis.json"
"$LATANDAD" genesis gentx validator_2 5000000000$DENOM --chain-id "$CHAIN_ID" --keyring-backend test --home "$V2" \
  --output-document "$V1/config/gentx/validator_2.json" >/dev/null 2>&1
"$LATANDAD" genesis collect-gentxs --home "$V1" >/dev/null 2>&1
"$LATANDAD" genesis validate --home "$V1" >/dev/null
cp "$G" "$V2/config/genesis.json"
PEER1="$("$LATANDAD" comet show-node-id --home "$V1")@127.0.0.1:26656"
sed -i "s#^persistent_peers = \".*\"#persistent_peers = \"$PEER1\"#" "$V2/config/config.toml"

VALOPER1=$("$LATANDAD" keys show validator_1 --bech val -a --keyring-backend test --home "$V1")
VALOPER2=$("$LATANDAD" keys show validator_2 --bech val -a --keyring-backend test --home "$V2")
log "validator_2 operator address: $VALOPER2"

# --- 3. Start both nodes.
"$LATANDAD" start --home "$V1" > "$WORK/validator_1.log" 2>&1 & echo $! > "$WORK/validator_1.pid"
"$LATANDAD" start --home "$V2" > "$WORK/validator_2.log" 2>&1 & echo $! > "$WORK/validator_2.pid"
cleanup() {
  for n in validator_1 validator_2 hook; do [ -f "$WORK/$n.pid" ] && kill "$(cat "$WORK/$n.pid")" 2>/dev/null || true; done
}
trap cleanup EXIT

height() { curl -s "http://127.0.0.1:${1:-26657}/status" | jq -r '.result.sync_info.latest_block_height // 0'; }
log "waiting for the first blocks"
until [ "$(height)" -ge 3 ] 2>/dev/null; do sleep 2; done

# --- 4. Webhook receiver: logs every Alertmanager POST with a timestamp.
python3 - "$HOOK_PORT" "$WORK/webhook.log" <<'PY' &
import json, sys, time
from http.server import BaseHTTPRequestHandler, HTTPServer
port, out = int(sys.argv[1]), sys.argv[2]
class H(BaseHTTPRequestHandler):
    def do_POST(self):
        body = self.rfile.read(int(self.headers.get("Content-Length", 0)))
        with open(out, "a") as f:
            f.write(time.strftime("%H:%M:%S", time.gmtime()) + " " + body.decode() + "\n")
        self.send_response(204); self.end_headers()
    def log_message(self, *a): pass
HTTPServer(("127.0.0.1", port), H).serve_forever()
PY
echo $! > "$WORK/hook.pid"

# --- 5. Monitoring stack against the devnet. Both validators are watched (Grafana
#        lists both); only validator_2 is expected to alert.
ENV=$MON_DIR/.env
[ -f "$ENV" ] && cp "$ENV" "$WORK/env.backup"
restore_env() { if [ -f "$WORK/env.backup" ]; then cp "$WORK/env.backup" "$ENV"; else rm -f "$ENV"; fi; }
compose() { (cd "$MON_DIR" && docker compose -p latanda-devnet-test "$@"); }
# Stop the stack while the devnet .env is still in place (compose needs it).
trap 'cleanup; compose down -v; restore_env' EXIT
trap 'exit 130' INT TERM
(umask 077; python3 -c 'import secrets; print(secrets.token_urlsafe(18))' > "$WORK/grafana-admin-password")
cat > "$ENV" <<EOF
GRAFANA_ADMIN_PASSWORD=$(cat "$WORK/grafana-admin-password")
GRAFANA_LISTEN=${GRAFANA_LISTEN:-127.0.0.1}
ALERT_WEBHOOK_URL=http://127.0.0.1:$HOOK_PORT/hook
WATCH_VALIDATORS=$VALOPER1,$VALOPER2
COMETBFT_TARGETS=127.0.0.1:26660,127.0.0.1:26760
COSMOS_API_TARGETS=127.0.0.1:1317,127.0.0.1:1417
NODE_EXPORTER_TARGETS=localhost:9100
CHAIN_REST_URL=http://127.0.0.1:1317
CHAIN_RPC_URL=http://127.0.0.1:26657
POLL_INTERVAL=15
EOF
chmod 600 "$ENV"
compose up -d --build

prom() { curl -s "http://127.0.0.1:19090/api/v1/query" --data-urlencode "query=$1"; }
firing() { prom "ALERTS{alertstate=\"firing\",alertname=\"$1\"}" | jq -r '.data.result | length'; }
wait_alert() { # $1 = alert name, $2 = timeout seconds
  local t=0
  until [ "$(firing "$1")" -ge 1 ] 2>/dev/null; do
    sleep 10; t=$((t + 10))
    [ "$t" -ge "$2" ] && { log "TIMEOUT waiting for $1"; return 1; }
  done
  log "FIRING: $1"
}

# The SDK only jails once height > start height + window. validator_2 needs more than
# WINDOW/2 missed blocks to be jailed, so stopping it after WINDOW/2 is enough.
log "waiting for height $((WINDOW / 2 + 20))"
until [ "$(height)" -ge $((WINDOW / 2 + 20)) ] 2>/dev/null; do sleep 10; done

# --- 6. Governance proposal -> info alert. A text proposal without messages
#        needs non-empty metadata, otherwise the SDK rejects it in the block.
cat > "$WORK/proposal.json" <<EOF
{"messages": [], "metadata": "devnet-jail-test", "deposit": "1000000$DENOM",
 "title": "Devnet test proposal", "summary": "Triggers GovernanceProposalActive"}
EOF
TXHASH=$("$LATANDAD" tx gov submit-proposal "$WORK/proposal.json" --from validator_1 --keyring-backend test \
  --home "$V1" --chain-id "$CHAIN_ID" --gas 400000 --fees 0$DENOM --yes --output json | jq -r .txhash)
sleep 10
TXCODE=$("$LATANDAD" q tx "$TXHASH" --node tcp://127.0.0.1:26657 -o json | jq -r '.code')
[ "$TXCODE" = 0 ] || { log "proposal tx failed: $("$LATANDAD" q tx "$TXHASH" -o json | jq -r .raw_log)"; exit 1; }
wait_alert GovernanceProposalActive 180

# --- 7. Stop validator_2: missed blocks grow until it is jailed.
log "stopping validator_2 at height $(height)"
kill "$(cat "$WORK/validator_2.pid")"; rm -f "$WORK/validator_2.pid"
wait_alert LowPeerCount 600
wait_alert ValidatorMissedBlocksWarning 900
wait_alert ValidatorMissedBlocksCritical 900
wait_alert ValidatorJailed 900
log "validator_2 on chain: $("$LATANDAD" q staking validator "$VALOPER2" --node tcp://127.0.0.1:26657 -o json | jq -c '.validator // . | {jailed, status}')"

# --- 8. What reached the webhook (Discord payload: "embeds" with the titles).
sleep 60
log "webhook deliveries:"
jq -r '.embeds[]?.title' < <(cut -d' ' -f2- "$WORK/webhook.log") | sed 's/^/    /'
log "done. Logs and webhook payloads are in $WORK"
if [ "${KEEP_RUNNING:-0}" = 1 ]; then
  log "KEEP_RUNNING=1: devnet and stack keep running, Ctrl+C stops everything"
  log "Grafana: user admin, password in $WORK/grafana-admin-password"
  wait
fi
