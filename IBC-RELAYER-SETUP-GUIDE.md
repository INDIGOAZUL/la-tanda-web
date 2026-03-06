# IBC Relayer Setup Guide for La Tanda Chain

This guide explains how to set up an IBC (Inter-Blockchain Communication) relayer to connect La Tanda Chain with other Cosmos chains.

## Prerequisites

### Hardware Requirements
- CPU: 4 cores
- RAM: 8 GB
- Storage: 100 GB SSD
- Network: Stable internet connection (100+ Mbps)

### Software Dependencies
- Go 1.21+
- Git
- Systemd (for running as service)
- UFW or firewall configuration

## Choose Your Relayer

We recommend **Hermes** (developed by Informal Systems) for its reliability and active maintenance.

| Relayer | Pros | Cons |
|---------|------|------|
| Hermes | Fast, well-maintained | Rust binary |
| Go Relayer v2 | Pure Go | Slower updates |

This guide uses **Hermes**.

## Install Hermes Relayer

### 1. Download Hermes

```bash
# Create relayer directory
mkdir -p ~/hermes && cd ~/hermes

# Download latest Hermes (check https://github.com/informalsystems/hermes/releases)
wget https://github.com/informalsystems/hermes/releases/download/v1.10.0/hermes-v1.10.0-x86_64-unknown-linux-gnu.tar.gz

# Extract
tar -xzf hermes-v1.10.0-x86_64-unknown-linux-gnu.tar.gz

# Make executable
chmod +x hermes

# Move to PATH
sudo mv hermes /usr/local/bin/
```

### 2. Verify Installation

```bash
hermes version
# Expected output: hermes 1.10.0
```

## Configure Hermes

### 1. Create Configuration Directory

```bash
mkdir -p ~/.hermes
cd ~/.hermes
```

### 2. Create Config File

Create `config.toml`:

```toml
[global]
log_level = 'info'

[mode]
clients_enabled = true
connections_enabled = true
channels_enabled = true

[mode.clients]
refresh = true
misbehaviour = true

[mode.connections]
refresh = true

[mode.channels]
refresh = true

[telemetry]
enabled = true
host = '127.0.0.1'
port = 3001

# La Tanda Chain
[[chains]]
id = 'latanda-testnet-1'
type = 'CosmosSdk'
rpc_addr = 'https://latanda.online/chain/rpc/'
grpc_addr = 'https://latanda.online/chain/grpc/'
websocket_addr = 'wss://latanda.online/chain/rpc/ws'
rpc_timeout = '10s'
account_prefix = 'ltd'
key_name = 'relayer'
store_prefix = 'ibc'
gas_price = { price = 0.025, denom = 'ultd' }
max_gas = 300000
clock_drift = '5s'
trusting_period = '14days'
trust_threshold = { numerator = '1', denominator = '3' }

# Cosmos Hub Testnet (counterparty)
[[chains]]
id = 'theta-testnet-001'
type = 'CosmosSdk'
rpc_addr = 'https://rpc.theta-testnet.polypore.xyz'
grpc_addr = 'https://grpc.theta-testnet.polypore.xyz:443'
websocket_addr = 'wss://rpc.theta-testnet.polypore.xyz/ws'
rpc_timeout = '10s'
account_prefix = 'cosmos'
key_name = 'relayer'
store_prefix = 'ibc'
gas_price = { price = 0.001, denom = 'uatom' }
max_gas = 300000
clock_drift = '5s'
trusting_period = '14days'
trust_threshold = { numerator = '1', denominator = '3' }
```

### 3. Add Relayer Key

```bash
# Create key for La Tanda Chain
hermes keys add --chain latanda-testnet-1 --key-name relayer --mnemonic "your-24-word-mnemonic-here"

# Create key for Cosmos Hub Testnet
hermes keys add --chain theta-testnet-001 --key-name relayer --mnemonic "your-24-word-mnemonic-here"
```

⚠️ **Important**: Fund both accounts with testnet tokens:
- La Tanda: Get `ultd` from faucet or team
- Cosmos Hub: Get `uatom` from https://discord.gg/cosmoshub

### 4. Verify Connection to Chains

```bash
hermes health-check --chain latanda-testnet-1
hermes health-check --chain theta-testnet-001
```

Expected output:
```
SUCCESS health check for chain latanda-testnet-1
SUCCESS health check for chain theta-testnet-001
```

## Create IBC Channel

### 1. Create Client

```bash
hermes create client --host-chain latanda-testnet-1 --reference-chain theta-testnet-001
```

### 2. Create Connection

```bash
hermes create connection --a-chain latanda-testnet-1 --b-chain theta-testnet-001
```

