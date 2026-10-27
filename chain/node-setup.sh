#!/bin/bash
# ============================================
# La Tanda Chain — Node Setup Script
# Chain ID: latanda-testnet-1
# Token: LTD (denom: ultd)
# ============================================
set -eo pipefail

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}"
echo "  _          _____              _       "
echo " | |    __ _|_   _|_ _ _ _  __| |__ _  "
echo " | |__ / _\` | | |/ _\` | ' \\/ _\` / _\` | "
echo " |____|\__,_| |_|\__,_|_||_\__,_\__,_| "
echo "                                        "
echo "  Chain Node Setup — latanda-testnet-1   "
echo -e "${NC}"

# ============================================
# 1. System Requirements Check
# ============================================
echo -e "${YELLOW}[1/7] Checking system requirements...${NC}"

# Check OS
if [[ "$(uname)" != "Linux" ]]; then
    echo -e "${RED}Error: This script requires Linux (Ubuntu 22.04+ recommended)${NC}"
    exit 1
fi

# Check minimum RAM (4GB)
TOTAL_RAM=$(free -m | awk '/^Mem:/{print $2}')
if [[ $TOTAL_RAM -lt 3500 ]]; then
    echo -e "${RED}Error: Minimum 4GB RAM required. Found: ${TOTAL_RAM}MB${NC}"
    exit 1
fi

# Check disk space (50GB minimum)
AVAIL_DISK=$(df -BG / | awk 'NR==2{print $4}' | sed 's/G//')
if [[ $AVAIL_DISK -lt 50 ]]; then
    echo -e "${RED}Error: Minimum 50GB free disk required. Found: ${AVAIL_DISK}GB${NC}"
    exit 1
fi

echo -e "${GREEN}  RAM: ${TOTAL_RAM}MB | Disk: ${AVAIL_DISK}GB available | CPU: $(nproc) cores${NC}"

# ============================================
# 2. Install Dependencies
# ============================================
echo -e "${YELLOW}[2/7] Installing system dependencies...${NC}"

sudo apt-get update -qq
sudo apt-get install -y -qq build-essential git curl wget jq ufw > /dev/null 2>&1

echo -e "${GREEN}  Dependencies installed${NC}"

# ============================================
# 3. Install Go 1.25.6
# ============================================
# go.mod of the chain source declares go 1.25.6. Installing an older Go
# makes the toolchain download a newer one silently on first build.
GO_VERSION="1.25.6"
GO_SHA256="f022b6aad78e362bcba9b0b94d09ad58c5a70c6ba3b7582905fababf5fe0181a"

echo -e "${YELLOW}[3/7] Installing Go ${GO_VERSION}...${NC}"

if [[ "$(uname -m)" != "x86_64" ]]; then
    echo -e "${RED}Error: This script installs the linux-amd64 Go archive. Found: $(uname -m)${NC}"
    echo "  Follow chain/testnet-validator-guide.md and pick the archive for your CPU from https://go.dev/dl/"
    exit 1
fi

if command -v go &> /dev/null && [[ "$(go version)" == *"go${GO_VERSION} "* ]]; then
    echo -e "${GREEN}  Go already installed: $(go version)${NC}"
else
    wget -q "https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz" -O /tmp/go.tar.gz
    if ! echo "${GO_SHA256}  /tmp/go.tar.gz" | sha256sum --check --status; then
        rm -f /tmp/go.tar.gz
        echo -e "${RED}  ERROR: Go archive checksum mismatch!${NC}"
        exit 1
    fi
    sudo rm -rf /usr/local/go
    sudo tar -C /usr/local -xzf /tmp/go.tar.gz
    rm /tmp/go.tar.gz

    # Add to PATH
    if ! grep -q '/usr/local/go/bin' ~/.bashrc; then
        echo 'export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin' >> ~/.bashrc
    fi
    export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin

    echo -e "${GREEN}  $(go version)${NC}"
fi

# ============================================
# 4. Build latandad Binary
# ============================================
echo -e "${YELLOW}[4/7] Building latandad binary...${NC}"

BUILD_DIR="/tmp/latanda-build"
SOURCE_TARBALL="/tmp/latanda-chain-source.tar.gz"

rm -rf $BUILD_DIR
mkdir -p $BUILD_DIR
cd $BUILD_DIR

# Download the published chain source. There is no fallback: a scaffold built
# from a different Ignite/SDK version is not guaranteed to match the chain's
# state machine, and the node can fail later with an app hash mismatch.
echo "  Downloading chain source..."
if ! wget -q https://latanda.online/chain/latanda-chain-source.tar.gz -O $SOURCE_TARBALL; then
    # wget -O leaves an empty file behind on failure
    rm -f $SOURCE_TARBALL
    echo -e "${RED}  ERROR: Could not download https://latanda.online/chain/latanda-chain-source.tar.gz${NC}"
    echo "  Check your connection and try again, or ask in the La Tanda Discord."
    exit 1
fi
echo "  Source sha256 (record it in your operations log): $(sha256sum $SOURCE_TARBALL | awk '{print $1}')"

