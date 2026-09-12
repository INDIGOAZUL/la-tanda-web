# La Tanda Testnet Validator Guide

This guide covers the complete validator lifecycle on Ubuntu: host preparation,
node installation, systemd, state sync, wallet and validator creation,
monitoring, maintenance, and recovery.

The network values below were checked against the repository and live endpoints.
Block heights and state-sync trust hashes are intentionally calculated at setup
time because they become stale quickly.

## 1. Network and server requirements

| Item | Value |
| --- | --- |
| Chain ID | `latanda-testnet-1` |
| Address prefix | `ltd` |
| Validator prefix | `ltdvaloper` |
| Base denomination | `ultd` |
| Display denomination | `LTD` |
| Conversion | `1 LTD = 1,000,000 ultd` |
| Home directory | `$HOME/.latanda` |
| P2P port | `26656/tcp` |
| Local RPC port | `26657/tcp` |

Recommended minimum host:

- Ubuntu 22.04 or newer
- 2 CPU cores
- 4 GB RAM
- 50 GB SSD, with room to grow
- A stable public network connection
- A dedicated, non-root service account

Before continuing, confirm the official RPC reports the expected chain:

```bash
curl -fsSL https://latanda.online/chain/rpc/status \
  | jq -r '.result.node_info.network'
```

Expected output: `latanda-testnet-1`.

## 2. Prepare Ubuntu

Update the host and install the required tools:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y build-essential ca-certificates curl git jq wget ufw
```

Create a dedicated account if one does not already exist:

```bash
sudo adduser --disabled-password --gecos "" latanda
sudo install -d -o latanda -g latanda /home/latanda/.latanda
```

Enable a basic firewall. Keep the SSH rule that matches your own setup:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 26656/tcp comment "La Tanda P2P"
sudo ufw enable
sudo ufw status
```

RPC port `26657` should remain local unless you intentionally operate a public
RPC service with separate access controls and rate limiting.

## 3. Install Go

The current chain source declares Go 1.25.6 in `go.mod`. For an amd64 host:

```bash
cd /tmp
wget -q https://go.dev/dl/go1.25.6.linux-amd64.tar.gz -O go.tar.gz
GO_SHA256="f022b6aad78e362bcba9b0b94d09ad58c5a70c6ba3b7582905fababf5fe0181a"
echo "$GO_SHA256  go.tar.gz" | sha256sum --check
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf go.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin' >> "$HOME/.profile"
export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin
go version
```

For another CPU architecture, select the matching archive and checksum from
<https://go.dev/dl/> instead of using the amd64 values above.

## 4. Build `latandad`

Build from the source bundle published by La Tanda:

```bash
sudo -iu latanda
export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin
mkdir -p "$HOME/src/latanda"
cd "$HOME/src/latanda"
wget -q https://latanda.online/chain/latanda-chain-source.tar.gz \
  -O latanda-chain-source.tar.gz
tar -xzf latanda-chain-source.tar.gz
go mod download
go build -trimpath -o "$HOME/go/bin/latandad" ./cmd/latandad
"$HOME/go/bin/latandad" version --long
exit
sudo install -o root -g root -m 0755 \
  /home/latanda/go/bin/latandad /usr/local/bin/latandad
latandad version --long
```

Record the reported version and commit in your operations log before upgrading
or joining the validator set.

## 5. Initialize the chain home

Choose a public moniker and initialize the node as the service account:

```bash
sudo -iu latanda
MONIKER="replace-with-your-validator-name"
latandad init "$MONIKER" \
  --chain-id latanda-testnet-1 \
  --default-denom ultd
```

Initialization creates node and validator keys. Do not publish, paste, or send
the contents of these files:

- `~/.latanda/config/node_key.json`
- `~/.latanda/config/priv_validator_key.json`

## 6. Install and verify genesis

Download genesis and verify the repository-published hash:

```bash
wget -q https://latanda.online/chain/genesis.json \
  -O "$HOME/.latanda/config/genesis.json"
GENESIS_SHA256="98fc9871d6a3b7b12b3f7fcaa1ca3303ffcfad0f209d61355975a15069ac3907"
echo "$GENESIS_SHA256  $HOME/.latanda/config/genesis.json" | sha256sum --check
jq -r '.chain_id' "$HOME/.latanda/config/genesis.json"
```

Stop if either check fails. Do not start from an unverified genesis file.

## 7. Configure peers and application settings

The official peer ID and address are published by the repository:

```bash
PEERS="483a8110c3cd93c8dd3801d935151e98656f5b67@168.231.67.201:26656"
CONFIG="$HOME/.latanda/config/config.toml"
APP="$HOME/.latanda/config/app.toml"

sed -i "s|^persistent_peers *=.*|persistent_peers = \"$PEERS\"|" "$CONFIG"
sed -i "s|^seeds *=.*|seeds = \"$PEERS\"|" "$CONFIG"
sed -i 's|^minimum-gas-prices *=.*|minimum-gas-prices = "0.001ultd"|' "$APP"
```

Keep RPC bound to loopback on a validator:

```bash
grep -n 'laddr = "tcp://127.0.0.1:26657"' "$CONFIG"
```

## 8. Install the systemd service

Leave the `latanda` shell, then create the service as an administrator:

```bash
exit
sudo tee /etc/systemd/system/latandad.service >/dev/null <<'EOF'
[Unit]
Description=La Tanda testnet validator
Documentation=https://latanda.online/chain/
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=latanda
Group=latanda
ExecStart=/usr/local/bin/latandad start --home /home/latanda/.latanda
Restart=on-failure
RestartSec=5
LimitNOFILE=65535
TimeoutStopSec=90
KillSignal=SIGINT

[Install]
WantedBy=multi-user.target
EOF

sudo systemd-analyze verify /etc/systemd/system/latandad.service
sudo systemctl daemon-reload
sudo systemctl enable latandad
```

Do not start the service until normal sync or state sync is configured.

## 9. Choose normal sync or state sync

Normal sync replays the chain from genesis. It is the simplest path, but can
take longer as the chain grows:

```bash
sudo systemctl start latandad
sudo journalctl -u latandad -f
```

Use state sync for a faster bootstrap only when two independent RPC providers
return the same trust hash.

## 10. Configure state sync safely

The following commands derive a recent trust height and compare the hash from
the official RPC and an independent community RPC:

```bash
sudo systemctl stop latandad
sudo -iu latanda

# Required if this home has already started normal sync. This preserves config
# and keys, but removes block data. Back up signing state first for a validator.
if [ -f "$HOME/.latanda/data/priv_validator_state.json" ]; then
  cp "$HOME/.latanda/data/priv_validator_state.json" \
    "$HOME/priv_validator_state.json.$(date +%s).bak"
fi
latandad comet unsafe-reset-all --home "$HOME/.latanda"

RPC1="https://latanda.online/chain/rpc"
RPC2="https://t-latanda.rpc.utsa.tech"
LATEST_HEIGHT=$(curl -fsSL "$RPC1/status" \
  | jq -r '.result.sync_info.latest_block_height')
TRUST_HEIGHT=$((LATEST_HEIGHT - 2000))
TRUST_HASH_1=$(curl -fsSL "$RPC1/block?height=$TRUST_HEIGHT" \
  | jq -r '.result.block_id.hash')
TRUST_HASH_2=$(curl -fsSL "$RPC2/block?height=$TRUST_HEIGHT" \
  | jq -r '.result.block_id.hash')

printf 'height=%s\nofficial=%s\ncommunity=%s\n' \
  "$TRUST_HEIGHT" "$TRUST_HASH_1" "$TRUST_HASH_2"
test -n "$TRUST_HASH_1" && test "$TRUST_HASH_1" = "$TRUST_HASH_2"
```

If the final command fails, stop and investigate. Do not choose one hash.

Apply the verified values:

```bash
CONFIG="$HOME/.latanda/config/config.toml"
sed -i '/^\[statesync\]/,/^\[/ s|^enable *=.*|enable = true|' "$CONFIG"
sed -i "/^\[statesync\]/,/^\[/ \
  s|^rpc_servers *=.*|rpc_servers = \"$RPC1,$RPC2\"|" "$CONFIG"
sed -i "/^\[statesync\]/,/^\[/ \
  s|^trust_height *=.*|trust_height = $TRUST_HEIGHT|" "$CONFIG"
sed -i "/^\[statesync\]/,/^\[/ \
  s|^trust_hash *=.*|trust_hash = \"$TRUST_HASH_1\"|" "$CONFIG"

grep -A 12 '^\[statesync\]' "$CONFIG"
exit
sudo systemctl start latandad
sudo journalctl -u latandad -f
```

Trust values expire. Recalculate them whenever you restart a failed bootstrap.

## 11. Verify node sync

Check service health, local RPC, height movement, and peer count:

```bash
sudo systemctl status latandad --no-pager
curl -fsSL http://127.0.0.1:26657/status \
  | jq '.result.sync_info | {latest_block_height, catching_up}'
sleep 10
curl -fsSL http://127.0.0.1:26657/status \
  | jq -r '.result.sync_info.latest_block_height'
curl -fsSL http://127.0.0.1:26657/net_info \
  | jq -r '.result.n_peers'
```

The height should increase and `catching_up` must become `false` before validator
creation.

## 12. Create and protect a wallet

Use the OS keyring where available. The `file` backend is a portable fallback
that encrypts the local key store with a password:

```bash
sudo -iu latanda
KEY_NAME="validator"
latandad keys add "$KEY_NAME" --keyring-backend file
latandad keys show "$KEY_NAME" -a --keyring-backend file
```

Write the recovery phrase offline during creation. Never store it in shell
history, screenshots, issue comments, chat, source control, or monitoring logs.
The public `ltd...` address is safe to share when requesting testnet tokens.

To restore an existing wallet interactively:

```bash
latandad keys add "$KEY_NAME" --recover --keyring-backend file
```

## 13. Request testnet LTD and verify the balance

Join the project Discord at <https://discord.gg/Ve9M2ZSYC2> and request testnet
LTD for the public address printed above. Never send a recovery phrase or
private key to a faucet operator.

Verify receipt from the local node:

```bash
ADDRESS=$(latandad keys show "$KEY_NAME" -a --keyring-backend file)
latandad query bank balances "$ADDRESS" --node http://127.0.0.1:26657
```

Request 10 testnet LTD from the faucet to create the validator. After the
validator is running, complete the control-proof flow in Discord:

1. `!register-validator`
2. `!verify`
3. `!verify-rdns <ip>` (or the HTTP nonce alternative)
4. Run for seven days without being jailed
5. Sign the requested batch

Successful operators receive a genesis delegation according to their approved
tier: 500 LTD for a full node, 2,000 LTD for a validator, or 5,000 LTD for an
infrastructure partner that provides public RPC, API, and state-sync services.
Confirm the current program status with the team before broadcasting a
transaction.

## 14. Create the validator

First confirm sync and obtain the consensus public key:

```bash
test "$(curl -fsSL http://127.0.0.1:26657/status \
  | jq -r '.result.sync_info.catching_up')" = "false"
latandad comet show-validator
```

Cosmos SDK 0.53 expects validator details in a JSON file. Generate it without
hand-copying the consensus public key:

```bash
PUBKEY=$(latandad comet show-validator)
jq -n --argjson pubkey "$PUBKEY" '{
  pubkey: $pubkey,
  amount: "10000000ultd",
  moniker: "replace-with-your-validator-name",
  identity: "",
  website: "",
  security: "",
  details: "La Tanda testnet validator",
  "commission-rate": "0.10",
  "commission-max-rate": "0.20",
  "commission-max-change-rate": "0.01",
  "min-self-delegation": "1"
}' > "$HOME/validator.json"
jq . "$HOME/validator.json"
```

Review every field, confirm the current staking requirement with the team, then
enter the keyring password and broadcast:

