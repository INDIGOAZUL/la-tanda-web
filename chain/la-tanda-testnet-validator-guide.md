# La Tanda Testnet — Complete Validator Guide

> **Chain ID:** `latanda-testnet-1` · **Token:** LTD (`ultd`) · **Consensus:** CometBFT (Cosmos SDK)
> **Testnet Explorer:** https://exp.utsa.tech/latanda/staking · **Discord:** https://discord.gg/bDJjH7tT4

This guide walks you through every step of running a La Tanda testnet validator — from provisioning a server to creating and managing your validator on-chain. It uses **systemd** (native Linux process manager) and covers **state sync** for fast bootstrapping.

---

## Table of Contents

1. [Server Requirements](#1-server-requirements)
2. [Ubuntu Preparation](#2-ubuntu-preparation)
3. [Go Installation](#3-go-installation)
4. [Latanda Binary Installation](#4-latanda-binary-installation)
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

**Appendices**

- [A. Quick Start — Complete Flow](#appendix-a-quick-start--complete-flow)
- [B. State Sync Quick Setup](#appendix-b-state-sync-quick-setup)
- [C. Network Information](#appendix-c-network-information)
- [D. CLI Command Quick Reference](#appendix-d-cli-command-quick-reference)

---

## 1. Server Requirements

### Minimum Hardware

| Resource   | Minimum         | Recommended        |
|------------|-----------------|---------------------|
| **CPU**    | 2 cores         | 4 cores             |
| **RAM**    | 4 GB            | 8 GB                |
| **Disk**   | 50 GB SSD       | 100 GB NVMe SSD     |
| **Network**| 5 Mbps upload   | 10+ Mbps upload     |
| **OS**     | Ubuntu 22.04+   | Ubuntu 24.04 LTS    |

> **Important:** Use an **SSD** (not HDD). CometBFT is I/O-intensive — spinning disks will cause missed blocks and eventual jailing.

### Network Ports

| Port    | Protocol | Purpose                  | Required? |
|---------|----------|--------------------------|-----------|
| `26656` | TCP      | P2P (node-to-node)       | **Yes**   |
| `26657` | TCP      | RPC (queries, monitoring) | Recommended |
| `1317`  | TCP      | REST API (optional)      | No        |
| `9090`  | TCP      | gRPC (optional)          | No        |

### Cloud Provider Recommendations

| Provider     | Instance Type       | Approx. Cost |
|--------------|---------------------|--------------|
| Hetzner      | CX22 (2 vCPU, 4 GB) | ~$4.50/mo    |
| DigitalOcean | Regular 4 GB / 2 vCPU | ~$12/mo    |
| Vultr        | Cloud Compute 4 GB  | ~$12/mo      |
| AWS          | t3.medium           | ~$30/mo      |
| Contabo      | VPS S (4 vCPU, 8 GB)| ~$6/mo       |

> **Tip:** Hetzner and Contabo offer the best price-to-performance for testnet validators.

---

## 2. Ubuntu Preparation

### 2.1 Update the System

```bash
sudo apt update && sudo apt upgrade -y
```

### 2.2 Install Essential Packages

```bash
sudo apt install -y \
  build-essential \
  git \
  curl \
  wget \
  jq \
  lz4 \
  unzip \
  ufw \
  fail2ban \
  tree
```

### 2.3 Configure the Firewall

```bash
# Enable UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment "SSH"
sudo ufw allow 26656/tcp comment "La Tanda P2P"
sudo ufw allow 26657/tcp comment "La Tanda RPC"
sudo ufw --force enable
sudo ufw status
```

Expected output:
```
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
26656/tcp                  ALLOW       Anywhere
26657/tcp                  ALLOW       Anywhere
```

### 2.4 Disable Password Login (Recommended)

```bash
# Generate an SSH key on your local machine if you haven't already:
#   ssh-keygen -t ed25519 -C "your@email.com"
#   ssh-copy-id root@YOUR_SERVER_IP

sudo sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart sshd
```

### 2.5 Configure Swap (If RAM < 8 GB)

```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 2.6 Increase System Limits

```bash
cat <<EOF | sudo tee /etc/security/limits.d/latanda.conf
*  soft  nofile  65535
*  hard  nofile  65535
EOF
```

### 2.7 Set the Hostname (Optional)

```bash
sudo hostnamectl set-hostname latanda-validator
```

---

## 3. Go Installation

La Tanda Chain requires **Go 1.24.1+** to build the `latandad` binary from source.

### 3.1 Install Go

```bash
wget -q https://go.dev/dl/go1.24.1.linux-amd64.tar.gz -O /tmp/go.tar.gz
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf /tmp/go.tar.gz
rm /tmp/go.tar.gz
```

### 3.2 Configure PATH

```bash
cat <<'EOF' >> ~/.bashrc
# Go environment
export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin
export GOPATH=$HOME/go
EOF

source ~/.bashrc
```

### 3.3 Verify Installation

```bash
go version
# Expected: go version go1.24.1 linux/amd64
```

---

## 4. Latanda Binary Installation

### Option A: Quick Install Script (Recommended)

```bash
wget -q https://latanda.online/chain/node-setup.sh -O /tmp/node-setup.sh
chmod +x /tmp/node-setup.sh
/tmp/node-setup.sh
```

This script handles system checks, Go installation, binary build, genesis download, peer configuration, and firewall setup. It will prompt you for a node name (moniker).

### Option B: Build from Source

```bash
# Download chain source
mkdir -p /tmp/latanda-build && cd /tmp/latanda-build
wget -q https://latanda.online/chain/latanda-chain-source.tar.gz
tar -xzf latanda-chain-source.tar.gz

# Build the binary
go mod tidy
go build -o /usr/local/bin/latandad ./cmd/latandad
```

### 4.1 Verify the Binary

```bash
latandad version
latandad --help
```

You should see the version string and a list of available commands. If you get "command not found", ensure `/usr/local/bin` is in your `PATH`.

---

## 5. Chain Initialization

Initialize your node with a moniker (your node's display name on the network):

```bash
MONIKER="my-validator"
latandad init "$MONIKER" --chain-id latanda-testnet-1 --default-denom ultd
```

### What Gets Created

The `init` command creates the `~/.latanda/` directory:

```
~/.latanda/
├── config/
│   ├── config.toml          # P2P, consensus, mempool settings
│   ├── app.toml             # API, telemetry, pruning settings
│   ├── genesis.json         # Chain genesis state (replaced next step)
│   ├── node_key.json        # ⚠️ Node identity key — BACK THIS UP
│   └── priv_validator_key.json  # ⚠️ Validator signing key — BACK THIS UP
└── data/
    └── (blockchain data goes here)
```

> **⚠️ CRITICAL:** `node_key.json` and `priv_validator_key.json` are your node's identity. If you lose `priv_validator_key.json`, you lose control of your validator. **Back these up immediately** (see [Security Recommendations](#17-security-recommendations)).

---

## 6. Genesis Download

Every node must start from the same genesis file. Download it and verify:

```bash
wget -q https://latanda.online/chain/genesis.json -O ~/.latanda/config/genesis.json
```

### Verify the Hash

```bash
sha256sum ~/.latanda/config/genesis.json
```

**Expected hash:**
```
98fc9871d6a3b7b12b3f7fcaa1ca3303ffcfad0f209d61355975a15069ac3907
```

> **If the hash does not match**, do NOT start your node. Re-download the genesis file. A mismatched genesis means your node will fork from the network.

---

## 7. Peer Configuration

### 7.1 Set Persistent Peers

The genesis node acts as the primary seed:

```bash
PEERS="483a8110c3cd93c8dd3801d935151e98656f5b67@168.231.67.201:26656"

sed -i "s|persistent_peers = \"\"|persistent_peers = \"$PEERS\"|" \
  ~/.latanda/config/config.toml

sed -i "s|seeds = \"\"|seeds = \"$PEERS\"|" \
  ~/.latanda/config/config.toml
```

### 7.2 Set Minimum Gas Price

```bash
sed -i 's|minimum-gas-prices = ""|minimum-gas-prices = "0.001ultd"|' \
  ~/.latanda/config/app.toml
```

### 7.3 Recommended `config.toml` Tuning

```bash
# Allow external RPC connections (for monitoring)
sed -i 's|laddr = "tcp://127.0.0.1:26657"|laddr = "tcp://0.0.0.0:26657"|' \
  ~/.latanda/config/config.toml

# Set a reasonable max number of peers
sed -i 's|max_num_inbound_peers = 40|max_num_inbound_peers = 50|' \
  ~/.latanda/config/config.toml
sed -i 's|max_num_outbound_peers = 10|max_num_outbound_peers = 20|' \
  ~/.latanda/config/config.toml
```

### 7.4 Recommended `app.toml` Tuning

```bash
# Enable the REST API
sed -i '/^\[api\]/,/^\[/ s|enable = false|enable = true|' \
  ~/.latanda/config/app.toml

# Set pruning (keeps last 100 states, prunes every 10th block)
sed -i 's|pruning = "default"|pruning = "custom"|' ~/.latanda/config/app.toml
sed -i 's|pruning-keep-recent = "0"|pruning-keep-recent = "100"|' ~/.latanda/config/app.toml
sed -i 's|pruning-interval = "0"|pruning-interval = "10"|' ~/.latanda/config/app.toml
```

---

## 8. Systemd Service Creation

Systemd is the native Linux process manager. It automatically restarts your node if it crashes and starts it on boot — no Node.js or PM2 required.

### 8.1 Create the Service File

```bash
sudo tee /etc/systemd/system/latandad.service > /dev/null <<EOF
[Unit]
Description=La Tanda Chain Node
After=network-online.target

[Service]
User=root
ExecStart=/usr/local/bin/latandad start
Restart=on-failure
RestartSec=10
LimitNOFILE=65535
Environment="HOME=/root"
WorkingDirectory=/root

[Install]
WantedBy=multi-user.target
EOF
```

### 8.2 Enable and Reload

```bash
sudo systemctl daemon-reload
sudo systemctl enable latandad
```

### 8.3 Understanding the Service File

| Directive       | Meaning                                          |
|-----------------|--------------------------------------------------|
| `After=network-online.target` | Waits for network before starting    |
| `Restart=on-failure`         | Auto-restart on crash (not clean exit) |
| `RestartSec=10`              | Waits 10 seconds before restarting     |
| `LimitNOFILE=65535`          | Allows many open file descriptors      |
| `WorkingDirectory=/root`     | Ensures `~/.latanda` is found          |

---

## 9. Starting and Managing the Node

### 9.1 Start the Node

```bash
sudo systemctl start latandad
```

### 9.2 Check Status

```bash
sudo systemctl status latandad
```

Look for `Active: active (running)` in the output.

### 9.3 View Logs

```bash
# Live streaming logs
journalctl -u latandad -f

# Last 100 lines
journalctl -u latandad -n 100

# Logs since last boot
journalctl -u latandad -b
```

### 9.4 Check Sync Progress

```bash
# Am I synced?
latandad status | jq '.sync_info.catching_up'
# false = synced, true = still catching up

# Current block height
latandad status | jq '.sync_info.latest_block_height'

# Latest block time
latandad status | jq '.sync_info.latest_block_time'
```

### 9.5 Node Management Commands

```bash
# Stop the node
sudo systemctl stop latandad

# Restart the node
sudo systemctl restart latandad

# Disable auto-start on boot
sudo systemctl disable latandad

# Check if the service is enabled
sudo systemctl is-enabled latandad
```

### 9.6 Verify Network Connectivity

```bash
# Number of connected peers
curl -s localhost:26657/net_info | jq '.result.n_peers'

# Your node ID
latandad comet show-node-id

# List peer addresses
curl -s localhost:26657/net_info | jq '.result.peers[].node_info.listen_addr'
```

---

## 10. State Sync Configuration

State sync allows your node to sync in **minutes instead of hours** by downloading a recent state snapshot rather than replaying every block from genesis.

> **Use this for new nodes only.** If your node is already synced, do not enable state sync.

### 10.1 Get a Trusted Block

You need a recent block height and hash from a synced RPC endpoint:

```bash
# Fetch the latest block from the genesis node's RPC
LATEST_HEIGHT=$(curl -s https://latanda.online/chain/rpc/block | jq -r '.result.block.header.height')
TRUST_HEIGHT=$((LATEST_HEIGHT - 1000))
TRUST_HASH=$(curl -s "https://latanda.online/chain/rpc/block?height=$TRUST_HEIGHT" | jq -r '.result.block_id.hash')

echo "Latest: $LATEST_HEIGHT | Trust Height: $TRUST_HEIGHT | Trust Hash: $TRUST_HASH"
```

### 10.2 Configure State Sync

```bash
# Stop the node first
sudo systemctl stop latandad

# Configure state sync in config.toml
sed -i '/^\[statesync\]/,/^$/ {
  s|enable = false|enable = true|
  s|rpc_servers = ""|rpc_servers = "https://latanda.online/chain/rpc,https://latanda.online/chain/rpc"|
  s|trust_height = 0|trust_height = '"$TRUST_HEIGHT"'|
  s|trust_hash = ""|trust_hash = "'"$TRUST_HASH"'"|
  s|trust_period = "0s"|trust_period = "168h0m0s"|
}' ~/.latanda/config/config.toml

# Disable fast sync (conflicts with state sync)
sed -i 's|fast_sync = true|fast_sync = false|' ~/.latanda/config/config.toml
```

### 10.3 Reset Data and Restart

```bash
# Remove existing blockchain data
latandad comet unsafe-reset-all

# Start the node
sudo systemctl start latandad
```

### 10.4 Verify State Sync

```bash
# Watch the logs — you should see "Discovering snapshots"
journalctl -u latandad -f

# Check sync status after a few minutes
latandad status | jq '.sync_info'
```

> **Expected behavior:** The node discovers a snapshot, applies it, then starts syncing remaining blocks. Total sync time: 2–10 minutes.

### 10.5 Disable State Sync After Syncing

Once your node is fully synced, you can optionally disable state sync to prevent accidental re-sync:

```bash
sed -i 's|enable = true|enable = false|' ~/.latanda/config/config.toml
# Do NOT restart — the setting only takes effect on next start
```

---

## 11. Wallet Creation

### 11.1 Create a New Wallet

```bash
latandad keys add my-wallet --keyring-backend test
```

> **⚠️ IMPORTANT:** Write down the **mnemonic phrase** shown after creation. Store it securely offline. This is the ONLY way to recover your wallet.

The output includes:
- `address`: Your `ltd1...` address
- `mnemonic`: 24-word recovery phrase (SAVE THIS)

### 11.2 List Wallets

```bash
latandad keys list --keyring-backend test
```

### 11.3 Show Wallet Address

```bash
latandad keys show my-wallet -a --keyring-backend test
```

### 11.4 Recover a Wallet from Mnemonic

```bash
latandad keys add my-wallet --recover --keyring-backend test
# Paste your 24-word mnemonic when prompted
```

### 11.5 Check Wallet Balance

```bash
latandad query bank balances $(latandad keys show my-wallet -a --keyring-backend test)
```

### 11.6 Backup Your Keys

```bash
# Back up the keyring directory
cp -r ~/.latanda/keyring-test ~/keyring-backup-$(date +%Y%m%d)

# Back up validator keys
cp ~/.latanda/config/priv_validator_key.json ~/priv_validator_key-backup-$(date +%Y%m%d).json
cp ~/.latanda/config/node_key.json ~/node_key-backup-$(date +%Y%m%d).json
```

> Store backups on an **encrypted USB drive** or password manager — never in plain text on the server.

---

## 12. Faucet / Verification Process

### 12.1 Request Testnet Tokens

La Tanda testnet tokens (LTD) are available through:

1. **Discord Faucet** — Join https://discord.gg/bDJjH7tT4 and request tokens in the `#faucet` channel
2. **La Tanda Platform** — Register at https://latanda.online and complete KYC verification for automated token distribution
3. **Team Request** — Contact `contact@latanda.online` with your `ltd1...` address

### 12.2 Verify Token Receipt

```bash
latandad query bank balances $(latandad keys show my-wallet -a --keyring-backend test)
```

Expected output (after receiving tokens):
```
balances:
- amount: "2000000000"
  denom: ultd
pagination:
  next_key: null
  total: "0"
```

> **Note:** `2000000000 ultd` = `2000 LTD` (1 LTD = 1,000,000 ultd)

### 12.3 Minimum Tokens Needed for Validation

| Purpose              | Amount          | Notes                              |
|----------------------|-----------------|------------------------------------|
| Self-delegation      | 50,000 LTD min  | Staked to your own validator       |
| Transaction fees     | ~1 LTD          | Gas costs for create-validator tx  |
| **Total recommended**| **~51,000 LTD** | Request from faucet if needed      |

---

## 13. Validator Creation

### Prerequisites

Before creating your validator, ensure:

- [ ] Your node is **fully synced** (`catching_up` = `false`)
- [ ] You have **50,000+ LTD** in your wallet
- [ ] Your node has been running **stable for at least 1 hour**
- [ ] Port **26656** is open (inbound)

### 13.1 Create the Validator Transaction

```bash
# Get your validator public key
VALIDATOR_PUBKEY=$(latandad comet show-validator | jq -r '.key')

# Get your wallet address
WALLET=$(latandad keys show my-wallet -a --keyring-backend test)

# Create the validator
latandad tx staking create-validator \
  --amount=50000000000ultd \
  --pubkey="$VALIDATOR_PUBKEY" \
  --moniker="my-validator" \
  --identity="" \
  --website="" \
  --details="La Tanda testnet validator" \
  --security-contact="your@email.com" \
  --chain-id=latanda-testnet-1 \
  --commission-rate="0.10" \
  --commission-max-rate="0.20" \
  --commission-max-change-rate="0.01" \
  --min-self-delegation="1" \
  --gas=auto \
  --gas-adjustment=1.5 \
  --fees=5000ultd \
  --from=my-wallet \
  --keyring-backend=test \
  --yes
```

### 13.2 Parameter Explanations

| Parameter                    | Value     | Meaning                                        |
|------------------------------|-----------|-------------------------------------------------|
| `--amount`                   | `50000000000ultd` | 50,000 LTD initial self-delegation     |
| `--commission-rate`          | `0.10`    | 10% commission on delegator rewards            |
| `--commission-max-rate`      | `0.20`    | Maximum commission you can ever charge (20%)   |
| `--commission-max-change-rate`| `0.01`   | Max 1% commission change per day               |
| `--min-self-delegation`      | `1`       | Minimum tokens you must keep self-delegated    |
| `--security-contact`         | (email)   | For security disclosures — recommended         |
| `--identity`                 | (empty)   | Keybase identity for logo display              |

### 13.3 Verify Validator Was Created

```bash
# Check your validator address
latandad keys show my-wallet --bech val -a --keyring-backend test
# Returns: ltdvaloper1...

# Query your validator
latandad query staking validator $(latandad keys show my-wallet --bech val -a --keyring-backend test)
```

### 13.4 Check the Active Validator Set

```bash
latandad query staking validators --output json | jq '.validators[] | {
  moniker: .description.moniker,
  tokens: .tokens,
  status: .status,
  jailed: .jailed
}'
```

### 13.5 View on Explorer

After creating your validator, check the explorer:
- **Community Explorer:** https://exp.utsa.tech/latanda/staking

---

## 14. Validator Management Commands

### 14.1 Edit Validator

```bash
latandad tx staking edit-validator \
  --moniker="new-name" \
  --website="https://your-site.com" \
  --details="Updated description" \
  --from=my-wallet \
  --chain-id=latanda-testnet-1 \
  --keyring-backend=test \
  --gas=auto \
  --fees=5000ultd \
  --yes
```

### 14.2 Delegate (Stake) More Tokens

```bash
latandad tx staking delegate \
  $(latandad keys show my-wallet --bech val -a --keyring-backend test) \
  10000000000ultd \
  --from=my-wallet \
  --chain-id=latanda-testnet-1 \
  --keyring-backend=test \
  --gas=auto \
  --fees=5000ultd \
  --yes
```

### 14.3 Unbond (Unstake) Tokens

```bash
latandad tx staking unbond \
  $(latandad keys show my-wallet --bech val -a --keyring-backend test) \
  10000000000ultd \
  --from=my-wallet \
  --chain-id=latanda-testnet-1 \
  --keyring-backend=test \
  --gas=auto \
  --fees=5000ultd \
  --yes
```

> **Note:** Unbonding takes **21 days** on Cosmos chains. Tokens are locked during this period.

### 14.4 Withdraw Rewards

```bash
latandad tx distribution withdraw-rewards \
  $(latandad keys show my-wallet --bech val -a --keyring-backend test) \
  --from=my-wallet \
  --chain-id=latanda-testnet-1 \
  --keyring-backend=test \
  --commission \
  --gas=auto \
  --fees=5000ultd \
  --yes
```

### 14.5 Redelegate to Another Validator

```bash
latandad tx staking redelegate \
  $(latandad keys show my-wallet --bech val -a --keyring-backend test) \
  <destination-validator-address> \
  10000000000ultd \
  --from=my-wallet \
  --chain-id=latanda-testnet-1 \
  --keyring-backend=test \
  --gas=auto \
  --fees=5000ultd \
  --yes
```

### 14.6 Unjail a Validator

If your validator gets jailed (downtime), you must unjail it:

```bash
latandad tx slashing unjail \
  --from=my-wallet \
  --chain-id=latanda-testnet-1 \
  --keyring-backend=test \
  --gas=auto \
  --fees=5000ultd \
  --yes
```

### 14.7 Query Delegations

```bash
# All delegations to your validator
latandad query staking delegations-to \
  $(latandad keys show my-wallet --bech val -a --keyring-backend test)

# Your own delegation
latandad query staking delegation \
  $(latandad keys show my-wallet -a --keyring-backend test) \
  $(latandad keys show my-wallet --bech val -a --keyring-backend test)
```

### 14.8 Query Rewards

```bash
# Outstanding rewards
latandad query distribution validator-outstanding-rewards \
  $(latandad keys show my-wallet --bech val -a --keyring-backend test)

# Commission earned
latandad query distribution commission \
  $(latandad keys show my-wallet --bech val -a --keyring-backend test)
```

### 14.9 Send Tokens

```bash
latandad tx bank send my-wallet <destination-ltd-address> 1000000ultd \
  --chain-id=latanda-testnet-1 \
  --keyring-backend=test \
  --gas=auto \
  --fees=500ultd \
  --yes
```

---

## 15. Monitoring and Health Checks

### 15.1 Quick Status Checks

```bash
# Is my node synced?
latandad status | jq '.sync_info.catching_up'

# Current block height
latandad status | jq '.sync_info.latest_block_height'

# Connected peers
curl -s localhost:26657/net_info | jq '.result.n_peers'

# My node ID
latandad comet show-node-id
```

### 15.2 Validator Signing Status

```bash
# Check if your validator is signing blocks
latandad query slashing signing-info \
  $(latandad comet show-validator | jq -r '.key')

# Key fields:
# - missed_blocks_counter: Should be low (< 50)
# - jailed_until: Should be empty if not jailed
```

### 15.3 Create a Health Check Script

```bash
cat <<'HEALTHCHECK' > /usr/local/bin/latanda-health.sh
#!/bin/bash
# La Tanda Validator Health Check
# Run via cron: */5 * * * * /usr/local/bin/latanda-health.sh

LOG="/var/log/latanda-health.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Check if latandad is running
if ! systemctl is-active --quiet latandad; then
    echo "$TIMESTAMP ALERT: latandad is NOT running!" >> "$LOG"
    # Optional: send notification (Telegram, email, etc.)
    # curl -s "https://api.telegram.org/bot<TOKEN>/sendMessage" \
    #   -d chat_id=<CHAT_ID> -d text="ALERT: La Tanda node is DOWN"
    exit 1
fi

# Check sync status
CATCHING_UP=$(latandad status 2>/dev/null | jq -r '.sync_info.catching_up')
HEIGHT=$(latandad status 2>/dev/null | jq -r '.sync_info.latest_block_height')

if [ "$CATCHING_UP" = "true" ]; then
    echo "$TIMESTAMP WARN: Node is catching up at height $HEIGHT" >> "$LOG"
fi

# Check peer count
PEERS=$(curl -s localhost:26657/net_info 2>/dev/null | jq -r '.result.n_peers')
if [ "$PEERS" -lt 1 ] 2>/dev/null; then
    echo "$TIMESTAMP WARN: No peers connected!" >> "$LOG"
fi

# Check disk space
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 85 ]; then
    echo "$TIMESTAMP WARN: Disk usage at ${DISK_USAGE}%" >> "$LOG"
fi

echo "$TIMESTAMP OK: height=$HEIGHT peers=$PEERS disk=${DISK_USAGE}% synced=$([ "$CATCHING_UP" = "false" ] && echo "yes" || echo "no")" >> "$LOG"
HEALTHCHECK

chmod +x /usr/local/bin/latanda-health.sh
```

### 15.4 Set Up Cron for Health Checks

```bash
# Add to crontab — checks every 5 minutes
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/latanda-health.sh") | crontab -

# Verify
crontab -l
```

### 15.5 Monitor Block Production (Validators)

```bash
# Check if your validator is in the active set
VALOPER=$(latandad keys show my-wallet --bech val -a --keyring-backend test)
latandad query staking validator "$VALOPER" | grep -E "moniker|status|jailed|tokens"

# Check your signing performance
latandad query slashing signing-info $(latandad comet show-validator | jq -r '.key')
```

### 15.6 Disk Usage Monitoring

```bash
# Check blockchain data size
du -sh ~/.latanda/data/

# Check overall disk
df -h /

# If disk is getting full, consider pruning or state sync reset
```

---

## 16. Common Troubleshooting

### Node Won't Start

```bash
# Check systemd logs for errors
journalctl -u latandad -n 50 --no-pager

# Common issues:
# 1. Genesis hash mismatch — re-download genesis
# 2. Port already in use — check with: lsof -i :26656
# 3. Corrupt data — reset and re-sync
```

### Node Won't Sync (0 Peers)

```bash
# Verify the genesis node is reachable
curl -s http://168.231.67.201:26657/status | jq '.result.node_info.id'

# Check your firewall
sudo ufw status

# Re-add the seed peer
PEERS="483a8110c3cd93c8dd3801d935151e98656f5b67@168.231.67.201:26656"
sed -i "s|seeds = \".*\"|seeds = \"$PEERS\"|" ~/.latanda/config/config.toml
sed -i "s|persistent_peers = \".*\"|persistent_peers = \"$PEERS\"|" ~/.latanda/config/config.toml
sudo systemctl restart latandad
```

### Validator Got Jailed

Your validator gets jailed if it misses too many blocks (downtime). To fix:

```bash
# 1. Make sure your node is running and synced
sudo systemctl status latandad
latandad status | jq '.sync_info.catching_up'
# Must be: false

# 2. Unjail your validator
latandad tx slashing unjail \
  --from=my-wallet \
  --chain-id=latanda-testnet-1 \
  --keyring-backend=test \
  --gas=auto \
  --fees=5000ultd \
  --yes

# 3. Verify you're back in the active set
latandad query staking validator $(latandad keys show my-wallet --bech val -a --keyring-backend test)
```

### Node is Stuck at a Certain Block

```bash
# Check peer count
curl -s localhost:26657/net_info | jq '.result.n_peers'

# If 0 peers, restart
sudo systemctl restart latandad

# If still stuck, reset and re-sync with state sync
sudo systemctl stop latandad
latandad comet unsafe-reset-all
# Re-configure state sync (see Section 10)
sudo systemctl start latandad
```

### Genesis Hash Mismatch

```bash
# Redownload genesis
wget -q https://latanda.online/chain/genesis.json -O ~/.latanda/config/genesis.json

# Verify
sha256sum ~/.latanda/config/genesis.json
# Must match: 98fc9871d6a3b7b12b3f7fcaa1ca3303ffcfad0f209d61355975a15069ac3907

sudo systemctl restart latandad
```

### Out of Disk Space

```bash
# Check what's using space
du -sh ~/.latanda/data/*
du -sh /var/log/*

# Clear old logs
journalctl --vacuum-time=7d

# If needed, reset and re-sync with state sync (prunes old data)
sudo systemctl stop latandad
latandad comet unsafe-reset-all
# Re-configure state sync, then restart
```

### Transaction Fails with "insufficient funds"

```bash
# Check your balance
latandad query bank balances $(latandad keys show my-wallet -a --keyring-backend test)

# Request more tokens from faucet or team
```

### Transaction Fails with "out of gas"

```bash
# Increase gas
--gas=auto --gas-adjustment=2.0 --fees=10000ultd
```

---

## 17. Security Recommendations

### 17.1 SSH Security

```bash
# Disable password authentication (use SSH keys only)
sudo sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/^#*PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# Install and configure fail2ban
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 17.2 Firewall (Already Covered)

Ensure UFW is active and only required ports are open:
```bash
sudo ufw status verbose
```

### 17.3 Key Management

```bash
# Set restrictive permissions on validator keys
chmod 600 ~/.latanda/config/priv_validator_key.json
chmod 600 ~/.latanda/config/node_key.json
chmod 700 ~/.latanda/keyring-test/
```

### 17.4 Backup Strategy

| What to Backup                          | Where                       | How Often     |
|-----------------------------------------|-----------------------------|---------------|
| `priv_validator_key.json`               | Encrypted USB / offline     | Once (after creation) |
| `node_key.json`                         | Encrypted USB / offline     | Once (after creation) |
| `keyring-test/` directory               | Encrypted storage           | After new keys |
| `config/config.toml` + `app.toml`       | Version control / backup    | After changes  |
| Health check logs (`/var/log/latanda-health.log`) | Log rotation     | Automatic     |

> **Never** store validator keys in a public repository, cloud clipboard, or plain-text file on the server.

### 17.5 Keep Software Updated

```bash
# System updates (weekly)
sudo apt update && sudo apt upgrade -y

# Check for La Tanda chain binary updates
# (Announced on Discord: https://discord.gg/bDJjH7tT4)
```

### 17.6 No VPN Required

La Tanda's P2P protocol uses encrypted communication (Ed25519). A VPN is not needed and may add latency.

### 17.7 Separate Signing Node (Advanced)

For production/mainnet validators, consider running a **sentry node architecture**:

```
[Internet] → [Sentry Node 1] ─┐
              [Sentry Node 2] ─┼→ [Validator (private, no public IP)]
              [Sentry Node 3] ─┘
```

The validator node has no public IP and only connects to trusted sentry nodes. This protects against DDoS attacks. For testnet, this is optional but good practice.

---

## 18. Useful Maintenance Commands

### Quick Reference

```bash
# ===== NODE STATUS =====
latandad status | jq '.sync_info'              # Sync status
latandad status | jq '.sync_info.catching_up'   # true/false
latandad status | jq '.sync_info.latest_block_height'  # Current block
latandad comet show-node-id                     # Your node ID
curl -s localhost:26657/net_info | jq '.result.n_peers'  # Peer count

# ===== SYSTEMD =====
sudo systemctl start latandad                   # Start
sudo systemctl stop latandad                    # Stop
sudo systemctl restart latandad                 # Restart
sudo systemctl status latandad                  # Status
journalctl -u latandad -f                       # Live logs
journalctl -u latandad -n 100                   # Last 100 log lines

# ===== WALLET =====
latandad keys add <name> --keyring-backend test # Create wallet
latandad keys list --keyring-backend test       # List wallets
latandad keys show <name> -a --keyring-backend test  # Show address
latandad query bank balances <ltd-address>      # Check balance

# ===== VALIDATOR =====
latandad query staking validators               # List all validators
latandad query staking validator <ltdvaloper>   # Query one validator
latandad query slashing signing-info <pubkey>   # Signing info
latandad tx slashing unjail --from <key> --chain-id latanda-testnet-1 --keyring-backend test --gas auto --fees 5000ultd --yes  # Unjail

# ===== GOVERNANCE =====
latandad query gov proposals                    # List proposals
latandad query gov proposal <id>                # Proposal details
latandad tx gov vote <proposal-id> yes --from <key> --chain-id latanda-testnet-1 --keyring-backend test --gas auto --fees 5000ultd --yes  # Vote

# ===== CHAIN QUERIES =====
latandad query block --type=height <height>     # Get block
latandad query tx <txhash>                      # Get transaction
latandad query staking params                   # Staking parameters
latandad query distribution community-pool      # Community pool

# ===== MAINTENANCE =====
du -sh ~/.latanda/data/                         # Data directory size
df -h /                                         # Disk usage
journalctl --vacuum-time=7d                     # Clean old logs
sudo apt update && sudo apt upgrade -y          # System updates
```

---

## Appendix A: Quick Start — Complete Flow

Everything you need from zero to running validator in one block:

```bash
# 1. Install dependencies
sudo apt update && sudo apt install -y build-essential git curl wget jq lz4 ufw

# 2. Install Go 1.24.1
wget -q https://go.dev/dl/go1.24.1.linux-amd64.tar.gz -O /tmp/go.tar.gz
sudo rm -rf /usr/local/go && sudo tar -C /usr/local -xzf /tmp/go.tar.gz && rm /tmp/go.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin' >> ~/.bashrc && source ~/.bashrc

# 3. Build latandad
mkdir -p /tmp/latanda-build && cd /tmp/latanda-build
wget -q https://latanda.online/chain/latanda-chain-source.tar.gz
tar -xzf latanda-chain-source.tar.gz && go mod tidy
go build -o /usr/local/bin/latandad ./cmd/latandad

# 4. Initialize
latandad init "my-validator" --chain-id latanda-testnet-1 --default-denom ultd

# 5. Genesis + peers
wget -q https://latanda.online/chain/genesis.json -O ~/.latanda/config/genesis.json
PEERS="483a8110c3cd93c8dd3801d935151e98656f5b67@168.231.67.201:26656"
sed -i "s|persistent_peers = \"\"|persistent_peers = \"$PEERS\"|" ~/.latanda/config/config.toml
sed -i "s|seeds = \"\"|seeds = \"$PEERS\"|" ~/.latanda/config/config.toml
sed -i 's|minimum-gas-prices = ""|minimum-gas-prices = "0.001ultd"|' ~/.latanda/config/app.toml

# 6. Firewall
sudo ufw allow 26656/tcp && sudo ufw allow 26657/tcp && sudo ufw --force enable

# 7. Create systemd service
sudo tee /etc/systemd/system/latandad.service > /dev/null <<EOF
[Unit]
Description=La Tanda Chain Node
After=network-online.target

[Service]
User=root
ExecStart=/usr/local/bin/latandad start
Restart=on-failure
RestartSec=10
LimitNOFILE=65535
Environment="HOME=/root"
WorkingDirectory=/root

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload && sudo systemctl enable latandad

# 8. State sync (fast)
LATEST_HEIGHT=$(curl -s https://latanda.online/chain/rpc/block | jq -r '.result.block.header.height')
TRUST_HEIGHT=$((LATEST_HEIGHT - 1000))
TRUST_HASH=$(curl -s "https://latanda.online/chain/rpc/block?height=$TRUST_HEIGHT" | jq -r '.result.block_id.hash')
sed -i 's|enable = false|enable = true|' ~/.latanda/config/config.toml
sed -i "s|rpc_servers = \"\"|rpc_servers = \"https://latanda.online/chain/rpc,https://latanda.online/chain/rpc\"|" ~/.latanda/config/config.toml
sed -i "s|trust_height = 0|trust_height = $TRUST_HEIGHT|" ~/.latanda/config/config.toml
sed -i "s|trust_hash = \"\"|trust_hash = \"$TRUST_HASH\"|" ~/.latanda/config/config.toml
sed -i 's|trust_period = "0s"|trust_period = "168h0m0s"|' ~/.latanda/config/config.toml
latandad comet unsafe-reset-all

# 9. Start
sudo systemctl start latandad
journalctl -u latandad -f   # Watch sync progress

# 10. After synced, create wallet and validator
latandad keys add my-wallet --keyring-backend test  # SAVE THE MNEMONIC!
# Request tokens from faucet, then:
latandad tx staking create-validator \
  --amount=50000000000ultd \
  --pubkey=$(latandad comet show-validator | jq -r '.key') \
  --moniker="my-validator" \
  --chain-id=latanda-testnet-1 \
  --commission-rate="0.10" \
  --commission-max-rate="0.20" \
  --commission-max-change-rate="0.01" \
  --min-self-delegation="1" \
  --gas=auto --gas-adjustment=1.5 --fees=5000ultd \
  --from=my-wallet --keyring-backend=test --yes
```

---

## Appendix B: State Sync Quick Setup

If your node is already initialized and you just want to enable state sync:

```bash
sudo systemctl stop latandad

# Fetch trusted block
LATEST_HEIGHT=$(curl -s https://latanda.online/chain/rpc/block | jq -r '.result.block.header.height')
TRUST_HEIGHT=$((LATEST_HEIGHT - 1000))
TRUST_HASH=$(curl -s "https://latanda.online/chain/rpc/block?height=$TRUST_HEIGHT" | jq -r '.result.block_id.hash')

# Apply config
sed -i 's|enable = false|enable = true|' ~/.latanda/config/config.toml
sed -i "s|rpc_servers = \"\"|rpc_servers = \"https://latanda.online/chain/rpc,https://latanda.online/chain/rpc\"|" ~/.latanda/config/config.toml
sed -i "s|trust_height = 0|trust_height = $TRUST_HEIGHT|" ~/.latanda/config/config.toml
sed -i "s|trust_hash = \"\"|trust_hash = \"$TRUST_HASH\"|" ~/.latanda/config/config.toml
sed -i 's|trust_period = "0s"|trust_period = "168h0m0s"|' ~/.latanda/config/config.toml

# Reset and start
latandad comet unsafe-reset-all
sudo systemctl start latandad

# Monitor
journalctl -u latandad -f
```

---

## Appendix C: Network Information

| Resource              | Value / URL                                                          |
|-----------------------|----------------------------------------------------------------------|
| **Chain ID**          | `latanda-testnet-1`                                                  |
| **Token**             | LTD (denom: `ultd`, 1 LTD = 1,000,000 ultd)                         |
| **Total Supply**      | 200,000,000 LTD (fixed, 0% inflation)                               |
| **Block Time**        | ~5 seconds                                                           |
| **Consensus**         | CometBFT (Cosmos SDK)                                                |
| **Genesis File**      | https://latanda.online/chain/genesis.json                            |
| **Chain Source**      | https://latanda.online/chain/latanda-chain-source.tar.gz             |
| **Setup Script**      | https://latanda.online/chain/node-setup.sh                           |
| **RPC Endpoint**      | https://latanda.online/chain/rpc/                                    |
| **REST API**          | https://latanda.online/chain/api/                                    |
| **Explorer**          | https://exp.utsa.tech/latanda/staking                                |
| **P2P Seed**          | `483a8110c3cd93c8dd3801d935151e98656f5b67@168.231.67.201:26656`      |
| **Genesis Hash**      | `98fc9871d6a3b7b12b3f7fcaa1ca3303ffcfad0f209d61355975a15069ac3907`   |
| **Discord**           | https://discord.gg/bDJjH7tT4                                        |
| **Platform**          | https://latanda.online                                               |
| **API Docs (Swagger)**| https://latanda.online/docs                                          |
| **Dev Portal**        | https://latanda.online/dev-dashboard.html                            |

### Infrastructure Partners

| Role               | Moniker            |
|--------------------|--------------------|
| Genesis Validator  | JohnWiard          |
| Explorer Host      | UTSA               |
| Community Explorer | https://exp.utsa.tech/latanda/staking |

---

## Appendix D: CLI Command Quick Reference

```
╔══════════════════════════════════════════════════════════════════╗
║                  LA TANDA CHAIN — CLI CHEATSHEET                ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  NODE STATUS                                                     ║
║  ├─ latandad status | jq '.sync_info'                           ║
║  ├─ latandad status | jq '.sync_info.catching_up'               ║
║  ├─ latandad status | jq '.sync_info.latest_block_height'       ║
║  ├─ latandad comet show-node-id                                 ║
║  └─ curl -s localhost:26657/net_info | jq '.result.n_peers'    ║
║                                                                  ║
║  SYSTEMD MANAGEMENT                                              ║
║  ├─ sudo systemctl start latandad                               ║
║  ├─ sudo systemctl stop latandad                                ║
║  ├─ sudo systemctl restart latandad                             ║
║  ├─ sudo systemctl status latandad                              ║
║  └─ journalctl -u latandad -f                                   ║
║                                                                  ║
║  WALLET                                                          ║
║  ├─ latandad keys add <name> --keyring-backend test             ║
║  ├─ latandad keys list --keyring-backend test                   ║
║  ├─ latandad keys show <name> -a --keyring-backend test         ║
║  └─ latandad query bank balances <ltd1...>                      ║
║                                                                  ║
║  STAKING                                                         ║
║  ├─ latandad query staking validators                           ║
║  ├─ latandad query staking validator <ltdvaloper...>            ║
║  ├─ latandad tx staking create-validator ...                    ║
║  ├─ latandad tx staking delegate <valoper> <amount> ...         ║
║  ├─ latandad tx staking unbond <valoper> <amount> ...           ║
║  ├─ latandad tx staking redelegate <src> <dst> <amt> ...        ║
║  └─ latandad tx staking edit-validator ...                      ║
║                                                                  ║
║  DISTRIBUTION                                                    ║
║  ├─ latandad tx distribution withdraw-rewards <valoper> ...     ║
║  ├─ latandad query distribution validator-outstanding-rewards   ║
║  └─ latandad query distribution commission <valoper>            ║
║                                                                  ║
║  SLASHING                                                        ║
║  ├─ latandad query slashing signing-info <pubkey>               ║
║  └─ latandad tx slashing unjail ...                             ║
║                                                                  ║
║  GOVERNANCE                                                      ║
║  ├─ latandad query gov proposals                                ║
║  ├─ latandad query gov proposal <id>                            ║
║  └─ latandad tx gov vote <id> yes/no/no_with_veto/abstain ...  ║
║                                                                  ║
║  TOKEN TRANSFER                                                  ║
║  └─ latandad tx bank send <from> <to> <amount> ...              ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## Support & Resources

- **Platform:** https://latanda.online
- **Discord:** https://discord.gg/bDJjH7tT4
- **GitHub:** https://github.com/INDIGOAZUL/la-tanda-web
- **API Docs:** https://latanda.online/docs
- **Dev Portal:** https://latanda.online/dev-dashboard.html
- **Explorer:** https://exp.utsa.tech/latanda/staking
- **Email:** contact@latanda.online
- **Reference Guide:** https://www.johnwiard.com/Testnet/latanda/project-introduction

---

*La Tanda Chain — `latanda-testnet-1` — Ray-Banks LLC*
*Built with Cosmos SDK + CometBFT*
