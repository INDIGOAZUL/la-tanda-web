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
# Expected: defeeddaa99e8968fd7b65ae20380068015505138171e6cbea94cac195c34cc3
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

### Step 9: Start the Node

```bash
# Option A: Run directly (foreground)
latandad start

# Option B: Run with PM2 (recommended — auto-restart, logs)
npm install -g pm2    # if not already installed
pm2 start latandad --name latanda-chain -- start
pm2 save
pm2 startup           # auto-start on reboot
```

### Step 10: Verify Sync

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

## Becoming a Validator (Phase 2+)

Once your full node is synced and running stable, you can apply to become a validator.

### Requirements
- Node running with 99.5%+ uptime for at least 1 week
- 50,000 LTD staked (testnet tokens — request from the La Tanda team)
- KYC verification completed on La Tanda platform

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
  --from=my-wallet \
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

## Troubleshooting

### Node won't start
```bash
# Check logs
pm2 logs latanda-chain --lines 50

# Common fix: reset data (keeps config/keys)
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
pm2 restart latanda-chain
```

### Genesis hash mismatch
```bash
# Redownload genesis
wget -q https://latanda.online/chain/genesis.json -O ~/.latanda/config/genesis.json
sha256sum ~/.latanda/config/genesis.json
# Must match: defeeddaa99e8968fd7b65ae20380068015505138171e6cbea94cac195c34cc3
```

---

## Network Information

| Resource | URL |
|----------|-----|
| Genesis File | https://latanda.online/chain/genesis.json |
| Setup Script | https://latanda.online/chain/node-setup.sh |
| Chain Source | https://latanda.online/chain/latanda-chain-source.tar.gz |
| RPC Endpoint | http://168.231.67.201:26657 |
| REST API | http://168.231.67.201:1317 |
| P2P Seed | `483a8110c3cd93c8dd3801d935151e98656f5b67@168.231.67.201:26656` |
| Chain ID | `latanda-testnet-1` |
| Denom | `ultd` (1 LTD = 1,000,000 ultd) |
| Genesis Hash | `defeeddaa99e8968fd7b65ae20380068015505138171e6cbea94cac195c34cc3` |

---

## Support

- **Contact:** contact@latanda.online
- **GitHub:** github.com/INDIGOAZUL
- **Platform:** https://latanda.online

---

*Ray-Banks LLC | La Tanda Chain Testnet*
