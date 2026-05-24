# La Tanda — Web3 Ecosystem of Honduras

> **Not an app. An ecosystem.**
> Red social + tandas digitales + marketplace + minería + blockchain propia.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
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

**Cómo sumarte**: [Node Operator Guide](./la-tanda-chain-node-guide.md) (si está en este repo) o [latanda.online/chain](https://latanda.online/chain/)

---

## 🚀 Quick Start

### For Users (Non-Technical)
1. Go to [latanda.online](https://latanda.online)
2. Create your account (email or Google Sign-In)
3. Join a tanda, post on the feed, mine LTD, explore the marketplace

### For Developers (Integrating with La Tanda API)
1. API Documentation: [latanda.online/docs](https://latanda.online/docs)
2. Dev Portal: [latanda.online/dev-dashboard.html](https://latanda.online/dev-dashboard.html)
3. Authentication: JWT via `/api/auth/login`
4. 160+ production endpoints
5. Swagger UI: [latanda.online/docs](https://latanda.online/docs) (interactive API explorer)
6. Chain Explorer: [exp.utsa.tech/latanda](https://exp.utsa.tech/latanda/staking)

### For Validators (Running a Node)
1. Read the guide: [la-tanda-chain-node-guide.md](https://latanda.online/la-tanda-chain-node-guide.md)
2. One-line install: `wget -q https://latanda.online/chain/node-setup.sh -O node-setup.sh && chmod +x node-setup.sh && ./node-setup.sh`
3. Chain page with seeds: [latanda.online/chain](https://latanda.online/chain/)
4. Join the Incentivized Testnet Program by sending 10 LTD testnet + create-validator tx

---

## 🛠️ Development Setup

### Prerequisites
- **Node.js** 18+ (for local development server)
- **Git** (for cloning the repository)
- A modern web browser (Chrome, Firefox, Safari, or Edge)

### Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/INDIGOAZUL/la-tanda-web.git
cd la-tanda-web

# 2. Serve locally (no build step required — this is a static site)
npx serve .

# 3. Open in your browser
# The server will start at http://localhost:3000 (or the next available port)
```

> **Note:** This project is a static web application — no compilation, bundling, or build step is needed. Simply serve the files and open in a browser.

### Alternative Local Servers

```bash
# Using Python
python3 -m http.server 8000

# Using PHP
php -S localhost:8000

# Using VS Code Live Server extension
# Right-click index.html → "Open with Live Server"
```

### API Integration (for Developers)

The project uses a simulated API proxy (`api-proxy-enhanced.js`) that provides 120+ endpoint stubs. To connect to the live API:

1. Review the endpoint definitions in `api-endpoints-config.js`
2. Authentication is JWT-based — obtain a token via `/api/auth/login`
3. See the [API Documentation](https://latanda.online/docs) for full endpoint reference
4. The [Dev Portal](https://latanda.online/dev-dashboard.html) provides live API status and metrics

### Key Links

| Resource | URL |
|----------|-----|
| Live Site | [latanda.online](https://latanda.online) |
| API Docs (Swagger UI) | [latanda.online/docs](https://latanda.online/docs) |
| Dev Portal | [latanda.online/dev-dashboard.html](https://latanda.online/dev-dashboard.html) |
| Chain Explorer | [exp.utsa.tech/latanda/staking](https://exp.utsa.tech/latanda/staking) |
| Whitepaper | [latanda.online/whitepaper.html](https://latanda.online/whitepaper.html) |
| Governance | [latanda.online/governance.html](https://latanda.online/governance.html) |
| Tokenomics | [latanda.online/ltd-token-economics.html](https://latanda.online/ltd-token-economics.html) |
| MIA AI | [latanda.online/mia.html](https://latanda.online/mia.html) |

---

## 📂 Project Structure

```
la-tanda-web/
├── *.html                        # Ecosystem pages (55+ files)
│   ├── index.html                # Landing page with 3D hero + tokenomics
│   ├── whitepaper.html           # Whitepaper v2.0 (10 pools + sustainability)
│   ├── ltd-token-economics.html  # Interactive tokenomics with live chain data
│   ├── governance.html           # On-chain governance hub (Keplr wallet)
│   ├── mia.html                  # MIA AI assistant (7th ecosystem layer)
│   ├── auth.html                 # Login/signup page
│   ├── dashboard.html            # User dashboard
│   ├── groups.html               # Tanda groups management
│   ├── marketplace.html          # Web3 marketplace
│   ├── trading.html              # LTD token trading
│   └── staking.html              # Staking interface
│
├── js/                           # Modular JavaScript (framework-aligned)
│   ├── components-loader.js      # Dynamic component loader
│   ├── dashboard-api-connector.js# Dashboard API integration
│   ├── groups-system.js          # Tanda group logic
│   ├── firebase-config.js        # Firebase configuration
│   ├── global-search.js          # Unified search
│   ├── sidebar/                  # Sidebar navigation (index, events, ui)
│   └── hub/                      # Hub connectors and utilities
│
├── css/                          # Stylesheets
│   ├── design-tokens.css         # Design system variables
│   ├── components/               # Reusable component styles
│   └── *.css                     # Page-specific styles
│
├── assets/                       # Images, logos, favicons
├── translations/                 # i18n files (en.json, es.json, pt.json)
├── packages/sdk/                 # TypeScript SDK package
├── chain/                        # La Tanda Chain resources (genesis, node setup)
├── docs/                         # OpenAPI spec + Swagger UI
├── utils/                        # Shared utilities (roleGuard)
├── middleware/                   # Server middleware
│
├── api-proxy-enhanced.js         # Main API proxy (120+ simulated endpoints)
├── api-adapter.js                # API adapter layer
├── api-endpoints-config.js       # Endpoint configuration registry
├── marketplace-social.js         # Marketplace social features
├── shared-components.js          # Shared UI component library
├── smart-suggestions-engine.js   # AI-powered suggestions
├── real-time-api-integration.js  # Real-time data sync
├── sw.js                         # Service worker (PWA)
├── pwa-manager.js                # PWA lifecycle manager
│
├── .github/                      # Bounty templates, PR gatekeeper, ban list
├── workflows/                    # CI/CD configuration
├── postman-collection.json       # Postman API collection for testing
└── robots.txt                    # Search engine directives
```

### Key Architecture Notes

- **Static site**: No build step — HTML, CSS, and JS are served directly
- **API simulation**: `api-proxy-enhanced.js` simulates 120+ endpoints for development and demo purposes
- **PWA support**: Service worker (`sw.js`) enables offline functionality
- **Multi-language**: Translation files in `translations/` (English, Spanish, Portuguese)
- **SDK**: TypeScript SDK in `packages/sdk/` for programmatic integration
- **Important**: `api-proxy-enhanced.js` is the main API file — do not modify without team coordination

---

## 🤝 Cómo contribuir

La Tanda tiene un **sistema de bounties de 3 tiers** en GitHub Issues:

| Tier | Quién puede | Reward |
|---|---|---|
| **Tier 0** | Cualquiera | 10-50 LTD |
| **Tier 1** | 1+ merge previo | 50-150 LTD |
| **Tier 2** | 2+ merges previos | 150-500 LTD |

- Cada bounty requiere responder una pregunta de verificación del código (requiere leer la fuente real)
- PR Gatekeeper automático rechaza: PRs sin asignación, cuentas <30 días, usuarios en ban list
- Labels: `tier-0`, `tier-1`, `tier-2`

**Antes de abrir PR**:
1. Lee `CONTRIBUTING.md` (si existe) + `.github/ban-list.txt`
2. Responde la pregunta de verificación del bounty
3. Firma commits con tu email verificado en GitHub
4. Un PR = un bounty

---

## 📚 Recursos

### Documentación pública
- 🌐 Website: [latanda.online](https://latanda.online)
- 📜 Whitepaper v2.0: [latanda.online/whitepaper.html](https://latanda.online/whitepaper.html)
- 💰 Tokenomics: [latanda.online/ltd-token-economics.html](https://latanda.online/ltd-token-economics.html)
- 🏛️ Governance: [latanda.online/governance.html](https://latanda.online/governance.html)
- 💻 Dev Portal: [latanda.online/dev-dashboard.html](https://latanda.online/dev-dashboard.html)
- 📖 API Docs: [latanda.online/docs](https://latanda.online/docs)
- 🔗 Chain: [latanda.online/chain](https://latanda.online/chain/)

### Comunidad
- 💬 Discord: [discord.gg/Ve9M2ZSYC2](https://discord.gg/Ve9M2ZSYC2)
- 📢 Telegram: [t.me/latandahn](https://t.me/latandahn)
- 🐦 Twitter: [@TandaWeb3](https://twitter.com/TandaWeb3)
- 📰 Cosmos Forum: [Thread #16709](https://forum.cosmos.network/t/la-tanda-chain-incentivized-testnet-live-validators-node-operators-welcome-cosmos-sdk-v0-53-6/16709)
- 🟣 Reddit (own sub): [r/LaTandaChain](https://reddit.com/r/LaTandaChain)

---

## 📜 Licencia

MIT License — see [LICENSE](./LICENSE)

Código abierto, uso libre con atribución. Las marcas "La Tanda" y "La Tanda Chain" son propiedad de Ray-Banks LLC.

---

## ⚖️ Legal

La Tanda es operada por **Ray-Banks LLC**. Más información en [raybanks.org](https://raybanks.org).

Este repositorio es un mirror público del frontend. El código está liberado para transparencia y contribuciones comunitarias. No constituye oferta de valores ni asesoramiento financiero.

---

## 🚫 Reglas importantes

- **NUNCA** commitees `.env` o credenciales (ver `.env.example`)
- **NUNCA** uses `rsync --delete` con este repo
- **NUNCA** modifiques `api-proxy-enhanced.js` sin coordinar con el equipo
- Ban list pública: `.github/ban-list.txt` (no aceptamos PRs de cuentas listadas)

---

<p align="center">
<strong>Construyendo el Web3 de Latinoamérica, un tanda a la vez.</strong><br>
🇭🇳 Honduras → 🌎 LatAm → 🌍 Global
</p>
