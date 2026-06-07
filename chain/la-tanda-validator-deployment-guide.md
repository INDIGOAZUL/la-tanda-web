# La Tanda Testnet — Comprehensive Validator Deployment Guide

**Chain ID:** `latanda-testnet-1`
**Token:** LTD (micro-unit: `ultd`, 1 LTD = 1,000,000 ultd)
**Block Time:** ~5 seconds
**Consensus:** CometBFT (Cosmos SDK v0.53.x)
**Address Prefix:** `ltd`
**Explorer:** https://latanda.online/chain/

---

This guide walks you through running a **validator node** on the La Tanda Testnet — from bare-metal server setup through active validation, monitoring, and maintenance. Every command has been tested on a live testnet validator.

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

---

## 1. Server Requirements

### Minimum Hardware

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 2 cores | 4+ cores |
| RAM | 4 GB | 8 GB |
| Disk | 50 GB SSD | 100 GB+ NVMe SSD |
| Network | 100 Mbps | 1 Gbps |

### Supported OS

- **Ubuntu 22.04 LTS** (Jammy)
- **Ubuntu 24.04 LTS** (Noble) — recommended

Other Linux distributions may work but are untested. Windows and macOS are not supported for production validator nodes.

### Network Requirements

- **Public IPv4 address** (or port-forwarded static IP)
- **Port 26656 open inbound** (P2P traffic from other nodes)
- Port 26657 (RPC) optional — close it for production, open for monitoring

### Provider Recommendations

| Provider | Plan | Est. Monthly Cost | Notes |
|----------|------|-------------------|-------|
| Hetzner | CX22 (2 vCPU, 4 GB) | ~$4.50 | Best value |
| Hetzner | CX32 (4 vCPU, 8 GB) | ~$9.00 | Recommended for validators |
| DigitalOcean | $12 plan (2 vCPU, 4 GB) | $12.00 | Simple setup |
| Vultr | $12 plan (2 vCPU, 4 GB) | $12.00 | Good global presence |

> **Important:** Validator uptime directly impacts rewards and potential slashing. Choose a provider with a proven track record (99.9%+ SLA).

---

## 2. Ubuntu Preparation

Connect to your server via SSH and run the following:

### 2.1 Update System Packages

```bash
sudo apt update && sudo apt upgrade -y
```

### 2.2 Install Essential Tools

```bash
sudo apt install -y curl wget git jq build-essential ufw unzip
```

### 2.3 Configure Firewall

Open only the ports your node needs:

```bash
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 26656/tcp comment 'La Tanda P2P'
sudo ufw allow 26657/tcp comment 'La Tanda RPC (optional)'
```

Enable the firewall:

```bash
sudo ufw enable
```

Verify:

```bash
sudo ufw status verbose
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

### 2.4 Set Up SSH Key Authentication (Recommended)

On your **local machine**, generate an SSH key if you don't have one:

```bash
ssh-keygen -t ed25519 -C "your-email@example.com"
```

Copy the public key to your server:

```bash
ssh-copy-id root@YOUR_SERVER_IP
```

Then on the server, disable password authentication:

```bash
sudo sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/^#*PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
sudo systemctl restart sshd
```

> **⚠️ Warning:** Do NOT log out of your current SSH session until you have verified key-based login works in a second terminal window.

### 2.5 Install Fail2ban

```bash
sudo apt install -y fail2ban
sudo systemctl enable --now fail2ban
```

### 2.6 Optimize System Limits

Validators need higher open-file limits. Add these lines to `/etc/security/limits.conf`:

```bash
cat >> /etc/security/limits.conf << 'EOF'
root          soft    nofile          65536
root          hard    nofile          65536
*             soft    nofile          65536
*             hard    nofile          65536
EOF
```

Also modify systemd limits (used by the node service later):

```bash
mkdir -p /etc/systemd/system.conf.d/
cat > /etc/systemd/system.conf.d/limits.conf << 'EOF'
[Manager]
DefaultLimitNOFILE=65536
EOF
```

---

## 3. Go Installation

La Tanda Chain requires **Go 1.24.1** or later.

### 3.1 Download and Install Go

```bash
wget -q https://go.dev/dl/go1.24.1.linux-amd64.tar.gz -O /tmp/go.tar.gz
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf /tmp/go.tar.gz
rm /tmp/go.tar.gz
```

### 3.2 Add Go to PATH

```bash
echo 'export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin' >> ~/.bashrc
source ~/.bashrc
```

### 3.3 Verify Installation

```bash
go version
```

Expected output:
```
go version go1.24.1 linux/amd64
```

---

## 4. Latanda Binary Installation

You have two options: **one-line automated setup** or **manual build**.

### Option A: One-Line Automated Setup (Quick Start)

```bash
wget -q https://latanda.online/chain/node-setup.sh -O node-setup.sh && \
  chmod +x node-setup.sh && ./node-setup.sh
