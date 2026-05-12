#!/usr/bin/env bash
# =============================================================================
# Verify that the monitoring stack correctly detects a jailed validator.
#
# This is a verification harness — NOT a production tool. Run it only against
# a test validator on a private chain fork or a disposable testnet identity
# where jailing is acceptable. Slashing on a real validator destroys 1% of
# self-bonded stake.
#
# Usage:
#   bash scripts/test-jail-alert.sh
#
# Pre-conditions:
#   * .env is filled in with VALIDATOR_OPERATOR_ADDRESS and CONSENSUS_ADDRESS
#   * docker compose stack is running and healthy
#   * `latandad` is available on PATH and points at the test validator
#   * You have already accepted that this validator will be jailed
# =============================================================================
set -euo pipefail

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
cd "${DIR}"

# Load .env
if [[ ! -f .env ]]; then
  echo "ERROR: .env not found in ${DIR}. Run cp .env.example .env first." >&2
  exit 1
fi
# shellcheck disable=SC1091
set -a
. ./.env
set +a

PROM=${PROM:-http://localhost:${PROMETHEUS_PORT:-9090}}
ALERTMAN=${ALERTMAN:-http://localhost:${ALERTMANAGER_PORT:-9093}}
EXPORTER=${EXPORTER:-http://localhost:${COSMOS_EXPORTER_PORT:-9101}}
API=${NODE_API_URL:-http://localhost:1317}

red()    { printf '\033[31m%s\033[0m\n' "$*"; }
green()  { printf '\033[32m%s\033[0m\n' "$*"; }
yellow() { printf '\033[33m%s\033[0m\n' "$*"; }
info()   { printf '[%s] %s\n' "$(date +%H:%M:%S)" "$*"; }

# --------------------------------------------------------------------------
# 1. Stack health
# --------------------------------------------------------------------------
info "Step 1/6 — checking stack health"

curl -sf "${PROM}/-/ready"       >/dev/null || { red "Prometheus not ready at ${PROM}";   exit 2; }
curl -sf "${ALERTMAN}/-/ready"   >/dev/null || { red "Alertmanager not ready at ${ALERTMAN}"; exit 2; }
curl -sf "${EXPORTER}/health"    >/dev/null || { red "Validator exporter not ready at ${EXPORTER}"; exit 2; }
green "  all components healthy"

# --------------------------------------------------------------------------
# 2. Baseline missed_blocks
# --------------------------------------------------------------------------
info "Step 2/6 — recording baseline missed_blocks"

BASELINE=$(curl -s "${EXPORTER}/metrics" \
  | awk '/^cosmos_validator_missed_blocks_counter/ && !/^#/ { print $NF; exit }')
BASELINE=${BASELINE:-0}
info "  baseline missed_blocks_counter = ${BASELINE}"

# --------------------------------------------------------------------------
# 3. Stop latandad
# --------------------------------------------------------------------------
info "Step 3/6 — stopping latandad to start missing blocks"
yellow "  this validator will start missing blocks. Hit Ctrl-C now to abort."
sleep 5

if pgrep -x latandad >/dev/null 2>&1; then
  if systemctl --quiet is-active latandad 2>/dev/null; then
    sudo systemctl stop latandad
  elif command -v pm2 >/dev/null && pm2 list 2>/dev/null | grep -q latanda-chain; then
    pm2 stop latanda-chain
  else
    info "  killing latandad directly"
    sudo pkill -x latandad || true
  fi
  green "  latandad stopped"
else
  yellow "  latandad already stopped"
fi

# --------------------------------------------------------------------------
# 4. Wait for jailed: true
# --------------------------------------------------------------------------
info "Step 4/6 — waiting for chain to mark validator as jailed"
info "  (on default params this takes ~14h. for fast tests, lower"
info "   signed_blocks_window on a private chain fork before starting.)"

POLL_INTERVAL=15
MAX_POLLS=${MAX_POLLS:-3600}    # 15h cap at 15s/poll

for ((i=1; i<=MAX_POLLS; i++)); do
  JAILED=$(curl -sf "${API}/cosmos/staking/v1beta1/validators/${VALIDATOR_OPERATOR_ADDRESS}" \
    | awk -F'"' '/"jailed":/ { for (k=1;k<=NF;k++) if ($k ~ /^(true|false)$/) { print $k; exit } }' || true)
  CURRENT_MISSED=$(curl -s "${EXPORTER}/metrics" \
    | awk '/^cosmos_validator_missed_blocks_counter/ && !/^#/ { print $NF; exit }')
  info "  poll ${i}/${MAX_POLLS}: jailed=${JAILED:-unknown} missed=${CURRENT_MISSED:-?}"
  if [[ "${JAILED:-}" == "true" ]]; then
    green "  chain has marked the validator as JAILED"
    break
  fi
  sleep "${POLL_INTERVAL}"
done

if [[ "${JAILED:-}" != "true" ]]; then
  red "validator never became jailed within ${MAX_POLLS} polls — aborting"
  exit 3
fi

# --------------------------------------------------------------------------
# 5. Confirm the ValidatorJailed alert fired
# --------------------------------------------------------------------------
info "Step 5/6 — confirming ValidatorJailed alert reached Alertmanager"

for ((i=1; i<=20; i++)); do
  if curl -sf "${ALERTMAN}/api/v2/alerts" \
       | grep -q '"alertname":"ValidatorJailed"'; then
    green "  ValidatorJailed alert is firing in Alertmanager"
    break
  fi
  info "  poll ${i}/20: alert not yet present, sleeping 15s"
  sleep 15
done

if ! curl -sf "${ALERTMAN}/api/v2/alerts" | grep -q '"alertname":"ValidatorJailed"'; then
  red "ValidatorJailed alert never showed up — investigate alerts.yml or scrape lag"
  exit 4
fi

# --------------------------------------------------------------------------
# 6. Recover
# --------------------------------------------------------------------------
info "Step 6/6 — restarting latandad + unjailing"
info "  restart latandad with whatever supervisor you use (systemctl/pm2/...)"
info "  then run:"
echo
echo "    latandad tx slashing unjail \\"
echo "      --from <your-key> --chain-id ${CHAIN_ID:-latanda-testnet-1} \\"
echo "      --gas auto --gas-adjustment 1.3 --fees 5000ultd -y"
echo
green "Test completed. Make sure you actually unjail after this script exits."
