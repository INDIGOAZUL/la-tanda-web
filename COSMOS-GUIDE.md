# IBC Relayer Setup Guide: La Tanda Testnet (`latanda-testnet-1`)

This guide provides a comprehensive walkthrough for setting up an IBC Relayer using **Hermes** (recommended for Cosmos SDK v0.50+) to connect the La Tanda Testnet with other Cosmos-based chains.

## 1. Prerequisites

- **Hardware**: 2 CPU, 4GB RAM, 50GB SSD.
- **OS**: Ubuntu 22.04 or later.
- **Dependencies**: `curl`, `jq`, `git`, `make`, `gcc`.
- **Go**: v1.22+ (if building from source).

## 2. Installation (Hermes)

Download the latest Hermes binary:

```bash
wget https://github.com/informalsystems/hermes/releases/download/v1.10.3/hermes-v1.10.3-x86_64-unknown-linux-gnu.tar.gz
tar -xvf hermes-v1.10.3-x86_64-unknown-linux-gnu.tar.gz
sudo mv hermes /usr/local/bin/
```

Verify installation:
```bash
hermes version
```

## 3. Configuration

Create the Hermes config directory and file:

```bash
mkdir -p $HOME/.hermes
nano $HOME/.hermes/config.toml
```

### `config.toml`

```toml
[global]
log_level = 'info'

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
host = '127.0.0.1'
port = 3000

[telemetry]
enabled = true
host = '127.0.0.1'
port = 3001

[[chains]]
id = 'latanda-testnet-1'
type = 'CosmosSdk'
rpc_addr = 'https://latanda.online/chain/rpc/'
grpc_addr = 'http://168.231.67.201:9090'
event_source = { mode = 'push', url = 'wss://latanda.online/chain/rpc/websocket', batch_delay = '500ms' }
rpc_timeout = '10s'
account_prefix = 'ltd'
key_name = 'relayer-key'
store_prefix = 'ibc'
default_gas = 100000
max_gas = 400000
gas_price = { price = 0.025, denom = 'ultd' }
gas_multiplier = 1.1
max_msg_num = 30
max_tx_size = 2097152
clock_drift = '5s'
max_block_time = '30s'
trusting_period = '14days'
trust_threshold = { numerator = '1', denominator = '3' }
address_type = { derivation = 'cosmos' }
```

## 4. Wallet Setup

Restore your relayer wallet:

```bash
hermes keys add --chain latanda-testnet-1 --mnemonic-file mnemonic.txt
```

## 5. Channel Creation

Create a connection and channel between La Tanda and a counterparty chain (replace `counterparty-chain-id`):

```bash
hermes create channel --a-chain latanda-testnet-1 --b-chain <counterparty-chain-id> --a-port transfer --b-port transfer --new-client-connection
```

## 6. Systemd Service

Create a systemd unit for persistent relaying:

```ini
[Unit]
Description=Hermes IBC Relayer
After=network-online.target

[Service]
User=$USER
ExecStart=/usr/local/bin/hermes start
Restart=always
RestartSec=3
LimitNOFILE=4096

[Install]
WantedBy=multi-user.target
```

## 7. Troubleshooting

1. **RPC Timeout**: Increase `rpc_timeout` in `config.toml` if the network is slow.
2. **Account Sequence Mismatch**: Restart Hermes to reset local sequence tracking.
3. **Insufficient Funds**: Ensure the relayer address has `ultd` tokens for gas.
4. **Client Expired**: Re-create the client if the `trusting_period` has passed without an update.
5. **Websocket Disconnection**: Check if `wss://latanda.online/chain/rpc/websocket` is reachable from your server.
