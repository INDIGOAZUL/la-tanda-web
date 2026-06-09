# La Tanda Testnet — Complete Validator Guide

**Chain ID:** `latanda-testnet-1`
**Token:** LTD (micro-unit: `ultd`, 1 LTD = 1,000,000 ultd)
**Total Supply:** 200,000,000 LTD
**Consensus:** CometBFT (Delegated Proof of Stake)
**Block Time:** ~5 seconds

---

## Table of Contents

1. [Server Requirements](#1-server-requirements)
2. [Ubuntu Preparation](#2-ubuntu-preparation)
3. [Go Installation](#3-go-installation)
4. [Latandad Binary Installation](#4-latandad-binary-installation)
5. [Chain Initialization](#5-chain-initialization)
6. [Genesis Download](#6-genesis-download)
7. [Peer Configuration](#7-peer-configuration)
8. [Systemd Service Creation](#8-systemd-service-creation)
9. [Starting and Managing the Node](#9-starting-and-managing-the-node)
10. [State Sync Configuration](#10-state-sync-configuration)
11. [Wallet Creation](#11-wallet-creation)
12. [Faucet / Token Acquisition](#12-faucet--token-acquisition)
13. [Validator Creation](#13-validator-creation)
14. [Validator Management Commands](#14-validator-management-commands)
15. [Monitoring and Health Checks](#15-monitoring-and-health-checks)
16. [Common Troubleshooting](#16-common-troubleshooting)
17. [Security Recommendations](#17-security-recommendations)
18. [Useful Maintenance Commands](#18-useful-maintenance-commands)

---

## 1. Server Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **OS** | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |
| **CPU** | 2 cores | 4 cores |
| **RAM** | 4 GB | 8 GB |
| **Disk** | 50 GB SSD | 100 GB NVMe SSD |
| **Network** | 100 Mbps | 1 Gbps, stable connection |
| **Port 26656** | Open inbound (P2P) | Required |
| **Port 26657** | Open (RPC, optional) | Recommended for monitoring |

> **Cost Estimate:** A Hetzner CX22 (2 vCPU, 4 GB RAM, 40 GB disk) costs approximately $4.50/month. A Vultr or DigitalOcean droplet with similar specs costs $6-12/month.

### VPS Providers

| Provider | Recommended Plan | Monthly Cost |
|----------|-----------------|-------------|
| [Hetzner](https://www.hetzner.com/cloud/) | CX22 (2 vCPU, 4 GB RAM) | ~$4.50 |
| [DigitalOcean](https://www.digitalocean.com/) | Basic (2 vCPU, 4 GB RAM) | ~$12.00 |
| [Vultr](https://www.vultr.com/) | Regular (2 vCPU, 4 GB RAM) | ~$12.00 |

---

## 2. Ubuntu Preparation

### 2.1 Update the System

```bash
sudo apt update && sudo apt upgrade -y
```

### 2.2 Install Essential Dependencies

```bash
sudo apt install -y build-essential git curl wget jq ufw fail2ban chrony
```

| Package | Purpose |
|---------|---------|
| `build-essential` | C/C++ compilers for building Go binaries |
| `git` | Version control (chain source) |
| `curl` / `wget` | Downloading files and scripts |
| `jq` | JSON parsing for CLI output |
| `ufw` | Uncomplicated Firewall |
| `fail2ban` | Brute-force protection for SSH |
| `chrony` | NTP time synchronization (critical for consensus) |

### 2.3 Configure Time Synchronization

Accurate time is critical for blockchain consensus. Verify chrony is running:

```bash
sudo systemctl enable chrony
sudo systemctl start chrony
chronyc tracking
```

### 2.4 Configure Firewall

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment "SSH"
sudo ufw allow 26656/tcp comment "La Tanda Chain P2P"
sudo ufw allow 26657/tcp comment "La Tanda Chain RPC"
sudo ufw --force enable
sudo ufw status
```

### 2.5 Secure SSH

```bash
# Disable password authentication (use SSH keys instead)
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart sshd
```

> **Important:** Set up SSH key authentication *before* disabling password login. Generate a key on your local machine with `ssh-keygen -t ed25519` and copy it with `ssh-copy-id root@YOUR_SERVER_IP`.

### 2.6 Install Fail2ban

```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 3. Go Installation

La Tanda chain is built with Go. Install Go 1.24.1:

```bash
# Remove any existing Go installation
sudo rm -rf /usr/local/go

# Download Go 1.24.1
wget -q https://go.dev/dl/go1.24.1.linux-amd64.tar.gz -O /tmp/go.tar.gz

# Extract to /usr/local
sudo tar -C /usr/local -xzf /tmp/go.tar.gz
rm /tmp/go.tar.gz

# Add Go to PATH (persistent across sessions)
echo 'export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin' >> ~/.bashrc
source ~/.bashrc

# Verify installation
go version
# Expected output: go version go1.24.1 linux/amd64
```

---

## 4. Latandad Binary Installation

### Option A: Build from Source (Recommended)

```bash
# Create a build directory
mkdir -p /tmp/latanda-build && cd /tmp/latanda-build

# Download the chain source
wget -q https://latanda.online/chain/latanda-chain-source.tar.gz
tar -xzf latanda-chain-source.tar.gz

# Build the latandad binary
export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin
go mod tidy
go build -o /usr/local/bin/latandad ./cmd/latandad

# Verify the binary
latandad version
```

### Option B: One-Line Setup Script

The official setup script automates the entire process:

```bash
wget -q https://latanda.online/chain/node-setup.sh -O node-setup.sh && chmod +x node-setup.sh && ./node-setup.sh
```

This script handles system checks, Go installation, binary compilation, genesis download, peer configuration, and firewall setup.

### Verify Binary Installation

```bash
latandad version
latandad --help
```

---

## 5. Chain Initialization

```bash
# Set your node's display name (moniker)
MONIKER="your-validator-name"

# Initialize the node
latandad init "$MONIKER" --chain-id latanda-testnet-1 --default-denom ultd
```

This creates the configuration directory at `~/.latanda/`:

```
~/.latanda/
├── config/
│   ├── app.toml          # Application settings (gas prices, API, pruning)
│   ├── config.toml       # P2P, consensus, RPC, and mempool settings
│   ├── client.toml       # Client configuration (keyring, output format)
│   ├── genesis.json      # Initial chain state (downloaded in next step)
│   ├── node_key.json     # Node identity key (DO NOT SHARE)
│   └── priv_validator_key.json  # Validator signing key (BACKUP THIS)
├── data/
│   └── (blockchain data - populated during sync)
└── keyring-test/         # Wallet keys (when using test keyring backend)
```

> **CRITICAL:** Back up `priv_validator_key.json` and `node_key.json` immediately after initialization. Losing these files means losing your validator identity.

---

## 6. Genesis Download

```bash
# Download the official genesis file
wget -q https://latanda.online/chain/genesis.json -O ~/.latanda/config/genesis.json

# Verify the SHA-256 hash
sha256sum ~/.latanda/config/genesis.json
# Expected: 98fc9871d6a3b7b12b3f7fcaa1ca3303ffcfad0f209d61355975a15069ac3907
```

If the hash does not match, re-download the file. A mismatched genesis will prevent your node from joining the network.

---

## 7. Peer Configuration

### 7.1 Set Persistent Peers and Seeds

```bash
# Genesis node peer
PEERS="483a8110c3cd93c8dd3801d935151e98656f5b67@168.231.67.201:26656"

# Configure persistent peers (nodes your node stays connected to)
sed -i "s|persistent_peers = \"\"|persistent_peers = \"$PEERS\"|" ~/.latanda/config/config.toml

# Configure seed nodes (used for initial peer discovery)
sed -i "s|seeds = \"\"|seeds = \"$PEERS\"|" ~/.latanda/config/config.toml
```

### 7.2 Set Minimum Gas Price

```bash
sed -i 's|minimum-gas-prices = ""|minimum-gas-prices = "0.001ultd"|' ~/.latanda/config/app.toml
```

### 7.3 Enable Prometheus Metrics (Optional, for Monitoring)

```bash
sed -i 's|prometheus = false|prometheus = true|' ~/.latanda/config/config.toml
```

### 7.4 Optimize Configuration for Production

```bash
# Increase max number of peers
sed -i 's|max_num_inbound_peers = "40"|max_num_inbound_peers = "100"|' ~/.latanda/config/config.toml
sed -i 's|max_num_outbound_peers = "10"|max_num_outbound_peers = "40"|' ~/.latanda/config/config.toml

# Enable external RPC (for monitoring tools)
sed -i 's|laddr = "tcp://127.0.0.1:26657"|laddr = "tcp://0.0.0.0:26657"|' ~/.latanda/config/config.toml

# Set pruning to keep recent state (saves disk space)
sed -i 's|pruning = "nothing"|pruning = "custom"|' ~/.latanda/config/app.toml
sed -i 's|pruning-keep-recent = "0"|pruning-keep-recent = "100"|' ~/.latanda/config/app.toml
sed -i 's|pruning-keep-every = "0"|pruning-keep-every = "5000"|' ~/.latanda/config/app.toml
sed -i 's|pruning-interval = "0"|pruning-interval = "10"|' ~/.latanda/config/app.toml
```

---

## 8. Systemd Service Creation

Using systemd ensures your node runs as a persistent service with automatic restarts and structured logging.

### 8.1 Create the Service File

```bash
sudo tee /etc/systemd/system/latandad.service > /dev/null <<EOF
[Unit]
Description=La Tanda Chain Node (latandad)
After=network-online.target
Wants=network-online.target

[Service]
User=root
Group=root
Type=simple
ExecStart=/usr/local/bin/latandad start \
  --home /root/.latanda \
  --chain-id latanda-testnet-1
Restart=on-failure
RestartSec=5
LimitNOFILE=65535
StandardOutput=journal
StandardError=journal

# Security hardening
NoNewPrivileges=true
ProtectSystem=full
ReadWritePaths=/root/.latanda

# Resource limits
MemoryMax=6G

[Install]
WantedBy=multi-user.target
EOF
```

### 8.2 Enable and Start the Service

```bash
# Reload systemd to pick up the new service
sudo systemctl daemon-reload

# Enable the service to start on boot
sudo systemctl enable latandad

# Start the service
sudo systemctl start latandad
```

### 8.3 Verify the Service is Running

```bash
sudo systemctl status latandad
```

Expected output:
```
* latandad.service - La Tanda Chain Node (latandad)
     Loaded: loaded (/etc/systemd/system/latandad.service; enabled)
     Active: active (running) since ...
```

---

## 9. Starting and Managing the Node

### Systemd Commands

```bash
# Start the node
sudo systemctl start latandad

# Stop the node
sudo systemctl stop latandad

# Restart the node
sudo systemctl restart latandad

# Check service status
sudo systemctl status latandad

# View live logs
sudo journalctl -u latandad -f

# View last 100 log lines
sudo journalctl -u latandad -n 100 --no-pager

# View logs since a specific time
sudo journalctl -u latandad --since "2025-01-01 00:00:00"
```

### Verify Node Sync

```bash
# Check sync status
latandad status | jq '.sync_info'

# Key fields:
# - catching_up: true  -> still syncing
# - catching_up: false -> fully synced, ready for validator operations
# - latest_block_height: current block your node is at
# - earliest_block_height: first block in your store
```

### Check Network Connectivity

```bash
# Get your node ID
latandad comet show-node-id

# Check connected peer count
curl -s localhost:26657/net_info | jq '.result.n_peers'

# Verify connection to genesis node
curl -s http://168.231.67.201:26657/status | jq '.result.node_info.id'
```

---

## 10. State Sync Configuration

State sync allows your node to quickly catch up to the latest chain state without downloading and replaying all historical blocks. This is especially useful for new nodes joining a mature network.

### 10.1 How State Sync Works

```
Genesis ──► Block 1 ──► Block 2 ──► ... ──► Block N-2000 ──► Block N
                                                    │               │
                                            State snapshot     Latest block
                                            (trust height)    (catch up
                                                              from here)
```

1. Your node downloads a recent state snapshot from trusted peers
2. It verifies the snapshot against block hashes
3. It then applies only the remaining blocks (typically < 2000) to reach the tip

### 10.2 Get State Sync Parameters

You need three values: `trust_height`, `trust_hash`, and `trust_period`. Query a trusted RPC endpoint:

```bash
# Query the latest block height and hash from a trusted node
RPC="https://latanda.online/chain/rpc/"

# Get the latest block info
LATEST_HEIGHT=$(curl -s "$RPC/block" | jq '.result.block.header.height' | tr -d '"')
BLOCK_HEIGHT=$((LATEST_HEIGHT - 1000))  # Go back 1000 blocks for safety

# Get the block hash at that height
BLOCK_HASH=$(curl -s "$RPC/block?height=$BLOCK_HEIGHT" | jq '.result.block_id.hash' | tr -d '"')

echo "Trust Height: $BLOCK_HEIGHT"
echo "Trust Hash:   $BLOCK_HASH"
```

### 10.3 Configure State Sync

```bash
# Get the RPC servers from trusted nodes
RPC_SERVERS="168.231.67.201:26657,168.231.67.201:26657"

# Configure state sync in config.toml
sed -i 's|enable = false|enable = true|' ~/.latanda/config/config.toml
sed -i "s|rpc_servers = \"\"|rpc_servers = \"$RPC_SERVERS\"|" ~/.latanda/config/config.toml
sed -i "s|trust_height = 0|trust_height = $BLOCK_HEIGHT|" ~/.latanda/config/config.toml
sed -i "s|trust_hash = \"\"|trust_hash = \"$BLOCK_HASH\"|" ~/.latanda/config/config.toml
sed -i "s|trust_period = \"\"|trust_period = \"168h0m0s\"|" ~/.latanda/config/config.toml
```

### 10.4 Reset Data and Start with State Sync

> **Warning:** This will delete all local blockchain data. Make sure you have backed up your keys.

```bash
# Stop the node
sudo systemctl stop latandad

# Reset all data (keeps config and keys)
latandad comet unsafe-reset-all

# Start the node (it will now use state sync)
sudo systemctl start latandad

# Monitor sync progress
sudo journalctl -u latandad -f | grep -i "state\|sync\|block"
```

### 10.5 Verify State Sync Completion

```bash
# Once catching_up is false, state sync is complete
latandad status | jq '.sync_info.catching_up'
# false = synced and ready
```

### 10.6 Disable State Sync After Completion

Once your node is fully synced, disable state sync to prevent unexpected behavior:

```bash
sudo systemctl stop latandad
sed -i 's|enable = true|enable = false|' ~/.latanda/config/config.toml
sudo systemctl start latandad
```

---

## 11. Wallet Creation

### 11.1 Create a New Wallet

```bash
# Create a new key (wallet)
latandad keys add my-validator-wallet --keyring-backend test

# You will see output like:
# - name: my-validator-wallet
#   type: local
#   address: ltd1...
#   pubkey: ltdpub1...
#   mnemonic: "word1 word2 word3 ..."  (WRITE THIS DOWN!)
```

> **CRITICAL:** Write down the 24-word mnemonic seed phrase and store it in a secure, offline location. This is the ONLY way to recover your wallet if you lose access to the server.

### 11.2 List Wallets

```bash
latandad keys list --keyring-backend test
```

### 11.3 Show Wallet Address

```bash
latandad keys show my-validator-wallet -a --keyring-backend test
```

### 11.4 Show Validator Address

```bash
latandad keys show my-validator-wallet --bech=val -a --keyring-backend test
```

### 11.5 Recover a Wallet from Mnemonic

```bash
latandad keys add my-recovered-wallet --recover --keyring-backend test
```

---

## 12. Faucet / Token Acquisition

To become a validator, you need LTD tokens for staking. On the La Tanda testnet, tokens can be obtained through:

### 12.1 Request from the Team

Contact the La Tanda team through the following channels to request testnet LTD:

- **Discord:** [discord.gg/Ve9M2ZSYC2](https://discord.gg/Ve9M2ZSYC2)
- **Telegram:** [t.me/latandahn](https://t.me/latandahn)
- **Email:** contact@latanda.online

### 12.2 Check Your Balance

```bash
latandad query bank balances $(latandad keys show my-validator-wallet -a --keyring-backend test)
```

### 12.3 Receive Tokens from Another Address

```bash
latandad tx bank send <sender-key> $(latandad keys show my-validator-wallet -a --keyring-backend test) 10000000ultd \
  --chain-id latanda-testnet-1 \
  --keyring-backend test \
  --gas auto \
  --gas-adjustment 1.5 \
  --fees 500ultd \
  -y
```

---

## 13. Validator Creation

### 13.1 Prerequisites

Before creating a validator, ensure:

- [ ] Your full node is fully synced (`catching_up: false`)
- [ ] You have at least 50,000 LTD (50,000,000,000 ultd) for self-delegation
- [ ] Your node has been running with stable uptime

### 13.2 Create the Validator

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
  --from=my-validator-wallet \
  --gas=auto \
  --gas-adjustment=1.5 \
  --fees=5000ultd \
  -y
```

| Parameter | Description | Example |
|-----------|-------------|---------|
| `--amount` | Tokens to self-delegate (in micro-units) | `50000000000ultd` = 50,000 LTD |
| `--pubkey` | Your validator's consensus public key | Auto-detected via `latandad comet show-validator` |
| `--moniker` | Your validator's display name | `"MyValidator"` |
| `--commission-rate` | Initial commission percentage | `"0.10"` = 10% |
| `--commission-max-rate` | Maximum commission allowed | `"0.20"` = 20% |
| `--commission-max-change-rate` | Max daily commission change | `"0.01"` = 1% |
| `--min-self-delegation` | Minimum LTD you must keep bonded | `"1"` |

### 13.3 Verify Your Validator is Active

```bash
# Check your validator status
latandad query staking validator $(latandad keys show my-validator-wallet --bech=val -a --keyring-backend test)

# List all validators
latandad query staking validators --output json | jq '.validators[] | {moniker: .description.moniker, status: .status, tokens: .tokens}'
```

### 13.4 Validator Status Codes

| Status | Code | Meaning |
|--------|------|---------|
| Bonded | `3` | Validator is in the active set and producing blocks |
| Unbonded | `2` | Validator is not in the active set |
| Unbonding | `1` | Validator is leaving the active set (unbonding period) |

---

## 14. Validator Management Commands

### 14.1 Edit Validator Information

```bash
# Update moniker, identity, website, description
latandad tx staking edit-validator \
  --moniker="new-moniker" \
  --identity="your-keybase-id" \
  --website="https://your-website.com" \
  --details="Your validator description" \
  --chain-id=latanda-testnet-1 \
  --keyring-backend=test \
  --from=my-validator-wallet \
  --gas=auto \
  --gas-adjustment=1.5 \
  --fees=5000ultd \
  -y
```

### 14.2 Change Commission Rate

```bash
latandad tx staking edit-validator \
  --commission-rate="0.15" \
  --chain-id=latanda-testnet-1 \
  --keyring-backend=test \
  --from=my-validator-wallet \
  --gas=auto \
  --gas-adjustment=1.5 \
  --fees=5000ultd \
  -y
```

> **Note:** Commission can only be increased by `commission-max-change-rate` (default 1%) per day.

### 14.3 Delegate More Tokens

```bash
latandad tx staking delegate $(latandad keys show my-validator-wallet --bech=val -a --keyring-backend test) 10000000000ultd \
  --chain-id=latanda-testnet-1 \
  --keyring-backend=test \
  --from=my-validator-wallet \
  --gas=auto \
  --gas-adjustment=1.5 \
  --fees=500ultd \
  -y
```

### 14.4 Unbond (Leave the Active Set)

```bash
latandad tx staking unbond $(latandad keys show my-validator-wallet --bech=val -a --keyring-backend test) 10000000000ultd \
  --chain-id=latanda-testnet-1 \
  --keyring-backend=test \
  --from=my-validator-wallet \
  --gas=auto \
  --gas-adjustment=1.5 \
  --fees=500ultd \
  -y
```

> **Warning:** Unbonding takes effect after the unbonding period. During this time, tokens are locked and do not earn rewards.

### 14.5 Withdraw Rewards

```bash
# Withdraw all rewards
latandad tx distribution withdraw-all-rewards \
  --chain-id=latanda-testnet-1 \
  --keyring-backend=test \
  --from=my-validator-wallet \
  --gas=auto \
  --gas-adjustment=1.5 \
  --fees=500ultd \
  -y

# Withdraw rewards and re-stake them (compound)
latandad tx distribution withdraw-rewards $(latandad keys show my-validator-wallet --bech=val -a --keyring-backend test) \
  --chain-id=latanda-testnet-1 \
  --keyring-backend=test \
  --from=my-validator-wallet \
  --gas=auto \
  --gas-adjustment=1.5 \
  --fees=500ultd \
  --commission \
  -y
```

### 14.6 Check Signing Info (Missed Blocks)

```bash
latandad query slashing signing-info $(latandad comet show-validator)
```

---

## 15. Monitoring and Health Checks

### 15.1 Node Health Script

Create a simple health check script:

```bash
cat > ~/latanda-health.sh << 'EOF'
#!/bin/bash
echo "=== La Tanda Node Health Check ==="
echo ""

# Node status
STATUS=$(latandad status 2>/dev/null)
if [ $? -eq 0 ]; then
    CATCHING_UP=$(echo "$STATUS" | jq -r '.sync_info.catching_up')
    BLOCK_HEIGHT=$(echo "$STATUS" | jq -r '.sync_info.latest_block_height')
    PEERS=$(curl -s localhost:26657/net_info 2>/dev/null | jq -r '.result.n_peers')

    echo "Block Height:    $BLOCK_HEIGHT"
    echo "Sync Status:     $([ "$CATCHING_UP" = "false" ] && echo "SYNCED" || echo "SYNCING...")"
    echo "Connected Peers: $PEERS"
    echo ""

    # Validator status
    VAL_ADDRESS=$(latandad keys show my-validator-wallet --bech=val -a --keyring-backend test 2>/dev/null)
    if [ -n "$VAL_ADDRESS" ]; then
        VAL_STATUS=$(latandad query staking validator "$VAL_ADDRESS" 2>/dev/null | jq -r '.status')
        BONDED=$(latandad query staking validator "$VAL_ADDRESS" 2>/dev/null | jq -r '.tokens')
        echo "Validator Status: $([ "$VAL_STATUS" = "3" ] && echo "BONDED (Active)" || echo "UNBONDED")"
        echo "Self-Bonded:      $((BONDED / 1000000)) LTD"
    fi

    # System resources
    echo ""
    echo "=== System Resources ==="
    echo "Memory: $(free -h | awk '/^Mem:/{print $3 "/" $2}')"
    echo "Disk:   $(df -h /root/.latanda | awk 'NR==2{print $3 "/" $2 " (" $5 " used)"}')"
    echo "Uptime: $(sudo systemctl show latandad --property=ActiveEnterTimestamp | cut -d= -f2)"
else
    echo "ERROR: latandad is not responding"
    echo "Service status:"
    sudo systemctl is-active latandad
fi
EOF
chmod +x ~/latanda-health.sh
```

Run it with:

```bash
~/latanda-health.sh
```

### 15.2 Key Metrics to Monitor

| Metric | Command | Healthy Value |
|--------|---------|-------------|
| Sync Status | `latandad status \| jq '.sync_info.catching_up'` | `false` |
| Block Height | `latandad status \| jq '.sync_info.latest_block_height'` | Increasing |
| Peer Count | `curl -s localhost:26657/net_info \| jq '.result.n_peers'` | > 0 |
| Service Status | `sudo systemctl is-active latandad` | `active` |
| Memory Usage | `free -h` | < 80% |
| Disk Usage | `df -h /root/.latanda` | < 80% |

### 15.3 Set Up Log Rotation

Prevent log files from consuming too much disk space:

```bash
sudo tee /etc/logrotate.d/latandad > /dev/null <<EOF
/var/log/journal/latandad {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    postrotate
        systemctl reload latandad > /dev/null 2>&1 || true
    endscript
}
EOF
```

### 15.4 Prometheus + Grafana (Advanced)

If you enabled Prometheus metrics in step 7.4, you can scrape metrics at `http://YOUR_SERVER_IP:26660/metrics`.

Add to your Prometheus `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'latandad'
    static_configs:
      - targets: ['YOUR_SERVER_IP:26660']
```

---

## 16. Common Troubleshooting

### 16.1 Node Won't Start

```bash
# Check service logs for errors
sudo journalctl -u latandad -n 100 --no-pager

# Common causes:
# 1. Port already in use
sudo lsof -i :26656
sudo lsof -i :26657

# 2. Corrupted data - reset and resync
sudo systemctl stop latandad
latandad comet unsafe-reset-all
# Reconfigure state sync (see Section 10) or restart from genesis
sudo systemctl start latandad
```

### 16.2 Can't Find Peers (0 peers)

```bash
# Verify the genesis node is reachable
curl -s http://168.231.67.201:26657/status | jq '.result.node_info.id'

# Check your firewall
sudo ufw status

# Verify port 26656 is open
sudo ss -tlnp | grep 26656

# Re-add the seed node
sed -i 's|seeds = ".*"|seeds = "483a8110c3cd93c8dd3801d935151e98656f5b67@168.231.67.201:26656"|' ~/.latanda/config/config.toml
sudo systemctl restart latandad
```

### 16.3 Node Is Stuck / Not Syncing

```bash
# Check peer count
curl -s localhost:26657/net_info | jq '.result.n_peers'

# If peers > 0 but not syncing, try:
sudo systemctl restart latandad

# If still stuck, reset and use state sync (Section 10)
sudo systemctl stop latandad
latandad comet unsafe-reset-all
# ... configure state sync ...
sudo systemctl start latandad
```

### 16.4 Genesis Hash Mismatch

```bash
# Re-download and verify genesis
wget -q https://latanda.online/chain/genesis.json -O ~/.latanda/config/genesis.json
sha256sum ~/.latanda/config/genesis.json
# Must match: 98fc9871d6a3b7b12b3f7fcaa1ca3303ffcfad0f209d61355975a15069ac3907

# Reset data and restart
sudo systemctl stop latandad
latandad comet unsafe-reset-all
sudo systemctl start latandad
```

### 16.5 Service Crashes on Restart

```bash
# Check if there's a memory issue
sudo journalctl -u latandad -n 200 --no-pager | grep -i "oom\|kill\|memory"

# Check disk space
df -h /root/.latanda

# Check systemd resource limits
sudo systemctl show latandad | grep Memory
```

### 16.6 Validator Jailed (Missed Blocks)

```bash
# Check if your validator is jailed
latandad query staking validator $(latandad keys show my-validator-wallet --bech=val -a --keyring-backend test) | jq '.jailed'

# If jailed, unjail it
latandad tx slashing unjail \
  --chain-id=latanda-testnet-1 \
  --keyring-backend=test \
  --from=my-validator-wallet \
  --gas=auto \
  --gas-adjustment=1.5 \
  --fees=5000ultd \
  -y
```

### 16.7 Transaction Fails with "Insufficient Fees"

```bash
# Check current gas prices
latandad query staking params | jq '.params'

# Increase fees in your transaction
# --fees 10000ultd (instead of 500ultd)
```

---

## 17. Security Recommendations

### 17.1 Key Management

| Key File | Location | Action |
|----------|----------|--------|
| `priv_validator_key.json` | `~/.latanda/config/` | **BACKUP** immediately, never share |
| `node_key.json` | `~/.latanda/config/` | **BACKUP**, identifies your node on P2P |
| Wallet mnemonic | Written during creation | **STORE OFFLINE**, never digital |
| Wallet keys | `~/.latanda/keyring-test/` | **BACKUP** the entire directory |

### 17.2 File Permissions

```bash
# Restrict access to sensitive files
chmod 600 ~/.latanda/config/priv_validator_key.json
chmod 600 ~/.latanda/config/node_key.json
chmod 700 ~/.latanda/keyring-test/
```

### 17.3 Backup Strategy

```bash
# Create a backup of critical files
mkdir -p ~/latanda-backups
cp ~/.latanda/config/priv_validator_key.json ~/latanda-backups/
cp ~/.latanda/config/node_key.json ~/latanda-backups/
cp -r ~/.latanda/keyring-test/ ~/latanda-backups/
cp ~/.latanda/config/genesis.json ~/latanda-backups/

# Encrypt the backup
tar czf - ~/latanda-backups/ | gpg --symmetric --cipher-algo AES256 -o latanda-backup-$(date +%Y%m%d).tar.gz.gpg

# Download the encrypted backup to your local machine
# scp root@YOUR_IP:~/latanda-backup-*.tar.gz.gpg ./local-backup/
```

### 17.4 Server Security Checklist

- [ ] SSH key authentication enabled, password login disabled
- [ ] Firewall active (ufw) with only ports 22, 26656, 26657 open
- [ ] Fail2ban running for SSH brute-force protection
- [ ] System updates applied regularly (`apt update && apt upgrade`)
- [ ] Non-root user for daily operations (optional but recommended)
- [ ] Automatic security updates enabled: `sudo apt install unattended-upgrades && sudo dpkg-reconfigure -plow unattended-upgrades`
- [ ] Sensitive files backed up and encrypted
- [ ] Monitor disk space and memory usage

### 17.5 Monitoring Alerts

Consider setting up basic alerts:

```bash
# Simple disk space alert via cron
(crontab -l 2>/dev/null; echo "0 */6 * * * df -h /root/.latanda | awk 'NR==2 && int(\$5) > 80 {print \"ALERT: Disk usage \" \$5 \" on latanda node\"}' | mail -s 'Latanda Node Disk Alert' your@email.com") | crontab -
```

---

## 18. Useful Maintenance Commands

### Quick Reference Cheat Sheet

```bash
# ═══════════════════════════════════════════
# NODE MANAGEMENT
# ═══════════════════════════════════════════
sudo systemctl start latandad          # Start node
sudo systemctl stop latandad             # Stop node
sudo systemctl restart latandad         # Restart node
sudo systemctl status latandad          # Check status
sudo journalctl -u latandad -f          # Live logs

# ═══════════════════════════════════════════
# SYNC & STATUS
# ═══════════════════════════════════════════
latandad status | jq '.sync_info'       # Sync info
latandad status | jq '.sync_info.catching_up'          # Synced? (false=done)
latandad status | jq '.sync_info.latest_block_height'  # Current block
curl -s localhost:26657/net_info | jq '.result.n_peers' # Peer count
latandad comet show-node-id             # Your node ID

# ═══════════════════════════════════════════
# WALLET & KEYS
# ═══════════════════════════════════════════
latandad keys add <name> --keyring-backend test          # Create wallet
latandad keys list --keyring-backend test                 # List wallets
latandad keys show <name> -a --keyring-backend test       # Show address
latandad keys show <name> --bech=val -a --keyring-backend test  # Validator addr

# ═══════════════════════════════════════════
# VALIDATOR OPERATIONS
# ═══════════════════════════════════════════
latandad query staking validators       # List all validators
latandad query staking validator <val-addr>  # Your validator info
latandad query slashing signing-info <pubkey>  # Missed blocks
latandad tx slashing unjail --from <key> --chain-id latanda-testnet-1 --keyring-backend test -y  # Unjail

# ═══════════════════════════════════════════
# TOKENS & TRANSFERS
# ═══════════════════════════════════════════
latandad query bank balances <address>  # Check balance
latandad tx bank send <from> <to> <amount>ultd --chain-id latanda-testnet-1 --keyring-backend test --gas auto --fees 500ultd -y
latandad tx distribution withdraw-all-rewards --from <key> --chain-id latanda-testnet-1 --keyring-backend test --gas auto --fees 500ultd -y

# ═══════════════════════════════════════════
# GOVERNANCE
# ═══════════════════════════════════════════
latandad query gov proposals            # List proposals
latandad query gov proposal <id>        # View proposal
latandad tx gov vote <proposal-id> <option> --from <key> --chain-id latanda-testnet-1 --keyring-backend test --gas auto --fees 500ultd -y

# ═══════════════════════════════════════════
# MAINTENANCE
# ═══════════════════════════════════════════
latandad comet unsafe-reset-all         # Reset data (keeps keys)
sudo apt update && sudo apt upgrade -y   # System update
df -h /root/.latanda                     # Check disk usage
free -h                                  # Check memory
```

### Software Update Procedure

When a new version of `latandad` is released:

```bash
# 1. Stop the node
sudo systemctl stop latandad

# 2. Build the new version
cd /tmp/latanda-build
git pull origin main  # or download new source
go build -o /usr/local/bin/latandad ./cmd/latandad

# 3. Verify the new version
latandad version

# 4. Start the node
sudo systemctl start latandad

# 5. Monitor for issues
sudo journalctl -u latandad -f
```

---

## Network Information Quick Reference

| Resource | Value |
|----------|-------|
| **Chain ID** | `latanda-testnet-1` |
| **Denom** | `ultd` (1 LTD = 1,000,000 ultd) |
| **Address Prefix** | `ltd` |
| **Block Time** | ~5 seconds |
| **Consensus** | CometBFT (DPoS) |
| **Genesis Hash** | `98fc9871d6a3b7b12b3f7fcaa1ca3303ffcfad0f209d61355975a15069ac3907` |
| **P2P Seed** | `483a8110c3cd93c8dd3801d935151e98656f5b67@168.231.67.201:26656` |
| **Genesis File** | https://latanda.online/chain/genesis.json |
| **Setup Script** | https://latanda.online/chain/node-setup.sh |
| **Chain Source** | https://latanda.online/chain/latanda-chain-source.tar.gz |
| **RPC Endpoint** | https://latanda.online/chain/rpc/ |
| **REST API** | https://latanda.online/chain/api/ |
| **Chain Explorer** | https://latanda.online/chain/ |
| **Community Explorer** | https://exp.utsa.tech/latanda/staking |

---

## Support & Resources

| Channel | Link |
|---------|------|
| Discord | [discord.gg/Ve9M2ZSYC2](https://discord.gg/Ve9M2ZSYC2) |
| Telegram | [t.me/latandahn](https://t.me/latandahn) |
| Twitter | [@TandaWeb3](https://twitter.com/TandaWeb3) |
| Cosmos Forum | [Thread #16709](https://forum.cosmos.network/t/la-tanda-chain-incentivized-testnet-live-validators-node-operators-welcome-cosmos-sdk-v0-53-6/16709) |
| Reddit | [r/LaTandaChain](https://reddit.com/r/LaTandaChain) |
| Email | contact@latanda.online |

---

## Incentivized Testnet Program

La Tanda rewards early validators who join before mainnet:

| Tier | Slots | Reward at Genesis |
|------|-------|-------------------|
| Infra Partner | 5 (4 occupied) | 5,000 LTD |
| Validator | 10 | 2,000 LTD |
| Full Node | 20 | 500 LTD |
| Bug Reporter | Open | 100-1,000 LTD |

---

*La Tanda Chain Testnet | latanda-testnet-1 | Ray-Banks LLC*