```

This script handles everything: dependency checks, Go validation, binary build, genesis download, and peer configuration. When prompted, enter your desired **moniker** (node name).

> ⚠️ The automated setup does NOT create a systemd service. Continue to [Section 8](#8-systemd-service-creation) after it completes.

### Option B: Manual Build (Full Control)

#### 4.1 Download the Chain Source

```bash
mkdir -p /tmp/latanda-build && cd /tmp/latanda-build
wget -q https://latanda.online/chain/latanda-chain-source.tar.gz
tar -xzf latanda-chain-source.tar.gz
```

#### 4.2 Build the Binary

```bash
export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin
go mod tidy
go build -o /usr/local/bin/latandad ./cmd/latandad
```

#### 4.3 Verify

```bash
latandad version
latandad --help
```

If the tarball is unavailable, you can build from the upstream repo:

```bash
git clone https://github.com/INDIGOAZUL/latanda-fintech.git /tmp/latanda-fintech
cd /tmp/latanda-fintech
go build -o /usr/local/bin/latandad ./cmd/latandad
```

---

## 5. Chain Initialization

### 5.1 Set Your Moniker

Choose a unique name for your node that will appear on the network:

```bash
MONIKER="your-validator-name"
```

### 5.2 Initialize the Node

```bash
latandad init "$MONIKER" --chain-id latanda-testnet-1 --default-denom ultd
```

This creates the node home directory at `~/.latanda/` with:

| File | Purpose | Backup? |
|------|---------|---------|
| `config/config.toml` | P2P, RPC, mempool settings | ✅ Yes |
| `config/app.toml` | Application-level settings (gas, API, pruning) | ✅ Yes |
| `config/genesis.json` | Chain genesis state | ✅ Yes |
| `config/node_key.json` | Node identity key (Peer ID) | ✅ Yes |
| `config/priv_validator_key.json` | **Validator signing key** | ⚠️ **YES — BACKUP SECURELY** |
| `data/` | Blockchain data (can be rebuilt) | ❌ No |

### 5.3 Set Minimum Gas Price

```bash
sed -i 's|minimum-gas-prices = ""|minimum-gas-prices = "0.001ultd"|' ~/.latanda/config/app.toml
```

### 5.4 Configure Pruning (Optional but Recommended for Validators)

```bash
sed -i 's|pruning = "default"|pruning = "custom"|' ~/.latanda/config/app.toml
sed -i 's|pruning-keep-recent = "0"|pruning-keep-recent = "100"|' ~/.latanda/config/app.toml
sed -i 's|pruning-keep-every = "0"|pruning-keep-every = "0"|' ~/.latanda/config/app.toml
sed -i 's|pruning-interval = "0"|pruning-interval = "10"|' ~/.latanda/config/app.toml
```

This keeps the last 100 states and prunes everything older every 10 blocks — balances disk usage with the ability to query recent state.

---

## 6. Genesis Download

Every node must have the exact same genesis file to connect to the network.

### 6.1 Download the Genesis File

```bash
wget -q https://latanda.online/chain/genesis.json -O ~/.latanda/config/genesis.json
```

### 6.2 Verify the Genesis Hash

```bash
sha256sum ~/.latanda/config/genesis.json
```

Expected hash:
```
98fc9871d6a3b7b12b3f7fcaa1ca3303ffcfad0f209d61355975a15069ac3907
```

> **If the hash doesn't match**, the genesis file is corrupted or the network has started a new chain. Download again or contact the La Tanda team.

---

## 7. Peer Configuration

Your node needs to know how to find the network.

### 7.1 Set Persistent Peers and Seeds

```bash
PEERS="483a8110c3cd93c8dd3801d935151e98656f5b67@168.231.67.201:26656"

sed -i "s|persistent_peers = \"\"|persistent_peers = \"$PEERS\"|" ~/.latanda/config/config.toml
sed -i "s|seeds = \"\"|seeds = \"$PEERS\"|" ~/.latanda/config/config.toml
```

### 7.2 Configure P2P Settings (Recommended)

```bash
# Set your external address for better peer discovery
EXTERNAL_IP="$(curl -s ifconfig.me)"
sed -i "s|external_address = \"\"|external_address = \"$EXTERNAL_IP:26656\"|" ~/.latanda/config/config.toml

# Increase max connections
sed -i 's|max_num_inbound_peers = 40|max_num_inbound_peers = 60|' ~/.latanda/config/config.toml
sed -i 's|max_num_outbound_peers = 10|max_num_outbound_peers = 30|' ~/.latanda/config/config.toml
```

### 7.3 Add Additional Peers (Optional)

For redundancy, you can add multiple peers:

```bash
PEERS="483a8110c3cd93c8dd3801d935151e98656f5b67@168.231.67.201:26656"
# Add more peers separated by commas (check the chain explorer for current peers)
# PEERS="$PEERS,<node-id>@<ip>:26656"

sed -i "s|persistent_peers = \"\"|persistent_peers = \"$PEERS\"|" ~/.latanda/config/config.toml
```

---

## 8. Systemd Service Creation

Using **systemd** (instead of PM2 or screen) is the recommended approach for production validator nodes. Systemd automatically restarts your node on failure or reboot, manages logs, and integrates with system monitoring.

### 8.1 Create the Systemd Service File

```bash
sudo tee /etc/systemd/system/latandad.service > /dev/null << 'EOF'
[Unit]
Description=La Tanda Chain Node
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/latandad start
Restart=on-failure
RestartSec=5
LimitNOFILE=65536
LimitNPROC=65536

