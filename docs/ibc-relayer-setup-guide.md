# IBC Relayer Setup Guide

This guide covers setting up the Hermes Relayer for the La Tanda Chain to enable Inter-Blockchain Communication (IBC) with counterparty chains like Cosmos Hub testnet or Osmosis testnet.

## Prerequisites

### Hardware Requirements
- **CPU**: 4+ cores (recommended 8+)
- **RAM**: 8GB minimum (recommended 16GB)
- **Storage**: 100GB+ SSD
- **Network**: Stable internet connection with at least 100Mbps bandwidth

### Software Requirements
- **Operating System**: Ubuntu 20.04 LTS or later (recommended)
- **Go**: Version 1.21 or later
- **Rust**: Latest stable version
- **GCC**: For building Rust dependencies

### La Tanda Chain Information
- **Chain ID**: `latanda-testnet-1`
- **RPC**: `https://latanda.online/chain/rpc/`
- **REST API**: `https://latanda.online/chain/api/`
- **Token**: `ultd`
- **Address Prefix**: `ltd`
- **Gas Price**: `0.025ultd`
- **Cosmos SDK Version**: v0.53.6
- **Ignite CLI Version**: v29.8.0
- **Genesis Node**: 168.231.67.201
- **Node ID**: `483a8110c3cd93c8dd3801d935151e98656f5b67`

---

## Install Hermes Relayer

Hermes is the IBC relayer developed by Informal Systems. Follow these steps to install it.

### 1. Install Required Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl build-essential git jq
```

### 2. Install Go (if not installed)

```bash
# Download and install Go
curl -sL https://go.dev/dl/go1.21.0.linux-amd64.tar.gz | sudo tar -C /usr/local -xzf -

# Add Go to PATH
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
echo 'export GOPATH=$HOME/go' >> ~/.bashrc
source ~/.bashrc

# Verify Go installation
go version
```

### 3. Install Hermes from Binary

```bash
# Download the latest Hermes release
mkdir -p $HOME/.hermes/bin
cd $HOME/.hermes/bin

# Download Hermes v1.7.0 (or latest stable)
curl -sL https://github.com/informalsystems/hermes/releases/download/v1.7.0/hermes-v1.7.0-x86_64-unknown-linux-gnu.tar.gz | tar -xzf -

# Verify installation
./hermes version
```

### 4. Add Hermes to PATH

```bash
echo 'export PATH=$PATH:$HOME/.hermes/bin' >> ~/.bashrc
source ~/.bashrc
```

---

## Configure for La Tanda Chain

### 1. Create Hermes Configuration Directory

```bash
mkdir -p $HOME/.hermes/config
```

### 2. Create Configuration File

Create the `config.toml` file with the La Tanda Chain configuration:

```toml
# ~/.hermes/config/config.toml

[global]
log_level = 'info'

[telemetry]
enabled = true
host = '127.0.0.1'
port = 3001

# La Tanda Chain Configuration
[[chains]]
id = 'latanda-testnet-1'
type = 'CosmosSdk'
rpc_addr = 'https://latanda.online/chain/rpc/'
grpc_addr = 'https://latanda.online/chain/grpc/'
rest_addr = 'https://latanda.online/chain/api/'
websocket_addr = 'wss://latanda.online/chain/rpc/ws'
rpc_timeout = '10s'
account_prefix = 'ltd'
key_name = 'relayer'
key_store_type = 'Keyboard'
store_prefix = 'ibc'
default_gas = 100000
max_gas = 400000
gas_price = { price = 0.025, denom = 'ultd' }
max_msg_num = 15
max_tx_size = 2097152
clock_drift = '5s'
max_block_time = '30s'
memo_prefix = 'hermes-relayer'

[chains.packet_filter]
policy = 'allowall'
```

### 3. Setup Relayer Keys

The relayer needs keys to sign transactions on behalf of the chain. You have two options:

#### Option A: Use CLI to Add Keys

```bash
# Add key for La Tanda Chain (you'll be prompted for password)
hermes keys add latanda-testnet-1 --key-name relayer

