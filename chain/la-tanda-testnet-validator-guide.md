# La Tanda Testnet Validator Guide

**A complete step-by-step guide to running a La Tanda Testnet validator node on Ubuntu Linux.**

This guide covers the full validator lifecycle — from provisioning a server through validator creation, state sync, systemd service management, monitoring, and ongoing maintenance. By the end, you'll have a production-grade validator node contributing to network security.

**Chain ID:** `latanda-testnet-1`
**Token:** LTD (micro-unit: `ultd`, 1 LTD = 1,000,000 ultd)
**Consensus:** CometBFT (Tendermint)
**Website:** https://latanda.online
**Explorer:** https://latanda.online/chain/

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

Your validator node needs a dedicated server (physical or cloud VPS) meeting these minimums:

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| OS | Ubuntu 22.04 | Ubuntu 24.04 LTS |
| CPU | 2 cores | 4 cores |
| RAM | 4 GB | 8 GB |
| Disk | 50 GB SSD | 100 GB+ NVMe |
| Network | Stable, 100 Mbps | 1 Gbps |
| Open Ports | 26656 (P2P), 26657 (RPC) | Same |

### Cloud Provider Options

| Provider | Recommended Plan | Monthly Cost |
|----------|-----------------|-------------|
| [Hetzner](https://www.hetzner.com/cloud) | CX22 (2 vCPU, 4 GB) | ~$4.50 |
| [DigitalOcean](https://www.digitalocean.com/) | Basic ($12/mo, 2 vCPU, 4 GB) | ~$12 |
| [Vultr](https://www.vultr.com/) | Cloud Compute ($12/mo, 2 vCPU, 4 GB) | ~$12 |
| [Contabo](https://contabo.com/) | Cloud VPS S ($8/mo, 4 vCPU, 8 GB) | ~$8 |

### Network Requirements

- **Port 26656** (TCP) — P2P communication between nodes; must be open inbound
- **Port 26657** (TCP) — RPC for querying the node (optional, needed for monitoring)

### SSH Access

Before proceeding, ensure you can SSH into your server:

```bash
ssh root@<your-server-ip>
```

If you're using a non-root user with sudo privileges, prefix commands with `sudo` as needed.

---

## 2. Ubuntu Preparation

Log into your server and run the following.

### 2.1 Update System Packages

```bash
sudo apt update && sudo apt upgrade -y
```

### 2.2 Install Essential Tools

```bash
sudo apt install -y build-essential git curl wget jq ufw unzip lz4
```

### 2.3 Configure Firewall

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment "SSH"
sudo ufw allow 26656/tcp comment "La Tanda P2P"
sudo ufw allow 26657/tcp comment "La Tanda RPC"
sudo ufw enable
```

Verify the firewall is active:

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
22/tcp (v6)                ALLOW       Anywhere (v6)
26656/tcp (v6)             ALLOW       Anywhere (v6)
26657/tcp (v6)             ALLOW       Anywhere (v6)
```

### 2.4 Disable Swap (Recommended for Validators)

```bash
sudo swapoff -a
sudo sed -i '/ swap / s/^/#/' /etc/fstab
```

### 2.5 Optimize System Limits

```bash
cat <<EOF >> /etc/security/limits.d/99-latanda.conf
*                soft   nofile          65536
*                hard   nofile          65536
*                soft   memlock         unlimited
*                hard   memlock         unlimited
EOF
```

---

## 3. Go Installation

The `latandad` binary is built from source using Go. Install Go 1.24.1:

### 3.1 Download and Install

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

### 4.1 Build from Source

```bash
mkdir -p /tmp/latanda-build && cd /tmp/latanda-build
wget -q https://latanda.online/chain/latanda-chain-source.tar.gz
tar -xzf latanda-chain-source.tar.gz
cd latanda-chain
go mod tidy
go build -o /usr/local/bin/latandad ./cmd/latandad
```

### 4.2 Verify Binary

```bash
latandad version
latandad --help
```

If you see command output from both, the binary is installed correctly.

**Alternative: Quick Install Script**

If you prefer an automated approach, run the setup script:

```bash
wget -q https://latanda.online/chain/node-setup.sh -O node-setup.sh
chmod +x node-setup.sh
./node-setup.sh
```

The script handles Go installation, binary build, and initial configuration, but you'll still need the systemd and state sync configuration from the later sections of this guide.

---

## 5. Chain Initialization

Initialize your node with a unique moniker (identifier):

```bash
MONIKER="<your-validator-name>"
latandad init "$MONIKER" --chain-id latanda-testnet-1 --default-denom ultd
```

Replace `<your-validator-name>` with a name for your node (e.g., `my-latanda-validator`). This name appears on the explorer and in peer lists.

### What Gets Created

The command creates the node home directory at `~/.latanda/` with:

| File | Purpose | Sensitivity |
|------|---------|-------------|
| `config/config.toml` | Network and consensus settings | Low |
| `config/app.toml` | Application and state sync settings | Low |
| `config/node_key.json` | Node identity key (P2P ID) | High — backup this |
| `config/priv_validator_key.json` | Validator signing key | **Critical — secure this** |
| `config/genesis.json` | Chain genesis state (replaced in step 6) | Low |
| `data/` | Blockchain data directory | Low (can be rebuilt) |

> **⚠️ Key Security:** The `priv_validator_key.json` is the most important file on your node. If you lose it, you cannot sign blocks. If someone else obtains it, they can sign blocks as you or double-sign, which results in a jailing penalty. Back this file up securely offline and never share it.

---

## 6. Genesis Download

Every node must use the exact same genesis file to verify the chain's initial state.

### 6.1 Download Genesis

```bash
wget -q https://latanda.online/chain/genesis.json -O ~/.latanda/config/genesis.json
```

### 6.2 Verify Genesis Hash

```bash
sha256sum ~/.latanda/config/genesis.json
```

Expected hash:
```
98fc9871d6a3b7b12b3f7fcaa1ca3303ffcfad0f209d61355975a15069ac3907
```

If the hash doesn't match, your node will reject the genesis block. This can happen if you downloaded during a chain upgrade. In that case, check the La Tanda website or community channels for the correct genesis file.

---

## 7. Peer Configuration

Your node needs to discover and connect to the network. Configure persistent peers and seeds so it knows where to find the chain.

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

### 7.3 Optional: Enable Pruning to Save Disk Space

Edit `~/.latanda/config/app.toml` and set:

```toml
[pruning]
pruning = "custom"
pruning-keep-recent = "100"
pruning-interval = "10"
```

This keeps only the last 100 blocks of state, which significantly reduces disk usage.

### 7.4 Optional: Enable Prometheus Metrics

Edit `~/.latanda/config/config.toml` and set:

```toml
[tools]
prometheus = true
```

This exposes metrics at `http://localhost:26660/metrics` for integration with Prometheus and Grafana.

---

## 8. Systemd Service Creation

Unlike PM2 (used in the beginner guides), **Systemd** is the native Linux process manager. It's lighter, more reliable, and automatically restarts your node if it crashes.

### 8.1 Create the Service File

```bash
sudo tee /etc/systemd/system/latandad.service > /dev/null <<EOF
[Unit]
Description=La Tanda Chain Validator Node
After=network-online.target

[Service]
User=root
ExecStart=$(which latandad) start
Restart=on-failure
RestartSec=5
LimitNOFILE=65536
LimitMEMLOCK=infinity

[Install]
WantedBy=multi-user.target
EOF
```

> **Note:** Replace `User=root` with your username if running under a non-root user.

### 8.2 Explanation of Systemd Settings

| Setting | Value | Purpose |
|---------|-------|---------|
| `After=network-online.target` | — | Waits for network before starting |
| `Restart=on-failure` | — | Auto-restart on crash |
| `RestartSec=5` | 5 seconds | Wait time before restart |
| `LimitNOFILE` | 65536 | Prevent "too many open files" errors |
| `LimitMEMLOCK` | infinity | Prevents memory locking issues |

### 8.3 Reload Systemd and Enable the Service

```bash
sudo systemctl daemon-reload
sudo systemctl enable latandad.service
```

`enable` creates a symlink so the service starts automatically on boot.

---

## 9. Starting and Managing the Node

### 9.1 Start the Node

```bash
sudo systemctl start latandad.service
```

### 9.2 Check Status

```bash
sudo systemctl status latandad.service
```

This shows:
- **Active: active (running)** — Node is running
- **Active: failed** — Node crashed (check logs)
- **Active: inactive (dead)** — Node is stopped

### 9.3 View Logs

```bash
# Follow logs in real time
sudo journalctl -u latandad.service -f

# Last 100 lines
sudo journalctl -u latandad.service -n 100 --no-pager

# Logs since last hour
sudo journalctl -u latandad.service --since "1 hour ago" --no-pager
```

### 9.4 Stop the Node

```bash
sudo systemctl stop latandad.service
```

### 9.5 Restart the Node

```bash
sudo systemctl restart latandad.service
```

### 9.6 Check Sync Status

```bash
latandad status | jq '.sync_info'
```

Key fields:
- `catching_up: false` — Node is fully synced
- `catching_up: true` — Node is still catching up to the latest block
- `latest_block_height` — Current block your node is at
- `latest_block_time` — Timestamp of the latest block

### 9.7 Systemd Management Cheatsheet

| Command | Action |
|---------|--------|
| `sudo systemctl start latandad` | Start the node |
| `sudo systemctl stop latandad` | Stop the node |
| `sudo systemctl restart latandad` | Restart the node |
| `sudo systemctl status latandad` | Check node status |
| `sudo systemctl enable latandad` | Enable auto-start on boot |
| `sudo systemctl disable latandad` | Disable auto-start on boot |
| `journalctl -u latandad -f` | View live logs |
| `journalctl -u latandad -n 100` | View last 100 log lines |

---

## 10. State Sync Configuration

State sync dramatically reduces sync time by downloading a trusted snapshot at a recent block height, rather than replaying every block from genesis. For a testnet that has been running for months, this reduces sync from hours to **minutes**.

### 10.1 How State Sync Works

1. Your node requests a trusted height and hash from a trusted RPC endpoint
2. It downloads a snapshot of application state at that height
3. It verifies the snapshot against the trusted hash
4. It fast-forwards to the latest block

### 10.2 Find Trusted Height and Hash

Query a trusted RPC endpoint for the current block info:

```bash
# Using the genesis node RPC
TRUSTED_RPC="http://168.231.67.201:26657"
LATEST_HEIGHT=$(curl -s $TRUSTED_RPC/block | jq -r '.result.block.header.height')
TRUST_HEIGHT=$((LATEST_HEIGHT - 2000))
TRUST_HASH=$(curl -s "$TRUSTED_RPC/block?height=$TRUST_HEIGHT" | jq -r '.result.block_id.hash')

echo "Latest block: $LATEST_HEIGHT"
echo "Trust height: $TRUST_HEIGHT"
echo "Trust hash:   $TRUST_HASH"
```

### 10.3 Alternative: Using ANODE.TEAM State Sync Nodes

ANODE.TEAM provides state sync endpoints for La Tanda. Visit https://anode.team for latest endpoints, or use:

```bash
# ANODE.TEAM state sync RPC
TRUSTED_RPC="https://latanda-rpc.owlstake.com"
# ... or use your own trusted node
```

### 10.4 Configure State Sync in config.toml

Edit `~/.latanda/config/config.toml` and set the `[statesync]` section:

```toml
[statesync]
enable = true
rpc_servers = "http://168.231.67.201:26657,http://168.231.67.201:26657"
trust_height = <TRUST_HEIGHT>
trust_hash = "<TRUST_HASH>"
trust_period = "168h"  # 7 days
```

Replace `<TRUST_HEIGHT>` and `<TRUST_HASH>` with the values from step 10.2.

**Important:** If you're using multiple RPC servers (for redundancy), separate them with commas. For testnet, one trusted server is sufficient.

### 10.5 Start with State Sync

```bash
# If you already ran the node, reset the data first
latandad comet unsafe-reset-all

# Start the node
sudo systemctl restart latandad.service
```

### 10.6 Monitor State Sync Progress

```bash
journalctl -u latandad.service -f | grep -E "state sync|height|block"
```

During state sync, you'll see log messages like:
```
Applied snapshot chunk X of Y
Snapshot restored, height: <height>
Committed state, height: <height>
```

### 10.7 Verify Sync After State Sync

Once the snapshot is restored, the node will fast-sync remaining blocks and then begin normal consensus:

```bash
latandad status | jq '.sync_info'
```

When `catching_up` shows `false`, your node is fully synced and participating in consensus.

### 10.8 State Sync Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| `snapshot not found` | No snapshot at trust height | Lower trust height by 1000 and retry |
| `trust hash mismatch` | Incorrect hash | Re-query RPC and verify hash |
| `version mismatch` | Different chain version | Update binary and genesis file |
| SSN timeout | Network connectivity | Check firewall (port 26657) |

---

## 11. Wallet Creation

A wallet holds the LTD tokens you'll use for staking, transaction fees, and validator operations.

### 11.1 Create a Wallet

```bash
latandad keys add <wallet-name> --keyring-backend test
```

Replace `<wallet-name>` with a name for your wallet (e.g., `validator-wallet`, `validator-key`).

You'll be prompted to:
1. Enter a **keyring passphrase** (save this — you need it for signing transactions)
2. **Save the mnemonic** (seed phrase) that is displayed

> **⚠️ CRITICAL: Securely save the mnemonic phrase.** This 24-word phrase is the ONLY way to recover your wallet if you lose access. Write it on paper and store it in a safe location. Never share it. Never type it into any website.

### 11.2 List Wallets

```bash
latandad keys list --keyring-backend test
```

### 11.3 Show Wallet Address

```bash
latandad keys show <wallet-name> -a --keyring-backend test
```

This returns your **ltd address** (e.g., `ltd1...`). This is the address to receive tokens.

### 11.4 Show Validator Operator Address

```bash
latandad keys show <wallet-name> --bech val -a --keyring-backend test
```

This returns your **ltdvaloper address** (e.g., `ltdvaloper1...`). This is the address used for validator operations.

### 11.5 Export Private Key (Backup)

```bash
latandad keys export <wallet-name> --keyring-backend test
```

### 11.6 Recover Wallet from Mnemonic

If you need to restore your wallet on a new machine:

```bash
latandad keys add <wallet-name> --recover --keyring-backend test
```

You'll be prompted to enter your 24-word mnemonic phrase.

---

## 12. Faucet / Verification Process

Before you can create a validator, you need testnet LTD tokens for staking.

### 12.1 Get Testnet Tokens

La Tanda testnet tokens are available from the La Tanda team:

1. **Contact the La Tanda team** via contact@latanda.online with:
   - Your ltd address (from step 11.3)
   - Your validator moniker
   - A brief note about your validator plans

2. **Check balance** after receiving tokens:

```bash
latandad query bank balances <your-ltd-address>
```

### 12.2 Minimum Stake Requirement

The minimum self-delegation for testnet validators is **50,000 LTD** (`50000000000ultd`).

### 12.3 Verify Transaction Fees

Ensure you have some tokens set aside for transaction fees (a small amount like 100 LTD should suffice for many transactions):

```bash
latandad query bank balances <your-ltd-address> --denom ultd
```

### 12.4 Fund Your Wallet

If you need tokens to pay for gas fees, transfer from another wallet:

```bash
latandad tx bank send <source-wallet> <your-ltd-address> 1000000ultd \
  --chain-id latanda-testnet-1 \
  --keyring-backend test \
  --gas auto \
  --gas-adjustment 1.5 \
  --fees 500ultd
```

---

## 13. Validator Creation

Once your node is fully synced and you have testnet LTD tokens, you're ready to create your validator.

### 13.1 Prerequisites

- ✅ Node is fully synced (`catching_up: false`)
- ✅ Wallet has sufficient LTD tokens (50,000+ for staking + fees)
- ✅ `priv_validator_key.json` exists at `~/.latanda/config/`
- ✅ Node is running (`sudo systemctl status latandad`)

### 13.2 Create the Validator

```bash
latandad tx staking create-validator \
  --amount=50000000000ultd \
  --pubkey=$(latandad comet show-validator) \
  --moniker="<your-validator-name>" \
  --chain-id=latanda-testnet-1 \
  --commission-rate="0.10" \
  --commission-max-rate="0.20" \
  --commission-max-change-rate="0.01" \
  --min-self-delegation="1" \
  --keyring-backend=test \
  --from=<wallet-name> \
  --gas=auto \
  --gas-adjustment=1.5 \
  --fees=5000ultd \
  --details="<optional description>" \
  --website="<optional URL>" \
  --identity="<optional keybase PGP ID for avatar>"
```

Replace:
- `<your-validator-name>` — Your validator's display name on the explorer
- `<wallet-name>` — The wallet name from step 11

#### Commission Rate Explanation

| Parameter | Example | Meaning |
|-----------|---------|---------|
| `commission-rate` | 0.10 | 10% commission on delegator rewards |
| `commission-max-rate` | 0.20 | Maximum commission you can ever set (locked) |
| `commission-max-change-rate` | 0.01 | Max 1% change per 24h period |

Set commission-rate wisely — you cannot exceed commission-max-rate and you cannot increase it faster than commission-max-change-rate.

### 13.3 Confirm Validator Creation

```bash
latandad query staking validators --output json | jq '.validators[] | select(.description.moniker | contains("<your-validator-name>")) | {moniker: .description.moniker, tokens: .tokens, status: .status, commission: .commission.commission_rates.rate}'
```

### 13.4 Check Your Validator Status

```bash
latandad query staking validator <ltdvaloper-address>
```

Status codes:
- `BOND_STATUS_BONDED` — Active validator (in the active set)
- `BOND_STATUS_UNBONDED` — Not in active set (below minimum stake)
- `BOND_STATUS_UNBONDING` — Unbonding in progress (21-day period)

### 13.5 Check Active Set Position

```bash
latandad query staking validators --output json | jq '.validators[] | select(.status=="BOND_STATUS_BONDED") | {moniker: .description.moniker, tokens: .tokens}' | jq -s '. | sort_by(.tokens | tonumber) | reverse'
```

---

## 14. Validator Management Commands

### 14.1 Edit Validator Metadata

Update your validator's displayed information:

```bash
latandad tx staking edit-validator \
  --moniker="<new-name>" \
  --website="<new-url>" \
  --details="<new-description>" \
  --chain-id=latanda-testnet-1 \
  --keyring-backend=test \
  --from=<wallet-name> \
  --gas=auto \
  --gas-adjustment=1.5 \
  --fees=5000ultd
```

### 14.2 Delegate More Tokens to Yourself

```bash
latandad tx staking delegate <ltdvaloper-address> 10000000000ultd \
  --chain-id=latanda-testnet-1 \
  --keyring-backend=test \
  --from=<wallet-name> \
  --gas=auto \
  --gas-adjustment=1.5 \
  --fees=5000ultd
```

### 14.3 Unbond (Remove Stake)

```bash
latandad tx staking unbond <ltdvaloper-address> 10000000000ultd \
  --chain-id=latanda-testnet-1 \
  --keyring-backend=test \
  --from=<wallet-name> \
  --gas=auto \
  --gas-adjustment=1.5 \
  --fees=5000ultd
```

Tokens become liquid after the 21-day unbonding period.

### 14.4 Withdraw Validator Rewards

```bash
# Withdraw all rewards and commissions
latandad tx distribution withdraw-rewards <ltdvaloper-address> \
  --commission \
  --chain-id=latanda-testnet-1 \
  --keyring-backend=test \
  --from=<wallet-name> \
  --gas=auto \
  --gas-adjustment=1.5 \
  --fees=5000ultd
```

### 14.5 Unjail Your Validator

If your validator is jailed (due to downtime or double-sign), unjail it:

```bash
latandad tx slashing unjail \
  --chain-id=latanda-testnet-1 \
  --keyring-backend=test \
  --from=<wallet-name> \
  --gas=auto \
  --gas-adjustment=1.5 \
  --fees=5000ultd
```

### 14.6 Redelegate to Another Validator

```bash
latandad tx staking redelegate <current-ltdvaloper> <target-ltdvaloper> 10000000000ultd \
  --chain-id=latanda-testnet-1 \
  --keyring-backend=test \
  --from=<wallet-name> \
  --gas=auto \
  --gas-adjustment=1.5 \
  --fees=5000ultd
```

---

## 15. Monitoring and Health Checks

### 15.1 Basic Health Check

```bash
# Is the node process running?
sudo systemctl is-active latandad.service

# Is the RPC responding?
curl -s localhost:26657/status | jq '.result'

# Peer count
curl -s localhost:26657/net_info | jq '.result.n_peers'

# Is the node synced?
curl -s localhost:26657/status | jq '.result.sync_info.catching_up'
```

### 15.2 Create a Health Check Script

Save this as `/usr/local/bin/latanda-health.sh`:

```bash
#!/bin/bash
# La Tanda Validator Health Check

NODE_NAME="<your-validator-name>"
RPC="http://localhost:26657"

# Check if process is running
if ! systemctl is-active --quiet latandad.service; then
    echo "CRITICAL: Node process is not running"
    exit 2
fi

# Check RPC response
STATUS=$(curl -sf $RPC/status 2>/dev/null)
if [ $? -ne 0 ]; then
    echo "CRITICAL: RPC not responding"
    exit 2
fi

# Check sync status
CATCHING_UP=$(echo "$STATUS" | jq -r '.result.sync_info.catching_up')
if [ "$CATCHING_UP" = "true" ]; then
    echo "WARNING: Node is still syncing"
    exit 1
fi

# Check peer count
PEERS=$(echo "$STATUS" | jq -r '.result.node_info.network')
BLOCK_HEIGHT=$(echo "$STATUS" | jq -r '.result.sync_info.latest_block_height')

echo "OK: Node $NODE_NAME — Chain: $PEERS — Height: $BLOCK_HEIGHT — Peers: $(curl -sf $RPC/net_info | jq '.result.n_peers')"
exit 0
```

Make it executable:

```bash
chmod +x /usr/local/bin/latanda-health.sh
```

Run it manually:

```bash
/usr/local/bin/latanda-health.sh
```

### 15.3 Set Up Cron Monitoring

Add a cron job to check every 5 minutes:

```bash
crontab -e
```

Add this line:

```
*/5 * * * * /usr/local/bin/latanda-health.sh >> /var/log/latanda-health.log 2>&1
```

### 15.4 Monitor Disk Space

```bash
# Check disk usage for the node data directory
du -sh ~/.latanda/data/

# Overall disk usage
df -h /
```

The data directory grows over time. With pruning enabled, expect roughly 10-20 GB per month. Without pruning, it grows much faster.

### 15.5 Monitor Block Production

Log recent block times to detect issues:

```bash
curl -s localhost:26657/status | jq '.result.sync_info'
```

A healthy validator should produce `catching_up: false` with `latest_block_time` within the last 30 seconds.

### 15.6 Monitor Your Validator Signing Info

```bash
# Check if your validator has missed any blocks
latandad query slashing signing-info $(latandad comet show-validator)
```

If you've missed more than the threshold of blocks (typically ~5% in a rolling window), your validator will be jailed.

---

## 16. Common Troubleshooting

### 16.1 Node Won't Start

**Symptoms:** `systemctl status latandad` shows `failed`

**Check logs:**
```bash
journalctl -u latandad.service -n 50 --no-pager
```

**Common causes and fixes:**

| Error | Cause | Fix |
|-------|-------|-----|
| `bind: address already in use` | Another process on port 26656/26657 | `sudo lsof -i :26656`, kill process, restart |
| `Error: error signing` | Corrupted key file | Restore from backup |
| `panic: runtime error` | Corrupted data | `latandad comet unsafe-reset-all`, restart |
| `Error: genesis file not found` | Missing genesis | Re-download genesis file |
| `Error: error creating db` | Disk full | Check `df -h`, free space |

### 16.2 Can't Find Peers

**Symptom:** `net_info` shows 0 peers

**Checklist:**

1. **Verify firewall:**
```bash
sudo ufw status
# Ensure 26656 is ALLOW
```

2. **Check port is bound:**
```bash
sudo ss -tlnp | grep 26656
```

3. **Test external connectivity:**
```bash
curl -s http://168.231.67.201:26657/status | jq '.result.node_info.id'
```

4. **Re-add peers:**
```bash
PEERS="483a8110c3cd93c8dd3801d935151e98656f5b67@168.231.67.201:26656"
sed -i "s|persistent_peers = \".*\"|persistent_peers = \"$PEERS\"|" ~/.latanda/config/config.toml
sudo systemctl restart latandad.service
```

5. **Wait:** Peer discovery can take 1-2 minutes after starting.

### 16.3 Node is Not Syncing / Stuck

**Symptom:** Block height hasn't changed in several minutes

**Diagnose:**
```bash
# Check block height every 10 seconds
watch -n 10 'latandad status | jq ".sync_info.latest_block_height"'
```

**Fixes (in order of severity):**

1. **Restart the node:**
```bash
sudo systemctl restart latandad.service
```

2. **Reset P2P connections:**
```bash
latandad comet unsafe-reset-all
sudo systemctl restart latandad.service
```

3. **Delete data and resync (with state sync enabled):**
```bash
sudo systemctl stop latandad.service
rm -rf ~/.latanda/data/
latandad comet unsafe-reset-all
sudo systemctl restart latandad.service
```

### 16.4 Validator Jailed

**Symptom:** Validator not signing blocks, shows "jailed" in query

**Causes:**
- Node was down for too long
- Double-signing (rare, serious)

**Fix:**
1. Ensure node is synced and running
2. Unjail:
```bash
latandad tx slashing unjail --from=<wallet-name> --chain-id=latanda-testnet-1 --keyring-backend=test --gas=auto --gas-adjustment=1.5 --fees=5000ultd
```

3. Monitor for 10-15 minutes — you should rejoin the active set in the next epoch.

### 16.5 "Too Many Open Files" Error

**Fix:** Increase system limits (already done in section 2.5, but verify):

```bash
# Check current limits
cat /proc/$(pidof latandad)/limits | grep "open files"

# Apply immediately
prlimit --pid $(pidof latandad) --nofile=65536:65536
```

### 16.6 Disk Space Running Low

**Quick fix:** Reduce pruning interval to keep less state:

```bash
sed -i 's/pruning-keep-recent = "100"/pruning-keep-recent = "10"/' ~/.latanda/config/app.toml
sudo systemctl restart latandad.service
```

**Long-term fix:**
- Upgrade to a larger disk
- Move data to a dedicated data volume

---

## 17. Security Recommendations

A compromised validator can cause financial loss (signed unbonding, double-sign jailing). Follow these practices to keep your node secure.

### 17.1 SSH Hardening

```bash
# Disable root login
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config

# Disable password authentication
sudo sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config

# Use SSH keys only (if not already set)
ssh-keygen -t ed25519 -a 100
cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys

# Restart SSH
sudo systemctl restart sshd
```

### 17.2 Key Management

| Key | Location | Action |
|-----|----------|--------|
| `priv_validator_key.json` | `~/.latanda/config/` | Encrypt and back up offline |
| `node_key.json` | `~/.latanda/config/` | Back up (needed for P2P identity) |
| Wallet mnemonic | — | Write on paper, store in safe |
| Keyring passphrase | — | Store in password manager |

**Never:**
- Store keys in cloud storage (Google Drive, Dropbox, iCloud)
- Email keys to yourself
- Paste keys in Discord, Telegram, or chat
- Share validator keys across multiple nodes

### 17.3 System Protection

```bash
# Install fail2ban
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Automatic security updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
# Select "Yes" when prompted

# Monitor failed login attempts
sudo lastb | head -20
```

### 17.4 Network Security

```bash
# Verify firewall rules are strict
sudo ufw status numbered

# Check for unusual listeners
sudo ss -tlnp

# Only ports 22 (SSH), 26656 (P2P), 26657 (RPC) should be open
```

### 17.5 Regular Maintenance

- **Weekly:** `sudo apt update && sudo apt upgrade -y` (then reboot if kernel updated)
- **Daily:** Check disk space with `df -h`
- **Daily:** Verify node is synced with `latandad status | jq '.sync_info.catching_up'`
- **Monthly:** Review journalctl logs for errors
- **After upgrades:** Test the node stops and restarts cleanly

### 17.6 Recommended Software

| Tool | Purpose | Install |
|------|---------|---------|
| fail2ban | Brute force protection | `apt install fail2ban` |
| rkhunter | Rootkit detection | `apt install rkhunter` |
| aide | File integrity monitoring | `apt install aide` |
| logwatch | Log monitoring | `apt install logwatch` |

---

## 18. Useful Maintenance Commands

### Quick-Reference Cheatsheet

#### Node Operations
```bash
latandad start                    # Start the node (foreground)
sudo systemctl start latandad     # Start via systemd
sudo systemctl stop latandad      # Stop via systemd
sudo systemctl restart latandad   # Restart via systemd
sudo systemctl status latandad    # Check if running
```

#### Sync & Status
```bash
latandad status | jq '.sync_info' # Full sync status
latandad status | jq '.sync_info.catching_up'  # true/false
latandad status | jq '.sync_info.latest_block_height'  # Current block
latandad comet show-node-id       # Your P2P node ID
```

#### Peer Management
```bash
curl -s localhost:26657/net_info | jq '.result.n_peers'  # Peer count
curl -s localhost:26657/net_info | jq '.result.peers[].node_info.moniker'  # Peer names
```

#### Wallet & Balance
```bash
latandad keys list --keyring-backend test                 # List wallets
latandad keys show <name> -a --keyring-backend test       # Show address
latandad query bank balances <ltd-address>                # Check balance
latandad query bank balances <ltd-address> --denom ultd   # Balance in ultd
```

#### Validator
```bash
latandad comet show-validator                             # Show validator pubkey
latandad query staking validators                         # List all validators
latandad query staking validator <ltdvaloper-address>     # Your validator details
latandad query slashing signing-info <validator-pubkey>   # Signing info (missed blocks)
latandad tx slashing unjail --from=<wallet> ...           # Unjail validator
latandad tx staking edit-validator --moniker="..." ...    # Edit validator info
```

#### Transaction
```bash
latandad tx bank send <from> <to> <amount>ultd ...       # Send tokens
latandad tx staking delegate <valoper> <amount>ultd ...   # Delegate tokens
latandad tx staking unbond <valoper> <amount>ultd ...     # Unbond tokens
latandad tx distribution withdraw-rewards <valoper> --commission ...  # Claim rewards
```

#### Logs & Debug
```bash
journalctl -u latandad -f                                 # Follow live logs
journalctl -u latandad -n 100                             # Last 100 lines
journalctl -u latandad --since "1 hour ago"               # Last hour
journalctl -u latandad -p err -o short-precise            # Errors only with timestamps
```

#### Data Management
```bash
du -sh ~/.latanda/data/                                   # Data directory size
latandad comet unsafe-reset-all                            # Reset data (keeps config/keys)
latandad export                                           # Export on-chain state
```

#### System
```bash
df -h /                                                   # Disk usage
sudo lsof -i :26656                                       # Who's using port 26656
htop                                                      # Live resource monitor
uptime                                                    # Server uptime
```

---

## Appendix A: Quick Start (Complete Flow)

If you want to set up everything end-to-end with minimal steps:

```bash
# 1. System prep
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential git curl wget jq ufw

# 2. Firewall
sudo ufw allow 22/tcp && sudo ufw allow 26656/tcp && sudo ufw allow 26657/tcp
sudo ufw --force enable

# 3. Go
wget -q https://go.dev/dl/go1.24.1.linux-amd64.tar.gz -O /tmp/go.tar.gz
sudo rm -rf /usr/local/go && sudo tar -C /usr/local -xzf /tmp/go.tar.gz && rm /tmp/go.tar.gz
export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin
echo 'export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin' >> ~/.bashrc

# 4. Build binary
mkdir -p /tmp/latanda-build && cd /tmp/latanda-build
wget -q https://latanda.online/chain/latanda-chain-source.tar.gz
tar -xzf latanda-chain-source.tar.gz && cd latanda-chain
go mod tidy && go build -o /usr/local/bin/latandad ./cmd/latandad

# 5. Init
latandad init "my-validator" --chain-id latanda-testnet-1 --default-denom ultd

# 6. Genesis
wget -q https://latanda.online/chain/genesis.json -O ~/.latanda/config/genesis.json
sha256sum ~/.latanda/config/genesis.json

# 7. Peers
PEERS="483a8110c3cd93c8dd3801d935151e98656f5b67@168.231.67.201:26656"
sed -i "s|persistent_peers = \"\"|persistent_peers = \"$PEERS\"|" ~/.latanda/config/config.toml
sed -i "s|seeds = \"\"|seeds = \"$PEERS\"|" ~/.latanda/config/config.toml
sed -i 's|minimum-gas-prices = ""|minimum-gas-prices = "0.001ultd"|' ~/.latanda/config/app.toml

# 8. Systemd service
sudo tee /etc/systemd/system/latandad.service > /dev/null <<SERVICEEOF
[Unit]
Description=La Tanda Chain Validator Node
After=network-online.target

[Service]
User=root
ExecStart=$(which latandad) start
Restart=on-failure
RestartSec=5
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
SERVICEEOF

sudo systemctl daemon-reload
sudo systemctl enable latandad.service

# 9. Start node
sudo systemctl start latandad.service

# 10. Check sync status
latandad status | jq '.sync_info'
```

Wait for `catching_up: false`, then continue with wallet creation and validator setup (sections 11-13).

---

## Appendix B: State Sync Quick Setup

To sync in minutes instead of hours:

```bash
# Get trusted height and hash
LATEST_HEIGHT=$(curl -s http://168.231.67.201:26657/block | jq -r '.result.block.header.height')
TRUST_HEIGHT=$((LATEST_HEIGHT - 2000))
TRUST_HASH=$(curl -s "http://168.231.67.201:26657/block?height=$TRUST_HEIGHT" | jq -r '.result.block_id.hash')

# Enable state sync
sed -i 's|enable = false|enable = true|' ~/.latanda/config/config.toml
sed -i "s|trust_height = 0|trust_height = $TRUST_HEIGHT|" ~/.latanda/config/config.toml
sed -i "s|trust_hash = \"\"|trust_hash = \"$TRUST_HASH\"|" ~/.latanda/config/config.toml

# Reset and restart
latandad comet unsafe-reset-all
sudo systemctl restart latandad.service

# Monitor
journalctl -u latandad.service -f | grep -E "state sync|applying|commit"
```

---

## Appendix C: Network Information

| Resource | URL |
|----------|-----|
| Website | https://latanda.online |
| Explorer | https://latanda.online/chain/ |
| Genesis File | https://latanda.online/chain/genesis.json |
| Setup Script | https://latanda.online/chain/node-setup.sh |
| Chain Source | https://latanda.online/chain/latanda-chain-source.tar.gz |
| RPC Endpoint | `http://168.231.67.201:26657` |
| REST API | https://latanda.online/chain/api/ |
| Chain Explorer | https://latanda.online/chain/ |
| P2P Seed | `483a8110c3cd93c8dd3801d935151e98656f5b67@168.231.67.201:26656` |
| Genesis Hash | `98fc9871d6a3b7b12b3f7fcaa1ca3303ffcfad0f209d61355975a15069ac3907` |

### Infrastructure Partners

| Partner | Service | Contact |
|---------|---------|---------|
| OwlStake | RPC & API endpoints | https://owlstake.com |
| ANODE.TEAM | Snapshots & state sync | https://anode.team |

---

## Appendix D: Command Quick Reference Card

```
┌─────────────────────────────────────────────┐
│         latandad Quick Reference             │
├─────────────────────────────────────────────┤
│ SYSTEMCTL                                   │
│  start       sudo systemctl start latandad  │
│  stop        sudo systemctl stop latandad   │
│  restart     sudo systemctl restart latandad│
│  status      sudo systemctl status latandad │
│  logs        journalctl -u latandad -f      │
├─────────────────────────────────────────────┤
│ STATUS                                      │
│  sync?       latandad status|jq .sync_info  │
│  height      latandad status|jq .sync_info  │
│              .latest_block_height           │
│  peers       curl -s localhost:26657        │
│              /net_info|jq .result.n_peers   │
│  node id     latandad comet show-node-id    │
├─────────────────────────────────────────────┤
│ VALIDATOR                                   │
│  check       latandad query staking         │
│              validator <valoper>            │
│  pubkey      latandad comet show-validator  │
│  unjail      latandad tx slashing unjail    │
│  edit        latandad tx staking            │
│              edit-validator --moniker=...   │
├─────────────────────────────────────────────┤
│ WALLET                                      │
│  list        latandad keys list             │
│  address     latandad keys show <name> -a   │
│  balance     latandad query bank balances   │
│  send        latandad tx bank send ...      │
│  delegate    latandad tx staking delegate   │
│  rewards     latandad tx distribution       │
│              withdraw-rewards ... --commission│
└─────────────────────────────────────────────┘
```

---

## References

- [La Tanda Node Operator Guide](la-tanda-chain-node-guide.md) — Manual setup, security checklist, basic commands
- [La Tanda Beginner Guide](la-tanda-node-beginner-guide.md) — Step-by-step for first-time node operators
- [La Tanda Network Documentation](https://latanda.online/docs) — Swagger API documentation
- [ANODE.TEAM Snapshots & State Sync](https://anode.team) — Snapshot service for fast sync

---

*La Tanda Chain — latanda-testnet-1 | Ray-Banks LLC*

*Guide created for La Tanda Testnet Validator Program — 2026*