[Install]
WantedBy=multi-user.target
EOF
```

### 8.2 Reload and Enable

```bash
sudo systemctl daemon-reload
sudo systemctl enable latandad
```

### 8.3 Set Log Rotation (Prevents Disk from Filling)

```bash
cat > /etc/logrotate.d/latandad << 'EOF'
/var/log/latandad/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
}
EOF

mkdir -p /var/log/latandad
```

---

## 9. Starting and Managing the Node

### 9.1 Start the Node

```bash
sudo systemctl start latandad
```

### 9.2 Check Service Status

```bash
sudo systemctl status latandad
```

Expected output shows `active (running)` with no errors.

### 9.3 View Logs

```bash
# Follow logs in real-time
sudo journalctl -u latandad -f

# Last 100 lines
sudo journalctl -u latandad --no-pager -n 100

# Filter by time
sudo journalctl -u latandad --since "1 hour ago"
```

### 9.4 Monitor Sync Status

```bash
# Check catching_up status
latandad status | jq '.sync_info'

# Check current block height
latandad status | jq '.sync_info.latest_block_height'

# Check peer count
curl -s localhost:26657/net_info | jq '.result.n_peers'
```

Your node is **fully synced** when:
- `catching_up` is `false`
- `latest_block_height` matches the current network height (check on the [explorer](https://latanda.online/chain/))

### 9.5 Common Systemd Commands

```bash
# Restart the node
sudo systemctl restart latandad

# Stop the node
sudo systemctl stop latandad

# Check if service is enabled on boot
sudo systemctl is-enabled latandad

# Disable auto-start (if needed)
sudo systemctl disable latandad
```

---

## 10. State Sync Configuration

**State sync** allows your node to jump to the latest block height quickly by fetching a trusted snapshot instead of replaying every block from genesis. This reduces sync time from potentially hours to **minutes**.

### 10.1 When to Use State Sync

- **New node setup** — skip hours of block replay
- **Recovery** — after `unsafe-reset-all` to rejoin fast
- **Test environment** — quick node spin-up

### 10.2 Find a Trusted RPC Endpoint

You need an RPC server that exposes state sync endpoints. Ask on the [La Tanda Discord](https://discord.gg/Ve9M2ZSYC2) or Telegram for current RPC snapshot endpoints. You can also use the genesis node's RPC:

```bash
# Check if the RPC supports state sync
curl -s http://168.231.67.201:26657/status | jq '.result.sync_info'
```

### 10.3 Get Trust Height and Hash

From an already-synced RPC node, retrieve the trusted block:

```bash
# Set your trusted RPC node
TRUST_RPC="http://168.231.67.201:26657"

# Get trusted block height (use a recent height, e.g., current - 1000)
LATEST_HEIGHT=$(curl -s $TRUST_RPC/block | jq -r '.result.block.header.height')
TRUST_HEIGHT=$((LATEST_HEIGHT - 1000))
TRUST_HASH=$(curl -s "$TRUST_RPC/block?height=$TRUST_HEIGHT" | jq -r '.result.block_id.hash')

echo "Trust height: $TRUST_HEIGHT"
echo "Trust hash: $TRUST_HASH"
```

### 10.4 Configure State Sync in config.toml

```bash
# Enable state sync
sed -i 's|enable = false|enable = true|' ~/.latanda/config/config.toml

# Set RPC servers (comma-separated, at least 2 recommended)
sed -i 's|rpc_servers = ""|rpc_servers = "http://168.231.67.201:26657,http://168.231.67.201:26657"|' ~/.latanda/config/config.toml

# Set trust height and hash
sed -i "s|trust_height = 0|trust_height = $TRUST_HEIGHT|" ~/.latanda/config/config.toml
sed -i "s|trust_hash = \"\"|trust_hash = \"$TRUST_HASH\"|" ~/.latanda/config/config.toml

