# La Tanda Chain — Node Operator Guide

**Chain ID:** `latanda-testnet-1`
**Token:** LTD (micro-unit: `ultd`, 1 LTD = 1,000,000 ultd)
**Total Supply:** 200,000,000 LTD
**Block Time:** ~5 seconds
**Consensus:** CometBFT (Tendermint)

---

## Quick Start (One-Line Install)

```bash
wget -q https://latanda.online/chain/node-setup.sh -O node-setup.sh && chmod +x node-setup.sh && ./node-setup.sh
```

This script handles everything: system checks, Go installation, binary build, genesis download, peer configuration, and firewall setup.

---

## Manual Setup (Step by Step)

### Prerequisites

| Requirement | Minimum |
|-------------|---------|
| OS | Ubuntu 22.04+ (any Linux works) |
| CPU | 2 cores |
| RAM | 4 GB |
| Disk | 50 GB SSD |
| Network | Stable connection, port 26656 open inbound |

### Step 1: Install System Dependencies

```bash
sudo apt update && sudo apt install -y build-essential git curl wget jq ufw
```

### Step 2: Install Go 1.24.1

```bash
wget -q https://go.dev/dl/go1.24.1.linux-amd64.tar.gz -O /tmp/go.tar.gz
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf /tmp/go.tar.gz
rm /tmp/go.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin' >> ~/.bashrc
source ~/.bashrc
go version
# Should output: go version go1.24.1 linux/amd64
```

### Step 3: Build the `latandad` Binary

```bash
# Download chain source
mkdir -p /tmp/latanda-build && cd /tmp/latanda-build
wget -q https://latanda.online/chain/latanda-chain-source.tar.gz
tar -xzf latanda-chain-source.tar.gz

# Build
go mod tidy
go build -o /usr/local/bin/latandad ./cmd/latandad

# Verify
latandad --help
```

### Step 4: Initialize Your Node

```bash
# Choose a name for your node (your identifier on the network)
MONIKER="my-node-name"

latandad init "$MONIKER" --chain-id latanda-testnet-1 --default-denom ultd
```

This creates your node configuration at `~/.latanda/` including:
- `config/config.toml` — network and consensus settings
- `config/app.toml` — application settings
- `config/node_key.json` — your node's identity key (KEEP THIS SAFE)
- `config/priv_validator_key.json` — validator signing key (KEEP THIS SAFE)
- `data/` — blockchain data

### Step 5: Download Genesis File

```bash
wget -q https://latanda.online/chain/genesis.json -O ~/.latanda/config/genesis.json

# Verify the hash matches
sha256sum ~/.latanda/config/genesis.json
# Expected: 98fc9871d6a3b7b12b3f7fcaa1ca3303ffcfad0f209d61355975a15069ac3907
```

The genesis file defines the initial state of the chain — accounts, validators, token supply. Every node must have the exact same genesis file.

### Step 6: Configure Peers

```bash
# Set the genesis node as your persistent peer
PEERS="483a8110c3cd93c8dd3801d935151e98656f5b67@168.231.67.201:26656"

sed -i "s|persistent_peers = \"\"|persistent_peers = \"$PEERS\"|" ~/.latanda/config/config.toml
sed -i "s|seeds = \"\"|seeds = \"$PEERS\"|" ~/.latanda/config/config.toml
```

This tells your node where to find the network. Once connected, it will discover other peers automatically.

### Step 7: Set Minimum Gas Price

```bash
sed -i 's|minimum-gas-prices = ""|minimum-gas-prices = "0.001ultd"|' ~/.latanda/config/app.toml
```

### Step 8: Open Firewall

```bash
sudo ufw allow 26656/tcp comment "La Tanda Chain P2P"
sudo ufw allow 26657/tcp comment "La Tanda Chain RPC"
```

- **Port 26656** — P2P communication between nodes (REQUIRED)
- **Port 26657** — RPC for querying the node (optional, for monitoring)

### Step 9: Create a systemd Service

For production or testnet validator infrastructure, run `latandad` under systemd so it starts automatically after reboots and exposes logs through `journalctl`.

```bash
sudo tee /etc/systemd/system/latandad@.service > /dev/null <<'EOF'
[Unit]
Description=La Tanda Chain Node
After=network-online.target
Wants=network-online.target

[Service]
User=%i
WorkingDirectory=/home/%i
ExecStart=/usr/local/bin/latandad start --home /home/%i/.latanda
Restart=always
RestartSec=5
LimitNOFILE=65535
Environment=DAEMON_HOME=/home/%i/.latanda

[Install]
WantedBy=multi-user.target
EOF

# Enable the service for your current Linux user
sudo systemctl daemon-reload
sudo systemctl enable latandad@$USER
```

Run the service as a regular Linux user, not `root`, so the node home remains under `/home/<user>/.latanda` and file permissions stay predictable.

### Step 10: Start and Manage the Node

