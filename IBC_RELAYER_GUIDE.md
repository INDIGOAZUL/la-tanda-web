# IBC Relayer Setup Guide for La Tanda Chain

## Overview

This guide explains how to set up an IBC (Inter-Blockchain Communication) relayer to connect La Tanda Chain with other Cosmos-based chains.

## Prerequisites

### System Requirements
- **OS**: Ubuntu 22.04+ or macOS
- **CPU**: 2 cores minimum
- **RAM**: 4 GB minimum
- **Disk**: 50 GB SSD
- **Network**: Stable connection with ports 26656 (P2P) and 26657 (RPC) open

### Software Dependencies
- **Go**: 1.24.1 or later
- **Git**: latest version
- **Rust**: latest stable (for Hermes)

Verify installations:
```bash
go version
git --version
rustc --version
```

## Choose Your Relayer

We recommend **Hermes** for production use due to its active development and comprehensive features.

### Hermes vs Go Relayer v2

| Feature | Hermes | Go Relayer v2 |
|---------|--------|---------------|
| Language | Rust | Go |
| Performance | Excellent | Good |
| Features | Most complete | Good |
| Documentation | Excellent | Good |
| Community | Larger | Growing |

## Install Hermes Relayer

### Option 1: Pre-built Binary (Recommended)

```bash
# Download latest release
cd /tmp
wget https://github.com/informalsystems/hermes/releases/download/v1.10.0/hermes-v1.10.0-x86_64-unknown-linux-gnu.tar.gz

# Extract and install
tar -xzf hermes-v1.10.0-x86_64-unknown-linux-gnu.tar.gz
sudo mv hermes /usr/local/bin/

# Verify
hermes version
```

### Option 2: Install via Cargo

```bash
# Install Rust if needed
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Install Hermes
cargo install ibc-relayer-cli --bin hermes --locked
```

### Option 3: Build from Source

```bash
git clone https://github.com/informalsystems/hermes.git
cd hermes
cargo build --release
sudo cp target/release/hermes /usr/local/bin/
```

## Configure La Tanda Chain

### Test Network Connectivity

Before configuration, verify connectivity:

```bash
# Test RPC endpoint
curl -s https://latanda.online/chain/rpc/status | jq .

# Expected output:
# {
#   "jsonrpc": "2.0",
#   "id": -1,
#   "result": {
#     "node_info": {
#       "network": "latanda-testnet-1",
#       ...
#     }
#   }
# }
```

### Create Configuration File

Create `~/.hermes/config.toml`:

```toml
[global]
log_level = "info"

[mode]

[mode.clients]
enabled = true
refresh = true
misbehaviour = true

[mode.connections]
enabled = false

[mode.channels]
enabled = false

[mode.packets]
enabled = true
clear_interval = 100
clear_on_start = true
tx_confirmation = true

[rest]
enabled = true
host = "127.0.0.1"
port = 3000

[telemetry]
enabled = true
host = "127.0.0.1"
port = 3001

[[chains]]
id = "latanda-testnet-1"
rpc_addr = "https://latanda.online/chain/rpc/"
grpc_addr = "https://latanda.online/chain/api/"
websocket_addr = "wss://latanda.online/chain/rpc/websocket"
rpc_timeout = "10s"
account_prefix = "ltd"
key_name = "latanda-key"
store_prefix = "ibc"
default_gas = 100000
max_gas = 400000
gas_price = { price = 0.025, denom = "ultd" }
gas_multiplier = 1.1
max_msg_num = 30
max_tx_size = 180000
clock_drift = "5s"
max_block_time = "30s"
trusting_period = "14days"
trust_threshold = { numerator = "1", denominator = "3" }

[[chains]]
id = "cosmoshub-testnet"
rpc_addr = "https://cosmos-testnet.publicnode.com:443"
websocket_addr = "wss://cosmos-testnet.publicnode.com:443/websocket"
grpc_addr = "https://cosmos-testnet.publicnode.com:9090"
rpc_timeout = "10s"
account_prefix = "cosmos"
key_name = "cosmos-key"
store_prefix = "ibc"
default_gas = 100000
max_gas = 400000
gas_price = { price = 0.025, denom = "uatom" }
gas_multiplier = 1.1
max_msg_num = 30
max_tx_size = 180000
clock_drift = "5s"
max_block_time = "30s"
trusting_period = "14days"
trust_threshold = { numerator = "1", denominator = "3" }
```

## Create Keys

```bash
# Add key for La Tanda Chain
hermes keys add --chain latanda-testnet-1 --mnemonic-file la-tanda-mnemonic.txt

# Add key for Cosmos Hub testnet
hermes keys add --chain cosmoshub-testnet --mnemonic-file cosmos-mnemonic.txt
```

## Create IBC Connection

