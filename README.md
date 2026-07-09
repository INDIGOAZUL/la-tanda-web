# La Tanda — Web3 Ecosystem of Honduras

> **Not an app. An ecosystem.**
> Social network + digital tandas + marketplace + mining + native blockchain.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Chain](https://img.shields.io/badge/chain-latanda--testnet--1-00d4ff)](https://latanda.online/chain/)
[![Supply](https://img.shields.io/badge/supply-200M%20LTD%20fixed-ffd700)](https://latanda.online/whitepaper.html)
[![Inflation](https://img.shields.io/badge/inflation-0%25-22c55e)](https://latanda.online/whitepaper.html)
[![Mainnet](https://img.shields.io/badge/mainnet-Q1%202027-8b5cf6)](https://latanda.online/chain/)

This repository is the **public mirror** of the frontend for La Tanda, the first sovereign Web3 ecosystem built in Honduras for Latin America.

---

## 🌐 What is La Tanda

La Tanda is a **Web3 ecosystem with 7 integrated layers**, not a simple savings app. Digital tandas (Rotating Savings and Credit Associations - ROSCA) represent only one of these layers.

### The 7 Layers of the Ecosystem

| # | Layer | Description |
|---|---|---|
| 1 | 💬 **Social Network** | Feed, stories, comments, and reactions. Active engagement builds on-chain reputation. |
| 2 | 🔄 **Digital Tandas** | 0% commission rotating savings groups, on-chain scoring, and embedded lending. |
| 3 | 🛍️ **Web3 Marketplace** | Products, services, and bookings. On-chain Seller Score. Payments in Lempiras or LTD. |
| 4 | ⛏️ **LTD Mining** | 5 activity tiers (1-12 LTD/day), with a global cap of 500 LTD/day. |
| 5 | ⭐ **On-Chain Reputation** | Unified credit score (300-850), portable across all layers, anchored on the blockchain. |
| 6 | 🔗 **La Tanda Chain** | Sovereign Cosmos SDK + CometBFT blockchain, 200M LTD fixed supply, 0% inflation. |
| 7 | 🤖 **MIA AI** | AI assistant with 16 financial capabilities powered by Groq Llama 3.3 70B. |

---

## 📊 Current Status (Live on Testnet)

| Metric | Current Value |
|---|---|
| **Active Monthly Users** | 15,000+ |
| **Active Tandas** | 300+ |
| **Chain Validators** | 13+ |
| **API Endpoints in Production** | 160+ |
| **Active Algorithms** | 14 (fraud, ranking, credit, health, etc.) |
| **Governance Proposals Passed** | 2 (GOV-001, GOV-002) |
| **Testnet Uptime since Q1 2026** | 100% (no consensus incidents) |

All metrics are verifiable against on-chain data or the public developer portal.

---

## 💎 Tokenomics (200M Fixed LTD)

**Model**: Fixed supply + pre-minted Treasury (similar to THORChain), **zero real inflation**.

### Distribution (10 Pools)

| Pool | % | Amount | Usage |
|---|---|---|---|
| Community & Mining | 30% | 60M LTD | User rewards, Incentivized Testnet |
| Staking & Validators | 20% | 40M LTD | Pre-minted rewards (APY 15-25%, ~8 years) |
| Development Fund | 12% | 24M LTD | 6 months cliff + 3 years linear vesting |
| Team & Founders | 12% | 24M LTD | 1 year cliff + 2 years linear vesting |
| Marketing & Partnerships | 6% | 12M LTD | Quarterly allocation based on milestones |
| Seed Round | 5% | 10M LTD | $0.02/LTD, 6-month cliff + 18-month linear vesting |
| Strategic / Private | 5% | 10M LTD | $0.03/LTD, 3-month cliff + 12-month linear vesting |
| Initial TGE Liquidity | 5% | 10M LTD | DEX pools and listings |
| Bug Bounties & Grants | 3% | 6M LTD | Allocated via governance |
| Insurance Fund | 2% | 4M LTD | Managed via emergency governance vote |
| **TOTAL** | **100%** | **200M LTD** | |

**Post-Staking-Pool Sustainability** (post Year 8): Supported by 6 redundant sources including **marketplace commission routing (0.5% GMV → validators)**.

Full Tokenomics Details: [Whitepaper v2.0](https://latanda.online/whitepaper.html) · [Interactive Dashboard](https://latanda.online/ltd-token-economics.html)

---

## 🔗 La Tanda Chain

A sovereign blockchain built with **Cosmos SDK + CometBFT**, specifically designed for community fintech in Latin America.

- **Chain ID (testnet)**: `latanda-testnet-1`
- **Token**: LTD (denom `ultd`, 1 LTD = 1,000,000 ultd)
- **Address Prefix**: `ltd`
- **Block Time**: ~5 seconds
- **Consensus**: CometBFT (Delegated Proof of Stake)
- **Active Validators**: 13+ (Genesis, PRO Delegators, ANODE.TEAM, OwlStake, StakerHouse, UTSA/lesnik, and others)
- **Governance**: Active (2 proposals passed)
- **Mainnet Launch**: Planned Q1 2027
- **Community Explorer**: [exp.utsa.tech/latanda/staking](https://exp.utsa.tech/latanda/staking)

---

## 💻 Development Setup

To run and test the frontend project locally:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/syu-toutousai/la-tanda-web.git
   cd la-tanda-web
   ```
2. **Start a local development server**:
   Serve the static root files locally using `npx serve` (requires Node.js):
   ```bash
   npx serve .
   ```
3. **Open the application**:
   Open your browser and navigate to the local address output by the command (defaults to `http://localhost:3000`).

---

## 📂 Project Structure

The repository is structured as a static Web3 frontend with integrated modules and blockchain configuration files:

- `*.html` - Core pages representing the 7 layers of the La Tanda ecosystem (e.g., `index.html` for landing, `governance.html` for voting portal, `mia.html` for the AI assistant).
- `js/` - Frontend JavaScript modules, including `components-loader.js`, UI state managers, and dashboard integration connectors.
- `css/` - CSS sheets including design tokens, layouts, and component-specific modules.
- `assets/` - Static assets, images, icons, and favicons.
- `chain/` - Resources for La Tanda Chain, including validator seeds, `genesis.json`, and the automated validator installer (`node-setup.sh`).
- `docs/` - Developer documentation, OpenAPI specs, and Swagger UI configurations.
- `api-*.js` - API proxies, endpoints configuration, client definitions (`api-client.js`), and integration handlers (`api-proxy.js`).
- `.github/` - Pull request templates, issue templates, and automatic gatekeeper checks.

---

## 🚀 Quick Start

### For Users
1. Visit [latanda.online](https://latanda.online).
2. Create an account via email or Google Sign-In.
3. Join a tanda, publish in the social feed, start mining LTD, and browse the marketplace.

### For Developers
1. API Documentation: [latanda.online/docs](https://latanda.online/docs)
2. Developer Portal: [latanda.online/dev-dashboard.html](https://latanda.online/dev-dashboard.html)
3. Authentication: Acquire JWT tokens via `/api/auth/login`.

### For Validators (Running a Node)
1. Read the Node Operator Guide: [la-tanda-chain-node-guide.md](./la-tanda-chain-node-guide.md) (or on the [chain portal](https://latanda.online/chain/)).
2. Install via one-liner:
   ```bash
   wget -q https://latanda.online/chain/node-setup.sh -O node-setup.sh && chmod +x node-setup.sh && ./node-setup.sh
   ```

---

## 🤝 Contributing & Bounties

La Tanda operates a **3-tier GitHub Issues bounty program**:

| Tier | Eligibility | Reward |
|---|---|---|
| **Tier 0** | Open to anyone | 10-50 LTD |
| **Tier 1** | 1+ previous merged PR | 50-150 LTD |
| **Tier 2** | 2+ previous merged PRs | 150-500 LTD |

**PR Rules**:
- Each bounty requires answering the codebase verification question inside the PR description.
- Gatekeeper workflows automatically reject PRs without assignment, accounts <30 days old, or users in `ban-list.txt`.
- Sign commits using your verified GitHub email address.

---

## 📚 Resources & Links

- **Main Website**: [latanda.online](https://latanda.online)
- **Developer Portal**: [latanda.online/dev-dashboard.html](https://latanda.online/dev-dashboard.html)
- **API Reference**: [latanda.online/docs](https://latanda.online/docs)
- **Validator Staking Explorer**: [exp.utsa.tech/latanda/staking](https://exp.utsa.tech/latanda/staking)
- **Tokenomics Dashboard**: [latanda.online/ltd-token-economics.html](https://latanda.online/ltd-token-economics.html)
- **Cosmos Forum thread**: [Cosmos Forum #16709](https://forum.cosmos.network/t/la-tanda-chain-incentivized-testnet-live-validators-node-operators-welcome-cosmos-sdk-v0-53-6/16709)
- **Discord Server**: [discord.gg/Ve9M2ZSYC2](https://discord.gg/Ve9M2ZSYC2)
- **Telegram Channel**: [t.me/latandahn](https://t.me/latandahn)
- **Twitter/X**: [@TandaWeb3](https://twitter.com/TandaWeb3)

---

## 📜 License

MIT License — see [LICENSE](./LICENSE).

---

## 🚫 Important Guidelines

- **NEVER** commit `.env` files or credentials (see `.env.example`).
- **NEVER** use `rsync --delete` against this repository.
- **NEVER** modify `api-proxy-enhanced.js` without coordinating with the core dev team.
- Public ban list is available at `.github/ban-list.txt`.