# Set trust period (must be less than the unbonding period)
sed -i 's|trust_period = "168h0m0s"|trust_period = "336h0m0s"|' ~/.latanda/config/config.toml
```

### 10.5 Reset Data and Restart

State sync requires a fresh data directory:

```bash
latandad comet unsafe-reset-all
sudo systemctl restart latandad
```

### 10.6 Monitor State Sync Progress

```bash
journalctl -u latandad -f --no-pager -n 50
```

You should see logs like:
```
" discovered new snapshot"
" applied snapshot chunk to 100%"
" completed snapshot sync"
```

After state sync completes, your node will start catching up with new blocks normally. Verify with:

```bash
latandad status | jq '.sync_info'
```

### 10.7 Disable State Sync After Success

Once synced, you can disable state sync to prevent accidental re-triggering:

```bash
sed -i 's|enable = true|enable = false|' ~/.latanda/config/config.toml
sudo systemctl restart latandad
```

---

## 11. Wallet Creation

Your wallet holds the LTD tokens needed to create a validator.

### 11.1 Create a New Wallet

```bash
latandad keys add validator-wallet --keyring-backend test
```

You will be shown:
- Your **address** (starts with `ltd1...`)
- Your **public key**
- A **mnemonic phrase** (24 words) — **WRITE THIS DOWN IMMEDIATELY AND STORE IT SECURELY**

> **⚠️ Critical:** The mnemonic is the ONLY way to recover your wallet. If you lose it, your tokens are gone forever. Store it offline (paper backup, hardware wallet).

### 11.2 Export Your Wallet Address

```bash
WALLET_ADDRESS=$(latandad keys show validator-wallet -a --keyring-backend test)
echo "Your wallet address: $WALLET_ADDRESS"
```

### 11.3 List All Wallets

```bash
latandad keys list --keyring-backend test
```

### 11.4 Import an Existing Wallet

If you already have a wallet from another Cosmos chain or a previous setup:

```bash
latandad keys add validator-wallet --recover --keyring-backend test
```

You'll be prompted to enter your 24-word mnemonic phrase.

### 11.5 Export Key (for Backup)

```bash
# Export private key (encrypted)
latandad keys export validator-wallet --keyring-backend test

# Export as hex private key (unencrypted — handle with extreme care)
latandad keys unsafe-export-eth-key validator-wallet --keyring-backend test
```

### 11.6 Check Your Balance

```bash
latandad query bank balances $WALLET_ADDRESS
```

---

## 12. Faucet / Verification Process

To become a validator, you need testnet LTD tokens for the self-delegation (50,000 LTD minimum) and transaction fees.

### 12.1 Request Testnet Tokens

You can request testnet LTD tokens through one of these methods:

**Method A: La Tanda Platform**
1. Go to https://latanda.online/
2. Create an account (email or Google Sign-In)
3. Navigate to the chain dashboard
4. Use the faucet tool to request testnet LTD for your validator address

**Method B: Contact the Team**
- Email: contact@latanda.online
- [Discord](https://discord.gg/Ve9M2ZSYC2) — ask in the #validators channel
- [Telegram](https://t.me/latandahn) — message the group

Include in your request:
- Your wallet address (starts with `ltd1...`)
- Your node moniker
- Your node ID (`latandad comet show-node-id`)

### 12.2 Verify Your Identity (KYC)

La Tanda requires KYC verification before granting validator status. Complete this on the platform:
1. Go to https://latanda.online/
2. Complete the KYC/verification process in your profile
3. Submit your validator application

### 12.3 Check Your Balance After Receiving Tokens

```bash
latandad query bank balances $(latandad keys show validator-wallet -a --keyring-backend test)
```

You should see at least 50,000,000,000 ultd (50,000 LTD) for the minimum self-delegation + some extra for gas fees.

### 12.4 Convert LTD to ultd

The chain uses micro-units internally. 1 LTD = 1,000,000 ultd. All amounts in transactions must be specified in ultd.

| LTD | ultd |
|-----|------|
| 1 LTD | 1,000,000 ultd |
| 50,000 LTD | 50,000,000,000 ultd |
| 100,000 LTD | 100,000,000,000 ultd |

---

## 13. Validator Creation

Once your node is **fully synced** (catching_up = false) and your wallet has sufficient balance, you can create your validator.

### 13.1 Prerequisites Checklist

Before running the create-validator command:
- [ ] Node is fully synced (`latandad status | jq '.sync_info.catching_up'` → `false`)
- [ ] Wallet has sufficient balance (`latandad query bank balances <address>`)
- [ ] At least 50,000,000,000 ultd for self-delegation
- [ ] Extra balance for gas fees (at least 10,000,000 ultd)
- [ ] Node is running and reachable on port 26656

### 13.2 Get Your Validator Public Key

```bash
latandad comet show-validator
```

This returns your validator's consensus public key (hex-encoded ed25519). It's used to link your signing key to the validator on-chain.

### 13.3 Create the Validator

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
  --from=validator-wallet \
  --gas=auto \
  --gas-adjustment=1.5 \
  --fees=5000ultd
```

### 13.4 Understanding the Parameters

| Parameter | Value | Explanation |
|-----------|-------|-------------|
| `--amount` | 50000000000ultd (50,000 LTD) | Tokens you self-delegate |
| `--pubkey` | (auto) | Your validator's consensus public key |
| `--moniker` | Your choice | Public name shown on explorers |
| `--commission-rate` | 0.10 (10%) | % of rewards you keep before distributing to delegators |
| `--commission-max-rate` | 0.20 (20%) | Maximum commission you can ever set |
| `--commission-max-change-rate` | 0.01 (1%) | Max % commission can change per day |
| `--min-self-delegation` | 1 | Minimum amount you must keep self-delegated |
| `--from` | validator-wallet | Key name that signs the transaction |
| `--gas-adjustment` | 1.5 | Multiplier for gas estimation (avoids out-of-gas errors) |

### 13.5 Verify Your Validator Was Created

```bash
latandad query staking validators --output json | jq '.validators[] | select(.description.moniker == "your-validator-name")'
```

If successful, you'll see your validator details including operator address (`ltdvaloper1...`), status, and delegation info.