```bash
latandad tx staking create-validator "$HOME/validator.json" \
  --chain-id latanda-testnet-1 \
  --from "$KEY_NAME" \
  --keyring-backend file \
  --gas auto \
  --gas-adjustment 1.5 \
  --fees 5000ultd
```

Save the transaction hash. Confirm success before treating the validator as
created:

```bash
latandad query tx <transaction-hash> --output json | jq '{code,raw_log,height}'
VALOPER=$(latandad keys show "$KEY_NAME" \
  --bech val --address --keyring-backend file)
latandad query staking validator "$VALOPER"
```

## 15. Validator management

Edit public metadata:

```bash
latandad tx staking edit-validator \
  --new-moniker "new-name" \
  --details "Updated validator description" \
  --from "$KEY_NAME" \
  --keyring-backend file \
  --chain-id latanda-testnet-1 \
  --gas auto --gas-adjustment 1.5 --fees 5000ultd
```

Delegate, withdraw rewards, or unbond only after reviewing the amounts:

```bash
latandad tx staking delegate "$VALOPER" 1000000ultd \
  --from "$KEY_NAME" --keyring-backend file \
  --chain-id latanda-testnet-1 --gas auto --gas-adjustment 1.5 --fees 5000ultd

latandad tx distribution withdraw-rewards "$VALOPER" --commission \
  --from "$KEY_NAME" --keyring-backend file \
  --chain-id latanda-testnet-1 --gas auto --gas-adjustment 1.5 --fees 5000ultd

latandad tx staking unbond "$VALOPER" 1000000ultd \
  --from "$KEY_NAME" --keyring-backend file \
  --chain-id latanda-testnet-1 --gas auto --gas-adjustment 1.5 --fees 5000ultd
```

Check jail and signing state before attempting an unjail transaction:

```bash
CONS_PUBKEY=$(latandad comet show-validator)
latandad query slashing signing-info "$CONS_PUBKEY"

latandad tx slashing unjail \
  --from "$KEY_NAME" --keyring-backend file \
  --chain-id latanda-testnet-1 --gas auto --gas-adjustment 1.5 --fees 5000ultd
```

An unjail transaction does not fix the cause of downtime. Confirm the node is
caught up, has peers, and is signing before broadcasting it.

## 16. Monitoring and health checks

Start with systemd and CometBFT signals:

```bash
sudo systemctl is-active latandad
sudo journalctl -u latandad --since "15 minutes ago" --no-pager
curl -fsSL http://127.0.0.1:26657/status \
  | jq '.result.sync_info | {latest_block_height, catching_up, latest_block_time}'
curl -fsSL http://127.0.0.1:26657/net_info \
  | jq '.result | {listening, n_peers}'
```

Compare local and reference heights:

```bash
LOCAL_HEIGHT=$(curl -fsSL http://127.0.0.1:26657/status \
  | jq -r '.result.sync_info.latest_block_height')
REMOTE_HEIGHT=$(curl -fsSL https://latanda.online/chain/rpc/status \
  | jq -r '.result.sync_info.latest_block_height')
echo "local=$LOCAL_HEIGHT remote=$REMOTE_HEIGHT lag=$((REMOTE_HEIGHT-LOCAL_HEIGHT))"
```

Monitor the validator record and recent signing history:

```bash
latandad query staking validator "$VALOPER" --output json \
  | jq '{status, jailed, tokens, delegator_shares, description}'
latandad query slashing signing-info "$CONS_PUBKEY" --output json
```

Useful alert conditions include:

- systemd service is not active
- `catching_up` changes to `true`
- block height stops increasing
- peer count reaches zero
- validator becomes jailed
- disk usage exceeds 80 percent
- repeated consensus or database errors appear in the journal

## 17. Troubleshooting and recovery

### Service will not start

```bash
sudo systemctl status latandad --no-pager
sudo journalctl -u latandad -n 100 --no-pager
sudo -u latanda test -r /home/latanda/.latanda/config/genesis.json
sudo -u latanda /usr/local/bin/latandad version --long
```