```bash
# Start now
sudo systemctl start latandad@$USER

# Check service status
systemctl status latandad@$USER --no-pager

# Follow live logs
journalctl -u latandad@$USER -f

# Restart after config changes
sudo systemctl restart latandad@$USER
```

### Step 11: Verify Sync

```bash
# Check if your node is syncing
latandad status | jq '.sync_info'

# Key fields:
# - catching_up: true = still syncing, false = caught up
# - latest_block_height: should be increasing
```

Your node will download all blocks from genesis and replay them. For a new testnet this takes under a minute. For a mature chain it could take hours.

---

## Security Checklist

Before running your node, ensure:

- [ ] **SSH key authentication** — disable password login (`PasswordAuthentication no` in `/etc/ssh/sshd_config`)
- [ ] **Firewall active** — `sudo ufw enable` with only needed ports open (22, 26656, 26657)
- [ ] **Fail2ban installed** — `sudo apt install fail2ban` (protects SSH from brute force)
- [ ] **Key files secured** — `chmod 600 ~/.latanda/config/node_key.json ~/.latanda/config/priv_validator_key.json`
- [ ] **Regular backups** — backup `~/.latanda/config/` (keys and config, NOT the data directory)
- [ ] **System updates** — `sudo apt update && sudo apt upgrade` regularly

### No VPN Required

Node communication is encrypted by default (Ed25519 authenticated P2P). You do NOT need a VPN. The P2P protocol is designed for the public internet.

---

## Monitoring and Health Checks

Use these checks during bootstrap and ongoing operation:

```bash
# Service health
systemctl is-active latandad@$USER
systemctl status latandad@$USER --no-pager

# Recent errors
journalctl -u latandad@$USER -p warning -n 50 --no-pager

# RPC status
curl -s localhost:26657/status | jq '.result.sync_info'

# Peer count
curl -s localhost:26657/net_info | jq '.result.n_peers'

# Disk usage for chain data
du -sh ~/.latanda/data
```

---

## Useful Commands

### Node Status
```bash
# Full status
latandad status | jq

# Current block height
latandad status | jq '.sync_info.latest_block_height'

# Am I caught up?
latandad status | jq '.sync_info.catching_up'

# My node ID
latandad comet show-node-id

# Connected peers
curl -s localhost:26657/net_info | jq '.result.n_peers'
```

### Chain Queries
```bash
# List all validators
latandad query staking validators --output json | jq '.validators[] | {moniker: .description.moniker, tokens: .tokens, status: .status}'

# Check an account balance
latandad query bank balances <ltd-address>

# View latest block
latandad query block --type=height <height>

# Governance proposals
latandad query gov proposals
```

### Key Management
```bash
# Create a new key (wallet)
latandad keys add my-wallet --keyring-backend test

# List keys
latandad keys list --keyring-backend test

# Show address
latandad keys show my-wallet -a --keyring-backend test
```

### Send Tokens
```bash
# Send LTD to another address
latandad tx bank send <from-key> <to-address> 1000000ultd \
  --chain-id latanda-testnet-1 \
  --keyring-backend test \
  --gas auto \
  --gas-adjustment 1.5 \
  --fees 500ultd
```

---

## Optional: State Sync for Faster Bootstrap

State sync lets a new node download a recent trusted application state instead of replaying every historical block. Use it only with trusted RPC endpoints.

```bash
RPC="https://latanda.online/chain/rpc"
LATEST_HEIGHT=$(curl -s "$RPC/block" | jq -r '.result.block.header.height')
TRUST_HEIGHT=$((LATEST_HEIGHT - 2000))
TRUST_HASH=$(curl -s "$RPC/block?height=$TRUST_HEIGHT" | jq -r '.result.block_id.hash')

# Stop the node before editing state-sync settings. The reset command below
# deletes local block data but keeps config/keys; back up validator keys first.
sudo systemctl stop latandad@$USER
latandad comet unsafe-reset-all --home ~/.latanda

export RPC TRUST_HEIGHT TRUST_HASH
python3 - <<'PY'
from pathlib import Path
import os
path = Path.home() / '.latanda/config/config.toml'
text = path.read_text()
replacements = {
    'enable = false': 'enable = true',
    'rpc_servers = ""': f'rpc_servers = "{os.environ["RPC"]},{os.environ["RPC"]}"',
    'trust_height = 0': f'trust_height = {os.environ["TRUST_HEIGHT"]}',
    'trust_hash = ""': f'trust_hash = "{os.environ["TRUST_HASH"]}"',
    'trust_period = "168h0m0s"': 'trust_period = "336h0m0s"',
}
start = text.index('[statesync]')
end = text.find('\n[', start + len('[statesync]'))
if end == -1:
    end = len(text)
section = text[start:end]
for old, new in replacements.items():
    if old not in section:
        raise SystemExit(f'missing statesync setting: {old}')
    section = section.replace(old, new, 1)
path.write_text(text[:start] + section + text[end:])
PY

sudo systemctl start latandad@$USER
```