### 13.6 Check If You're in the Active Set

```bash
latandad query staking validators --output json | jq '.validators[] | select(.status == "BOND_STATUS_BONDED") | .description.moniker'
```

Active validators show status `BOND_STATUS_BONDED`. If you see your moniker in this list, you're validating!

### 13.7 View Your Validator on the Explorer

Open https://latanda.online/chain/ in your browser. You should see your validator in the list.

---

## 14. Validator Management Commands

### 14.1 View Your Validator Info

```bash
# Full details
latandad query staking validator $(latandad keys show validator-wallet -a --keyring-backend test --bech val)

# Basic info
latandad query staking validator <ltdvaloper-address>
```

### 14.2 Edit Validator Metadata

Update your validator's public information:

```bash
latandad tx staking edit-validator \
  --new-moniker="new-validator-name" \
  --website="https://your-website.com" \
  --identity="keybase-pgp-id" \
  --details="La Tanda Testnet Validator" \
  --security-contact="your-email@example.com" \
  --commission-rate="0.12" \
  --from=validator-wallet \
  --chain-id=latanda-testnet-1 \
  --keyring-backend=test \
  --gas=auto \
  --gas-adjustment=1.5 \
  --fees=5000ultd
```

> Note: `--commission-rate` cannot exceed `--commission-max-rate`, and can only change by `--commission-max-change-rate` per 24h period.

### 14.3 Delegate Additional Tokens to Yourself

```bash
latandad tx staking delegate \
  $(latandad keys show validator-wallet -a --keyring-backend test --bech val) \
  1000000000ultd \
  --from=validator-wallet \
  --chain-id=latanda-testnet-1 \
  --keyring-backend=test \
  --gas=auto \
  --gas-adjustment=1.5 \
  --fees=5000ultd
```

### 14.4 Withdraw Rewards

```bash
# Withdraw all rewards and commissions
latandad tx distribution withdraw-rewards \
  $(latandad keys show validator-wallet -a --keyring-backend test --bech val) \
  --commission \
  --from=validator-wallet \
  --chain-id=latanda-testnet-1 \
  --keyring-backend=test \
  --gas=auto \
  --gas-adjustment=1.5 \
  --fees=5000ultd
```

### 14.5 Check Validator Signing Info

```bash
# Get your consensus address
CONSENSUS_ADDRESS=$(latandad comet show-address)

# Check missed blocks
latandad query slashing signing-info $(latandad comet show-validator)
```

### 14.6 Unjail Your Validator

If your validator gets jailed (usually due to downtime), you can unjail it:

```bash
latandad tx slashing unjail \
  --from=validator-wallet \
  --chain-id=latanda-testnet-1 \
  --keyring-backend=test \
  --gas=auto \
  --gas-adjustment=1.5 \
  --fees=5000ultd
```

### 14.7 Unbond / Stop Validating

```bash
# Unbond some tokens (you must keep at least min-self-delegation)
latandad tx staking unbond \
  $(latandad keys show validator-wallet -a --keyring-backend test --bech val) \
  10000000000ultd \
  --from=validator-wallet \
  --chain-id=latanda-testnet-1 \
  --keyring-backend=test \
  --gas=auto \
  --gas-adjustment=1.5 \
  --fees=5000ultd
```

---

## 15. Monitoring and Health Checks

### 15.1 Quick Health Check Script

Create a script for daily health checks:

```bash
cat > /usr/local/bin/latanda-health.sh << 'SCRIPT'
#!/bin/bash
# La Tanda Validator Health Check

NODE_HOME="$HOME/.latanda"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "========================================"
echo " La Tanda Validator Health Check"
echo " $TIMESTAMP"
echo "========================================"

# System resources
echo ""
echo "--- System Resources ---"
echo "CPU Load: $(uptime | awk -F'load average:' '{print $2}')"
echo "Memory: $(free -h | awk '/^Mem:/{print $3 "/" $2}')"
echo "Disk: $(df -h ~/.latanda/ | awk 'NR==2{print $3 "/" $2 " (" $5 ")"}')"

# Node status
echo ""
echo "--- Node Status ---"
STATUS=$(latandad status 2>/dev/null)
if [ $? -eq 0 ]; then
    HEIGHT=$(echo "$STATUS" | jq -r '.sync_info.latest_block_height')
    CATCHING_UP=$(echo "$STATUS" | jq -r '.sync_info.catching_up')
    echo "Block Height: $HEIGHT"
    echo "Synced: $([ "$CATCHING_UP" = "false" ] && echo 'YES' || echo 'NO (catching up)')"
else
    echo "ERROR: Cannot connect to node!"
fi

# Peer count
PEERS=$(curl -s localhost:26657/net_info 2>/dev/null | jq -r '.result.n_peers')
echo "Peers: ${PEERS:-0}"

# Service status
echo ""
echo "--- Service Status ---"
systemctl is-active --quiet latandad && echo "latandad: RUNNING" || echo "latandad: STOPPED"

# Validator status
echo ""
echo "--- Validator Status ---"
VAL_ADDRESS=$(latandad keys show validator-wallet -a --keyring-backend test --bech val 2>/dev/null)
if [ -n "$VAL_ADDRESS" ]; then
    VAL_INFO=$(latandad query staking validator "$VAL_ADDRESS" --output json 2>/dev/null)
    if [ -n "$VAL_INFO" ]; then
        JAILEd=$(echo "$VAL_INFO" | jq -r '.jailed')
        STATUS=$(echo "$VAL_INFO" | jq -r '.status')
        TOKENS=$(echo "$VAL_INFO" | jq -r '.tokens')
        echo "Operator Address: $VAL_ADDRESS"
        echo "Jailed: $JAILEd"
        echo "Status: $STATUS"
        echo "Total Stake: $((TOKENS / 1000000)) LTD"

        if [ "$JAILEd" = "true" ]; then
            echo "⚠️  WARNING: Validator is JAILED! Run unjail command."
        fi
    else
        echo "Validator not found or query failed"
    fi
else
    echo "Wallet 'validator-wallet' not found"
fi

echo ""
echo "========================================"
SCRIPT
chmod +x /usr/local/bin/latanda-health.sh
```

