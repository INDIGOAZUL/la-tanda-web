# La Tanda — Web3 Ecosystem of Honduras

> **Not an app. An ecosystem.**
> Social network + digital tandas + marketplace + mining + sovereign chain.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Chain](https://img.shields.io/badge/chain-latanda--testnet--1-00d4ff)](https://latanda.online/chain/)
[![Supply](https://img.shields.io/badge/supply-200M%20LTD%20fixed-ffd700)](https://latanda.online/whitepaper.html)
[![Inflation](https://img.shields.io/badge/inflation-0%25-22c55e)](https://latanda.online/whitepaper.html)
[![Mainnet](https://img.shields.io/badge/mainnet-Q1%202027-8b5cf6)](https://latanda.online/chain/)

This repository is the **public mirror** of the La Tanda frontend, the first sovereign Web3 ecosystem built in Honduras for Latin America.

---

## 🌐 What is La Tanda?

La Tanda is a **Web3 ecosystem with 7 integrated layers**, not a simple rotating-savings app. Tandas (ROSCA savings groups) are one of those layers. Think of it like Amazon compared with a single cardboard box: the box is useful, but the ecosystem is much larger.

### The 7 ecosystem layers

| # | Layer | What it does |
|---|---|---|
| 1 | 💬 **Social Network** | Feed, stories, comments, and reactions. Time spent in the ecosystem builds on-chain reputation. |
| 2 | 🔄 **Digital Tandas** | 0% commission rotating savings groups, on-chain scoring, and integrated loans. |
| 3 | 🛍️ **Web3 Marketplace** | Products, services, and bookings. Seller Score on-chain. Payments in lempiras or LTD. |
| 4 | ⛏️ **LTD Mining** | 5 tiers (1-12 LTD/day), 500 LTD/day global cap, rewards earned through real activity. |
| 5 | ⭐ **On-Chain Reputation** | Unified 300-850 financial score, portable across layers and anchored on-chain. |
| 6 | 🔗 **La Tanda Chain** | Sovereign Cosmos SDK + CometBFT blockchain, fixed 200M LTD supply, 0% inflation. |
| 7 | 🤖 **MIA AI** | Financial assistant with 16 capabilities, powered by Groq Llama 3.3 70B. |

---

## 📊 Current status (live on testnet)

| Metric | Current value |
|---|---|
| **Monthly active users** | 15,000+ |
| **Active tandas** | 300+ |
| **Chain validators** | 13+ |
| **Production API endpoints** | 160+ |
| **Production algorithms** | 14 (fraud, ranking, credit, health, and more) |
| **Passed governance proposals** | 2 (GOV-001, GOV-002) |
| **Testnet uptime since Q1 2026** | 100% (no consensus incidents) |

All metrics are verifiable against on-chain data or the public developer portal.

---

## 💎 Tokenomics (fixed 200M LTD)

**Model:** fixed supply + pre-minted treasury, similar to THORChain, with **zero real inflation**.

### Distribution (10 pools)

| Pool | % | Amount | Use |
|---|---:|---:|---|
| Community and Mining | 30% | 60M LTD | User rewards and Incentivized Testnet |
| Staking and Validators | 20% | 40M LTD | Pre-minted rewards (15-25% APY, ~8 years) |
| Development Fund | 12% | 24M LTD | 6-month cliff + 3-year linear vesting |
| Team and Founders | 12% | 24M LTD | 1-year cliff + 2-year linear vesting |
| Marketing and Partnerships | 6% | 12M LTD | Quarterly milestone releases |
| Seed Round | 5% | 10M LTD | $0.02/LTD, 6-month cliff + 18-month linear vesting |
| Strategic / Private | 5% | 10M LTD | $0.03/LTD, 3-month cliff + 12-month linear vesting |
| Initial TGE Liquidity | 5% | 10M LTD | DEX pools and listings |
| Bug Bounties and Grants | 3% | 6M LTD | Via governance |
| Insurance Fund | 2% | 4M LTD | Emergency governance vote |
| **TOTAL** | **100%** | **200M LTD** | |

**Post-staking-pool sustainability** after year 8 uses six redundant sources, including **marketplace commission routing (0.5% GMV → validators)**, a revenue stream that differentiates La Tanda from pure store-of-value chains.

Full tokenomics: [Whitepaper v2.0](https://latanda.online/whitepaper.html) · [Interactive tokenomics page](https://latanda.online/ltd-token-economics.html)

---

## 🔗 La Tanda Chain

La Tanda Chain is a sovereign blockchain built with **Cosmos SDK + CometBFT**, designed specifically for community fintech in Latin America.

- **Chain ID (testnet):** `latanda-testnet-1`
- **Token:** LTD (denom `ultd`, 1 LTD = 1,000,000 ultd)
- **Address prefix:** `ltd`
- **Block time:** ~5 seconds
- **Consensus:** CometBFT (BFT, Delegated Proof of Stake)
- **Active validators:** 13+ (genesis, PRO Delegators, drops, UTSA/lesnik, OwlStake, StakerHouse, ANODE.TEAM, AlxVoy, VALIDARIOS, narkosha, oleg1, and community validators)
- **Governance:** active, 2 passed proposals
- **Mainnet:** planned for Q1 2027
- **Community explorer:** https://exp.utsa.tech/latanda/staking

### Incentivized Testnet Program

About 100K LTD is reserved for validators who join before mainnet:

| Tier | Slots | Genesis reward |
|---|---:|---:|
| Infra Partner | 5 (4 occupied) | 5,000 LTD |
| Validator | 10 | 2,000 LTD |
| Full Node | 20 | 500 LTD |
| Bug Reporter | Open | 100-1,000 LTD |

**How to join:** read the [Node Operator Guide](https://latanda.online/la-tanda-chain-node-guide.md) or visit [latanda.online/chain](https://latanda.online/chain/).

---

## 🚀 Quick Start

### For users
1. Go to [latanda.online](https://latanda.online).
2. Create an account with email or Google Sign-In.
3. Join a tanda, publish in the feed, mine LTD, and explore the marketplace.

### For developers integrating with the La Tanda API
1. API documentation: https://latanda.online/docs
2. Developer portal: https://latanda.online/dev-dashboard.html
3. Authentication: JWT via `/api/auth/login`
4. 160+ production endpoints are available.

### For validators running a node
1. Read the [Node Operator Guide](https://latanda.online/la-tanda-chain-node-guide.md).
2. Install with one command: `wget -q https://latanda.online/chain/node-setup.sh -O node-setup.sh && chmod +x node-setup.sh && ./node-setup.sh`
3. Chain page with seeds: https://latanda.online/chain/
4. Join the Incentivized Testnet Program by sending 10 testnet LTD and creating a validator transaction.

---

## 🛠️ Development Setup

This repository is a static frontend mirror. You can serve it locally without a build step:

```bash
npx serve .
```

Then open the local URL printed by `serve` in your browser, usually `http://localhost:3000`.

Recommended development checks:

1. Confirm the page you changed loads locally.
2. Check the browser console for JavaScript errors.
3. Verify any public links you touched, especially [Swagger UI](https://latanda.online/docs), [Dev Portal](https://latanda.online/dev-dashboard.html), and [Chain Explorer](https://exp.utsa.tech/latanda/staking).

---

## 📂 Project Structure

```text
la-tanda-web/
├── *.html                    # Ecosystem pages and public entry points
├── css/                      # Stylesheets, design tokens, components, and modules
├── js/                       # Shared JavaScript components, loaders, hub code, and utilities
├── assets/                   # Images, generated assets, logos, favicons, and bundled chunks
├── chain/                    # La Tanda Chain resources such as node setup and genesis files
├── docs                      # Swagger UI / API documentation entry point
├── .github/                  # Issue templates, PR template, and repository automation
└── api-*.js                  # API adapters, endpoint config, handlers, and proxy implementations
```

Key pages aligned with the ecosystem framework:

- `index.html` — landing page with cosmic 3D hero, tokenomics donut, and persona cards.
- `whitepaper.html` — Whitepaper v2.0 with 10 pools and 6 sustainability sources.
- `ltd-token-economics.html` — interactive tokenomics page with live chain data.
- `governance.html` — on-chain governance hub with Keplr wallet support.
- `mia.html` — MIA AI, the seventh ecosystem layer.
- `chain/index.html` — chain landing page with live stats.
- `marketplace-social.html` — marketplace social experience; its root-level script is `marketplace-social.js`.

The main API implementation file is `api-proxy-enhanced.js`. Supporting API files include `api-endpoints-config.js`, `api-adapter.js`, `api-proxy.js`, and `api-handlers-complete.js`.

---

## 🤝 Contributing

La Tanda uses a **3-tier GitHub bounty system**:

| Tier | Who can claim | Reward |
|---|---|---:|
| **Tier 0** | Anyone | 10-50 LTD |
| **Tier 1** | 1+ previous merge | 50-150 LTD |
| **Tier 2** | 2+ previous merges | 150-500 LTD |

- Each bounty includes a codebase verification question that requires reading the real source.
- The automated PR gatekeeper rejects unassigned PRs, accounts younger than 30 days, and users on the ban list.
- Labels: `tier-0`, `tier-1`, `tier-2`.

Before opening a PR:

1. Read the repository rules and `.github/ban-list.txt` if present.
2. Answer the bounty verification question.
3. Sign commits with your verified GitHub email.
4. Keep each PR focused on one bounty.

---

## 📚 Resources

### Public documentation
- 🌐 Website: [latanda.online](https://latanda.online)
- 📜 Whitepaper v2.0: [latanda.online/whitepaper.html](https://latanda.online/whitepaper.html)
- 💰 Tokenomics: [latanda.online/ltd-token-economics.html](https://latanda.online/ltd-token-economics.html)
- 🏛️ Governance: [latanda.online/governance.html](https://latanda.online/governance.html)
- 💻 Dev Portal: [latanda.online/dev-dashboard.html](https://latanda.online/dev-dashboard.html)
- 📖 API Docs / Swagger UI: [latanda.online/docs](https://latanda.online/docs)
- 🔗 Chain: [latanda.online/chain](https://latanda.online/chain/)
- 🔎 Chain Explorer: [exp.utsa.tech/latanda/staking](https://exp.utsa.tech/latanda/staking)

### Community
- 💬 Discord: [discord.gg/Ve9M2ZSYC2](https://discord.gg/Ve9M2ZSYC2)
- 📢 Telegram: [t.me/latandahn](https://t.me/latandahn)
- 🐦 Twitter: [@TandaWeb3](https://twitter.com/TandaWeb3)
- 📰 Cosmos Forum: [Thread #16709](https://forum.cosmos.network/t/la-tanda-chain-incentivized-testnet-live-validators-node-operators-welcome-cosmos-sdk-v0-53-6/16709)
- 🟣 Reddit: [r/LaTandaChain](https://reddit.com/r/LaTandaChain)

---

## 📜 License

MIT License — see [LICENSE](./LICENSE).

The code is open source and free to use with attribution. The "La Tanda" and "La Tanda Chain" brands are property of Ray-Banks LLC.

---

## ⚖️ Legal

La Tanda is operated by **Ray-Banks LLC**. More information is available at [raybanks.org](https://raybanks.org).

This repository is a public mirror of the frontend. The code is released for transparency and community contributions. It is not a securities offering or financial advice.

---

## 🚫 Important Rules

- **NEVER** commit `.env` files or credentials; see `.env.example`.
- **NEVER** use `rsync --delete` with this repository.
- **NEVER** modify `api-proxy-enhanced.js` without coordinating with the team.
- Public ban list: `.github/ban-list.txt`, when present.

---

<p align="center">
<strong>Building the Web3 of Latin America, one tanda at a time.</strong><br>
🇭🇳 Honduras → 🌎 LatAm → 🌍 Global
</p>
