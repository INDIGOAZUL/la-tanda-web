# IBC Relayer Setup Guide

A comprehensive guide for setting up an IBC (Inter-Blockchain Communication) relayer to connect La Tanda Chain with other Cosmos chains.

## Prerequisites

### Hardware Requirements
- **CPU**: 4+ cores
- **RAM**: 8GB+ (16GB recommended)
- **Storage**: 100GB+ SSD
- **Network**: Stable internet connection with static IP

### Software Dependencies
- **Go**: Version 1.21 or later
- **Hermes Relayer**: Version 1.8.0 or later (recommended)
- **or Go Relayer (rly)**: Version 2.5.0 or later

### Verify Go Installation

```bash
go version
# Should output: go1.21.x or later
```

---

## Install Hermes Relayer

### Method 1: Binary Download (Recommended)

```bash
# Download the latest Hermes release
cd /tmp
wget https://github.com/informalsystems/hermes/releases/download/v1.8.0/hermes-v1.8.0-x86_64-unknown-linux-gnu.tar.gz

# Extract and install
tar -xzf hermes-v1.8.0-x86_64-unknown-linux-gnu.tar.gz
sudo mv hermes /usr/local/bin/
rm hermes-v1.8.0-x86_64-unknown-linux-gnu.tar.gz

# Verify installation
hermes version
```

### Method 2: Build from Source

```bash
# Install Rust if not present
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Clone and build Hermes
cd /tmp
git clone https://github.com/informalsystems/hermes.git
cd hermes
cargo build --release
sudo mv target/release/hermes /usr/local/bin/
```

### Verify Hermes

```bash
hermes version
# Expected output: hermes 1.8.0
```

---

## Configure for La Tanda Chain

### Create Configuration Directory

```bash
mkdir -p ~/.hermes/config
cd ~/.hermes/config
```

### Create `config.toml`

```toml
[global]
log_level = 'info'

[mode]
clients = { enabled = true, refresh = true, update = true }
connections = { enabled = true, init = true }
channels = { enabled = true, init = true }

[mode.channels]
filter = true

[[chains]]
id = 'latanda-testnet-1'
type = 'CosmosSdk'
rpc_addr = 'https://latanda.online/chain/rpc/'
grpc_addr = 'https://latanda.online:9091/'
websocket_addr = 'wss://latanda.online/chain/ws/'
rpc_timeout = '30s'
account_prefix = 'ltd'
key_name = 'relayer'
store_prefix = 'ibc'
gas_price = { price = 0.025, denom = 'ultd' }
max_gas = 1000000
clock_drift = '30s'
trusting_period = '14days'
trust_threshold = { numerator = '1', denominator = '3' }

[chains.packet_filter]
policy = 'allow'
list = [
    # Add channel filters here
]
```

### Add Relayer Key

```bash
# Generate a new key for the relayer
hermes keys add latanda-testnet-1 --key-name relayer

# Or import existing key
hermes keys add latanda-testnet-1 --key-name relayer --mnemonic "your 24-word mnemonic here"

# Verify key was added
hermes keys list latanda-testnet-1
```

**⚠️ Important**: Backup your mnemonic phrase securely!

---

## Configure Counterparty Chain

### Example: Cosmos Hub Testnet

Add the counterparty chain configuration to `config.toml`:

```toml
[[chains]]
id = 'cosmoshub-testnet-4'
type = 'CosmosSdk'
rpc_addr = 'https://rpc.testnet.cosmos.network/'
grpc_addr = 'https://grpc.testnet.cosmos.network:9090/'
websocket_addr = 'wss://rpc.testnet.cosmos.network:443/ws/'
rpc_timeout = '30s'
account_prefix = 'cosmos'
key_name = 'relayer'
store_prefix = 'ibc'
gas_price = { price = 0.001, denom = 'uatom' }
max_gas = 1000000
clock_drift = '30s'
trusting_period = '14days'
trust_threshold = { numerator = '1', denominator = '3' }
```

### Example: Osmosis Testnet

```toml
[[chains]]
id = 'osmo-test-5'
type = 'CosmosSdk'
rpc_addr = 'https://rpc.testnet.osmosis.zone/'
grpc_addr = 'https://grpc.testnet.osmosis.zone:9090/'
websocket_addr = 'wss://rpc.testnet.osmosis.zone:443/ws/'
rpc_timeout = '30s'
account_prefix = 'osmo'
key_name = 'relayer'
store_prefix = 'ibc'
gas_price = { price = 0.001, denom = 'uosmo' }
max_gas = 1000000
clock_drift = '30s'
trusting_period = '14days'
trust_threshold = { numerator = '1', denominator = '3' }
```

---

## Create IBC Channel

### Step 1: Initialize Clients

```bash
hermes create client latanda-testnet-1 cosmoshub-testnet-4
hermes create client cosmoshub-testnet-4 latanda-testnet-1
```

**Expected Output:**
```
IbcClient { chain_id: CosmosHubTestnet4, client_id: 07-tendermint-0, ... }
```

### Step 2: Create Connection

```bash
hermes create connection latanda-testnet-1 cosmoshub-testnet-4
```

**Expected Output:**
```
IbcConnection { connection_id: connection-0, ... }
```

### Step 3: Create Channel