# Or restore from mnemonic
hermes keys restore latanda-testnet-1 --key-name relayer --mnemonic "your 24-word mnemonic here"
```

#### Option B: Import Existing Key

```bash
# Import from cosmos keyring
hermes keys add latanda-testnet-1 --key-name relayer --keyring-backend test
```

---

## Configure Counterparty Chain

For the counterparty chain, you can use either Cosmos Hub testnet or Osmosis testnet. Below are examples for both.

### Option A: Cosmos Hub Testnet (Theta)

```toml
# Add to config.toml after the La Tanda Chain configuration

[[chains]]
id = 'theta-testnet-001'
type = 'CosmosSdk'
rpc_addr = 'https://rpc.sentry-01.theta-testnet.polypore.xyz'
grpc_addr = 'https://grpc.sentry-01.theta-testnet.polypore.xyz:443'
rest_addr = 'https://api.sentry-01.theta-testnet.polypore.xyz'
websocket_addr = 'wss://rpc.sentry-01.theta-testnet.polypore.xyz/ws'
rpc_timeout = '10s'
account_prefix = 'cosmos'
key_name = 'relayer'
key_store_type = 'Keyboard'
store_prefix = 'ibc'
default_gas = 100000
max_gas = 400000
gas_price = { price = 0.001, denom = 'uatom' }
max_msg_num = 15
max_tx_size = 2097152
clock_drift = '5s'
max_block_time = '30s'
memo_prefix = 'hermes-relayer'
```

### Option B: Osmosis Testnet

```toml
# Add to config.toml after the La Tanda Chain configuration

[[chains]]
id = 'osmo-test-4'
type = 'CosmosSdk'
rpc_addr = 'https://rpc.testnet.osmosis.zone'
grpc_addr = 'https://grpc.testnet.osmosis.zone:443'
rest_addr = 'https://api.testnet.osmosis.zone'
websocket_addr = 'wss://rpc.testnet.osmosis.zone/ws'
rpc_timeout = '10s'
account_prefix = 'osmo'
key_name = 'relayer'
key_store_type = 'Keyboard'
store_prefix = 'ibc'
default_gas = 200000
max_gas = 500000
gas_price = { price = 0.0025, denom = 'uosmo' }
max_msg_num = 15
max_tx_size = 2097152
clock_drift = '5s'
max_block_time = '30s'
memo_prefix = 'hermes-relayer'
```

---

## Create IBC Channel

### 1. Validate Configuration

Before creating channels, validate your configuration:

```bash
hermes config validate
```

### 2. Check Balance

Ensure your relayer has sufficient tokens to pay for gas:

```bash
hermes query balance latanda-testnet-1 --address <your-relayer-address>
```

### 3. Create Client, Connection, and Channel

Hermes can automatically create the necessary IBC primitives:

```bash
# Create client, connection, and channel in one command
hermes create channel \
    --dst-chain latanda-testnet-1 \
    --src-chain theta-testnet-001 \
    --dst-port transfer \
    --src-port transfer \
    --channel-version ics20-1
```

### 4. Manual Steps (if needed)

If the auto-creation fails, you can create each component manually:

```bash
# 1. Create client
hermes tx create-client \
    --host-chain latanda-testnet-1 \
    --reference-chain theta-testnet-001

# 2. Create connection
hermes tx create-connection \
    --host-chain latanda-testnet-1 \
    --reference-chain theta-testnet-001

# 3. Create channel
hermes tx create-channel \
    --host-chain latanda-testnet-1 \
    --reference-chain theta-testnet-001 \
    --dst-port transfer \
    --src-port transfer \
    --channel-version ics20-1
```

### 4. List Active Channels

```bash
hermes query channels latanda-testnet-1
```

---

## Test IBC Transfer

### 1. Start the Relayer

```bash
hermes start
```

### 2. Check Channel Status

```bash
hermes query channel end latanda-testnet-1 transfer channel-0
```

### 3. Initiate a Test Transfer

Use the La Tanda Chain CLI or the relayer to send a test IBC transfer:

```bash
# From La Tanda to Cosmos Hub (example)
# Using the chain's CLI (if available)
latandad tx ibc-transfer transfer \
    transfer \
    channel-0 \
    <cosmos-receiver-address> \
    1000ultd \
    --from <your-key-name> \
    --gas auto \
    --gas-adjustment 1.5 \
    --fees 1000ultd