### 3. Create Channel

```bash
hermes create channel --a-chain latanda-testnet-1 --a-port transfer --b-port transfer --new-client-connection
```

This creates an ICS20 token transfer channel. Save the channel IDs:
- La Tanda channel: `channel-0`
- Cosmos Hub channel: `channel-1`

## Test IBC Transfer

### 1. Check Balance

```bash
hermes query balance --chain latanda-testnet-1 --address ltd1...
```

### 2. Send Tokens (La Tanda → Cosmos Hub)

```bash
hermes tx raw ft-transfer \
  --dst-chain theta-testnet-001 \
  --src-chain latanda-testnet-1 \
  --src-port transfer \
  --src-channel channel-0 \
  --amount 1000 \
  --denom ultd \
  --receiver cosmos1... \
  --timeout-height-offset 1000
```

### 3. Send Tokens (Cosmos Hub → La Tanda)

```bash
hermes tx raw ft-transfer \
  --dst-chain latanda-testnet-1 \
  --src-chain theta-testnet-001 \
  --src-port transfer \
  --src-channel channel-1 \
  --amount 1000 \
  --denom uatom \
  --receiver ltd1... \
  --timeout-height-offset 1000
```

### 4. Check Relay Acknowledgment

```bash
hermes tx raw packet-recv \
  --chain theta-testnet-001 \
  --port transfer \
  --channel channel-1
```

## Run as Systemd Service

### 1. Create Service File

```bash
sudo nano /etc/systemd/system/hermes.service
```

Add content:

```ini
[Unit]
Description=Hermes IBC Relayer
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu
ExecStart=/usr/local/bin/hermes start
Restart=on-failure
RestartSec=5
LimitNOFILE=4096
Environment="RUST_BACKTRACE=1"

[Install]
WantedBy=multi-user.target
```

### 2. Enable and Start

```bash
sudo systemctl daemon-reload
sudo systemctl enable hermes
sudo systemctl start hermes
```

### 3. Check Status

```bash
sudo systemctl status hermes
journalctl -u hermes -f
```

## Monitoring

### Check Hermes Metrics

```bash
curl http://127.0.0.1:3001/metrics
```

### Useful Commands

```bash
# View connections
hermes query connections --chain latanda-testnet-1

# View channels
hermes query channels --chain latanda-testnet-1

# View clients
hermes query clients --chain latanda-testnet-1
```

## Troubleshooting

### Issue 1: Connection Timeout

**Error**: `Connection timed out`

**Solution**:
```bash
# Check if RPC is accessible
curl https://latanda.online/chain/rpc/status

# Increase timeout in config
rpc_timeout = '30s'
```

### Issue 2: Insufficient Gas

**Error**: `out of gas in location`

**Solution**:
```toml
# Increase max_gas in config
max_gas = 500000

# Or increase gas price
gas_price = { price = 0.05, denom = 'ultd' }
```

### Issue 3: Key Not Found

**Error**: `key relayer not found`

**Solution**:
```bash
# Add key again
hermes keys add --chain latanda-testnet-1 --key-name relayer --mnemonic "your-mnemonic"
```

### Issue 4: Block Height Not Available

**Error**: `height not available`

**Solution**:
```bash
# Wait for node to sync
hermes query chain height --chain latanda-testnet-1
```

### Issue 5: Packet Timeout

**Error**: `packet timeout`

**Solution**:
```bash
# Increase timeout
hermes tx raw ft-transfer ... --timeout-height-offset 2000
```

## Alternative: Go Relayer v2

If you prefer Go Relayer:

```bash
# Install
git clone https://github.com/cosmos/relayer.git
cd relayer
make install

# Initialize
rly config init

# Add chains
rly chains add -f ./configs/la-tanda.json
rly chains add -f ./configs/cosmos-hub-testnet.json

# Add keys
rly keys add latanda-testnet-1
rly keys add theta-testnet-001

# Create connection and channel
rly tx connection latanda-testnet-1 theta-testnet-001
rly tx channel latanda-testnet-001 theta-testnet-001 --port transfer
```

## References

- [Hermes Documentation](https://hermes.informal.systems/)
- [Cosmos IBC Docs](https://ibc.cosmos.network/)
- [La Tanda Chain Guide](./la-tanda-chain-node-guide.md)
- [Cosmos SDK v0.53.6](https://docs.cosmos.network/v0.53/)

## Support

- Discord: https://discord.gg/la-tanda
- Telegram: https://t.me/la-tanda
- GitHub Issues: https://github.com/INDIGOAZUL/la-tanda-web/issues

---

**Author**: Atlas (OpenClaw AI)
**Last Updated**: 2026-03-06
**License**: MIT
