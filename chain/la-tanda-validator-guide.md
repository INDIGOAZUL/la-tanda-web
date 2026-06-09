# La Tanda Testnet — Complete Validator Guide

**Chain ID:** `latanda-testnet-1`  
**Token:** LTD (micro-unit: `ultd`, 1 LTD = 1,000,000 ultd)  
**Consensus:** CometBFT (Tendermint)  
**Binary:** `latandad`  
**Reward:** 75 LTD (Comprehensive)

> This guide covers the **full validator lifecycle**: from server setup to validator creation, systemd management, state sync, monitoring, security hardening, and maintenance. For basic node setup, see [Node Operator Guide](la-tanda-chain-node-guide.md) or [Beginner Guide](la-tanda-node-beginner-guide.md).

---

## Table of Contents

1. [Server Requirements](#1-server-requirements)
2. [Ubuntu Preparation](#2-ubuntu-preparation)
3. [Go Installation](#3-go-installation)
4. [La Tanda Binary Installation](#4-la-tanda-binary-installation)
5. [Chain Initialization](#5-chain-initialization)
6. [Genesis Download](#6-genesis-download)
7. [Peer Configuration](#7-peer-configuration)
8. [Systemd Service Creation](#8-systemd-service-creation)
9. [Starting and Managing the Node](#9-starting-and-managing-the-node)
10. [State Sync Configuration](#10-state-sync-configuration)
11. [Wallet Creation](#11-wallet-creation)
12. [Faucet / Verification Process](#12-faucet--verification-process)
13. [Validator Creation](#13-validator-creation)
14. [Validator Management Commands](#14-validator-management-commands)
15. [Monitoring and Health Checks](#15-monitoring-and-health-checks)
16. [Common Troubleshooting](#16-common-troubleshooting)
17. [Security Recommendations](#17-security-recommendations)
18. [Useful Maintenance Commands](#18-useful-maintenance-commands)
19. [CLI Cheatsheet](#19-cli-cheatsheet)

---

## 1. Server Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| OS | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |
| CPU | 2 cores | 4 cores |
| RAM | 4 GB | 8 GB |
| Disk | 50 GB SSD | 100 GB NVMe SSD |
| Network | 100 Mbps | 1 Gbps |
| Uptime | 99.5% | 99.9% |
| Ports | 26656 (P2P) | 26656 + 26657 (RPC) |

**Estimated costs:** ~$5-12/month on Hetzner, DigitalOcean, or Vultr.

> **Why SSD/NVMe?** Blockchain state is stored in a database with frequent random reads. HDD will cause missed blocks and slashing.

---

## 2. Ubuntu Preparation

### 2.1 Update System

```bash
sudo apt update && sudo apt upgrade -y
sudo reboot
```

### 2.2 Install Dependencies

```bash
sudo apt install -y \
  build-essential \
  git \
  curl \
  wget \
  jq \
  ufw \
  fail2ban \
  unzip \
  lz4 \
  make \
  gcc \
  ncdu
```

### 2.3 Configure Firewall

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment "SSH"
sudo ufw allow 26656/tcp comment "La Tanda P2P"
sudo ufw allow 26657/tcp comment "La Tanda RPC"
sudo ufw --force enable
sudo ufw status verbose
```

### 2.4 Secure SSH

```bash
# Generate SSH key on your LOCAL machine (if you don't have one)
# ssh-keygen -t ed25519 -C "latanda-validator"

# Copy public key to server
# ssh-copy-id root@YOUR_SERVER_IP

# Disable password login
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart sshd
```

### 2.5 Create Dedicated User (Recommended)

```bash
sudo useradd -m -s /bin/bash latanda
sudo usermod -aG sudo latanda
sudo cp -r /root/.ssh /home/latanda/
sudo chown -R latanda:latanda /home/latanda/.ssh
# Switch to latanda user for remaining steps
sudo su - latanda
```

---

## 3. Go Installation

```bash
# Download Go 1.24.1
wget -q https://go.dev/dl/go1.24.1.linux-amd64.tar.gz -O /tmp/go.tar.gz

# Remove old Go and install new
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf /tmp/go.tar.gz
rm /tmp/go.tar.gz

# Add to PATH
echo 'export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin' >> ~/.bashrc
source ~/.bashrc

# Verify
go version
# Expected: go version go1.24.1 linux/amd64
```

---

## 4. La Tanda Binary Installation

### Option A: Build from Source

```bash
mkdir -p /tmp/latanda-build && cd /tmp/latanda-build
wget -q https://latanda.online/chain/latanda-chain-source.tar.gz
tar -xzf latanda-chain-source.tar.gz

# Build
go mod tidy
go build -o /usr/local/bin/latandad ./cmd/latandad

# Verify
latandad version
latandad --help
```

### Option B: Quick Install Script

```bash
wget -q https://latanda.online/chain/node-setup.sh -O /tmp/node-setup.sh
chmod +x /tmp/node-setup.sh
# Review the script before running:
cat /tmp/node-setup.sh
# Run:
/tmp/node-setup.sh
```

---

## 5. Chain Initialization

```bash
# Set your node name (visible on the network)
MONIKER="my-validator-name"

# Initialize
latandad init "$MONIKER" --chain-id latanda-testnet-1 --default-denom ultd

# This creates ~/.latanda/ with:
# config/config.toml      — P2P and consensus settings
# config/app.toml         — application settings
# config/node_key.json    — your node's identity (auto-generated)
# config/priv_validator_key.json — validator signing key (CRITICAL — back this up!)
```

---

## 6. Genesis Download

```bash
wget -q https://latanda.online/chain/genesis.json -O ~/.latanda/config/genesis.json

# Verify hash
sha256sum ~/.latanda/config/genesis.json
# Expected: 98fc9871d6a3b7b12b3f7fcaa1ca3303ffcfad0f209d61355975a15069ac3907
```

> **If hash doesn't match:** Redownload. A mismatched genesis will cause your node to fork from the network.

---

## 7. Peer Configuration

### 7.1 Set Persistent Peers

```bash
PEERS="483a8110c3cd93c8dd3801d935151e98656f5b67@168.231.67.201:26656"

sed -i "s|persistent_peers = \"\"|persistent_peers = \"$PEERS\"|" ~/.latanda/config/config.toml
sed -i "s|seeds = \"\"|seeds = \"$PEERS\"|" ~/.latanda/config/config.toml
```

### 7.2 Set Minimum Gas Price

```bash
sed -i 's|minimum-gas-prices = ""|minimum-gas-prices = "0.001ultd"|' ~/.latanda/config/app.toml
```

### 7.3 Configure RPC (Optional — for monitoring)

```bash
# Enable external RPC access (needed for monitoring)
sed -i 's|laddr = "tcp://127.0.0.1:26657"|laddr = "tcp://0.0.0.0:26657"|' ~/.latanda/config/config.toml

# Enable Prometheus metrics
sed -i 's|prometheus = false|prometheus = true|' ~/.latanda/config/config.toml
sed -i 's|prometheus_listen_addr = ":26660"|prometheus_listen_addr = "0.0.0.0:26660"|' ~/.latanda/config/config.toml
```

---

## 8. Systemd Service Creation

> **Why systemd over PM2?** Systemd is the native Linux init system — more reliable, better logging, automatic restart, and doesn't require Node.js.

### 8.1 Create Service File

```bash
sudo tee /etc/systemd/system/latandad.service > /dev/null <<EOF
[Unit]
Description=La Tanda Chain Node
After=network-online.target

[Service]
User=$USER
ExecStart=$(which latandad) start
Restart=always
RestartSec=3
LimitNOFILE=65535
LimitNPROC=65535

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=latandad

# Environment
Environment="HOME=$HOME"
Environment="PATH=$PATH:/usr/local/go/bin:$HOME/go/bin"

[Install]
WantedBy=multi-user.target
EOF
```

### 8.2 Enable and Reload

```bash
sudo systemctl daemon-reload
sudo systemctl enable latandad
```

### 8.3 Log Rotation (Prevents Disk Fill)

```bash
sudo tee /etc/logrotate.d/latandad > /dev/null <<EOF
/var/log/latandad/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0640 $USER $USER
}
EOF
```

---

## 9. Starting and Managing the Node

### 9.1 Start

```bash
sudo systemctl start latandad
```

### 9.2 Check Status

```bash
# Service status
sudo systemctl status latandad

# Live logs
journalctl -u latandad -f --no-hostname

# Last 100 lines
journalctl -u latandad -n 100 --no-hostname
```

### 9.3 Restart / Stop

```bash
sudo systemctl restart latandad
sudo systemctl stop latandad
```

### 9.4 Verify Sync Progress

```bash
# Check sync status
latandad status 2>&1 | jq '.sync_info'

# Quick check — am I synced?
latandad status 2>&1 | jq '.sync_info.catching_up'
# false = synced, true = still catching up

# Current block height
latandad status 2>&1 | jq '.sync_info.latest_block_height'
```

---

## 10. State Sync Configuration

> **State sync** lets you skip downloading the entire blockchain history. Instead, you download a recent snapshot and sync from there. This reduces sync time from hours to **minutes**.

### 10.1 Enable State Sync

```bash
# Get the latest block height and hash from an RPC endpoint
RPC="https://latanda.online/chain/rpc/"

# Fetch latest block -3 (for safety)
LATEST_HEIGHT=$(curl -s "$RPC/block" | jq -r .result.block.header.height)
TRUST_HEIGHT=$((LATEST_HEIGHT - 100))
TRUST_HASH=$(curl -s "$RPC/block?height=$TRUST_HEIGHT" | jq -r .result.block_id.hash)

echo "Trust Height: $TRUST_HEIGHT"
echo "Trust Hash: $TRUST_HASH"

# Configure state sync
sed -i "s|enable = false|enable = true|" ~/.latanda/config/config.toml
sed -i "s|rpc_servers = \"\"|rpc_servers = \"$RPC,$RPC\"|" ~/.latanda/config/config.toml
sed -i "s|trust_height = 0|trust_height = $TRUST_HEIGHT|" ~/.latanda/config/config.toml
sed -i "s|trust_hash = \"\"|trust_hash = \"$TRUST_HASH\"|" ~/.latanda/config/config.toml

# Set trust period (should be ~2/3 of unbonding period)
sed -i "s|trust_period = \"0s\"|trust_period = \"168h\"|" ~/.latanda/config/config.toml
```

### 10.2 Restart with State Sync

```bash
# Clear existing data first
latandad tendermint unsafe-reset-all --home ~/.latanda

# Restart
sudo systemctl restart latandad

# Monitor sync progress
journalctl -u latandad -f --no-hostname
```

### 10.3 Disable State Sync After Syncing

Once synced, disable state sync to avoid issues on restart:

```bash
sed -i "s|enable = true|enable = false|" ~/.latanda/config/config.toml
sudo systemctl restart latandad
```

---

## 11. Wallet Creation

### 11.1 Create a Key

```bash
# Create wallet (use --keyring-backend test for testnet)
latandad keys add my-validator --keyring-backend test

# Output includes:
# - name: my-validator
# - address: ltd1... (your wallet address)
# - pubkey: ...
# - mnemonic: "word1 word2 word3 ..." (SAVE THIS SECURELY!)
```

> **CRITICAL:** Write down the 24-word mnemonic on paper. Store it offline. Anyone with these words controls your funds.

### 11.2 List Keys

```bash
latandad keys list --keyring-backend test
```

### 11.3 Show Address

```bash
latandad keys show my-validator -a --keyring-backend test
```

### 11.4 Export / Import Keys

```bash
# Export (for backup)
latandad keys export my-validator --keyring-backend test > my-validator-key.backup

# Import (on new machine)
latandad keys import my-validator my-validator-key.backup --keyring-backend test
```

---

## 12. Faucet / Verification Process

### 12.1 Check Balance

```bash
MY_ADDR=$(latandad keys show my-validator -a --keyring-backend test)
latandad query bank balances $MY_ADDR
```

### 12.2 Request Testnet Tokens

Contact the La Tanda team to receive testnet LTD:

- **Email:** contact@latanda.online
- **GitHub:** Open an issue at [INDIGOAZUL/la-tanda-web](https://github.com/INDIGOAZUL/la-tanda-web)
- **Platform:** https://latanda.online

Include your wallet address (`ltd1...`) in the request.

### 12.3 Verify Receipt

```bash
latandad query bank balances $MY_ADDR
# Should show balance in ultd
```

---

## 13. Validator Creation

### 13.1 Prerequisites

- [ ] Full node synced (`catching_up: false`)
- [ ] Minimum 50,000 LTD (50,000,000,000 ultd) in wallet
- [ ] Node running stable for at least 24 hours
- [ ] KYC completed on La Tanda platform (if required)

### 13.2 Create Validator Transaction

```bash
MY_ADDR=$(latandad keys show my-validator -a --keyring-backend test)

latandad tx staking create-validator \
  --amount=50000000000ultd \
  --pubkey=$(latandad comet show-validator) \
  --moniker="your-validator-name" \
  --identity="" \
  --website="" \
  --details="Your validator description" \
  --chain-id=latanda-testnet-1 \
  --commission-rate="0.10" \
  --commission-max-rate="0.20" \
  --commission-max-change-rate="0.01" \
  --min-self-delegation="1" \
  --keyring-backend=test \
  --from=$MY_ADDR \
  --gas=auto \
  --gas-adjustment=1.5 \
  --fees=5000ultd \
  --yes
```

### 13.3 Verify Validator Created

```bash
# Get your validator operator address
VALOPER=$(latandad keys show my-validator --bech val -a --keyring-backend test)
echo "Validator: $VALOPER"

# Query your validator
latandad query staking validator $VALOPER

# Check if you're in the active set
latandad query staking validators --limit 100 -o json | \
  jq '.validators[] | select(.status == "BOND_STATUS_BONDED") | .description.moniker'
```

---

## 14. Validator Management Commands

### 14.1 Edit Validator

```bash
latandad tx staking edit-validator \
  --moniker="new-name" \
  --website="https://yoursite.com" \
  --details="Updated description" \
  --chain-id=latanda-testnet-1 \
  --keyring-backend=test \
  --from=my-validator \
  --gas=auto \
  --fees=500ultd \
  --yes
```

### 14.2 Delegate (Stake More)

```bash
latandad tx staking delegate $VALOPER 10000000000ultd \
  --chain-id=latanda-testnet-1 \
  --keyring-backend=test \
  --from=my-validator \
  --gas=auto \
  --fees=500ultd \
  --yes
```

### 14.3 Unbond (Unstake)

```bash
latandad tx staking unbond $VALOPER 10000000000ultd \
  --chain-id=latanda-testnet-1 \
  --keyring-backend=test \
  --from=my-validator \
  --gas=auto \
  --fees=500ultd \
  --yes
```

> **Note:** Unbonding takes 21 days. Tokens are locked during this period.

### 14.4 Withdraw Rewards

```bash
latandad tx distribution withdraw-rewards $VALOPER \
  --chain-id=latanda-testnet-1 \
  --keyring-backend=test \
  --from=my-validator \
  --gas=auto \
  --fees=500ultd \
  --yes
```

### 14.5 Withdraw All Rewards (All Delegations)

```bash
latandad tx distribution withdraw-all-rewards \
  --chain-id=latanda-testnet-1 \
  --keyring-backend=test \
  --from=my-validator \
  --gas=auto \
  --fees=1000ultd \
  --yes
```

### 14.6 Unjail Validator

If your validator was jailed (missed too many blocks):

```bash
latandad tx slashing unjail \
  --chain-id=latanda-testnet-1 \
  --keyring-backend=test \
  --from=my-validator \
  --gas=auto \
  --fees=500ultd \
  --yes
```

### 14.7 Re-delegate

Move stake from one validator to another without unbonding period:

```bash
latandad tx staking redelegate <src-valoper> <dst-valoper> 10000000000ultd \
  --chain-id=latanda-testnet-1 \
  --keyring-backend=test \
  --from=my-validator \
  --gas=auto \
  --fees=500ultd \
  --yes
```

### 14.8 Vote on Governance Proposals

```bash
# List proposals
latandad query gov proposals

# Vote yes on proposal #1
latandad tx gov vote 1 yes \
  --chain-id=latanda-testnet-1 \
  --keyring-backend=test \
  --from=my-validator \
  --gas=auto \
  --fees=500ultd \
  --yes
```

---

## 15. Monitoring and Health Checks

### 15.1 Basic Health Check Script

```bash
cat > ~/health-check.sh << 'EOF'
#!/bin/bash
# La Tanda Validator Health Check

echo "=== La Tanda Validator Health Check ==="
echo "Time: $(date)"
echo ""

# Service status
echo "--- Service Status ---"
systemctl is-active latandad
echo ""

# Sync status
echo "--- Sync Status ---"
SYNCING=$(latandad status 2>&1 | jq -r '.sync_info.catching_up')
HEIGHT=$(latandad status 2>&1 | jq -r '.sync_info.latest_block_height')
echo "Syncing: $SYNCING"
echo "Block Height: $HEIGHT"
echo ""

# Peer count
echo "--- Peers ---"
PEERS=$(curl -s localhost:26657/net_info 2>/dev/null | jq -r '.result.n_peers' 2>/dev/null || echo "N/A")
echo "Connected Peers: $PEERS"
echo ""

# Validator status
echo "--- Validator ---"
VALOPER=$(latandad keys show my-validator --bech val -a --keyring-backend test 2>/dev/null)
if [ -n "$VALOPER" ]; then
  JAIL_INFO=$(latandad query slashing signing-info $(latandad comet show-validator) 2>/dev/null)
  echo "Operator: $VALOPER"
  echo "$JAIL_INFO" | grep -E "jailed|missed_blocks_counter"
fi
echo ""

# Disk usage
echo "--- Disk Usage ---"
df -h / | tail -1
du -sh ~/.latanda/ 2>/dev/null
echo ""

echo "=== Health Check Complete ==="
EOF
chmod +x ~/health-check.sh
```

### 15.2 Prometheus + Grafana (Advanced)

If you enabled Prometheus in Step 7.3:

```bash
# Allow Prometheus port
sudo ufw allow 26660/tcp comment "Prometheus Metrics"

# Metrics endpoint
curl http://localhost:26660/metrics | head -20
```

Key metrics to monitor:
- `cometbft_consensus_height` — current block height
- `cometbft_consensus_round` — current consensus round
- `cometbft_p2p_peers` — connected peers
- `cometbft_block_sync_latest_block_height` — sync progress
- `cometbft_consensus_validator_last_signed_height` — last block you signed

### 15.3 Systemd Watchdog (Auto-Restart on Failure)

```bash
# The service file already has Restart=always
# For extra safety, add a watchdog timer:

sudo tee /etc/systemd/system/latandad-watchdog.timer > /dev/null <<EOF
[Unit]
Description=La Tanda Validator Watchdog

[Timer]
OnBootSec=300
OnUnitActiveSec=60

[Install]
WantedBy=timers.target
EOF

sudo tee /etc/systemd/system/latandad-watchdog.service > /dev/null <<EOF
[Unit]
Description=La Tanda Validator Watchdog Check

[Service]
Type=oneshot
ExecStart=/bin/bash -c 'latandad status 2>&1 | jq -e ".sync_info.catching_up == false" > /dev/null || (echo "Validator out of sync, restarting..." && systemctl restart latandad)'
EOF

sudo systemctl daemon-reload
sudo systemctl enable latandad-watchdog.timer
sudo systemctl start latandad-watchdog.timer
```

### 15.4 Email Alert Script (Optional)

```bash
cat > ~/alert-check.sh << 'EOF'
#!/bin/bash
# Sends email if validator is jailed or out of sync

ALERT_EMAIL="your@email.com"
SYNCING=$(latandad status 2>&1 | jq -r '.sync_info.catching_up')
JAIL_INFO=$(latandad query slashing signing-info $(latandad comet show-validator) 2>/dev/null | grep "jailed")

if [ "$SYNCING" = "true" ]; then
  echo "Validator is out of sync at $(date)" | mail -s "⚠️ La Tanda Validator Alert" $ALERT_EMAIL
fi

if echo "$JAIL_INFO" | grep -q "true"; then
  echo "Validator is JAILED at $(date)" | mail -s "🚨 La Tanda Validator JAILED" $ALERT_EMAIL
fi
EOF
chmod +x ~/alert-check.sh

# Run every 5 minutes
(crontab -l 2>/dev/null; echo "*/5 * * * * $HOME/alert-check.sh") | crontab -
```

---

## 16. Common Troubleshooting

### 16.1 Node Won't Start

```bash
# Check service logs
journalctl -u latandad -n 50 --no-hostname

# Common causes:
# 1. Port already in use
sudo lsof -i :26656
sudo lsof -i :26657

# 2. Genesis file missing/corrupt
sha256sum ~/.latanda/config/genesis.json
# Must match: 98fc9871d6a3b7b12b3f7fcaa1ca3303ffcfad0f209d61355975a15069ac3907

# 3. Config syntax error
latandad start 2>&1 | head -20
```

### 16.2 Node Can't Find Peers

```bash
# Check peer count
curl -s localhost:26657/net_info | jq '.result.n_peers'

# Verify seed node is reachable
curl -s http://168.231.67.201:26657/status | jq '.result.node_info.id'

# Re-add peers
PEERS="483a8110c3cd93c8dd3801d935151e98656f5b67@168.231.67.201:26656"
sed -i "s|persistent_peers = \".*\"|persistent_peers = \"$PEERS\"|" ~/.latanda/config/config.toml
sudo systemctl restart latandad
```

### 16.3 Node Stuck / Not Syncing

```bash
# Check if peers are connected
curl -s localhost:26657/net_info | jq '.result.n_peers'

# If 0 peers — check firewall
sudo ufw status

# If stuck at specific block — reset and resync
latandad tendermint unsafe-reset-all --home ~/.latanda
sudo systemctl restart latandad
```

### 16.4 Validator Jailed

```bash
# Check jail status
VALOPER=$(latandad keys show my-validator --bech val -a --keyring-backend test)
latandad query staking validator $VALOPER | grep "jailed"

# Unjail
latandad tx slashing unjail \
  --chain-id=latanda-testnet-1 \
  --keyring-backend=test \
  --from=my-validator \
  --gas=auto \
  --fees=500ultd \
  --yes
```

### 16.5 Genesis Hash Mismatch

```bash
# Redownload genesis
wget -q https://latanda.online/chain/genesis.json -O ~/.latanda/config/genesis.json
sha256sum ~/.latanda/config/genesis.json
# Must match: 98fc9871d6a3b7b12b3f7fcaa1ca3303ffcfad0f209d61355975a15069ac3907
```

### 16.6 OOM (Out of Memory) Killed

```bash
# Check if OOM killed
dmesg | grep -i "out of memory"

# Solutions:
# 1. Add swap
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 2. Upgrade server RAM
```

### 16.7 Disk Full

```bash
# Check disk usage
df -h /
du -sh ~/.latanda/* | sort -rh | head -5

# Clean old logs
journalctl --vacuum-time=7d

# Prune old blocks (if supported)
latandad comet unsafe-reset-all  # WARNING: re-syncs from scratch
```

---

## 17. Security Recommendations

### 17.1 Server Hardening

- [ ] SSH key-only authentication (no passwords)
- [ ] Fail2ban installed: `sudo apt install fail2ban`
- [ ] Firewall active: `sudo ufw enable`
- [ ] Regular updates: `sudo apt update && sudo apt upgrade`
- [ ] Non-root user for running the node
- [ ] Automatic security updates: `sudo apt install unattended-upgrades`

### 17.2 Key Security

- [ ] Validator key (`priv_validator_key.json`) backed up to encrypted USB
- [ ] Key file permissions: `chmod 600 ~/.latanda/config/priv_validator_key.json`
- [ ] Mnemonic stored offline (paper, not digital)
- [ ] Separate wallet for non-validator operations
- [ ] **Never** share private keys or mnemonics

### 17.3 Network Security

- [ ] Only ports 22, 26656, 26657 open
- [ ] RPC port (26657) restricted to monitoring IPs if possible
- [ ] No unnecessary services running
- [ ] Regular security audits: `sudo netstat -tlnp`

### 17.4 Key Rotation

If your validator key is compromised:

```bash
# 1. Stop the validator
sudo systemctl stop latandad

# 2. Generate new key
latandad init new-moniker --chain-id latanda-testnet-1 --default-denom ultd

# 3. Update validator with new key (requires governance proposal on mainnet)
# For testnet: contact the La Tanda team
```

---

## 18. Useful Maintenance Commands

### 18.1 Node Information

```bash
# Node version
latandad version

# Node ID
latandad comet show-node-id

# Validator public key
latandad comet show-validator

# Full status (JSON)
latandad status

# Quick sync check
latandad status 2>&1 | jq '{syncing: .sync_info.catching_up, height: .sync_info.latest_block_height, time: .sync_info.latest_block_time}'
```

### 18.2 Chain Queries

```bash
# Account balance
latandad query bank balances <ltd-address>

# All validators
latandad query staking validators -o json | jq '.validators[] | {moniker: .description.moniker, tokens: .tokens, status: .status, jailed: .jailed}'

# Active validator set size
latandad query staking validators -o json | jq '[.validators[] | select(.status == "BOND_STATUS_BONDED")] | length'

# Validator details
latandad query staking validator <valoper-address>

# Delegation rewards
latandad query distribution rewards <ltd-address> <valoper-address>

# Community pool
latandad query distribution community-pool

# Governance proposals
latandad query gov proposals

# Proposal details
latandad query gov proposal <proposal-id>
```

### 18.3 Key Management

```bash
# List all keys
latandad keys list --keyring-backend test

# Add new key
latandad keys add <key-name> --keyring-backend test

# Recover from mnemonic
latandad keys add <key-name> --recover --keyring-backend test

# Delete key
latandad keys delete <key-name> --keyring-backend test

# Export key (backup)
latandad keys export <key-name> --keyring-backend test > key-backup.enc

# Import key
latandad keys import <key-name> key-backup.enc --keyring-backend test
```

### 18.4 Network Information

```bash
# Connected peers
curl -s localhost:26657/net_info | jq '.result.n_peers'

# Peer list
curl -s localhost:26657/net_info | jq '.result.peers[] | {id: .node_info.id, addr: .remote_ip}'

# Consensus state
curl -s localhost:26657/consensus_state | jq '.result.round_state.height_vote_set[0]'

# Latest block
curl -s localhost:26657/block | jq '.result.block.header'
```

### 18.5 System Maintenance

```bash
# Check disk usage
df -h / && du -sh ~/.latanda/ | sort -rh

# Check memory
free -h

# Check CPU usage
top -bn1 | head -5

# Check open ports
sudo netstat -tlnp | grep latandad

# Restart node (graceful)
sudo systemctl restart latandad

# View journal logs (last 24h)
journalctl -u latandad --since "24 hours ago" --no-hostname | tail -50
```

---

## 19. CLI Cheatsheet

| Command | Description |
|---------|-------------|
| `latandad start` | Start the node |
| `latandad status` | Full node status (JSON) |
| `latandad version` | Binary version |
| `latandad comet show-node-id` | Your node's P2P ID |
| `latandad comet show-validator` | Validator public key |
| `latandad keys list` | List all wallets |
| `latandad keys show <name> -a` | Show wallet address |
| `latandad keys show <name> --bech val -a` | Show validator operator address |
| `latandad query bank balances <addr>` | Check balance |
| `latandad query staking validators` | List all validators |
| `latandad query staking validator <valoper>` | Validator details |
| `latandad query staking delegations <addr>` | List delegations |
| `latandad query distribution rewards <addr>` | Pending rewards |
| `latandad query slashing signing-info <valcons>` | Signing info (missed blocks) |
| `latandad query gov proposals` | List governance proposals |
| `latandad tx bank send <from> <to> <amount>` | Send tokens |
| `latandad tx staking create-validator` | Create validator |
| `latandad tx staking edit-validator` | Edit validator |
| `latandad tx staking delegate <valoper> <amount>` | Delegate tokens |
| `latandad tx staking unbond <valoper> <amount>` | Unbond tokens |
| `latandad tx staking redelegate <src> <dst> <amount>` | Redelegate |
| `latandad tx distribution withdraw-rewards <valoper>` | Claim rewards |
| `latandad tx distribution withdraw-all-rewards` | Claim all rewards |
| `latandad tx slashing unjail` | Unjail validator |
| `latandad tx gov vote <id> <option>` | Vote on proposal |
| `sudo systemctl status latandad` | Service status |
| `sudo systemctl restart latandad` | Restart service |
| `journalctl -u latandad -f` | Live logs |
| `journalctl -u latandad -n 100` | Last 100 log lines |

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
| Swagger UI | https://latanda.online/docs |
| Dev Portal | https://latanda.online/dev-dashboard.html |
| P2P Seed | `483a8110c3cd93c8dd3801d935151e98656f5b67@168.231.67.201:26656` |
| Chain ID | `latanda-testnet-1` |
| Denom | `ultd` (1 LTD = 1,000,000 ultd) |
| Genesis Hash | `98fc9871d6a3b7b12b3f7fcaa1ca3303ffcfad0f209d61355975a15069ac3907` |

---

## Support

- **Email:** contact@latanda.online
- **GitHub:** github.com/INDIGOAZUL/la-tanda-web
- **Platform:** https://latanda.online

---

*La Tanda Chain Testnet — Validator Guide v1.0*  
*Ray-Banks LLC*
