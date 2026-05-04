# La Tanda — Web3 Ecosystem of Honduras

> **Not an app. An ecosystem.**
> Red social + tandas digitales + marketplace + minería + blockchain propia.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Chain](https://img.shields.io/badge/chain-latanda--testnet--1-00d4ff)](https://latanda.online/chain/)
[![Supply](https://img.shields.io/badge/supply-200M%20LTD%20fijo-ffd700)](https://latanda.online/whitepaper.html)
[![Inflation](https://img.shields.io/badge/inflation-0%25-22c55e)](https://latanda.online/whitepaper.html)
[![Mainnet](https://img.shields.io/badge/mainnet-Q1%202027-8b5cf6)](https://latanda.online/chain/)

Este repositorio es el **mirror público** del frontend de La Tanda, el primer ecosistema Web3 soberano construido en Honduras para Latinoamérica.

---

## 🌐 Qué es La Tanda

La Tanda es un **ecosistema Web3 con 7 capas integradas**, no una simple app de tandas. Las tandas (grupos de ahorro rotativo ROSCA) son UNA de las 7 capas. Piénsalo como Amazon al e-commerce: mucho más que una caja de cartón.

### Las 7 capas del ecosistema

| # | Capa | Qué hace |
|---|---|---|
| 1 | 💬 **Red Social** | Feed, stories, comentarios, reacciones. Tu tiempo genera reputación on-chain. |
| 2 | 🔄 **Tandas Digitales** | Grupos de ahorro rotativo 0% comisión, score on-chain, préstamos integrados |
| 3 | 🛍️ **Marketplace Web3** | Productos, servicios, bookings. Seller Score on-chain. Pagos en lempiras o LTD |
| 4 | ⛏️ **Minería de LTD** | 5 tiers (1-12 LTD/día), cap 500 LTD/día global, gana por actividad real |
| 5 | ⭐ **Reputación On-Chain** | Score financiero unificado 300-850, portable entre capas, anclado en blockchain |
| 6 | 🔗 **La Tanda Chain** | Blockchain soberana Cosmos SDK + CometBFT, 200M LTD fijo, 0% inflación |
| 7 | 🤖 **MIA AI** | Asistente financiero con 16 capacidades (Groq Llama 3.3 70B) |

---

## 📊 Estado actual (live en testnet)

| Métrica | Valor actual |
|---|---|
| **Usuarios activos mensuales** | 15,000+ |
| **Tandas activas** | 300+ |
| **Validadores de chain** | 13+ |
| **API endpoints en producción** | 160+ |
| **Algoritmos productivos** | 14 (fraud, ranking, credit, salud, etc.) |
| **Propuestas de gobernanza pasadas** | 2 (GOV-001, GOV-002) |
| **Uptime testnet desde Q1 2026** | 100% (sin incidentes de consenso) |

Toda métrica es verificable contra datos on-chain o el dev portal público.

---

## 💎 Tokenomics (200M LTD fijo)

**Modelo**: Supply fijo + Treasury pre-acuñado (similar a THORChain), **cero inflación real**.

### Distribución (10 pools)

| Pool | % | Amount | Uso |
|---|---|---|---|
| Comunidad y Minería | 30% | 60M LTD | Recompensas usuarios, Incentivized Testnet |
| Staking y Validadores | 20% | 40M LTD | Rewards pre-acuñados (APY 15-25%, ~8 años) |
| Fondo de Desarrollo | 12% | 24M LTD | 6 meses cliff + 3 años linear |
| Equipo y Fundadores | 12% | 24M LTD | 1 año cliff + 2 años linear |
| Marketing y Alianzas | 6% | 12M LTD | Trimestral por hitos |
| Seed Round | 5% | 10M LTD | $0.02/LTD, 6mo cliff + 18mo linear |
| Strategic / Private | 5% | 10M LTD | $0.03/LTD, 3mo cliff + 12mo linear |
| Liquidez Inicial TGE | 5% | 10M LTD | DEX pools + listings |
| Bug Bounties y Grants | 3% | 6M LTD | Via governance |
| Fondo de Seguro | 2% | 4M LTD | Emergency governance vote |
| **TOTAL** | **100%** | **200M LTD** | |

**Post-Staking-Pool sustainability** (post año 8): 6 fuentes redundantes incluyendo **marketplace commission routing (0.5% GMV → validadores)** — un revenue stream único vs cadenas pure store-of-value.

Tokenomics completa: [Whitepaper v2.0](https://latanda.online/whitepaper.html) · [Página interactiva](https://latanda.online/ltd-token-economics.html)

---

## 🔗 La Tanda Chain

Blockchain soberana construida con **Cosmos SDK + CometBFT**, específicamente diseñada para fintech comunitaria en Latinoamérica.

- **Chain ID (testnet)**: `latanda-testnet-1`
- **Token**: LTD (denom `ultd`, 1 LTD = 1,000,000 ultd)
- **Address prefix**: `ltd`
- **Block time**: ~5 segundos
- **Consensus**: CometBFT (BFT, Delegated Proof of Stake)
- **Validators activos**: 13+ (genesis, PRO Delegators, drops, UTSA/lesnik, OwlStake, StakerHouse, ANODE.TEAM, AlxVoy, VALIDARIOS, narkosha, oleg1, +community)
- **Governance**: activa, 2 props pasadas
- **Mainnet**: Q1 2027 planificado
- **Explorer (community)**: https://exp.utsa.tech/latanda/staking

### Incentivized Testnet Program

Reservados ~100K LTD para validadores que se suman antes del mainnet:

| Tier | Slots | Reward al genesis |
|---|---|---|
| Infra Partner | 5 (4 ocupados) | 5,000 LTD |
| Validator | 10 | 2,000 LTD |
| Full Node | 20 | 500 LTD |
| Bug Reporter | abierto | 100-1,000 LTD |

**How to join**: [Node Operator Guide](./chain/la-tanda-chain-node-guide.md) (if present in this repo) or [latanda.online/chain](https://latanda.online/chain/)

---

## 🚀 Quick Start

### For users (non-technical)
1. Go to [latanda.online](https://latanda.online)
2. Create your account (email or Google Sign-In)
3. Join a tanda, post in the feed, mine LTD, explore the marketplace

### For developers (integrate with La Tanda API)
1. API Documentation: https://latanda.online/docs
2. Dev portal: https://latanda.online/dev-dashboard.html
3. Authentication: JWT via `/api/auth/login`
4. 160+ production endpoints

### For validators (run a node)
1. Read the guide: [la-tanda-chain-node-guide.md](https://latanda.online/la-tanda-chain-node-guide.md)
2. One-line install: `wget -q https://latanda.online/chain/node-setup.sh -O node-setup.sh && chmod +x node-setup.sh && ./node-setup.sh`
3. Chain page with seeds: https://latanda.online/chain/
4. Join the Incentivized Testnet Program by submitting 10 LTD testnet + create-validator tx

---

## 🛠️ Development Setup

This is a pure HTML/CSS/JS frontend with **no build step**. You can run it locally with any static file server.

### Prerequisites
- **Node.js** (v18+ recommended) — only needed for `npx serve`, not for the app itself
- A modern browser (Chrome, Firefox, Safari, Edge)

### Run locally

```bash
# Clone the repo
git clone https://github.com/INDIGOAZUL/la-tanda-web.git
cd la-tanda-web

# Serve with npx (no install needed)
npx serve .

# Or use any static server:
# python3 -m http.server 3000
# php -S localhost:3000
```

The app will be available at `http://localhost:3000` (or the port shown by your server).

### What you get
- 55+ HTML pages served directly — no compilation, no bundling
- All JavaScript and CSS loaded as-is from `js/` and `css/` directories
- The app connects to the live La Tanda API at `latanda.online` by default (no local backend needed for frontend development)
- Edit any `.html`, `.css`, or `.js` file and refresh your browser to see changes

### Optional: Dev Portal
The project has a developer dashboard with API documentation, endpoint explorer, and WebSocket status at [latanda.online/dev-dashboard.html](https://latanda.online/dev-dashboard.html). You do not need to run it locally — it is available on the production site.

---

## 📂 Project Structure

```
la-tanda-web/
├── *.html                    # Ecosystem pages (55+ HTML files at root)
├── css/                      # Stylesheets (design-tokens, components, modules)
│   ├── main.css              # Base styles
│   ├── dashboard-layout.css  # Dashboard layout
│   └── hub/                  # Hub-specific styles (social-feed, comments, etc.)
├── js/                       # JavaScript modules
│   ├── components-loader.js  # Dynamic component loader (header, footer, sidebar)
│   ├── shared-components.js  # Shared UI components (footer, social links)
│   ├── hub/                  # Hub modules (social-feed, comments-modal, contextual-widgets)
│   └── onboarding/           # Onboarding flow
├── assets/                   # Images, logos, favicons
├── chain/                    # La Tanda Chain resources
│   ├── node-setup.sh         # One-line node setup script
│   ├── genesis.json          # Chain genesis configuration
│   ├── index.html            # Chain landing page
│   └── la-tanda-chain-node-guide.md  # Node operator guide
├── components/               # HTML component partials (header, footer, sidebar)
├── translations/             # i18n translation files
├── utils/                    # Utility modules
├── middleware/                # Server middleware
├── .github/                  # Bounty templates, PR gatekeeper, ban list
└── api-*.js                  # API adapters and proxies (at root)
```

**Key pages aligned with the 7-layer framework**:
- `index.html` — Landing page with 3D cosmic hero + tokenomics donut + persona cards
- `whitepaper.html` — Whitepaper v2.0 with 10 pools + 6 sustainability sources
- `ltd-token-economics.html` — Interactive tokenomics with live chain data
- `governance.html` — On-chain governance hub with Keplr wallet integration
- `mia.html` — MIA AI assistant (7th layer of the ecosystem)
- `chain/index.html` — Chain landing page with live stats

---

## 🤝 How to Contribute

La Tanda has a **3-tier bounty system** on GitHub Issues:

| Tier | Who can claim | Reward |
|---|---|---|
| **Tier 0** | Anyone | 10-50 LTD |
| **Tier 1** | 1+ prior merge | 50-150 LTD |
| **Tier 2** | 2+ prior merges | 150-500 LTD |

- Each bounty requires answering a codebase verification question (requires reading the actual source)
- Automated PR Gatekeeper rejects: unassigned PRs, accounts <30 days old, users on ban list
- Labels: `tier-0`, `tier-1`, `tier-2`

**Before opening a PR**:
1. Read `CONTRIBUTING.md` (if it exists) + `.github/ban-list.txt`
2. Answer the bounty's verification question
3. Sign commits with your GitHub-verified email
4. One PR = one bounty

---

## 📚 Resources

### Public Documentation
- 🌐 Website: [latanda.online](https://latanda.online)
- 📜 Whitepaper v2.0: [latanda.online/whitepaper.html](https://latanda.online/whitepaper.html)
- 💰 Tokenomics: [latanda.online/ltd-token-economics.html](https://latanda.online/ltd-token-economics.html)
- 🏛️ Governance: [latanda.online/governance.html](https://latanda.online/governance.html)
- 💻 Dev Portal: [latanda.online/dev-dashboard.html](https://latanda.online/dev-dashboard.html)
- 📖 API Docs (Swagger): [latanda.online/docs](https://latanda.online/docs)
- 🔗 Chain Explorer: [exp.utsa.tech/latanda/staking](https://exp.utsa.tech/latanda/staking)

### Community
- 💬 Discord: [discord.gg/Ve9M2ZSYC2](https://discord.gg/Ve9M2ZSYC2)
- 📢 Telegram: [t.me/latandahn](https://t.me/latandahn)
- 🐦 Twitter: [@TandaWeb3](https://twitter.com/TandaWeb3)
- 📰 Cosmos Forum: [Thread #16709](https://forum.cosmos.network/t/la-tanda-chain-incentivized-testnet-live-validators-node-operators-welcome-cosmos-sdk-v0-53-6/16709)
- 🟣 Reddit (own sub): [r/LaTandaChain](https://reddit.com/r/LaTandaChain)

---

## 📜 License

MIT License — see [LICENSE](https://opensource.org/licenses/MIT)

Open source, free to use with attribution. The trademarks "La Tanda" and "La Tanda Chain" are owned by Ray-Banks LLC.

---

## ⚖️ Legal

La Tanda is operated by **Ray-Banks LLC**. More information at [raybanks.org](https://raybanks.org).

This repository is a public mirror of the frontend. The code is released for transparency and community contributions. It does not constitute an offer of securities or financial advice.

---

## 🚫 Important Rules

- **NEVER** commit `.env` or credentials (see `.env.example`)
- **NEVER** use `rsync --delete` with this repo
- **NEVER** modify `api-proxy-enhanced.js` without coordinating with the team
- Public ban list: `.github/ban-list.txt` (PRs from listed accounts are rejected)

---

<p align="center">
<strong>Construyendo el Web3 de Latinoamérica, un tanda a la vez.</strong><br>
🇭🇳 Honduras → 🌎 LatAm → 🌍 Global
</p>