tar -xzf $SOURCE_TARBALL -C $BUILD_DIR
export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin
# go mod download keeps go.mod/go.sum exactly as published (go mod tidy may rewrite them)
go mod download
go build -trimpath -o $BUILD_DIR/latandad ./cmd/latandad
sudo install -o root -g root -m 0755 $BUILD_DIR/latandad /usr/local/bin/latandad

echo -e "${GREEN}  latandad installed: $(latandad version 2>&1 || echo 'built')${NC}"

# ============================================
# 5. Initialize Node
# ============================================
echo -e "${YELLOW}[5/7] Initializing node...${NC}"

# Prompt for moniker
read -p "  Enter your node name (moniker): " MONIKER
if [[ -z "$MONIKER" ]]; then
    MONIKER="latanda-node-$(hostname -s)"
fi

CHAIN_ID="latanda-testnet-1"
HOME_DIR="$HOME/.latanda"

# Initialize
latandad init "$MONIKER" --chain-id $CHAIN_ID --default-denom ultd > /dev/null 2>&1

# Download genesis from genesis node
echo "  Downloading genesis file..."
wget -q https://latanda.online/chain/genesis.json -O $HOME_DIR/config/genesis.json

# Verify genesis
EXPECTED_HASH="98fc9871d6a3b7b12b3f7fcaa1ca3303ffcfad0f209d61355975a15069ac3907"
ACTUAL_HASH=$(sha256sum $HOME_DIR/config/genesis.json | awk '{print $1}')

if [[ "$ACTUAL_HASH" != "$EXPECTED_HASH" ]]; then
    echo -e "${RED}  ERROR: Genesis hash mismatch!${NC}"
    echo "  Expected: $EXPECTED_HASH"
    echo "  Got:      $ACTUAL_HASH"
    exit 1
fi
echo -e "${GREEN}  Genesis verified (hash match)${NC}"

# ============================================
# 6. Configure Node
# ============================================
echo -e "${YELLOW}[6/7] Configuring node...${NC}"

CONFIG_DIR="$HOME_DIR/config"

# Set persistent peers (genesis node)
PEERS="483a8110c3cd93c8dd3801d935151e98656f5b67@168.231.67.201:26656"
sed -i "s|persistent_peers = \"\"|persistent_peers = \"$PEERS\"|" $CONFIG_DIR/config.toml

# Set seed node
sed -i "s|seeds = \"\"|seeds = \"$PEERS\"|" $CONFIG_DIR/config.toml

# Set minimum gas price
sed -i "s|minimum-gas-prices = \"\"|minimum-gas-prices = \"0.001ultd\"|" $CONFIG_DIR/app.toml

# RPC stays on 127.0.0.1:26657 (the default). Exposing it publicly on a
# validator invites abuse; see "Keep RPC bound to loopback" in
# chain/testnet-validator-guide.md.

# Enable API
sed -i '/^\[api\]/,/^\[/ s|enable = false|enable = true|' $CONFIG_DIR/app.toml

echo -e "${GREEN}  Persistent peers: $PEERS${NC}"
echo -e "${GREEN}  Min gas price: 0.001ultd${NC}"

# ============================================
# 7. Firewall & Start
# ============================================
echo -e "${YELLOW}[7/7] Configuring firewall and starting node...${NC}"

# Firewall
sudo ufw allow 26656/tcp comment "La Tanda Chain P2P" > /dev/null 2>&1
echo -e "${GREEN}  Firewall: port 26656 (P2P) opened, RPC 26657 stays local${NC}"

# Start the node
echo ""
echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}  La Tanda Chain Node Ready!${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""
echo -e "  Chain ID:   ${GREEN}$CHAIN_ID${NC}"
echo -e "  Moniker:    ${GREEN}$MONIKER${NC}"
echo -e "  Home:       ${GREEN}$HOME_DIR${NC}"
echo -e "  Node ID:    ${GREEN}$(latandad comet show-node-id 2>/dev/null)${NC}"
echo ""
echo -e "  ${YELLOW}To start the node:${NC}"
echo -e "  ${GREEN}latandad start${NC}"
echo ""
echo -e "  ${YELLOW}To start with PM2 (recommended — keeps it running):${NC}"
echo -e "  ${GREEN}pm2 start latandad --name latanda-chain -- start${NC}"
echo -e "  ${GREEN}pm2 save${NC}"
echo ""
echo -e "  ${YELLOW}To check sync status:${NC}"
echo -e "  ${GREEN}latandad status | jq '.sync_info.catching_up'${NC}"
echo ""
echo -e "  ${YELLOW}To check latest block:${NC}"
echo -e "  ${GREEN}latandad status | jq '.sync_info.latest_block_height'${NC}"
echo ""
echo -e "  The node will sync from the genesis node. Replaying the chain"
echo -e "  from block 1 can take a day or more; see state sync in"
echo -e "  chain/testnet-validator-guide.md for a faster bootstrap."
echo ""
echo -e "  ${CYAN}Welcome to La Tanda Chain!${NC}"