```bash
# Create client, connection, and channel
hermes create channel --a-chain latanda-testnet-1 --b-chain cosmoshub-testnet \
  --a-port transfer --b-port transfer --new-client-connection

# Expected output:
# Success: Channel(
#   ChainId(latanda-testnet-1),
#   ChannelId(channel-0),
#   PortId(transfer),
# ) was created with counterparty
# ...
```

## Test IBC Transfer

```bash
# Send tokens from La Tanda to Cosmos
hermes tx ft-transfer \
  --dst-chain cosmoshub-testnet \
  --src-chain latanda-testnet-1 \
  --src-port transfer \
  --src-channel channel-0 \
  --amount 1000 \
  --timeout-height-offset 1000 \
  --number-msgs 3

# Expected output:
# Success: [
#   SendPacket {
#     packet: Packet {
#       ...
#     },
#   },
# ]
```

## Run as Systemd Service

### Create Service File

Create `/etc/systemd/system/hermes.service`:

```ini
[Unit]
Description=Hermes IBC Relayer
After=network.target

[Service]
Type=simple
User=hermes
ExecStart=/usr/local/bin/hermes start
Restart=on-failure
RestartSec=5
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
```

### Enable and Start Service

```bash
# Create hermes user
sudo useradd -r -s /bin/false hermes

# Set ownership
sudo chown -R hermes:hermes /home/hermes

# Enable service
sudo systemctl daemon-reload
sudo systemctl enable hermes
sudo systemctl start hermes

# Check status
sudo systemctl status hermes

# View logs
sudo journalctl -u hermes -f
```

## Prometheus Monitoring (Optional)

Add to your Prometheus config:

```yaml
scrape_configs:
  - job_name: 'hermes'
    static_configs:
      - targets: ['localhost:3001']
```

## Troubleshooting

### Issue 1: "connection not found"

**Symptom**:
```
ERROR connection not found: chain_id=latanda-testnet-1 connection_id=connection-0
```

**Cause**: Connection not yet established or expired

**Solution**:
```bash
# Recreate connection
hermes create connection --a-chain latanda-testnet-1 --b-chain cosmoshub-testnet
```

**Verify**:
```bash
hermes query connection --chain latanda-testnet-1 --connection connection-0
```

---

### Issue 2: "key not found"

**Symptom**:
```
ERROR key not found: key_name=latanda-key
```

**Cause**: Key not added to Hermes keystore

**Solution**:
```bash
# Add key with mnemonic
hermes keys add --chain latanda-testnet-1 --mnemonic "your mnemonic words here"

# Verify key exists
hermes keys list --chain latanda-testnet-1
```

---

### Issue 3: "insufficient balance"

**Symptom**:
```
ERROR insufficient balance: required=100000ultd available=50000ultd
```

**Cause**: Account doesn't have enough tokens

**Solution**:
```bash
# Check balance
hermes query balance --chain latanda-testnet-1

# Get testnet tokens from faucet (if available)
# Or contact La Tanda team for testnet tokens
```

---

### Issue 4: "RPC timeout"

**Symptom**:
```
ERROR RPC timeout: timeout=10s
```

**Cause**: Network issue or RPC endpoint overloaded

**Solution**:
```bash
# Test connectivity
curl -v https://latanda.online/chain/rpc/status

# Try alternative endpoints if available
# Update config.toml with backup RPC
```

---

### Issue 5: "channel already exists"

**Symptom**:
```
ERROR channel already exists: channel_id=channel-0
```

**Cause**: Channel already created in previous attempt

**Solution**:
```bash
# Query existing channels
hermes query channels --chain latanda-testnet-1

# Use existing channel or create new one with different ID
hermes create channel --a-chain latanda-testnet-1 --b-chain cosmoshub-testnet \
  --a-port transfer --b-port transfer
```

---

### Issue 6: "grpc unavailable" (Bonus Issue)

**Symptom**:
```
ERROR gRPC unavailable: endpoint=https://latanda.online/chain/api/
```

**Cause**: gRPC endpoint not accessible or misconfigured

**Solution**:
```bash
# Test gRPC endpoint
grpcurl -plaintext https://latanda.online/chain/api/ list

# If gRPC fails, use REST fallback
# Update config.toml:
# grpc_addr = ""  # Leave empty to use REST
```

## Resources

### Official Documentation
- [Hermes Documentation](https://hermes.informal.systems/)
- [Cosmos IBC Protocol](https://ibc.cosmos.network/)
- [Go Relayer Documentation](https://github.com/cosmos/relayer)

### Community Support
- [Cosmos Discord](https://discord.gg/cosmosnetwork)
- [Hermes GitHub Issues](https://github.com/informalsystems/hermes/issues)

### Video Tutorials
- [IBC Relayer Setup (YouTube)](https://www.youtube.com/results?search_query=ibc+relayer+setup)

---

**Last Updated**: 2026-03-07  
**La Tanda Chain Version**: Cosmos SDK v0.53.6  
**Hermes Version Tested**: v1.10.0