```

### 4. Monitor Transfer Status

```bash
# Check packet commitments
hermes query packet commitments latanda-testnet-1 transfer channel-0

# Check unreceived packets
hermes query packet unreceived-packets latanda-testnet-1 transfer channel-0
```

---

## Run as Systemd Service

To run Hermes as a systemd service for automatic startup and monitoring:

### 1. Create Systemd Service File

```bash
sudo nano /etc/systemd/system/hermes.service
```

Add the following content:

```ini
[Unit]
Description=Hermes IBC Relayer
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/.hermes
ExecStart=/home/ubuntu/.hermes/bin/hermes start
Restart=on-failure
RestartSec=5
LimitNOFILE=4096
Environment=RUST_BACKTRACE=1

[Install]
WantedBy=multi-user.target
```

### 2. Enable and Start Service

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable hermes

# Start the service
sudo systemctl start hermes

# Check status
sudo systemctl status hermes
```

### 3. View Logs

```bash
# View recent logs
sudo journalctl -u hermes -n 50

# Follow logs in real-time
sudo journalctl -u hermes -f
```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. Connection Refused / RPC Timeout

**Problem**: Hermes cannot connect to the RPC endpoint.

**Solution**:
- Check if the RPC endpoint is accessible: `curl <rpc-url>/status`
- Verify firewall rules allow the connection
- Try using an alternative RPC endpoint
- Increase `rpc_timeout` in config.toml

```toml
rpc_timeout = '30s'  # Increase from 10s
```

#### 2. Insufficient Gas / Balance

**Problem**: Relayer doesn't have enough tokens to pay for transactions.

**Solution**:
- Check relayer balance: `hermes query balance <chain-id> --address <address>`
- Fund the relayer wallet with native tokens
- Adjust gas settings in config:

```toml
gas_price = { price = 0.05, denom = 'ultd' }  # Increase gas price
```

#### 3. Channel Creation Fails

**Problem**: Cannot create IBC channel between chains.

**Solution**:
- Ensure both chains are running and synchronized
- Verify chain IDs are correct
- Check if IBC modules are enabled on both chains
- Verify client exists before creating connection:

```bash
hermes query client states latanda-testnet-1
```

#### 4. Packets Not Being Relayed

**Problem**: IBC packets are stuck and not being forwarded.

**Solution**:
- Check for unreceived packets: `hermes query packet unreceived-packets <chain-id> <port> <channel>`
- Restart the relayer: `sudo systemctl restart hermes`
- Check logs for errors: `sudo journalctl -u hermes -n 100`
- Ensure the relayer has both source and destination chain keys

#### 5. Key Not Found Error

**Problem**: Hermes cannot find the relayer key.

**Solution**:
- Verify key exists: `hermes keys list <chain-id>`
- Restore key from mnemonic if needed: `hermes keys restore <chain-id> --key-name <name> --mnemonic "<mnemonic>"`
- Check key_name matches in config

#### 6. Version Mismatch

**Problem**: IBC protocol version mismatch between chains.

**Solution**:
- Ensure both chains use compatible IBC versions
- Update Hermes to the latest version
- Check chain upgrade history

```bash
hermes version
hermes upgrade
```

#### 7. Memory/Performance Issues

**Problem**: Hermes consuming too much memory or CPU.

**Solution**:
- Reduce `max_msg_num` in config
- Enable packet filtering to only relay specific channels:

```toml
[chains.packet_filter]
policy = 'list'
channels = ['transfer/channel-0']
```

---

## Additional Resources

- [Hermes Documentation](https://hermes.informal.systems/)
- [IBC Protocol Documentation](https://ibc.cosmos.network/)
- [Cosmos SDK Documentation](https://docs.cosmos.network/)
- [La Tanda Chain Repository](https://github.com/INDIGOAZUL/la-tanda-web)

---

## Support

For issues and questions:
- Open an issue on GitHub: https://github.com/INDIGOAZUL/la-tanda-web/issues
- Join the community Discord or Telegram channel

---

*Last updated: March 2026*