Run it:

```bash
/usr/local/bin/latanda-health.sh
```

### 15.2 Create a Cron Job for Regular Health Checks

```bash
crontab -e
```

Add:

```
# La Tanda health check every 6 hours
0 */6 * * * /usr/local/bin/latanda-health.sh >> /var/log/latandad/health.log 2>&1

# Check if process is running every 5 minutes, log to journal
*/5 * * * * systemctl is-active --quiet latandad || systemctl restart latandad
```

### 15.3 Set Up Prometheus Monitoring (Advanced)

La Tanda Chain nodes expose Prometheus metrics out of the box.

Enable Prometheus in `config.toml`:

```bash
sed -i 's|prometheus = false|prometheus = true|' ~/.latanda/config/config.toml
sudo systemctl restart latandad
```

Metrics are available at `http://localhost:26660/metrics`. You can scrape them with a Prometheus server and visualize with Grafana.

### 15.4 Set Up Alerting via Telegram or Discord

Create a simple alert script:

```bash
cat > /usr/local/bin/latanda-alert.sh << 'SCRIPT'
#!/bin/bash
# Alert if validator is jailed or node is down

WEBHOOK_URL="https://discord.com/api/webhooks/YOUR_WEBHOOK"  # Replace with your webhook

check_validator() {
    VAL_ADDRESS=$(latandad keys show validator-wallet -a --keyring-backend test --bech val 2>/dev/null)
    if [ -z "$VAL_ADDRESS" ]; then
        return
    fi

    JAILED=$(latandad query staking validator "$VAL_ADDRESS" --output json 2>/dev/null | jq -r '.jailed')
    if [ "$JAILED" = "true" ]; then
        MESSAGE="🚨 La Tanda Validator JAILED! Operator: $VAL_ADDRESS"
        curl -H "Content-Type: application/json" -d "{\"content\":\"$MESSAGE\"}" "$WEBHOOK_URL" 2>/dev/null
    fi
}

check_node() {
    if ! systemctl is-active --quiet latandad; then
        MESSAGE="🚨 La Tanda Node is DOWN! Attempting restart..."
        curl -H "Content-Type: application/json" -d "{\"content\":\"$MESSAGE\"}" "$WEBHOOK_URL" 2>/dev/null
        systemctl restart latandad
    fi
}

check_validator
check_node
SCRIPT
chmod +x /usr/local/bin/latanda-alert.sh
```

Add to crontab to run every 10 minutes.

### 15.5 Monitor Disk Usage

The data directory grows over time. Check regularly:

```bash
du -sh ~/.latanda/data/
```

If disk space gets low, run pruning or use state sync to rebuild.

---

## 16. Common Troubleshooting

### 16.1 "connection refused" — Can't Connect to Node

**Problem:** `latandad status` returns connection refused.

**Solutions:**

```bash
# 1. Check if the service is running
sudo systemctl status latandad

# 2. Check if port 26657 is open
ss -tlnp | grep 26657

# 3. Check logs for errors
sudo journalctl -u latandad --no-pager -n 50 | tail

# 4. Make sure RPC is configured correctly
cat ~/.latanda/config/config.toml | grep -A 5 '\[rpc\]'
```

### 16.2 Node Stuck at 0 Peers

**Problem:** `curl -s localhost:26657/net_info | jq '.result.n_peers'` returns `0`.

**Solutions:**

```bash
# 1. Verify port 26656 is open in firewall
sudo ufw status | grep 26656

# 2. Check if peers are configured
cat ~/.latanda/config/config.toml | grep -E "^(persistent_peers|seeds) ="

# 3. Re-set peers explicitly
PEERS="483a8110c3cd93c8dd3801d935151e98656f5b67@168.231.67.201:26656"
sed -i "s|persistent_peers = \".*\"|persistent_peers = \"$PEERS\"|" ~/.latanda/config/config.toml
sed -i "s|seeds = \".*\"|seeds = \"$PEERS\"|" ~/.latanda/config/config.toml
sudo systemctl restart latandad

# 4. Check if genesis node is reachable
curl -s http://168.231.67.201:26657/status
```

