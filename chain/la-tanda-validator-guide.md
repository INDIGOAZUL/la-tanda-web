# La Tanda Testnet 鈥?Complete Validator Guide

**Chain ID:** `latanda-testnet-1`
**Token:** LTD (micro-unit: `ultd`, 1 LTD = 1,000,000 ultd)
**Consensus:** CometBFT (Tendermint)
**Block Time:** ~5 seconds

---

## 1. Server Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| OS | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |
| CPU | 2 cores | 4 cores |
| RAM | 4 GB | 8 GB |
| Disk | 50 GB SSD | 100 GB SSD |
| Network | 10 Mbps | 100 Mbps |

Open firewall port `26656` for P2P communication.

---

## 2. System Preparation

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential git curl wget jq ufw unzip lz4

# Configure firewall
sudo ufw allow 22/tcp
sudo ufw allow 26656/tcp
sudo ufw enable
```

---

## 3. Install Go

```bash
GO_VERSION="1.24.1"
wget -q "https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz" -O /tmp/go.tar.gz
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf /tmp/go.tar.gz
rm /tmp/go.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin' >> ~/.bashrc
source ~/.bashrc
go version
```

---

## 4. Install La Tanda Binary

```bash
# Download and build
cd /tmp
wget -q https://latanda.online/chain/latanda-chain-source.tar.gz
tar -xzf latanda-chain-source.tar.gz
cd latanda-chain
make install

# Verify
latandad version
```

---

## 5. Initialize the Node

```bash
# Set moniker (your validator display name)
MONIKER="your-validator-name"
latandad init $MONIKER --chain-id latanda-testnet-1

# Download genesis
wget -q https://latanda.online/chain/genesis.json -O $HOME/.latanda/config/genesis.json

# Verify genesis hash
sha256sum $HOME/.latanda/config/genesis.json
```

---

## 6. Configure Peers & Seeds

```bash
# Set minimum gas prices
sed -i 's/minimum-gas-prices = ""/minimum-gas-prices = "0.001ultd"/' $HOME/.latanda/config/app.toml

# Configure persistent peers
PEERS="REPLACE_WITH_ACTUAL_PEERS@peer1.latanda.online:26656"
sed -i "s/persistent_peers = \"\"/persistent_peers = \"$PEERS\"/" $HOME/.latanda/config/config.toml

# Configure seeds
SEEDS="REPLACE_WITH_ACTUAL_SEEDS@seed.latanda.online:26656"
sed -i "s/seeds = \"\"/seeds = \"$SEEDS\"/" $HOME/.latanda/config/config.toml
```

---

## 7. State Sync Configuration

Add this to `$HOME/.latanda/config/config.toml` for fast sync:

```toml
[statesync]
enable = true
rpc_servers = "REPLACE_RPC_1:26657,REPLACE_RPC_2:26657"
trust_height = REPLACE_TRUST_HEIGHT
trust_hash = "REPLACE_TRUST_HASH"
trust_period = "168h"
discovery_time = "30s"
temp_dir = ""
chunk_request_timeout = "30s"
chunk_fetchers = "4"
```

To get the latest trust height and hash:
```bash
curl -s https://latanda-api.latanda.online:26657/block | jq -r '.result.block.header.height'
curl -s https://latanda-api.latanda.online:26657/block?height=TRUST_HEIGHT | jq -r '.result.block_id.hash'
```

---

## 8. Systemd Service

Create `/etc/systemd/system/latandad.service`:

```ini
[Unit]
Description=La Tanda Testnet Node
After=network-online.target

[Service]
User=$USER
ExecStart=$(which latandad) start
Restart=on-failure
RestartSec=3
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable latandad
sudo systemctl start latandad
```

Check status:
```bash
sudo journalctl -u latandad -f -o cat
```

---

## 9. Wait for Sync

Monitor sync progress:

```bash
# Check if catching up
latandad status 2>&1 | jq -r '.sync_info.catching_up'

# Check latest block height vs network
curl -s localhost:26657/status | jq -r '.result.sync_info.latest_block_height'
```

Wait until `catching_up` returns `false` before proceeding.

---

## 10. Create Wallet

```bash
# Create a new wallet
latandad keys add validator-wallet

# Or restore existing
latandad keys add validator-wallet --recover

# Get testnet tokens from faucet
# Visit https://latanda.online/faucet or request in Discord
```

---

## 11. Create Validator

Once synced and wallet funded:

```bash
latandad tx staking create-validator \
  --amount=1000000ultd \
  --pubkey=$(latandad tendermint show-validator) \
  --moniker="your-validator-name" \
  --chain-id=latanda-testnet-1 \
  --commission-rate="0.10" \
  --commission-max-rate="0.20" \
  --commission-max-change-rate="0.01" \
  --min-self-delegation=1 \
  --gas=auto \
  --gas-adjustment=1.3 \
  --from=validator-wallet \
  -y
```

Verify:
```bash
latandad query staking validator $(latandad keys show validator-wallet --bech val -a)
```

---

## 12. Monitoring Commands

```bash
# Node status
latandad status 2>&1 | jq

# Validator info
latandad query staking validator $(latandad keys show validator-wallet --bech val -a)

# Check blocks
curl -s localhost:26657/status | jq '.result.sync_info'

# Peer count
curl -s localhost:26657/net_info | jq '.result.n_peers'

# Disk usage
du -sh $HOME/.latanda/data/

# Memory usage
ps aux | grep latandad
```

---

## 13. Maintenance

### Unjail (if validator gets jailed)

```bash
latandad tx slashing unjail --from=validator-wallet --chain-id=latanda-testnet-1 --gas=auto -y
```

### Upgrade binary

```bash
# Stop service
sudo systemctl stop latandad

# Backup data
cp -r $HOME/.latanda/data $HOME/latanda_backup_$(date +%Y%m%d)

# Download new binary
cd /tmp/latanda-build
wget -q https://latanda.online/chain/latanda-chain-source.tar.gz
tar -xzf latanda-chain-source.tar.gz
cd latanda-chain
make install

# Restart
sudo systemctl start latandad
```

### Prune old data

```bash
latandad tendermint unsafe-reset-all --keep-addr-book
```

---

## 14. Troubleshooting

| Problem | Solution |
|---------|----------|
| Node won't start | Check logs: `journalctl -u latandad -n 50` |
| Stuck syncing | Check peers: `curl -s localhost:26657/net_info` |
| Wrong block hash | Reset: `latandad tendermint unsafe-reset-all` and resync |
| Out of disk | Prune: `latandad tendermint unsafe-reset-all` or increase disk |
| Validator jailed | Check uptime and unjail immediately |
| Port closed | Verify: `sudo ufw status` and `telnet localhost 26656` |

For further help, join the [La Tanda Discord](https://discord.gg/latanda) or open an issue on GitHub.
