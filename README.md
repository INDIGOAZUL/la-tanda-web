# La Tanda — Web3 Ecosystem of Honduras

> **Not an app. An ecosystem.**
> Red social + tandas digitales + marketplace + mineria + blockchain propia.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Chain](https://img.shields.io/badge/chain-latanda--testnet--1-00d4ff)](https://latanda.online/chain/)
[![Supply](https://img.shields.io/badge/supply-200M%20LTD%20fijo-ffd700)](https://latanda.online/whitepaper.html)
[![Inflation](https://img.shields.io/badge/inflation-0%25-22c55e)](https://latanda.online/whitepaper.html)
[![Mainnet](https://img.shields.io/badge/mainnet-Q1%202027-8b5cf6)](https://latanda.online/chain/)

Este repositorio es el **mirror publico** del frontend de La Tanda, el primer ecosistema Web3 soberano construido en Honduras para Latinoamerica.

---

## Que es La Tanda

La Tanda es un **ecosistema Web3 con 7 capas integradas**, no una simple app de tandas. Las tandas (grupos de ahorro rotativo ROSCA) son UNA de las 7 capas. Piensalo como Amazon al e-commerce: mucho mas que una caja de carton.

### Las 7 capas del ecosistema

| # | Capa | Que hace |
|---|---|---|
| 1 | Red Social | Feed, stories, comentarios, reacciones. Tu tiempo genera reputacion on-chain. |
| 2 | Tandas Digitales | Grupos de ahorro rotativo 0% comision, score on-chain, prestamos integrados |
| 3 | Marketplace WEB3 | Productos, servicios, bookings. Seller Score on-chain. Pagos en lempiras o LTD |
| 4 | Mineria de LTD | 5 tiers (1-12 LTD/dia), cap 500 LTD/dia global, gana por actividad real |
| 5 | Reputacion On-Chain | Score financiero unificado 300-850, portable entre capas, anclado en blockchain |
| 6 | La Tanda Chain | Blockchain soberana Cosmos SDK + CometBFT, 200M LTD fijo, 0% inflacion |
| 7 | MIA AI | Asistente financiero con 16 capacidades (Groq Llama 3.3 70B) |

---

## Estado actual (live en testnet)

| Metrica | Valor actual |
|---|---|
| **Usuarios activos mensuales** | 15,000+ |
| **Tandas activas** | 300+ |
| **Validadores de chain** | 13+ |
| **API endpoints en produccion** | 160+ |
| **Algoritmos productivos** | 14 (fraud, ranking, credit, salud, etc.) |
| **Propuestas de gobernanza pasadas** | 2 (GOV-001, GOV-002) |
| **Uptime testnet desde Q1 2026** | 100% (sin incidentes de consenso) |

Toda metrica es verificable contra datos on-chain o el dev portal publico.

---

## Tokenomics (200M LTD fijo)

**Modelo**: Supply fijo + Treasury pre-acunado (similar a THORChain), **cero inflacion real**.

### Distribucion (10 pools)

| Pool | % | Amount | Uso |
|---|---|---|---|
| Comunidad y Mineria | 30% | 60M LTD | Recompensas usuarios, Incentivized Testnet |
| Staking y Validadores | 20% | 40M LTD | Rewards pre-acunados (APY 15-25%, ~8 anos) |
| Fondo de Desarrollo | 12% | 24M LTD | 6 meses cliff + 3 anos linear |
| Equipo y Fundadores | 12% | 24M LTD | 1 ano cliff + 2 anos linear |
| Marketing y Alianzas | 6% | 12M LTD | Trimestral por hitos |
| Seed Round | 5% | 10M LTD | $0.02/LTD, 6mo cliff + 18mo linear |
| Strategic / Private | 5% | 10M LTD | $0.03/LTD, 3mo cliff + 12mo linear |
| Liquidez Inicial TGE | 5% | 10M LTD | DEX pools + listings |
| Bug Bounties y Grants | 3% | 6M LTD | Via governance |
| Fondo de Seguro | 2% | 4M LTD | Emergency governance vote |
| **TOTAL** | **100%** | **200M LTD** | |

**Post-Staking-Pool sustainability** (post ano 8): 6 fuentes redundantes incluyendo **marketplace commission routing (0.5% GMV -> validadores)** -- un revenue stream unico vs cadenas pure store-of-value.

Tokenomics completa: [Whitepaper v2.0](https://latanda.online/whitepaper.html) - [Pagina interactiva](https://latanda.online/ltd-token-economics.html)

---

## La Tanda Chain

Blockchain soberana construida con **Cosmos SDK + CometBFT**, especificamente disenada para fintech comunitaria en Latinoamerica.

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

**Como sumarte**: [Node Operator Guide](./chain/la-tanda-chain-node-guide.md) (si esta en este repo) o [latanda.online/chain](https://latanda.online/chain/)

---

## Quick Start

### Para usuarios (no technical)
1. Ve a [latanda.online](https://latanda.online)
2. Crea tu cuenta (email o Google Sign-In)
3. Unete a una tanda, publica en el feed, mina LTD, explora el marketplace

### Para desarrolladores (integrar con La Tanda API)
1. Documentacion API: https://latanda.online/docs
2. Dev portal: https://latanda.online/dev-dashboard.html
3. Autenticacion: JWT via `/api/auth/login`
4. 160+ endpoints productivos

### Para validadores (correr un nodo)
1. Lee la guia: [la-tanda-chain-node-guide.md](https://latanda.online/la-tanda-chain-node-guide.md)
2. Instalacion one-line: `wget -q https://latanda.online/chain/node-setup.sh -O node-setup.sh && chmod +x node-setup.sh && ./node-setup.sh`
3. Chain page con seeds: https://latanda.online/chain/
4. Unete al Incentivized Testnet Program enviando 10 LTD testnet + create-validator tx

---

## Development Setup

This project is a static HTML/JS frontend -- no build step required.

### Serve locally

```bash
# Option 1: Node.js (recommended)
npx serve .

# Option 2: Python 3
python -m http.server 8080

# Option 3: Python 2
python -m SimpleHTTPServer 8080
```

Then open `http://localhost:3000` (or `:8080` for Python).

### Prerequisites

- Any modern browser (Chrome, Firefox, Edge)
- Node.js 18+ (optional, for `npx serve`)
- Python 3 (optional, for `http.server`)

### API Proxy

The frontend communicates with the La Tanda backend via `api-proxy.js`. When running locally, ensure the proxy points to the correct API base URL. Check `api-proxy-enhanced.js` for configuration.

### Important

- **NEVER** commit `.env` or credentials
- **NEVER** use `rsync --delete` with this repo
- **NEVER** modify `api-proxy-enhanced.js` without coordinating with the team

---

## Project Structure

```
la-tanda-web/
+-- README.md                  # This file -- project overview
+-- LICENSE                    # MIT License
+-- SECURITY.md                # Security policy
+-- .env.example               # Environment variables template
+-- .gitignore                 # Git ignore rules
|
+-- *.html                     # Page files (60+ ecosystem pages)
|   +-- index.html             # Landing page -- hero, tokenomics, personas
|   +-- whitepaper.html        # Whitepaper v2.0 -- 10 pools, sustainability
|   +-- ltd-token-economics.html # Interactive tokenomics with live chain data
|   +-- governance.html        # On-chain governance hub with Keplr wallet
|   +-- mia.html               # MIA AI -- 7th ecosystem layer
|   +-- my-wallet.html         # User wallet page
|   +-- marketplace-social.html # Web3 marketplace
|   +-- kyc-registration.html  # KYC flow
|   +-- dev-dashboard.html     # Developer dashboard
|   +-- ...                    # 50+ more page files
|
+-- css/                       # Stylesheets
|   +-- design-tokens/         # Design system tokens
|   +-- components/            # Reusable component styles
|   +-- modules/               # Module-specific styles
|   +-- *.css                  # Global stylesheets
|
+-- js/                        # JavaScript modules
|   +-- components-loader.js   # Dynamic component loader
|   +-- marketplace-social.js  # Marketplace logic (root also has a copy)
|   +-- groups-system.js       # Tanda groups system
|   +-- my-wallet.js           # Wallet logic
|   +-- api-*.js               # API adapters and proxies
|   +-- core/                  # Core utilities
|   +-- components/            # JS components
|   +-- header/                # Header logic
|   +-- hub/                   # Hub modules
|   +-- helpers/               # Helper functions
|   +-- onboarding/            # Onboarding flows
|   +-- payment-providers/     # Payment integrations
|   +-- sidebar/               # Sidebar logic
|   +-- utils/                 # Utility functions
|
+-- chain/                     # La Tanda Chain resources
|   +-- genesis.json           # Genesis configuration
|   +-- node-setup.sh          # One-line node installer
|   +-- la-tanda-chain-node-guide.md      # Node operator guide
|   +-- la-tanda-node-beginner-guide.md   # Beginner node guide
|   +-- index.html             # Chain landing page
|
+-- docs/                      # OpenAPI spec + Swagger UI (symlink)
+-- assets/                    # Images, logos, favicons
+-- img/                       # Additional images
+-- images/                    # Additional images
+-- i18n/                      # Internationalization resources
+-- translations/              # Translation files
+-- components/                # HTML components
+-- group/                     # Group-related resources
+-- negocio/                   # Business logic resources
+-- packages/                  # Node packages
+-- utils/                     # Utility files
+-- workflows/                 # CI/CD workflows
+-- .github/                   # GitHub configs (bounty templates, PR gatekeeper)
+-- api-*.js                   # API adapters and proxies (root level)
+-- middleware/                # Server middleware
|   +-- api-proxy-enhanced.js  # Main API proxy (DO NOT modify without coordination)
+-- examples/                  # Example files
+-- marketplace-social.js      # Marketplace social logic (root-level, 500KB+)
```

---

## Resources

### Documentacion publica
- Website: [latanda.online](https://latanda.online)
- Whitepaper v2.0: [latanda.online/whitepaper.html](https://latanda.online/whitepaper.html)
- Tokenomics: [latanda.online/ltd-token-economics.html](https://latanda.online/ltd-token-economics.html)
- Governance: [latanda.online/governance.html](https://latanda.online/governance.html)
- Dev Portal: [latanda.online/dev-dashboard.html](https://latanda.online/dev-dashboard.html)
- API Docs: [latanda.online/docs](https://latanda.online/docs)
- Chain: [latanda.online/chain](https://latanda.online/chain/)

### Comunidad
- Discord: [discord.gg/Ve9M2ZSYC2](https://discord.gg/Ve9M2ZSYC2)
- Telegram: [t.me/latandahn](https://t.me/latandahn)
- Twitter: [@TandaWeb3](https://twitter.com/TandaWeb3)
- Cosmos Forum: [Thread #16709](https://forum.cosmos.network/t/la-tanda-chain-incentivized-testnet-live-validators-node-operators-welcome-cosmos-sdk-v0-53-6/16709)
- Reddit (own sub): [r/LaTandaChain](https://reddit.com/r/LaTandaChain)

---

## Licencia

MIT License -- see [LICENSE](./LICENSE)

Codigo abierto, uso libre con atribucion. Las marcas "La Tanda" y "La Tanda Chain" son propiedad de Ray-Banks LLC.

---

## Legal

La Tanda es operada por **Ray-Banks LLC**. Mas informacion en [raybanks.org](https://raybanks.org).

Este repositorio es un mirror publico del frontend. El codigo esta liberado para transparencia y contribuciones comunitarias. No constituye oferta de valores ni asesoramiento financiero.

---

## Reglas importantes

- **NUNCA** commitees `.env` o credenciales (ver `.env.example`)
- **NUNCA** uses `rsync --delete` con este repo
- **NUNCA** modifiques `api-proxy-enhanced.js` sin coordinar con el equipo
- Ban list publica: `.github/ban-list.txt` (no aceptamos PRs de cuentas listadas)

---

<p align="center">
<strong>Construyendo el Web3 de Latinoamerica, un tanda a la vez.</strong><br>
Honduras -> LatAm -> Global
</p>