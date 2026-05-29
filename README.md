# La Tanda — Web3 Ecosystem of Honduras

> **Not an app. An ecosystem.**
> Social network + digital tandas (ROSCA) + marketplace + mining + sovereign blockchain.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Chain](https://img.shields.io/badge/chain-latanda--testnet--1-00d4ff)](https://latanda.online/chain/)
[![Supply](https://img.shields.io/badge/supply-200M%20LTD%20fixed-ffd700)](https://latanda.online/whitepaper.html)
[![Inflation](https://img.shields.io/badge/inflation-0%25-22c55e)](https://latanda.online/whitepaper.html)
[![Mainnet](https://img.shields.io/badge/mainnet-Q1%202027-8b5cf6)](https://latanda.online/chain/)

This repository is the **public mirror** of the La Tanda frontend — the first sovereign Web3 ecosystem built in Honduras for Latin America.

---

## 🌐 What is La Tanda

La Tanda is a **Web3 ecosystem with 7 integrated layers** — not just a simple tanda (ROSCA) app. Think of it as Amazon to e-commerce: much more than a single product.

### The 7 ecosystem layers

| # | Layer | What it does |
|---|---|---|
| 1 | 💬 **Social Network** | Feed, stories, comments, reactions. Your time generates on-chain reputation. |
| 2 | 🔄 **Digital Tandas** | 0% fee rotating savings groups, on-chain score, integrated loans |
| 3 | 🛍️ **Web3 Marketplace** | Products, services, bookings. On-chain Seller Score. Payments in Lempiras or LTD |
| 4 | ⛏️ **LTD Mining** | 5 tiers (1-12 LTD/day), 500 LTD/day global cap, earn from real activity |
| 5 | ⭐ **On-Chain Reputation** | Unified financial score 300-850, portable across layers, anchored on-chain |
| 6 | 🔗 **La Tanda Chain** | Sovereign Cosmos SDK + CometBFT blockchain, 200M LTD fixed supply, 0% inflation |
| 7 | 🤖 **MIA AI** | Financial assistant with 16 capabilities (Groq Llama 3.3 70B) |

---

## 📊 Current Status (live on testnet)

| Metric | Current Value |
|---|---|
| **Monthly active users** | 15,000+ |
| **Active tandas** | 300+ |
| **Chain validators** | 13+ |
| **API endpoints in production** | 160+ |
| **Production algorithms** | 14 (fraud, ranking, credit, health, etc.) |
| **Governance proposals passed** | 2 (GOV-001, GOV-002) |
| **Testnet uptime since Q1 2026** | 100% (no consensus incidents) |

All metrics are verifiable against on-chain data or the public dev portal.

---

## 💎 Tokenomics (200M LTD fixed supply)

**Model**: Fixed supply + pre-minted Treasury (similar to THORChain), **zero inflation**.

### Distribution (10 pools)

| Pool | % | Amount | Use |
|---|---|---|---|
| Community & Mining | 30% | 60M LTD | User rewards, Incentivized Testnet |
| Staking & Validators | 20% | 40M LTD | Pre-minted rewards (APY 15-25%, ~8 years) |
| Development Fund | 12% | 24M LTD | 6 month cliff + 3 year linear |
| Team & Founders | 12% | 24M LTD | 1 year cliff + 2 year linear |
| Marketing & Partnerships | 6% | 12M LTD | Quarterly by milestones |
| Seed Round | 5% | 10M LTD | $0.02/LTD, 6mo cliff + 18mo linear |
| Strategic / Private | 5% | 10M LTD | $0.03/LTD, 3mo cliff + 12mo linear |
| Initial Liquidity TGE | 5% | 10M LTD | DEX pools + listings |
| Bug Bounties & Grants | 3% | 6M LTD | Via governance |
| Insurance Fund | 2% | 4M LTD | Emergency governance vote |
| **TOTAL** | **100%** | **200M LTD** | |

**Post-staking-pool sustainability** (post year 8): 6 redundant sources including **marketplace commission routing (0.5% GMV → validators)**.

Full tokenomics: [Whitepaper v2.0](https://latanda.online/whitepaper.html) · [Interactive page](https://latanda.online/ltd-token-economics.html)

---

## 🔗 La Tanda Chain

Sovereign blockchain built with **Cosmos SDK + CometBFT**, designed for community fintech in Latin America.

- **Chain ID (testnet)**: `latanda-testnet-1`
- **Token**: LTD (denom `ultd`, 1 LTD = 1,000,000 ultd)
- **Address prefix**: `ltd`
- **Block time**: ~5 seconds
- **Consensus**: CometBFT (BFT, Delegated Proof of Stake)
- **Active validators**: 13+
- **Governance**: active, 2 proposals passed
- **Mainnet**: Q1 2027 (target)
- **Explorer (community)**: https://exp.utsa.tech/latanda/staking

---

## 🚀 Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or later
- A modern web browser (Chrome, Firefox, Edge)

### Local Development

```bash
# Clone the repository
git clone https://github.com/INDIGOAZUL/la-tanda-web.git
cd la-tanda-web

# Serve locally (no build step required — pure HTML/JS/CSS)
npx serve .

# Or use Python's built-in HTTP server
python3 -m http.server 8080
```

Then open `http://localhost:8080` (or the port shown by `npx serve`).

> **Note**: This is a static frontend. API calls to `https://latanda.online` require network access. For local testing without API calls, the UI will render with simulated/demo data.

---

## 📁 Project Structure

```
la-tanda-web/
├── *.html                    # Ecosystem pages (60+ files)
├── css/                      # Styles (design tokens, components, modules)
├── js/                       # JavaScript (component loader, utilities, core logic)
│   ├── components/           # Reusable UI components
│   └── core/                 # Core application logic
├── assets/                   # Images, logos, favicons
├── chain/                    # La Tanda Chain resources (node setup, genesis)
├── docs/                     # OpenAPI spec + Swagger UI
├── components/               # HTML components
├── middleware/               # Express-like middleware
├── html/                     # Additional HTML templates
├── i18n/                     # Internationalization files
├── translations/             # Translation JSON files
├── utils/                    # Utility scripts
├── packages/                 # NPM packages
├── .github/                  # Bounty templates, PR gatekeeper
└── api-*.js                  # API adapters and proxies
```

### Key files
- `index.html` — Landing page with 3D cosmic hero + tokenomics donut
- `web3-dashboard.html` — Authenticated user dashboard
- `marketplace-social.js` — Marketplace social features (at root, not in `js/`)
- `api-adapter.js` — Main API adapter that intercepts and routes all API calls
- `auth.html` — Authentication page (login/signup)

---

## 🚀 Quick Start

### For users (non-technical)
1. Go to [latanda.online](https://latanda.online)
2. Create an account (email or Google Sign-In)
3. Join a tanda, post on the feed, mine LTD, explore the marketplace

### For developers (integrate with La Tanda API)
1. API Documentation: https://latanda.online/docs
2. Dev portal: https://latanda.online/dev-dashboard.html
3. Authentication: JWT via `/api/auth/login`
4. 160+ production endpoints

### For validators (run a node)
1. Read the guide: [Node setup](https://latanda.online/la-tanda-chain-node-guide.md)
2. One-line install: `wget -q https://latanda.online/chain/node-setup.sh -O node-setup.sh && chmod +x node-setup.sh && ./node-setup.sh`
3. Chain page with seeds: https://latanda.online/chain/
4. Join the Incentivized Testnet Program

---

## 🤝 How to Contribute

La Tanda has a **3-tier bounty system** on GitHub Issues:

| Tier | Who can | Reward |
|---|---|---|
| **Tier 0** | Anyone | 10-50 LTD |
| **Tier 1** | 1+ previous merge | 50-150 LTD |
| **Tier 2** | 2+ previous merges | 150-500 LTD |

- Each bounty requires answering a codebase verification question
- PR Gatekeeper auto-rejects: PRs without assignment, accounts <30 days, banned users
- Labels: `tier-0`, `tier-1`, `tier-2`

**Before opening a PR**:
1. Read `CONTRIBUTING.md` + `.github/ban-list.txt` (if they exist)
2. Answer the verification question on the bounty issue
3. Sign commits with your verified GitHub email
4. One PR = one bounty

---

## 📚 Resources

### Public documentation
- 🌐 Website: [latanda.online](https://latanda.online)
- 📜 Whitepaper v2.0: [latanda.online/whitepaper.html](https://latanda.online/whitepaper.html)
- 💰 Tokenomics: [latanda.online/ltd-token-economics.html](https://latanda.online/ltd-token-economics.html)
- 🏛️ Governance: [latanda.online/governance.html](https://latanda.online/governance.html)
- 💻 Dev Portal: [latanda.online/dev-dashboard.html](https://latanda.online/dev-dashboard.html)
- 📖 API Docs: [latanda.online/docs](https://latanda.online/docs)
- 🔗 Chain: [latanda.online/chain](https://latanda.online/chain/)
- 📊 Swagger UI: [latanda.online/docs/swagger](https://latanda.online/docs/swagger)
- 🔍 Chain Explorer: [exp.utsa.tech/latanda/staking](https://exp.utsa.tech/latanda/staking)

### Community
- 💬 Discord: [discord.gg/Ve9M2ZSYC2](https://discord.gg/Ve9M2ZSYC2)
- 📢 Telegram: [t.me/latandahn](https://t.me/latandahn)
- 🐦 Twitter: [@TandaWeb3](https://twitter.com/TandaWeb3)
- 📰 Cosmos Forum: [Thread #16709](https://forum.cosmos.network/t/la-tanda-chain-incentivized-testnet-live-validators-node-operators-welcome-cosmos-sdk-v0-53-6/16709)
- 🟣 Reddit: [r/LaTandaChain](https://reddit.com/r/LaTandaChain)

---

## 📜 License

MIT License — see [LICENSE](./LICENSE)

Open source, free to use with attribution. "La Tanda" and "La Tanda Chain" trademarks are property of Ray-Banks LLC.
