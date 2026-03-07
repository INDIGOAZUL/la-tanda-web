# IBC Relayer Setup Guide for La Tanda Chain

**Chain ID:** `latanda-testnet-1` | **Token:** `ultd` | **Gas Price:** `0.025ultd`

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Choose Your Relayer](#choose-your-relayer)
3. [Install Hermes Relayer](#install-hermes-relayer)
4. [Install Go Relayer v2](#install-go-relayer-v2)
5. [Configure La Tanda Chain](#configure-la-tanda-chain)
6. [Configure Counterparty Chain](#configure-counterparty-chain)
7. [Create IBC Channel](#create-ibc-channel)
8. [Test IBC Transfer](#test-ibc-transfer)
9. [Run as Systemd Service](#run-as-systemd-service)
10. [Troubleshooting](#troubleshooting)
11. [Quick Start: 30-Minute Path](#quick-start-30-minute-path)

---

## Prerequisites

### System Requirements

- **OS:** Linux (Ubuntu 22.04+ recommended)
- **RAM:** 2GB minimum, 4GB recommended
- **Disk:** 20GB minimum
- **Network:** Stable internet connection

### Software Requirements

```bash
# Install build dependencies
sudo apt-get update
sudo apt-get install -y \
    build-essential \
    pkg-config \
    libssl-dev \
    git \
    curl \
    wget \
    jq
```

### Rust Installation

Hermes requires Rust 1.85.0+. Install it using `rustup`:

```bash
# Install rustup
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Verify installation
rustc --version  # Should be 1.85.0 or higher
```

---

## Choose Your Relayer

We recommend **Hermes** for La Tanda Chain due to its performance and community support. However, both options are fully supported.

| Feature | Hermes (Rust) | Go Relayer v2 (Go) |
|---------|---------------|-------------------|
| Language | Rust | Go |
| Performance | ⚡ Higher | Good |
| Memory Usage | Lower | Higher |
| Setup Complexity | Medium | Low |
| Community Support | 🟢 Active | 🟢 Active |
| Documentation | Excellent | Excellent |
| Recommended For | Production | Simpler setups |

**Why Hermes for La Tanda Chain?**
- ✅ Built with Rust, lower resource footprint
- ✅ Better multi-chain support (future-proof for La Tanda expansion)
- ✅ Active development by Informal Systems
- ✅ Comprehensive monitoring and metrics

**When to Choose Go Relayer v2?**
- If you prefer Go over Rust
- If you need maximum compatibility with Cosmos SDK tools
- If you're already running other Go-based relayers

**Note:** This guide provides complete instructions for both options. You can switch between them at any time.

---

## Install Hermes Relayer

### Method 1: Install from Crates.io (Recommended)

```bash
# Install ibc-relayer-cli (Hermes)
cargo install ibc-relayer-cli --locked

# Verify installation
hermes --version
```

**Note:** The compilation may take 10-20 minutes.

### Method 2: Build from Source

```bash
# Clone repository
git clone https://github.com/informalsystems/hermes.git
cd hermes

# Checkout latest stable release
git checkout $(git describe --tags --abbrev=0)

# Build
cargo install --path crates/relayer-cli --locked

# Verify installation
hermes --version
```

---

## Install Go Relayer v2

### Prerequisites

Go Relayer v2 requires Go 1.21+:

```bash
# Install Go 1.21.6 (if not already installed)
wget https://go.dev/dl/go1.21.6.linux-amd64.tar.gz
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf go1.21.6.linux-amd64.tar.gz

# Add to PATH
export PATH=$PATH:/usr/local/go/bin
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc

# Verify installation
go version
# Expected output: go version go1.21.6 linux/amd64
```

### Method 1: Install from Pre-built Binary

```bash
# Download latest release
cd /tmp
wget https://github.com/cosmos/relayer/releases/download/v2.4.0/rly-v2.4.0-linux-amd64.tar.gz

# Extract
tar -xzf rly-v2.4.0-linux-amd64.tar.gz

# Move to PATH
sudo mv rly /usr/local/bin/

# Verify installation
rly version
# Expected output: rly version v2.4.0
```

### Method 2: Build from Source

```bash
# Clone repository
git clone https://github.com/cosmos/relayer.git
cd relayer

# Checkout latest stable release
git checkout v2.4.0

# Build
make install

# Verify installation
rly version
# Expected output: rly version v2.4.0
```

### Initialize Go Relayer

```bash
# Initialize config directory
rly config init

# Verify config created
ls ~/.relayer/config/
# Expected output: config.yaml
```

---

## Configure La Tanda Chain

### 1. Get Chain Configuration

```bash
# Get chain ID
curl -s https://latanda.online/chain/api/cosmos/base/tendermint/v1beta1/node_info | jq '.node_info.network'

# Get latest block height
curl -s https://latanda.online/chain/api/cosmos/base/tendermint/v1beta1/blocks/latest | jq '.block.header.height'
```

### 2. Create Hermes Configuration File

Create `~/.hermes/config.toml`:

```toml
[global]
log_level = 'info'

[telemetry]
enabled = true
host = '127.0.0.1'
port = 3001

[[chains]]
id = 'latanda-testnet-1'
rpc_addr = 'https://latanda.online/chain/rpc/'
# grpc_addr = 'https://latanda.online:9090'  # Port not verified, comment out if unavailable
websocket_addr = 'wss://latanda.online/chain/websocket/'
rpc_timeout = '10s'
account_prefix = 'ltd'
key_name = 'latanda-relayer'
store_prefix = 'ibc'
max_gas = 400000
gas_price = '0.025ultd'
gas_multiplier = 1.1
clock_drift = '15s'
trusting_period = '14days'
trust_threshold = { numerator = '1', denominator = '3' }

[chains.packet_filter]
policy = 'allow'
list = [
  ['transfer', 'channel-0'],
]

[chains.event_source]
mode = 'push'
url = 'ws://localhost:26657/websocket'
batch_delay = '500ms'

[chains.trust_threshold]
numerator = '1'
denominator = '3'

# Add more chains below...
```

### 3. Restore or Create Wallet Keys

```bash
# Option A: Import existing key (if you have one)
hermes keys restore latanda-testnet-1 --mnemonic "your twelve word mnemonic phrase here"

# Option B: Generate new key
hermes keys add latanda-testnet-1 --chain-id latanda-testnet-1

# Show key address
hermes keys list --chain-id latanda-testnet-1
```

### 4. Fund the Relayer Account

**Important:** The relayer needs funds to pay gas fees. Send at least 10,000 `ultd` to the relayer address.

```bash
# Check balance
latandad q bank balances <relayer-address> \
    --node https://latanda.online/chain/rpc/ \
    --chain-id latanda-testnet-1
```

---

## Configure Counterparty Chain

This example uses **Cosmos Hub (Gaia)** as the counterparty chain. You can use any IBC-enabled chain.

### 1. Add Cosmos Hub to Configuration

Update `~/.hermes/config.toml`:

```toml
[[chains]]
id = 'cosmoshub-4'
rpc_addr = 'https://cosmos-rpc.publicnode.com:443'
grpc_addr = 'https://cosmos-grpc.publicnode.com:443'
websocket_addr = 'wss://cosmos-rpc.publicnode.com/websocket/'
rpc_timeout = '10s'
account_prefix = 'cosmos'
key_name = 'cosmos-relayer'
store_prefix = 'ibc'
max_gas = 200000
gas_price = '0.0025uatom'
gas_multiplier = 1.1
clock_drift = '20s'
trusting_period = '14days'
trust_threshold = { numerator = '1', denominator = '3' }

[chains.packet_filter]
policy = 'allow'
list = [
  ['transfer', 'channel-0'],
  ['transfer', 'channel-1'],
  ['transfer', 'channel-2'],
]
```

### 2. Create Cosmos Hub Key

```bash
# Import or generate key
hermes keys add cosmoshub-4 --chain-id cosmoshub-4

# List keys
hermes keys list --chain-id cosmoshub-4
```

### 3. Fund Cosmos Hub Account

Send at least 1,000 `uatom` to the relayer address:

```bash
# Check balance
gaiad query bank balances <relayer-address> \
    --node https://cosmos-rpc.publicnode.com:443 \
    --chain-id cosmoshub-4
```

---

## Create IBC Channel

### 1. Verify Chain Configuration

```bash
# Verify Hermes can connect to both chains
hermes chains list

# Check chain health
hermes health-check --chain latanda-testnet-1
hermes health-check --chain cosmoshub-4
```

### 2. Create Client

```bash
# Create client on La Tanda for Cosmos Hub
hermes create client \
    --dst-chain latanda-testnet-1 \
    --src-chain cosmoshub-4

# Create client on Cosmos Hub for La Tanda
hermes create client \
    --dst-chain cosmoshub-4 \
    --src-chain latanda-testnet-1

# List clients
hermes query clients --chain latanda-testnet-1
hermes query clients --chain cosmoshub-4
```

### 3. Create Connection

```bash
# Create connection between the two clients
hermes create connection \
    --a-chain latanda-testnet-1 \
    --b-chain cosmoshub-4

# List connections
hermes query connections --chain latanda-testnet-1
hermes query connections --chain cosmoshub-4
```

### 4. Create Channel

```bash
# Create channel for token transfers
hermes create channel \
    --a-chain latanda-testnet-1 \
    --b-chain cosmoshub-4 \
    --a-connection <connection-id-on-latanda> \
    --b-connection <connection-id-on-cosmos> \
    --a-port transfer \
    --b-port transfer \
    --order unordered

# List channels
hermes query channels --chain latanda-testnet-1 --port transfer
hermes query channels --chain cosmoshub-4 --port transfer
```

### 5. Start Relaying Packets

```bash
# Start relaying between the two chains
hermes start \
    --a-chain latanda-testnet-1 \
    --b-chain cosmoshub-4
```

The relayer will now continuously monitor and relay IBC packets between the two chains.

---

## Test IBC Transfer

### 1. Get Denom Trace

```bash
# Query the denom trace for the transferred token
hermes query denom-trace \
    --chain cosmoshub-4 \
    --port transfer \
    --channel <channel-id>
```

### 2. Send Test Transfer

```bash
# Transfer from La Tanda to Cosmos Hub
latandad tx ibc-transfer transfer transfer <channel-id-on-latanda> <recipient-address-on-cosmos> 10000ultd \
    --from <your-key> \
    --node https://latanda.online/chain/rpc/ \
    --chain-id latanda-testnet-1 \
    --gas auto \
    --gas-adjustment 1.2 \
    --fees 5000ultd \
    -y
```

### 3. Check Transfer Status

```bash
# Check on source chain (La Tanda)
latandad q tx <tx-hash> \
    --node https://latanda.online/chain/rpc/

# Check on destination chain (Cosmos Hub)
gaiad q tx <tx-hash> \
    --node https://cosmos-rpc.publicnode.com:443
```

### 4. Verify Balance

```bash
# Check balance on destination chain
gaiad q bank balances <recipient-address> \
    --node https://cosmos-rpc.publicnode.com:443
```

You should see an IBC token (e.g., `ibc/27394FB092D2ECCD56123C04FEBEAB362994B773F4A844C4403BB903BCB52813`).

---

## Run as Systemd Service

### 1. Create Systemd Service File

Create `/etc/systemd/system/hermes.service`:

```ini
[Unit]
Description=Hermes IBC Relayer
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu
Environment=PATH=/home/ubuntu/.cargo/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
ExecStart=/home/ubuntu/.cargo/bin/hermes start
Restart=on-failure
RestartSec=10
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
```

### 2. Enable and Start Service

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service (start on boot)
sudo systemctl enable hermes

# Start service
sudo systemctl start hermes

# Check status
sudo systemctl status hermes

# View logs
sudo journalctl -u hermes -f
```

### 3. Monitor Relayer

```bash
# Check if relayer is running
hermes health-check --chain latanda-testnet-1

# View relayer metrics
curl http://localhost:3001/metrics

# Check REST API (if enabled)
curl http://localhost:3000/chains
```

---

## Troubleshooting

### Problem 1: Client Expired

**Symptom:** Error `client state has expired`

**Solution:**

```bash
# Update client
hermes update client \
    --dst-chain latanda-testnet-1 \
    --src-chain cosmoshub-4 \
    --client <client-id>
```

**Prevention:** Configure `trusting_period` and `clock_drift` appropriately in `config.toml`.

### Problem 2: Insufficient Gas

**Symptom:** Transaction fails with `insufficient fee` error

**Solution:**

```bash
# Increase gas multiplier in config.toml
# gas_multiplier = 1.5

# Or increase gas budget
hermes start --max-gas 600000
```

### Problem 3: Connection Timeout

**Symptom:** Unable to connect to RPC endpoint

**Solution:**

```bash
# Check if RPC is accessible
curl -I https://latanda.online/chain/rpc/

# Increase timeout in config.toml
# rpc_timeout = '30s'

# Use a different RPC endpoint
# Try alternative public RPC nodes
```

### Problem 4: Chain Out of Sync

**Symptom:** Relayer cannot find latest headers

**Solution:**

```bash
# Check chain sync status
latandad status \
    --node https://latanda.online/chain/rpc/ | jq '.sync_info.catching_up'

# Wait for chain to sync, or:
# Use a synced full node
```

### Problem 5: Packet Timeout

**Symptom:** IBC transfer times out

**Solution:**

```bash
# Increase packet timeout in transfer
# Use --timeout-height or --timeout-timestamp flags

# Example:
latandad tx ibc-transfer transfer transfer <channel-id> <recipient> 10000ultd \
    --timeout-height 12345678 \
    --from <key> \
    --node https://latanda.online/chain/rpc/ \
    --chain-id latanda-testnet-1 \
    -y
```

### Additional Debugging Commands

```bash
# View Hermes logs with more detail
RUST_LOG=debug hermes start

# Check client state
hermes query client \
    --chain latanda-testnet-1 \
    --client <client-id>

# Check connection state
hermes query connection \
    --chain latanda-testnet-1 \
    --connection <connection-id>

# Check channel state
hermes query channel \
    --chain latanda-testnet-1 \
    --port transfer \
    --channel <channel-id>

# Check packet commitment
hermes query packet-commitments \
    --chain latanda-testnet-1 \
    --port transfer \
    --channel <channel-id>

# Check unreceived packets
hermes query unreceived-packets \
    --chain latanda-testnet-1 \
    --port transfer \
    --channel <channel-id>
```

---

## Useful Resources

- **Hermes Documentation:** https://hermes.informal.systems
- **Hermes GitHub:** https://github.com/informalsystems/hermes
- **IBC Protocol:** https://ibc.cosmos.network
- **La Tanda Chain Explorer:** https://latanda.online/chain/
- **IBC Gang Discord:** https://discord.com/invite/A9VqJSyUXU

---

## Support

If you encounter issues not covered in this guide:

1. Check the [Hermes FAQ](https://github.com/informalsystems/hermes/discussions/2472)
2. Search existing [GitHub issues](https://github.com/informalsystems/hermes/issues)
3. Join the [IBC Gang Discord](https://discord.com/invite/A9VqJSyUXU) for community support
4. Contact La Tanda Chain support: contact@latanda.online

---

*Last Updated: 2026-03-07*