Confirm the node is catching up with:

```bash
latandad status | jq '.sync_info'
journalctl -u latandad@$USER -n 100 --no-pager
```

---

## Becoming a Validator (Phase 2+)

Once your full node is synced and running stable, you can apply to become a validator.

### Requirements
- Node running with 99.5%+ uptime for at least 1 week
- 50,000 LTD staked (testnet tokens — request from the La Tanda team)
- KYC verification completed on La Tanda platform

### Create a Validator Wallet

Use a named key for validator operations and record the address before requesting faucet funds or completing verification. The `test` keyring backend is convenient for testnet automation, but it stores keys unencrypted; use the OS keyring or a hardware signer for production funds.

```bash
latandad keys add validator --keyring-backend test
latandad keys show validator -a --keyring-backend test
```

For production key management, replace `--keyring-backend test` with your secure keyring backend in every command below.

### Faucet / Verification Process

1. Copy the wallet address from `latandad keys show validator -a`.
2. Request testnet LTD through the La Tanda validator onboarding or faucet flow.
3. Verify the balance before creating the validator:

```bash
latandad query bank balances $(latandad keys show validator -a --keyring-backend test)
```

### Create Validator
```bash
latandad tx staking create-validator \
  --amount=50000000000ultd \
  --pubkey=$(latandad comet show-validator) \
  --moniker="your-validator-name" \
  --chain-id=latanda-testnet-1 \
  --commission-rate="0.10" \
  --commission-max-rate="0.20" \
  --commission-max-change-rate="0.01" \
  --min-self-delegation="1" \
  --keyring-backend=test \
  --from=validator \
  --gas=auto \
  --gas-adjustment=1.5 \
  --fees=5000ultd
```

### Monitor Validator
```bash
# Check if your validator is in the active set
latandad query staking validator <ltdvaloper-address>

# Check signing info (missed blocks)
latandad query slashing signing-info $(latandad comet show-validator)
```

---

## Maintenance Commands

```bash
# Upgrade the binary after building a new release
sudo install -m 0755 latandad /usr/local/bin/latandad
sudo systemctl restart latandad@$USER

# Back up validator-critical config files
tar -czf latanda-validator-config-backup.tgz ~/.latanda/config/node_key.json ~/.latanda/config/priv_validator_key.json ~/.latanda/config/config.toml ~/.latanda/config/app.toml

# Prune old journal logs if the host is low on disk
sudo journalctl --vacuum-time=14d
```

The backup archive contains validator signing secrets. Store it encrypted or offline with restricted permissions, and never delete `priv_validator_key.json` unless you are intentionally retiring the validator identity.

---

## Troubleshooting

### Node won't start
```bash
# Check logs
journalctl -u latandad@$USER -n 100 --no-pager

# Common fix for a disposable full node: reset local block data (keeps config/keys)
# Back up validator keys first if this node has ever signed as a validator.
latandad comet unsafe-reset-all
```

### Can't find peers
```bash
# Verify the genesis node is reachable
curl -s http://168.231.67.201:26657/status | jq '.result.node_info.id'

# Check your firewall
sudo ufw status

# Make sure port 26656 is open inbound
```

### Node is stuck / not syncing
```bash
# Check peer count
curl -s localhost:26657/net_info | jq '.result.n_peers'

# If 0 peers, re-add the seed
sed -i 's|seeds = ".*"|seeds = "483a8110c3cd93c8dd3801d935151e98656f5b67@168.231.67.201:26656"|' ~/.latanda/config/config.toml
sudo systemctl restart latandad@$USER
```

### Genesis hash mismatch
```bash
# Redownload genesis
wget -q https://latanda.online/chain/genesis.json -O ~/.latanda/config/genesis.json
sha256sum ~/.latanda/config/genesis.json
# Must match: 98fc9871d6a3b7b12b3f7fcaa1ca3303ffcfad0f209d61355975a15069ac3907
```

---

## Network Information

| Resource | URL |
|----------|-----|
| Genesis File | https://latanda.online/chain/genesis.json |
| Setup Script | https://latanda.online/chain/node-setup.sh |
| Chain Source | https://latanda.online/chain/latanda-chain-source.tar.gz |
| RPC Endpoint | https://latanda.online/chain/rpc/ |
| REST API | https://latanda.online/chain/api/ |
| Chain Explorer | https://latanda.online/chain/ |
| P2P Seed | `483a8110c3cd93c8dd3801d935151e98656f5b67@168.231.67.201:26656` |
| Chain ID | `latanda-testnet-1` |
| Denom | `ultd` (1 LTD = 1,000,000 ultd) |
| Genesis Hash | `98fc9871d6a3b7b12b3f7fcaa1ca3303ffcfad0f209d61355975a15069ac3907` |

---

## Support

- **Contact:** contact@latanda.online
- **GitHub:** github.com/INDIGOAZUL
- **Platform:** https://latanda.online

---

*Ray-Banks LLC | La Tanda Chain Testnet*