```bash
hermes create channel latanda-testnet-1 cosmoshub-testnet-4 --port transfer --channel-id 0
```

**Expected Output:**
```
IbcChannel { channel_id: channel-0, port_id: transfer, ... }
```

### Verify Channel Creation

```bash
hermes query channels latanda-testnet-1
```

---

## Test IBC Transfer

### Step 1: Get Relayer Address

```bash
hermes keys show latanda-testnet-1 --key-name relayer
```

**Output Example:**
```
ltd1abcdefghijklmnopqrstuvwxyz1234567890
```

### Step 2: Fund the Relayer

Send some test tokens to the relayer address:
- **La Tanda Chain**: Send at least 1000 ultd for gas

### Step 3: Initiate Transfer

```bash
hermes tx transfer \
    --src-chain latanda-testnet-1 \
    --dst-chain cosmoshub-testnet-4 \
    --src-port transfer \
    --src-channel channel-0 \
    --amount 1000 \
    --denom ultd \
    --receiver cosmos1exampleaddress123456789 \
    --timeout-height-offset 1000
```

### Step 4: Monitor Transfer Status

```bash
hermes query packet pending latanda-testnet-1
```

---

## Run as Service (systemd)

### Create Service File

```bash
sudo nano /etc/systemd/system/hermes-relayer.service
```

### Add Following Content

```ini
[Unit]
Description=Hermes IBC Relayer
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu
ExecStart=/usr/local/bin/hermes start
Restart=always
RestartSec=10
Environment="RUST_BACKTRACE=1"

[Install]
WantedBy=multi-user.target
```

### Enable and Start Service

```bash
sudo systemctl daemon-reload
sudo systemctl enable hermes-relayer
sudo systemctl start hermes-relayer

# Check status
sudo systemctl status hermes-relayer

# View logs
sudo journalctl -u hermes-relayer -f
```

### Service Management Commands

```bash
# Stop
sudo systemctl stop hermes-relayer

# Restart
sudo systemctl restart hermes-relayer

# View logs
journalctl -u hermes-relayer -f --since "1 hour ago"
```

---

## Troubleshooting

### Common Issues

#### 1. Connection Timeout

**Error:**
```
Error: connection handshake error: handshake failed
```

**Solution:**
- Check firewall rules allow ports 26656, 26657, 9090, 9091
- Verify RPC endpoints are accessible
- Increase `rpc_timeout` in config

```bash
# Test RPC connectivity
curl https://latanda.online/chain/rpc/status
```

#### 2. Insufficient Gas

**Error:**
```
Error: insufficient fees
```

**Solution:**
- Add more tokens to relayer address
- Adjust `gas_price` in config

```bash
# Check balance
hermes query balance latanda-testnet-1 --key-name relayer
```

#### 3. Chain Not Synced

**Error:**
```
Error: chain is behind
```

**Solution:**
- Wait for chain to sync
- Use a different RPC endpoint

```bash
# Check node sync status
curl https://latanda.online/chain/rpc/status | jq '.result.sync_info'
```

#### 4. Key Not Found

**Error:**
```
Error: key relayer not found
```

**Solution:**
- Re-add the key with correct name

```bash
hermes keys add latanda-testnet-1 --key-name relayer --mnemonic "your mnemonic"
```

#### 5. Channel Creation Failed

**Error:**
```
Error: failed to create channel
```

**Solution:**
- Ensure both chains have IBC module enabled
- Verify chain IDs are correct
- Check if channel already exists

```bash
# Query existing channels
hermes query channels latanda-testnet-1
hermes query channels cosmoshub-testnet-4
```

#### 6. Packet Timeout

**Error:**
```
Error: packet timeout
```

**Solution:**
- Increase `timeout-height-offset`
- Check network connectivity
- Verify counterparty chain is online

#### 7. gRPC Connection Refused

**Error:**
```
Error: gRPC transport error: connection refused
```

**Solution:**
- Verify gRPC port is open
- Check firewall rules
- Use correct gRPC address

```bash
# Test gRPC
grpcurl -plaintext https://latanda.online:9091 list
```

---

## Additional Resources

- [Hermes Documentation](https://hermes.informal.systems/)
- [Cosmos IBC Documentation](https://ibc.cosmos.network/)
- [La Tanda Chain Documentation](https://docs.latanda.online/)
- [Go Relayer Documentation](https://github.com/cosmos/relayer)

---

## Maintenance

### Update Hermes

```bash
# Stop service
sudo systemctl stop hermes-relayer

# Download new version
cd /tmp
wget https://github.com/informalsystems/hermes/releases/download/v1.9.0/hermes-v1.9.0-x86_64-unknown-linux-gnu.tar.gz
tar -xzf hermes-v1.9.0-x86_64-unknown-linux-gnu.tar.gz
sudo mv hermes /usr/local/bin/

# Restart service
sudo systemctl restart hermes-relayer

# Verify
hermes version
```

### Backup Configuration

```bash
# Backup config and keys
cp -r ~/.hermes ~/.hermes.backup
```

### Monitor Health

```bash
# Check hermes status
hermes health-check

# View metrics
curl localhost:3000/metrics
```

---

**Reward**: 100 LTD - Paid on merge

**Author**: [Your Name]
**Date**: 2026-03-06
