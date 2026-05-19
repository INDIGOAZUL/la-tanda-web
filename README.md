# La Tanda — Web3 Ecosystem of Honduras

> **Not an app. An ecosystem.**
> Social network + digital tandas + marketplace + mining + proprietary blockchain.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Chain](https://img.shields.io/badge/chain-latanda--testnet--1-00d4ff)](https://latanda.online/chain/)
[![Supply](https://img.shields.io/badge/supply-200M%20LTD%20fijo-ffd700)](https://latanda.online/whitepaper.html)
[![Inflation](https://img.shields.io/badge/inflation-0%25-22c55e)](https://latanda.online/whitepaper.html)
[![Mainnet](https://img.shields.io/badge/mainnet-Q1%202027-8b5cf6)](https://latanda.online/chain/)

This repository is the **public mirror** of the La Tanda frontend — the first sovereign Web3 ecosystem built in Honduras for Latin America.

---

## 🌐 What is La Tanda

La Tanda is a **Web3 ecosystem with 7 integrated layers**, not a simple tanda app. Tandas (ROSCA rotating savings groups) are ONE of the 7 layers. Think of it as Amazon to e-commerce: much more than a cardboard box.

### The 7 ecosystem layers

| # | Layer | What it does |
|---|---|---|
| 1 | 💬 **Social Network** | Feed, stories, comments, reactions. Your time generates on-chain reputation. |
| 2 | 🔄 **Digital Tandas** | 0% commission rotating savings groups, on-chain score, integrated loans |
| 3 | 🛍️ **Web3 Marketplace** | Products, services, bookings. On-chain Seller Score. Payments in lempiras or LTD |
| 4 | ⛏️ **LTD Mining** | 5 tiers (1-12 LTD/day), global cap 500 LTD/day, earn from real activity |
| 5 | ⭐ **On-Chain Reputation** | Unified financial score 300-850, portable across layers, anchored on blockchain |
| 6 | 🔗 **La Tanda Chain** | Sovereign blockchain (Cosmos SDK + CometBFT), 200M LTD fixed supply, 0% inflation |
| 7 | 🤖 **MIA AI** | Financial assistant with 16 capabilities (Groq Llama 3.3 70B) |

---

## 📊 Current Status (live on testnet)

| Metric | Current Value |
|---|---|
| **Monthly active users** | 15,000+ |
| **Active tandas** | 300+ |
| **Chain validators** | 13+ |
| **Production API endpoints** | 160+ |
| **Production algorithms** | 14 (fraud, ranking, credit, health, etc.) |
| **Past governance proposals** | 2 (GOV-001, GOV-002) |
| **Testnet uptime since Q1 2026** | 100% (no consensus incidents) |

All metrics are verifiable against on-chain data or the public dev portal.

---

## 💎 Tokenomics (200M LTD fixed supply)

**Model**: Fixed supply + Pre-minted Treasury (similar to THORChain), **zero real inflation**.

### Distribution (10 pools)

| Pool | % | Amount | Usage |
|---|---|---|---|
| Community & Mining | 30% | 60M LTD | User rewards, Incentivized Testnet |
| Staking & Validators | 20% | 40M LTD | Pre-minted rewards (APY 15-25%, ~8 years) |
| Development Fund | 12% | 24M LTD | 6 month cliff + 3 year linear |
| Team & Founders | 12% | 24M LTD | 1 year cliff + 2 year linear |
| Marketing & Partnerships | 6% | 12M LTD | Quarterly by milestones |
| Seed Round | 5% | 10M LTD | $0.02/LTD, 6mo cliff + 18mo linear |
| Strategic / Private | 5% | 10M LTD | $0.03/LTD, 3mo cliff + 12mo linear |
| Initial TGE Liquidity | 5% | 10M LTD | DEX pools + listings |
| Bug Bounties & Grants | 3% | 6M LTD | Via governance |
| Insurance Fund | 2% | 4M LTD | Emergency governance vote |
| **TOTAL** | **100%** | **200M LTD** | |

**Post-Staking-Pool sustainability** (after year 8): 6 redundant sources including **marketplace commission routing (0.5% GMV → validators)** — a unique revenue stream vs pure store-of-value chains.

Full tokenomics: [Whitepaper v2.0](https://latanda.online/whitepaper.html) · [Interactive page](https://latanda.online/ltd-token-economics.html)

---

## 🔗 La Tanda Chain

Sovereign blockchain built with **Cosmos SDK + CometBFT**, specifically designed for community fintech in Latin America.

- **Chain ID (testnet)**: `latanda-testnet-1`
- **Token**: LTD (denom `ultd`, 1 LTD = 1,000,000 ultd)
- **Address prefix**: `ltd`
- **Block time**: ~5 seconds
- **Consensus**: CometBFT (BFT, Delegated Proof of Stake)
- **Active validators**: 13+ (genesis, PRO Delegators, drops, UTSA/lesnik, OwlStake, StakerHouse, ANODE.TEAM, AlxVoy, VALIDARIOS, narkosha, oleg1, +community)
- **Governance**: active, 2 proposals passed
- **Mainnet**: Q1 2027 planned
- **Explorer (community)**: https://exp.utsa.tech/latanda/staking

### Incentivized Testnet Program

~100K LTD reserved for validators joining before mainnet:

| Tier | Slots | Genesis Reward |
|---|---|---|
| Infra Partner | 5 (4 taken) | 5,000 LTD |
| Validator | 10 | 2,000 LTD |
| Full Node | 20 | 500 LTD |
| Bug Reporter | open | 100-1,000 LTD |

**How to join**: [Node Operator Guide](./la-tanda-chain-node-guide.md) (if in this repo) or [latanda.online/chain](https://latanda.online/chain/)

---

## 🚀 Quick Start

### For users (non-technical)
1. Go to [latanda.online](https://latanda.online)
2. Create your account (email or Google Sign-In)
3. Join a tanda, post on the feed, mine LTD, explore the marketplace

### For developers (integrate with La Tanda API)
1. API documentation: https://latanda.online/docs
2. Dev portal: https://latanda.online/dev-dashboard.html
3. Authentication: JWT via `/api/auth/login`
4. 160+ production endpoints

### For validators (run a node)
1. Read the guide: [la-tanda-chain-node-guide.md](https://latanda.online/la-tanda-chain-node-guide.md)
2. One-line install: `wget -q https://latanda.online/chain/node-setup.sh -O node-setup.sh && chmod +x node-setup.sh && ./node-setup.sh`
3. Chain page with seeds: https://latanda.online/chain/
4. Join the Incentivized Testnet Program by sending 10 LTD testnet + create-validator tx

---

## 💻 Development Setup

Serve the entire ecosystem frontend locally with a single command:

```bash
npx serve .
```

The app runs at `http://localhost:3000` by default. No build step, no dependencies — just static HTML, CSS, and JS.

**What you get locally:**
- Full ecosystem frontend (all 55+ HTML pages)
- API calls go to `latanda.online` (production API) unless you also run the chain locally
- Web3 features (Keplr wallet interactions, chain queries) hit the live testnet by default

**Prerequisites:**
- [Node.js](https://nodejs.org/) 18+ (for `npx serve`)
- A modern browser (Chrome, Firefox, Edge, Brave)

---

## 📁 Project Structure

```
la-tanda-web/
├── *.html                    # Ecosystem pages (55+ files, each a standalone SPA)
├── css/                      # Stylesheets (design-tokens, components, modules)
├── js/                       # JavaScript modules
│   ├── components-loader.js  # Lazy-loads UI components
│   ├── core/                 # Core libraries (api-client, state-management, router)
│   └── marketplace-social.js # Marketplace & social feed engine
├── assets/                   # Images, logos, favicons, WebGL shaders
├── chain/                    # La Tanda Chain resources (node-setup.sh, genesis.json)
├── docs/                     # OpenAPI spec + Swagger UI
├── .github/                  # Bounty templates, PR gatekeeper, ban list
├── api-proxy-enhanced.js     # Main API proxy (do NOT modify without coordination)
├── api-adapter.js            # API adapter layer
├── api-endpoints-config.js   # Endpoint configuration
└── marketplace-social.js     # (root-level) Marketplace & social feed entry point
```

**Key pages:**
- `index.html` — Landing page with cosmic 3D hero, tokenomics donut, and persona cards
- `whitepaper.html` — Whitepaper v2.0 with 10 pools + 6 sustainability sources
- `ltd-token-economics.html` — Interactive tokenomics with live chain data
- `governance.html` — On-chain governance hub with Keplr wallet
- `mia.html` — MIA AI (7th ecosystem layer — financial assistant)
- `chain/index.html` — Chain landing page with live validator stats

---

## 🤝 How to Contribute

La Tanda has a **3-tier bounty system** on GitHub Issues:

| Tier | Who can claim | Reward |
|---|---|---|
| **Tier 0** | Anyone | 10-50 LTD |
| **Tier 1** | 1+ previous merge | 50-150 LTD |
| **Tier 2** | 2+ previous merges | 150-500 LTD |

- Each bounty requires answering a codebase verification question (requires reading the actual source)
- PR Gatekeeper automatically rejects: PRs without assignment, accounts <30 days, users on ban list
- Labels: `tier-0`, `tier-1`, `tier-2`

**Before opening a PR:**
1. Read `CONTRIBUTING.md` (if it exists) + `.github/ban-list.txt`
2. Answer the verification question from the bounty
3. Sign commits with your GitHub-verified email
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

### Community
- 💬 Discord: [discord.gg/Ve9M2ZSYC2](https://discord.gg/Ve9M2ZSYC2)
- 📢 Telegram: [t.me/latandahn](https://t.me/latandahn)
- 🐦 Twitter: [@TandaWeb3](https://twitter.com/TandaWeb3)
- 📰 Cosmos Forum: [Thread #16709](https://forum.cosmos.network/t/la-tanda-chain-incentivized-testnet-live-validators-node-operators-welcome-cosmos-sdk-v0-53-6/16709)
- 🟣 Reddit: [r/LaTandaChain](https://reddit.com/r/LaTandaChain)

---

## 📜 License

MIT License — see [LICENSE](./LICENSE)

Open source, free to use with attribution. The "La Tanda" and "La Tanda Chain" trademarks are owned by Ray-Banks LLC.

---

## ⚖️ Legal

La Tanda is operated by **Ray-Banks LLC**. More information at [raybanks.org](https://raybanks.org).

This repository is a public mirror of the frontend. The code is released for transparency and community contributions. It does not constitute an offer of securities or financial advice.

---

## 🚫 Important Rules

- **NEVER** commit `.env` or credentials (see `.env.example`)
- **NEVER** use `rsync --delete` with this repo
- **NEVER** modify `api-proxy-enhanced.js` without coordinating with the team
- Public ban list: `.github/ban-list.txt` (we don't accept PRs from listed accounts)

---

<p align="center">
<strong>Building the Web3 of Latin America, one tanda at a time.</strong><br>
🇭🇳 Honduras → 🌎 LatAm → 🌍 Global
</p>