Look for a wrong home path, permissions, genesis mismatch, port conflict, or a
binary built for the wrong architecture.

### No peers

```bash
curl -fsSL http://127.0.0.1:26657/net_info | jq '.result.n_peers'
nc -vz 168.231.67.201 26656
sudo ufw status
grep -E '^(seeds|persistent_peers)' /home/latanda/.latanda/config/config.toml
```

### State sync fails

Stop the service and inspect the error first. Then recalculate a new trust
height and matching hash using Section 10. Do not reuse an expired trust pair.

If a failed state-sync attempt wrote partial data, back up the validator state
before resetting:

```bash
sudo systemctl stop latandad
sudo -iu latanda
cp "$HOME/.latanda/data/priv_validator_state.json" \
  "$HOME/priv_validator_state.json.$(date +%s).bak"
latandad comet unsafe-reset-all --home "$HOME/.latanda"
exit
```

Reapply fresh state-sync values and start the service. Never delete or replace
`priv_validator_key.json` while the validator is active.

### Database corruption or disk replacement

1. Stop `latandad`.
2. Preserve `config/priv_validator_key.json`, `config/node_key.json`, and
   `data/priv_validator_state.json` securely.
3. Verify there is no second server signing with the same validator key.
4. Rebuild or reinstall the same approved binary version.
5. Restore the three files with owner `latanda:latanda` and mode `600`.
6. Sync from genesis, a trusted snapshot, or state sync.
7. Start only one signer and monitor missed blocks.

Running two nodes with the same validator key at the same time can cause double
signing and slashing.

## 18. Security and maintenance checklist

Secure key material:

```bash
sudo chown latanda:latanda \
  /home/latanda/.latanda/config/node_key.json \
  /home/latanda/.latanda/config/priv_validator_key.json \
  /home/latanda/.latanda/data/priv_validator_state.json
sudo chmod 600 \
  /home/latanda/.latanda/config/node_key.json \
  /home/latanda/.latanda/config/priv_validator_key.json \
  /home/latanda/.latanda/data/priv_validator_state.json
```

Routine operations:

```bash
# Logs
sudo journalctl -u latandad -f
sudo journalctl --disk-usage

# Disk and memory
df -h /home/latanda/.latanda
free -h

# Restart after a planned configuration change
sudo systemctl restart latandad
sudo systemctl status latandad --no-pager

# Binary checksum for the operations log
sha256sum /usr/local/bin/latandad
```

Before an upgrade:

1. Read the maintainer's release and target-height announcement.
2. Record the old binary version and checksum.
3. Back up validator key and signing state offline.
4. Build and verify the announced source revision.
5. Replace the binary during the announced window.
6. Confirm height movement, peers, sync status, and signing after restart.

Do not perform unattended upgrades of the validator binary.

## Command cheat sheet

- Service status: `sudo systemctl status latandad`
- Follow logs: `sudo journalctl -u latandad -f`
- Local status: `curl -s http://127.0.0.1:26657/status | jq`
- Peer count: use the `net_info` command from Section 16.
- Node ID: `latandad comet show-node-id`
- Validator public key: `latandad comet show-validator`
- Wallet address: `latandad keys show validator -a --keyring-backend file`
- Account balance: `latandad query bank balances <ltd-address>`
- Validator record: `latandad query staking validator <ltdvaloper-address>`
- Governance proposals: `latandad query gov proposals`

## Verified resources

- Chain dashboard: <https://latanda.online/chain/>
- Official RPC: <https://latanda.online/chain/rpc/>
- Official REST API: <https://latanda.online/chain/api/>
- Genesis: <https://latanda.online/chain/genesis.json>
- Setup script: <https://latanda.online/chain/node-setup.sh>
- Community RPC: <https://t-latanda.rpc.utsa.tech>
- Community RPC: <https://latanda-rpc.latanda-node.uk>
- Project Discord: <https://discord.gg/Ve9M2ZSYC2>

Recheck live endpoints before every new deployment. A URL responding today does
not guarantee it will remain the preferred endpoint for the lifetime of a
validator.
