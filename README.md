# La Tanda — Web3 Ecosystem of Honduras

> **Not an app. An ecosystem.**
> Red social + tandas digitales + marketplace + minería + blockchain propia.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Chain](https://img.shields.io/badge/chain-latanda--testnet--1-00d4ff)](https://latanda.online/chain/)
[![Supply](https://img.shields.io/badge/supply-200M%20LTD%20fijo-ffd700)](https://latanda.online/whitepaper.html)
[![Inflation](https://img.shields.io/badge/inflation-0%25-22c55e)](https://latanda.online/whitepaper.html)
[![Mainnet](https://img.shields.io/badge/mainnet-Q1%202027-8b5cf6)](https://latanda.online/chain/)

This repository is the **public mirror** of the La Tanda frontend, the first sovereign Web3 ecosystem built in Honduras for Latin America.

---

## 🌐 What is La Tanda

La Tanda is a **Web3 ecosystem with 7 integrated layers**, not just a simple savings app. Digital "Tandas" (Rotating Savings and Credit Associations - ROSCA) are ONE of the 7 layers. Think of it like Amazon to e-commerce: much more than a cardboard box.

### The 7 Layers of the Ecosystem

| # | Layer | Description |
|---|---|---|
| 1 | 💬 **Social Network** | Feed, stories, comments, reactions. Your time generates on-chain reputation. |
| 2 | 🔄 **Digital Tandas** | 0% commission rotating savings groups, on-chain scoring, integrated loans. |
| 3 | 🛍️ **Web3 Marketplace** | Products, services, bookings. On-chain Seller Score. Payments in Lempiras or LTD. |
| 4 | ⛏️ **LTD Mining** | 5 tiers (1-12 LTD/day), global cap of 500 LTD/day, earn through real activity. |
| 5 | ⭐ **On-Chain Reputation** | Unified financial score (300-850), portable between layers, anchored on blockchain. |
| 6 | 🔗 **La Tanda Chain** | Sovereign Cosmos SDK + CometBFT blockchain, fixed 200M LTD, 0% inflation. |
| 7 | 🤖 **MIA AI** | Financial assistant with 16 capabilities (Groq Llama 3.3 70B). |

---

## 🛠️ Development Setup

To preview and develop the La Tanda frontend locally, follow these steps:

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)

### Local Serving
Since the project uses absolute paths and modern JS modules, a local web server is required. We recommend using `serve`:

1.  **Serve the root directory**:
    ```bash
    npx serve .
    ```
2.  **Access the application**:
    Open [http://localhost:3000](http://localhost:3000) in your browser.

> [!NOTE]
> Ensure you are serving from the repository root to allow correct resolution of API proxies and shared assets.

---

## 📂 Project Structure

This repository follows a modular frontend architecture. Below are the key directories and files:

- `*.html` — **Core Ecosystem Pages**: Over 60 entry points (e.g., `index.html`, `mia.html`, `governance.html`).
- `css/` — **Styles**: Organized into design tokens, components, and specific modules.
- `js/` — **Logic Hub**: 
  - `js/core/` — Core API clients and shared logic.
  - `js/components-loader.js` — Dynamic loading system for UI elements.
- `assets/` — **Static Assets**: Images, logos, favicons, and global media.
- `chain/` — **Blockchain Resources**: Configuration and setup scripts for La Tanda Chain nodes.
- `docs/` — **Documentation**: OpenAPI specifications and Swagger UI for API interaction.
- `api-proxy-enhanced.js` — **Main API Gateway**: The primary proxy used for production API communication.
- `.github/` — **Infrastructure**: Bounty templates and PR gatekeeper configurations.

---

## 📊 Current Status (Live on Testnet)

| Metric | Current Value |
|---|---|
| **Monthly Active Users** | 15,000+ |
| **Active Tandas** | 300+ |
| **Chain Validators** | 13+ |
| **Production API Endpoints** | 160+ |
| **Goverance Proposals** | 2 (GOV-001, GOV-002) |
| **Testnet Uptime** | 100% |

All metrics are verifiable against on-chain data or the public [Developer Portal](https://latanda.online/dev-dashboard.html).

---

## 🤝 How to Contribute

La Tanda operates a **3-tier bounty system** via GitHub Issues:

| Tier | Eligibility | Reward |
|---|---|---|
| **Tier 0** | Anyone | 10-50 LTD |
| **Tier 1** | 1+ prior merged PR | 50-150 LTD |
| **Tier 2** | 2+ prior merged PRs | 150-500 LTD |

### Contribution Workflow
1.  **Claim**: Comment on an issue with the required **Codebase Verification Answer**.
2.  **Wait**: Ensure you are assigned to the issue before starting work.
3.  **Submit**: Open a Pull Request targeting the `main` branch.
4.  **Merge**: Once merged, the bounty is paid on-chain to your `ltd1...` address.

> [!IMPORTANT]
> Automatic PR Gatekeepers will reject PRs without explicit assignment or from accounts less than 30 days old.

---

## 📚 Resources

### Public Documentation
- 🌐 **Website**: [latanda.online](https://latanda.online)
- 📜 **Whitepaper v2.0**: [View PDF](https://latanda.online/whitepaper.html)
- 💰 **Tokenomics**: [Interactive Page](https://latanda.online/ltd-token-economics.html)
- 🏛️ **Governance**: [Governance Hub](https://latanda.online/governance.html)
- 💻 **Developer Portal**: [Dev Dashboard](https://latanda.online/dev-dashboard.html)
- 📖 **API Documentation**: [Swagger UI](https://latanda.online/docs)
- 🔗 **Blockchain Explorer**: [Community Explorer](https://exp.utsa.tech/latanda/staking)

### Community
- 💬 [Discord](https://discord.gg/Ve9M2ZSYC2)
- 📢 [Telegram](https://t.me/latandahn)
- 🐦 [Twitter/X](https://twitter.com/TandaWeb3)

---

## 📜 License

MIT License — see [LICENSE](./LICENSE)

Open source, free use with attribution. "La Tanda" and "La Tanda Chain" are trademarks of Ray-Banks LLC.

---

<p align="center">
<strong>Building the Web3 of Latin America, one Tanda at a time.</strong><br>
🇭🇳 Honduras → 🌎 LatAm → 🌍 Global
</p>
