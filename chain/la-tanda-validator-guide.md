# La Tanda Testnet Validator Guide — Complete Lifecycle from Installation to Operation

**Chain ID:** `latanda-testnet-1`
**Token:** LTD (micro-unit: `ultd`, 1 LTD = 1,000,000 ultd)
**Total Supply:** 200,000,000 LTD (fixed)
**Block Time:** ~5 seconds
**Consensus:** CometBFT (Tendermint, Delegated Proof of Stake)
**Address Prefix:** `ltd`
**Validator Prefix:** `ltdvaloper`
**Consensus Pubkey Prefix:** `ltdvalconspub`

---

## 📋 Table of Contents

1. [Server Requirements](#1-server-requirements)
2. [Ubuntu Preparation](#2-ubuntu-preparation)
3. [Go Installation](#3-go-installation)
4. [Latanda Binary Installation](#4-latanda-binary-installation)
5. [Chain Initialization](#5-chain-initialization)
6. [Genesis Download & Verification](#6-genesis-download--verification)
7. [Peer Configuration](#7-peer-configuration)
8. [Systemd Service Creation](#8-systemd-service-creation)
9. [Starting and Managing the Node](#9-starting-and-managing-the-node)
10. [State Sync Configuration](#10-state-sync-configuration)
11. [Wallet Creation](#11-wallet-creation)
12. [Faucet & Verification Process](#12-faucet--verification-process)
13. [Validator Creation](#13-validator-creation)
14. [Validator Management Commands](#14-validator-management-commands)
15. [Monitoring & Health Checks](#15-monitoring--health-checks)
16. [Common Troubleshooting](#16-common-troubleshooting)
17. [Security Recommendations](#17-security-recommendations)
18. [Useful Maintenance Commands](#18-useful-maintenance-commands)

---

## 1. Server Requirements

| Component | Minimum | Recommended | Validator (Production) |
|-----------|---------|-------------|------------------------|
| **OS** | Ubuntu 22.04+ / Debian 12+ | Ubuntu 24.04 LTS | Ubuntu 24.04 LTS |
| **CPU** | 2 cores | 4 cores | 4-8 cores (dedicated) |
| **RAM** | 4 GB | 8 GB | 16-32 GB |
| **Disk** | 50 GB SSD | 100 GB NVMe | 500 GB - 1 TB NVMe |
| **Network** | 100 Mbps | 1 Gbps | 1 Gbps+ (low latency) |
| **Ports** | 26656 (P2P), 26657 (RPC) | Same + 1317 (REST) | Same + monitoring ports |

> **Note:** For testnet, minimum specs work fine. For mainnet or high-uptime validation, use recommended/production specs.

### Cloud Provider Recommendations

| Provider | Instance Type | Est. Cost/mo | Notes |
|----------|---------------|--------------|-------|
| **Hetzner** | CX42 (4 vCPU, 8 GB) | ~$18 | Best price/performance, NVMe |
| **DigitalOcean** | CPU-Optimized 4GB | ~$28 | Good network, easier setup |
| **Vultr** | Cloud Compute 8GB | ~$24 | Many locations |
| **AWS/GCP/Azure** | t3.medium / e2-standard-4 | ~$30-50 | More expensive, enterprise features |

---

## 2. Ubuntu Preparation

### 2.1 Connect to Your Server

```bash
# Windows (PowerShell) / Mac (Terminal) / Linux
ssh root@YOUR_SERVER_IP
```

### 2.2 System Update & Base Packages

```bash
# Update everything
apt update && apt upgrade -y

# Install essential tools
apt install -y \
  build-essential \
  git \
  curl \
  wget \
  jq \
  ufw \
  fail2ban \
  htop \
  vim \
  unzip \
  lz4 \
  snapd
```

### 2.3 Create a Non-Root User (Strongly Recommended)

```bash
# Create user (replace 'validator' with your preferred username)
adduser validator

# Give sudo privileges
usermod -aG sudo validator

# Switch to the new user
su - validator
```

### 2.4 SSH Hardening

```bash
# Edit SSH config
sudo vim /etc/ssh/sshd_config

# Recommended settings:
# PasswordAuthentication no
# PubkeyAuthentication yes
# PermitRootLogin no
# Port 22  (or change to non-standard port)

# Restart SSH
sudo systemctl restart sshd
```

**⚠️ Before disabling password auth, ensure you have SSH keys set up!**

```bash
# On YOUR LOCAL MACHINE (not the server):
ssh-keygen -t ed25519 -C "your-email@example.com"
ssh-copy-id validator@YOUR_SERVER_IP
```

### 2.5 Firewall Setup

```bash
# Allow SSH (adjust port if you changed it)
sudo ufw allow 22/tcp comment "SSH"

# La Tanda Chain ports
sudo ufw allow 26656/tcp comment "La Tanda P2P"
sudo ufw allow 26657/tcp comment "La Tanda RPC"
sudo ufw allow 1317/tcp comment "La Tanda REST API"

# Optional: Monitoring (Prometheus/Grafana)
# sudo ufw allow 9090/tcp comment "Prometheus"
# sudo ufw allow 3000/tcp comment "Grafana"

# Enable firewall
sudo ufw enable

# Verify
sudo ufw status verbose
```

### 2.6 Fail2ban Configuration

```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Check status
sudo fail2ban-client status
```

---

## 3. Go Installation

La Tanda Chain requires **Go 1.22+**. We'll install 1.24.1.

```bash
# Download and install Go
cd /tmp
wget -q https://go.dev/dl/go1.24.1.linux-amd64.tar.gz -O go.tar.gz
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf go.tar.gz
rm go.tar.gz

# Add to PATH (for current session)
export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin

# Make permanent
echo 'export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin' >> ~/.bashrc
echo 'export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin' >> ~/.profile
source ~/.bashrc

# Verify
go version
# Output: go version go1.24.1 linux/amd64
```

---

## 4. Latanda Binary Installation

### Option A: Build from Source (Recommended for Validators)

```bash
# Create build directory
mkdir -p /tmp/latanda-build && cd /tmp/latanda-build

# Download chain source
wget -q https://latanda.online/chain/latanda-chain-source.tar.gz
tar -xzf latanda-chain-source.tar.gz

# Build the binary
go mod tidy
go build -o /usr/local/bin/latandad ./cmd/latandad

# Verify installation
latandad version
# Example output:
# Version: 1.0.0
# Commit: abc123...
# Go Version: go1.24.1
```

### Option B: Use the Automated Setup Script (Easiest)

```bash
# This script handles everything: Go, build, genesis, peers, firewall
wget -q https://latanda.online/chain/node-setup.sh -O node-setup.sh
chmod +x node-setup.sh
./node-setup.sh
```

> **Tip:** The script is great for quick setup, but building manually gives you more control and understanding.

---

## 5. Chain Initialization

```bash
# Choose a moniker (your node's public name on the network)
# Use something identifiable like: yourname-validator
MONIKER="my-validator-name"

# Initialize the node
latandad init "$MONIKER" --chain-id latanda-testnet-1 --default-denom ultd
```

This creates the following structure in `~/.latanda/`:

```
~/.latanda/
├── config/
│   ├── config.toml          # Network & consensus config
│   ├── app.toml             # App-specific config (API, gRPC, etc.)
│   ├── node_key.json        # Node identity (P2P) — BACKUP THIS!
│   ├── priv_validator_key.json  # Validator signing key — BACKUP THIS!
│   └── genesis.json         # Genesis file (downloaded next)
└── data/                    # Blockchain data (blocks, state)
```

### 5.1 Backup Your Keys Immediately

```bash
# Create backup directory
mkdir -p ~/latanda-backup/keys

# Copy critical files
cp ~/.latanda/config/node_key.json ~/latanda-backup/keys/
cp ~/.latanda/config/priv_validator_key.json ~/latanda-backup/keys/

# Secure permissions
chmod 600 ~/latanda-backup/keys/*.json

# Verify backups
ls -la ~/latanda-backup/keys/
```

> **🔴 CRITICAL:** Losing `priv_validator_key.json` means losing your validator identity forever. Store backups OFF-SITE (encrypted USB, secure cloud, password manager).

---

## 6. Genesis Download & Verification

```bash
# Download genesis file
wget -q https://latanda.online/chain/genesis.json -O ~/.latanda/config/genesis.json

# Verify SHA256 hash
sha256sum ~/.latanda/config/genesis.json
# Expected: 98fc9871d6a3b7b12b3f7fcaa1ca3303ffcfad0f209d61355975a15069ac3907

# Verify chain ID in genesis matches
jq '.chain_id' ~/.latanda/config/genesis.json
# Should output: "latanda-testnet-1"
```

> **Why verification matters:** A mismatched genesis file will cause your node to join a different chain (fork). Always verify the hash.

---

## 7. Peer Configuration

### 7.1 Persistent Peers (Recommended)

```bash
# Main seed node
PEERS="483a8110c3cd93c8dd3801d935151e98656f5b67@168.231.67.201:26656"

# Additional community peers (add for better connectivity)
# PEERS="$PEERS,peer2-id@peer2-ip:26656,peer3-id@peer3-ip:26656"

# Update config.toml
sed -i "s|persistent_peers = \"\"|persistent_peers = \"$PEERS\"|" ~/.latanda/config/config.toml
sed -i "s|seeds = \"\"|seeds = \"$PEERS\"|" ~/.latanda/config/config.toml
```

### 7.2 Find Additional Peers

```bash
# Get peer list from RPC
curl -s https://latanda.online/chain/rpc/net_info | jq '.result.peers[] | {id: .node_info.id, address: .remote_ip}' | head -20

# Or use the chain explorer: https://latanda.online/chain/
```

### 7.3 Configure P2P Settings

```bash
# Edit config.toml for better peer management
cat >> ~/.latanda/config/config.toml << 'EOF'

# P2P optimization
[p2p]
  # Allow up to 50 peers
  max_num_inbound_peers = 40
  max_num_outbound_peers = 10
  
  # Dial timeout
  dial_timeout = "3s"
  
  # Handshake timeout
  handshake_timeout = "20s"
  
  # Enable UPnP (if behind NAT)
  # upnp = true
EOF
```

---

## 8. Systemd Service Creation

Using **systemd** is the production-standard way to run your node (better than PM2 for auto-restart, logging, and resource limits).

### 8.1 Create the Service File

```bash
sudo tee /etc/systemd/system/latandad.service > /dev/null << 'EOF'
[Unit]
Description=La Tanda Chain Node
After=network-online.target
Wants=network-online.target

[Service]
User=validator
Group=validator
Type=simple
WorkingDirectory=/home/validator
ExecStart=/usr/local/bin/latandad start --home /home/validator/.latanda
Restart=always
RestartSec=10
LimitNOFILE=65535
LimitNPROC=65535

# Resource limits (adjust based on your server)
MemoryMax=8G
CPUQuota=200%

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=read-only
ReadWritePaths=/home/validator/.latanda

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=latandad

[Install]
WantedBy=multi-user.target
EOF
```

### 8.2 Enable and Start the Service

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable auto-start on boot
sudo systemctl enable latandad

# Start the service
sudo systemctl start latandad

# Check status
sudo systemctl status latandad
```

### 8.3 Service Management Commands

```bash
# Start
sudo systemctl start latandad

# Stop
sudo systemctl stop latandad

# Restart
sudo systemctl restart latandad

# Status
sudo systemctl status latandad

# View logs (journalctl)
sudo journalctl -u latandad -f           # Follow live logs
sudo journalctl -u latandad -n 100      # Last 100 lines
sudo journalctl -u latandad --since "1 hour ago"

# Disable auto-start
sudo systemctl disable latandad
```

---

## 9. Starting and Managing the Node

### 9.1 First Start (Full Sync)

```bash
# With systemd (recommended)
sudo systemctl start latandad

# Monitor sync progress
sudo journalctl -u latandad -f

# Or check status via RPC
latandad status | jq '.sync_info'
```

### 9.2 Wait for Sync Completion

```bash
# Watch until catching_up becomes false
watch -n 5 'latandad status | jq ".sync_info"'

# Or use a loop
while true; do
  STATUS=$(latandad status | jq -r '.sync_info.catching_up')
  HEIGHT=$(latandad status | jq -r '.sync_info.latest_block_height')
  echo "Height: $HEIGHT | Catching up: $STATUS"
  if [ "$STATUS" = "false" ]; then
    echo "✅ Node fully synced!"
    break
  fi
  sleep 10
done
```

### 9.3 Verify Network Connectivity

```bash
# Check connected peers
latandad status | jq '.peers'

# Or via RPC
curl -s localhost:26657/net_info | jq '.result.n_peers'

# Should show 1+ peers
```

---

## 10. State Sync Configuration

State sync allows your node to catch up in minutes instead of hours by downloading a snapshot of the application state at a recent height.

### 10.1 Enable State Sync

```bash
# Get a trust height and hash from the RPC
TRUST_HEIGHT=$(curl -s https://latanda.online/chain/rpc/block?height=100000 | jq -r '.result.block.header.height')
TRUST_HASH=$(curl -s https://latanda.online/chain/rpc/block?height=100000 | jq -r '.result.block_id.hash')

echo "Trust Height: $TRUST_HEIGHT"
echo "Trust Hash: $TRUST_HASH"
```

### 10.2 Configure State Sync in config.toml

```bash
# Enable state sync
sed -i 's|statesync.enable = false|statesync.enable = true|' ~/.latanda/config/config.toml

# Set RPC servers (use multiple for redundancy)
sed -i 's|statesync.rpc_servers = ""|statesync.rpc_servers = "https://latanda.online/chain/rpc/,https://rpc2.latanda.online:443"|' ~/.latanda/config/config.toml

# Set trust height and hash
sed -i "s|statesync.trust_height = 0|statesync.trust_height = $TRIST_HEIGHT|" ~/.latanda/config/config.toml
sed -i "s|statesync.trust_hash = \"\"|statesync.trust_hash = \"$TRUST_HASH\"|" ~/.latanda/config/config.toml

# Set trust period (how long to trust the state)
sed -i 's|statesync.trust_period = "168h0m0s"|statesync.trust_period = "168h0m0s"|' ~/.latanda/config/config.toml
```

### 10.3 Start with State Sync

```bash
# Reset data (keeps config and keys)
latandad tendermint unsafe-reset-all --home ~/.latanda

# Restart node - will state sync automatically
sudo systemctl restart latandad

# Monitor
sudo journalctl -u latandad -f
```

> **Note:** State sync requires a healthy RPC endpoint with the trust height available. If it fails, the node falls back to regular block sync.

---

## 11. Wallet Creation

### 11.1 Create a Validator Wallet

```bash
# Create a new key (use test keyring for testnet, file/prod for mainnet)
latandad keys add validator-wallet --keyring-backend test --home ~/.latanda

# Output will show:
# - name: validator-wallet
# - type: local
# - address: ltd1xxxx... (your account address)
# - pubkey: ltdpub1xxxx...
# - mnemonic: 24 words — SAVE THESE SECURELY!
```

> **🔴 CRITICAL:** Write down the 24-word mnemonic and store it offline. This is the ONLY way to recover your wallet.

### 11.2 List and Show Keys

```bash
# List all keys
latandad keys list --keyring-backend test --home ~/.latanda

# Show specific key details
latandad keys show validator-wallet -a --keyring-backend test --home ~/.latanda
# Output: ltd1xxxx... (account address)

latandad keys show validator-wallet --bech val --keyring-backend test --home ~/.latanda
# Output: ltdvaloper1xxxx... (validator operator address)

latandad keys show validator-wallet --bech cons --keyring-backend test --home ~/.latanda
# Output: ltdvalconspub1xxxx... (consensus pubkey)
```

### 11.3 Export/Import Keys (for backup/migration)

```bash
# Export (encrypted, requires passphrase)
latandad keys export validator-wallet --keyring-backend test --home ~/.latanda > validator-wallet-backup.txt

# Import on another machine
latandad keys import validator-wallet validator-wallet-backup.txt --keyring-backend test --home ~/.latanda
```

---

## 12. Faucet & Verification Process

### 12.1 Get Testnet Tokens (Faucet)

```bash
# Check your address
ADDRESS=$(latandad keys show validator-wallet -a --keyring-backend test --home ~/.latanda)
echo "My address: $ADDRESS"
```

**Options to get testnet LTD:**

1. **Discord Faucet** (recommended):
   - Join: https://discord.gg/Ve9M2ZSYC2
   - Go to #faucet channel
   - Type: `!faucet <your-address>`
   - Receive: 100,000 LTD (testnet)

2. **Web Faucet** (if available):
   - Visit: https://latanda.online/faucet
   - Enter your address

3. **Contact Team:**
   - Email: contact@latanda.online
   - Request validator allocation (50,000 LTD for staking)

### 12.2 Verify Balance

```bash
# Query balance
latandad query bank balances $ADDRESS --home ~/.latanda

# Example output:
# balances:
# - amount: "100000000000"
#   denom: ultd
# pagination:
#   next_key: null
#   total: "100000000000"
```

### 12.3 KYC Verification (Required for Validator)

Before creating a validator, you must complete KYC on the La Tanda platform:

1. Go to https://latanda.online
2. Sign up / log in
3. Complete KYC verification (identity + address)
4. Link your validator wallet address to your account

> **Why KYC?** La Tanda Chain has regulatory compliance requirements. Only KYC-verified validators can join the active set.

---

## 13. Validator Creation

### 13.1 Prerequisites Checklist

- [ ] Node fully synced (`catching_up: false`)
- [ ] 50,000 LTD (50,000,000,000 ultd) in your wallet
- [ ] KYC completed on La Tanda platform
- [ ] Node running stably for 1+ week (recommended)
- [ ] Monitoring/alerting configured
- [ ] Backup of `priv_validator_key.json` stored offline

### 13.2 Create Validator Transaction

```bash
# Set variables
WALLET="validator-wallet"
MONIKER="my-validator-name"
IDENTITY=""          # Optional: Keybase identity
WEBSITE=""           # Optional: your website
DETAILS=""           # Optional: description
COMMISSION_RATE="0.10"        # 10%
COMMISSION_MAX_RATE="0.20"    # 20%
COMMISSION_MAX_CHANGE="0.01"  # 1% per change
MIN_SELF_DELEGATION="1"

# Create validator
latandad tx staking create-validator \
  --amount=50000000000ultd \
  --pubkey=$(latandad tendermint show-validator --home ~/.latanda) \
  --moniker="$MONIKER" \
  --identity="$IDENTITY" \
  --website="$WEBSITE" \
  --details="$DETAILS" \
  --commission-rate="$COMMISSION_RATE" \
  --commission-max-rate="$COMMISSION_MAX_RATE" \
  --commission-max-change-rate="$COMMISSION_MAX_CHANGE" \
  --min-self-delegation="$MIN_SELF_DELEGATION" \
  --chain-id=latanda-testnet-1 \
  --keyring-backend=test \
  --from="$WALLET" \
  --gas=auto \
  --gas-adjustment=1.5 \
  --fees=5000ultd \
  --home ~/.latanda

# You'll be prompted to confirm. Type 'y' and enter your keyring passphrase.
```

### 13.3 Verify Validator Creation

```bash
# Get your validator operator address
VALOPER=$(latandad keys show validator-wallet --bech val -a --keyring-backend test --home ~/.latanda)
echo "Validator operator: $VALOPER"

# Check validator status
latandad query staking validator $VALOPER --home ~/.latanda

# Check if in active set
latandad query staking validators --home ~/.latanda | jq '.validators[] | select(.operator_address=="'$VALOPER'") | {moniker: .description.moniker, status: .status, tokens: .tokens}'
```

### 13.4 Validator Status Values

| Status | Description |
|--------|-------------|
| `BOND_STATUS_UNBONDED` | Not a validator yet / unbonding |
| `BOND_STATUS_UNBONDING` | Unbonding in progress (21 days) |
| `BOND_STATUS_BONDED` | **Active validator** (in top 13 by stake) |

---

## 14. Validator Management Commands

### 14.1 Edit Validator Info

```bash
# Update commission rate (max 1% change per update)
latandad tx staking edit-validator \
  --commission-rate="0.12" \
  --chain-id=latanda-testnet-1 \
  --keyring-backend=test \
  --from=validator-wallet \
  --gas=auto --gas-adjustment=1.5 --fees=5000ultd \
  --home ~/.latanda

# Update other metadata
latandad tx staking edit-validator \
  --moniker="new-name" \
  --identity="keybase-id" \
  --website="https://my-validator.com" \
  --details="Professional validator with 99.9% uptime" \
  --chain-id=latanda-testnet-1 \
  --keyring-backend=test \
  --from=validator-wallet \
  --gas=auto --gas-adjustment=1.5 --fees=5000ultd \
  --home ~/.latanda
```

### 14.2 Delegate/Undelegate/Redelegate

```bash
# Delegate more tokens to yourself
latandad tx staking delegate $VALOPER 10000000000ultd \
  --chain-id=latanda-testnet-1 \
  --keyring-backend=test \
  --from=validator-wallet \
  --gas=auto --gas-adjustment=1.5 --fees=5000ultd \
  --home ~/.latanda

# Undelegate (starts 21-day unbonding)
latandad tx staking unbond $VALOPER 10000000000ultd \
  --chain-id=latanda-testnet-1 \
  --keyring-backend=test \
  --from=validator-wallet \
  --gas=auto --gas-adjustment=1.5 --fees=5000ultd \
  --home ~/.latanda

# Redelegate to another validator (instant)
latandad tx staking redelegate $VALOPER <OTHER_VALOPER> 10000000000ultd \
  --chain-id=latanda-testnet-1 \
  --keyring-backend=test \
  --from=validator-wallet \
  --gas=auto --gas-adjustment=1.5 --fees=5000ultd \
  --home ~/.latanda
```

### 14.3 Withdraw Rewards & Commission

```bash
# Withdraw all rewards (including commission)
latandad tx distribution withdraw-all-rewards \
  --chain-id=latanda-testnet-1 \
  --keyring-backend=test \
  --from=validator-wallet \
  --gas=auto --gas-adjustment=1.5 --fees=5000ultd \
  --home ~/.latanda

# Withdraw from specific validator
latandad tx distribution withdraw-rewards $VALOPER \
  --commission \
  --chain-id=latanda-testnet-1 \
  --keyring-backend=test \
  --from=validator-wallet \
  --gas=auto --gas-adjustment=1.5 --fees=5000ultd \
  --home ~/.latanda
```

### 14.4 Governance Participation

```bash
# List proposals
latandad query gov proposals --home ~/.latanda

# Vote (yes/no/no_with_veto/abstain)
latandad tx gov vote 1 yes \
  --chain-id=latanda-testnet-1 \
  --keyring-backend=test \
  --from=validator-wallet \
  --gas=auto --gas-adjustment=1.5 --fees=5000ultd \
  --home ~/.latanda
```

---

## 15. Monitoring & Health Checks

### 15.1 Essential Health Checks

```bash
#!/bin/bash
# save as ~/monitor-validator.sh
# chmod +x ~/monitor-validator.sh

VALOPER=$(latandad keys show validator-wallet --bech val -a --keyring-backend test --home ~/.latanda)

echo "=== NODE STATUS ==="
latandad status | jq '.sync_info | {height: .latest_block_height, catching_up: .catching_up}'

echo -e "\n=== PEERS ==="
curl -s localhost:26657/net_info | jq '.result.n_peers'

echo -e "\n=== VALIDATOR STATUS ==="
latandad query staking validator $VALOPER --home ~/.latanda --output json | jq '{
  moniker: .validator.description.moniker,
  status: .validator.status,
  tokens: .validator.tokens,
  commission: .validator.commission.commission_rates.rate,
  jailed: .validator.jailed
}'

echo -e "\n=== SIGNING INFO ==="
latandad query slashing signing-info $(latandad tendermint show-validator --home ~/.latanda) --home ~/.latanda --output json | jq '{
  start_height: .start_height,
  missed_blocks: .missed_blocks_counter,
  index_offset: .index_offset
}'
```

### 15.2 Prometheus Metrics (Optional)

```bash
# Enable Prometheus in app.toml
sed -i 's|prometheus = false|prometheus = true|' ~/.latanda/config/app.toml
sed -i 's|prometheus_listen_addr = ":26660"|prometheus_listen_addr = "0.0.0.0:26660"|' ~/.latanda/config/app.toml

# Restart node
sudo systemctl restart latandad

# Test metrics endpoint
curl -s localhost:26660/metrics | head -20
```

### 15.3 Grafana Dashboard (Community)

Import this dashboard ID for La Tanda Chain monitoring:
- **Community dashboard:** https://grafana.com/grafana/dashboards/18608-cosmos-validator/

### 15.4 Alerting Rules (Example)

```yaml
# prometheus/alerts.yml
groups:
- name: latanda-validator
  rules:
  - alert: ValidatorDown
    expr: up{job="latandad"} == 0
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "La Tanda validator is down"

  - alert: ValidatorJailed
    expr: latanda_validator_jailed == 1
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Validator has been jailed!"

  - alert: ValidatorMissingBlocks
    expr: rate(latanda_validator_missed_blocks[5m]) > 0.1
    for: 10m
    labels:
      severity: warning
    annotations:
      summary: "Validator missing blocks"

  - alert: NodeNotSyncing
    expr: latanda_syncing == 1
    for: 30m
    labels:
      severity: warning
    annotations:
      summary: "Node not synced for 30 minutes"
```

### 15.5 Quick Health Check One-Liner

```bash
# Run this periodically (cron every 5 min)
latandad status | jq -r '.sync_info | "Height: \(.latest_block_height) Catching up: \(.catching_up)"' && \
curl -s localhost:26657/net_info | jq -r '.result.n_peers | "Peers: \(.)"' && \
latandad query staking validator $(latandad keys show validator-wallet --bech val -a --keyring-backend test --home ~/.latanda) --home ~/.latanda -o json | jq -r '.validator | "Status: \(.status) Jailed: \(.jailed)"'
```

---

## 16. Common Troubleshooting

### 16.1 Node Won't Start

```bash
# Check logs
sudo journalctl -u latandad -n 100 --no-pager

# Common error: "address already in use"
# Fix: Check if another process uses port 26656/26657
sudo lsof -i :26656
sudo lsof -i :26657

# Kill and restart
sudo systemctl stop latandad
sudo kill -9 $(lsof -t -i:26656)
sudo systemctl start latandad
```

### 16.2 Genesis Hash Mismatch

```bash
# Re-download and verify
wget -q https://latanda.online/chain/genesis.json -O ~/.latanda/config/genesis.json
sha256sum ~/.latanda/config/genesis.json
# Must match: 98fc9871d6a3b7b12b3f7fcaa1ca3303ffcfad0f209d61355975a15069ac3907

# If still wrong, chain may have upgraded — check announcements
```

### 16.3 Can't Find Peers / 0 Peers

```bash
# Check firewall
sudo ufw status

# Check seed connectivity
curl -s http://168.231.67.201:26657/status | jq '.result.node_info.id'

# Re-add seed peer
sed -i 's|seeds = ".*"|seeds = "483a8110c3cd93c8dd3801d935151e98656f5b67@168.231.67.201:26656"|' ~/.latanda/config/config.toml
sudo systemctl restart latandad
```

### 16.4 Node Stuck / Not Syncing

```bash
# Check peer count
curl -s localhost:26657/net_info | jq '.result.n_peers'

# If 0 peers, check P2P port reachability from outside
# Use: https://www.yougetsignal.com/tools/open-ports/ (check 26656)

# Reset and resync (keeps config/keys)
sudo systemctl stop latandad
latandad tendermint unsafe-reset-all --home ~/.latanda
sudo systemctl start latandad
```

### 16.5 Validator Jailed

```bash
# Check why
latandad query slashing signing-info $(latandad tendermint show-validator --home ~/.latanda) --home ~/.latanda

# If missed blocks > threshold, wait for unjail period then:
latandad tx slashing unjail \
  --chain-id=latanda-testnet-1 \
  --keyring-backend=test \
  --from=validator-wallet \
  --gas=auto --gas-adjustment=1.5 --fees=5000ultd \
  --home ~/.latanda

# MUST fix root cause first (node downtime, sync issues, etc.)
```

### 16.6 RPC/API Not Responding

```bash
# Check if RPC is enabled in app.toml
grep -A5 "\[api\]" ~/.latanda/config/app.toml

# Enable if needed
sed -i 's|enable = false|enable = true|' ~/.latanda/config/app.toml
sed -i 's|address = "tcp://localhost:1317"|address = "tcp://0.0.0.0:1317"|' ~/.latanda/config/app.toml

# Restart
sudo systemctl restart latandad
```

### 16.7 Disk Space Issues

```bash
# Check disk usage
df -h
du -sh ~/.latanda/data/

# Prune old states (if enabled in app.toml)
# snapshot-interval, snapshot-keep-recent

# Or use state sync to reduce disk usage
```

---

## 17. Security Recommendations

### 17.1 Infrastructure Security

| Measure | Implementation |
|---------|----------------|
| **SSH Keys Only** | Disable password auth, use Ed25519 keys |
| **Non-root User** | Run node as `validator` user, not root |
| **Firewall** | Only open 22, 26656, 26657 (and monitoring ports) |
| **Fail2ban** | Auto-ban IPs after failed SSH attempts |
| **Auto-updates** | `apt install unattended-upgrades && dpkg-reconfigure unattended-upgrades` |
| **2FA on Cloud** | Enable MFA on Hetzner/DO/Vultr/AWS accounts |
| **Dedicated Server** | Don't run other services on validator node |

### 17.2 Key Management

```bash
# Secure key files
chmod 600 ~/.latanda/config/node_key.json
chmod 600 ~/.latanda/config/priv_validator_key.json

# Offsite backup (encrypted)
tar -czf - ~/.latanda/config/node_key.json ~/.latanda/config/priv_validator_key.json | \
  gpg --symmetric --cipher-algo AES256 > latanda-keys-backup-$(date +%Y%m%d).tar.gz.gpg

# Store in: password manager, encrypted USB, secure cloud (with 2FA)
```

### 17.3 Validator-Specific Security

- **Never** share your `priv_validator_key.json`
- **Never** run the same validator key on two nodes simultaneously (double-sign = slashing)
- **Use** a sentry node architecture for mainnet (see below)
- **Monitor** for jail/slashing events 24/7
- **Rotate** consensus keys periodically (planned feature)

### 17.4 Sentry Node Architecture (For Mainnet)

```
[Validator Node] ←private network→ [Sentry Node 1] ←public internet→ [Peers]
                                      [Sentry Node 2] ←public internet→ [Peers]
```

- Validator node has NO public IP
- Only connects to your sentry nodes
- Sentry nodes handle DDoS and expose P2P
- Requires private network (WireGuard, Tailscale, or VPC)

---

## 18. Useful Maintenance Commands

### 18.1 Daily Operations

```bash
# Quick status check
latandad status | jq '.sync_info'

# Check validator status
VALOPER=$(latandad keys show validator-wallet --bech val -a --keyring-backend test --home ~/.latanda)
latandad query staking validator $VALOPER --home ~/.latanda -o json | jq '.validator | {moniker: .description.moniker, status: .status, tokens: .tokens, commission: .commission.commission_rates.rate, jailed: .jailed}'

# Check signing performance
latandad query slashing signing-info $(latandad tendermint show-validator --home ~/.latanda) --home ~/.latanda -o json | jq '{missed: .missed_blocks_counter, height: .start_height}'
```

### 18.2 Log Analysis

```bash
# Last 100 lines
sudo journalctl -u latandad -n 100 --no-pager

# Follow live
sudo journalctl -u latandad -f

# Search for errors
sudo journalctl -u latandad -p err -n 50

# Search for specific patterns
sudo journalctl -u latandad | grep -i "error\|fail\|panic\|timeout" | tail -20
```

### 18.3 Backup & Restore

```bash
# Full config backup (keys + config, NOT data)
tar -czf latanda-config-backup-$(date +%Y%m%d).tar.gz \
  ~/.latanda/config/ \
  --exclude="~/.latanda/data"

# Restore config
tar -xzf latanda-config-backup-*.tar.gz -C ~/

# Data backup (large, use snapshots instead)
# Preferred: Use state sync or snapshot from another node
```

### 18.4 Upgrades

```bash
# Check current version
latandad version

# Check for upgrades (governance proposals)
latandad query gov proposals --home ~/.latanda | grep -i "upgrade\|software"

# When upgrade is approved:
# 1. Build new binary
# 2. Stop node
# 3. Replace binary
# 4. Run migration (if needed)
# 5. Start node

# Example upgrade process:
sudo systemctl stop latandad
cd /tmp/latanda-build
# ... pull new source, build ...
cp /usr/local/bin/latandad /usr/local/bin/latandad.backup
cp ./latandad /usr/local/bin/latandad
sudo systemctl start latandad
```

### 18.5 Useful Aliases (Add to ~/.bashrc)

```bash
cat >> ~/.bashrc << 'EOF'

# La Tanda Chain aliases
alias lt-status='latandad status | jq ".sync_info"'
alias lt-peers='curl -s localhost:26657/net_info | jq ".result.n_peers"'
alias lt-logs='sudo journalctl -u latandad -f'
alias lt-val='latandad query staking validator $(latandad keys show validator-wallet --bech val -a --keyring-backend test --home ~/.latanda) --home ~/.latanda -o json | jq ".validator | {moniker: .description.moniker, status: .status, tokens: .tokens, commission: .commission.commission_rates.rate, jailed: .jailed}"'
alias lt-sign='latandad query slashing signing-info $(latandad tendermint show-validator --home ~/.latanda) --home ~/.latanda -o json | jq "{missed: .missed_blocks_counter, height: .start_height}"'
alias lt-balance='latandad query bank balances $(latandad keys show validator-wallet -a --keyring-backend test --home ~/.latanda) --home ~/.latanda'
alias lt-restart='sudo systemctl restart latandad'
alias lt-stop='sudo systemctl stop latandad'
alias lt-start='sudo systemctl start latandad'

EOF
source ~/.bashrc
```

---

## 📚 Reference & Resources

| Resource | URL |
|----------|-----|
| **Website** | https://latanda.online |
| **Chain Page** | https://latanda.online/chain/ |
| **Explorer** | https://exp.utsa.tech/latanda/staking |
| **API Docs** | https://latanda.online/docs |
| **Dev Portal** | https://latanda.online/dev-dashboard.html |
| **Discord** | https://discord.gg/Ve9M2ZSYC2 |
| **Telegram** | https://t.me/latandahn |
| **Cosmos Forum** | https://forum.cosmos.network/t/la-tanda-chain/16709 |
| **GitHub** | https://github.com/INDIGOAZUL/la-tanda-web |

---

## 📄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-06-13 | Initial comprehensive validator guide |

---

## 🤝 Support

- **Email:** contact@latanda.online
- **Discord:** https://discord.gg/Ve9M2ZSYC2 (channels: #validators, #node-operators, #faucet)
- **GitHub Issues:** https://github.com/INDIGOAZUL/la-tanda-web/issues

---

*Built for La Tanda Chain Testnet — The Web3 Ecosystem of Honduras* 🇭🇳

*Ray-Banks LLC | latanda-testnet-1*