### 16.3 Node Won't Start

**Problem:** `sudo systemctl status latandad` shows `failed`.

**Solutions:**

```bash
# 1. Check full logs
sudo journalctl -u latandad --no-pager -n 100

# 2. Common fix: reset data (keeps config, keys, wallet)
latandad comet unsafe-reset-all
sudo systemctl restart latandad

# 3. Verify genesis file integrity
sha256sum ~/.latanda/config/genesis.json
# Expected: 98fc9871d6a3b7b12b3f7fcaa1ca3303ffcfad0f209d61355975a15069ac3907

# 4. Check disk space
df -h
```

### 16.4 "Wrong Block.Header.AppHash" Error

**Problem:** Node crashes with app hash mismatch.

**Cause:** Corrupted data from a previous chain state.

**Solution:**

```bash
latandad comet unsafe-reset-all
sudo systemctl restart latandad
```

If this persists with state sync, try a full sync instead (disable state sync in config.toml).

### 16.5 Validator is Jailed

**Problem:** Your validator status shows `jailed: true`.

**Causes:**
- Node was down for an extended period
- Missed too many blocks in a row
- Double-sign (this is permanent — hardware key security is critical)

**Solution:**

```bash
# 1. Fix the underlying issue (check node is synced and running)
latandad status | jq '.sync_info'

# 2. Unjail the validator
latandad tx slashing unjail \
  --from=validator-wallet \
  --chain-id=latanda-testnet-1 \
  --keyring-backend=test \
  --gas=auto \
  --gas-adjustment=1.5 \
  --fees=5000ultd

# 3. Verify unjailed
latandad query staking validator $(latandad keys show validator-wallet -a --keyring-backend test --bech val) | jq '.jailed'
```

### 16.6 "Out of Gas" Error

**Problem:** Transactions fail with `out of gas`.

**Solutions:**

```bash
# Increase gas adjustment in your commands
--gas-adjustment=2.0

# Or set a manual gas limit
--gas=500000
```

### 16.7 "Account sequence mismatch" Error

**Problem:** Transaction fails with account sequence mismatch.

**Cause:** Multiple transactions submitted without waiting for confirmation.

**Solutions:**

```bash
# Wait for previous tx to confirm, then retry
sleep 10

# Or use --sequence flag with the correct sequence number
latandad query auth account $(latandad keys show validator-wallet -a --keyring-backend test)
```

---

## 17. Security Recommendations

### 17.1 Key Management

**Critical files** — backup these and store them offline:

| File | Path | Security Level |
|------|------|----------------|
| Validator signing key | `~/.latanda/config/priv_validator_key.json` | 🔴 **TOP SECRET** |
| Node identity key | `~/.latanda/config/node_key.json` | 🟡 Sensitive |
| Wallet mnemonic | Written down on paper | 🔴 **TOP SECRET** |
| Wallet private key | (exported via CLI) | 🔴 **TOP SECRET** |

```bash
# Set restrictive permissions on key files
chmod 600 ~/.latanda/config/priv_validator_key.json
chmod 600 ~/.latanda/config/node_key.json
chmod 600 ~/.latanda/config/priv_validator_state.json
```

### 17.2 SSH Hardening

```bash
# Already done in Section 2, but verify:
grep -E "^(PermitRootLogin|PasswordAuthentication|PubkeyAuthentication)" /etc/ssh/sshd_config
```

Expected secure values:
```
PermitRootLogin prohibit-password
PasswordAuthentication no
PubkeyAuthentication yes
```

### 17.3 Firewall Rules

For maximum security, close RPC port (26657) from the internet:

```bash
sudo ufw delete allow 26657/tcp
# Or restrict to your IP only:
sudo ufw allow from YOUR_LOCAL_IP to any port 26657 proto tcp
```

Minimal open ports for a validator:
- **22/tcp** — SSH (your IP only, if possible)
- **26656/tcp** — P2P (required, must be public)

### 17.4 Regular Updates

```bash
# System updates
sudo apt update && sudo apt upgrade -y

# Kernel auto-updates (optional)
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades
```

### 17.5 Monitoring for Intrusion

```bash
# Install and configure aide (file integrity checker)
sudo apt install -y aide
sudo aideinit
sudo mv /var/lib/aide/aide.db.new /var/lib/aide/aide.db

# Check daily
sudo aide --check
```

### 17.6 HSM / Remote Signing (Advanced)

For production validators on mainnet, consider using a **Hardware Security Module (HSM)** or a **remote signer** like `tmkms` (Tendermint Key Management System). This keeps your validator signing key off the node server entirely. This is beyond the scope of this testnet guide but should be on your roadmap for mainnet.

### 17.7 Don't Run as Root (Advanced)

For production, create a dedicated user:

```bash
sudo useradd -m -s /bin/bash latanda
sudo mv ~/.latanda /home/latanda/.latanda
sudo chown -R latanda:latanda /home/latanda/.latanda
```

Then update the systemd service to use `User=latanda`.

---

## 18. Useful Maintenance Commands

### System

```bash
# Service management
sudo systemctl status latandad     # Check status
sudo systemctl restart latandad    # Restart node
sudo systemctl stop latandad       # Stop node
sudo journalctl -u latandad -f     # Follow logs

# Resource usage
htop                               # Interactive process viewer
df -h ~/.latanda/                  # Disk usage
du -sh ~/.latanda/data/            # Data directory size
free -h                            # Memory usage
```

### Node Status

```bash
# Core status
latandad status | jq '.sync_info'
latandad status | jq '.sync_info.latest_block_height'
latandad status | jq '.sync_info.catching_up'

# Node identity
latandad comet show-node-id
latandad comet show-validator
latandad comet show-address

# Network
curl -s localhost:26657/net_info | jq '.result.n_peers'
curl -s localhost:26657/consensus_state | jq '.result.round_state.height_height'
```

### Chain Queries

```bash
# Validators
latandad query staking validators --output json | jq '.validators[] | {moniker: .description.moniker, tokens: .tokens, status: .status}'
latandad query staking validator <ltdvaloper-address>

# Account
latandad query bank balances <ltd-address>
latandad query auth account <ltd-address>

# Blocks
latandad query block --type=height 1
latandad query block --type=latest

# Governance
latandad query gov proposals
latandad query gov votes <proposal-id>

# Distribution
latandad query distribution rewards <ltdvaloper-address>
latandad query distribution commission <ltdvaloper-address>
latandad query distribution validator-outstanding-rewards <ltdvaloper-address>
```

### Wallet Operations

```bash
# Key management
latandad keys list --keyring-backend test
latandad keys show validator-wallet -a --keyring-backend test
latandad keys show validator-wallet -a --keyring-backend test --bech val

# Send tokens
latandad tx bank send validator-wallet <destination-address> 1000000ultd \
  --chain-id=latanda-testnet-1 \
  --keyring-backend=test \
  --gas=auto \
  --gas-adjustment=1.5 \
  --fees=5000ultd
```

### Backup and Recovery Commands

```bash
# Backup validator keys (run locally, not on server)
tar -czf latanda-backup-$(date +%Y%m%d).tar.gz \
  ~/.latanda/config/priv_validator_key.json \
  ~/.latanda/config/node_key.json \
  ~/.latanda/config/genesis.json

# Restore from backup
tar -xzf latanda-backup-YYYYMMDD.tar.gz -C ~/

# Export mnemonic safely from the server
latandad keys export validator-wallet --keyring-backend test
```

### Database Maintenance

```bash
# Compact the database (run after stopping the node)
sudo systemctl stop latandad
latandad comet compact
sudo systemctl start latandad

# Unsafe reset (keeps config, keys, wallet — only use when necessary)
latandad comet unsafe-reset-all
```

### TMKMS / Signer

For validators who want to use remote signing, here's a quick reference:

```bash
# Get validator signing key hex for importing into tmkms
cat ~/.latanda/config/priv_validator_key.json | jq -r '.key'
```

---

## Incentivized Testnet Rewards

Running a validator on the La Tanda testnet qualifies you for LTD token rewards:

| Tier | Slots | Reward at Genesis |
|------|-------|-------------------|
| Infra Partner | 5 (4 occupied) | 5,000 LTD |
| Validator | 10 | 2,000 LTD |
| Full Node | 20 | 500 LTD |
| Bug Reporter | Open | 100–1,000 LTD |

To join: run your node, apply with 10 LTD testnet + create-validator transaction, and complete KYC on the platform.

---

## Network Reference

| Resource | URL |
|----------|-----|
| Chain Explorer | https://latanda.online/chain/ |
| Community Explorer | https://exp.utsa.tech/latanda/staking |
| Genesis File | https://latanda.online/chain/genesis.json |
| Setup Script | https://latanda.online/chain/node-setup.sh |
| Chain Source | https://latanda.online/chain/latanda-chain-source.tar.gz |
| RPC Endpoint | http://168.231.67.201:26657 |
| REST API | https://latanda.online/chain/api/ |
| P2P Seed | `483a8110c3cd93c8dd3801d935151e98656f5b67@168.231.67.201:26656` |
| Chain ID | `latanda-testnet-1` |
| Denom | `ultd` (1 LTD = 1,000,000 ultd) |
| Genesis Hash | `98fc9871d6a3b7b12b3f7fcaa1ca3303ffcfad0f209d61355975a15069ac3907` |
| Platform | https://latanda.online |
| API Docs | https://latanda.online/docs |
| Dev Portal | https://latanda.online/dev-dashboard.html |

## Community & Support

- **Discord:** https://discord.gg/Ve9M2ZSYC2
- **Telegram:** https://t.me/latandahn
- **Email:** contact@latanda.online
- **Cosmos Forum:** https://forum.cosmos.network/t/la-tanda-chain-incentivized-testnet-live-validators-node-operators-welcome-cosmos-sdk-v0-53-6/16709
- **GitHub:** https://github.com/INDIGOAZUL

---

*La Tanda Chain — latanda-testnet-1 | Ray-Banks LLC*
*Validator Deployment Guide v1.0 — Tested on live testnet validator*
