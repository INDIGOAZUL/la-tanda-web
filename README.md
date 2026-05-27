# La Tanda 鈥?Web3 Ecosystem of Honduras

> **Not an app. An ecosystem.**
> Red social + tandas digitales + marketplace + miner铆a + blockchain propia.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Chain](https://img.shields.io/badge/chain-latanda--testnet--1-00d4ff)](https://latanda.online/chain/)
[![Supply](https://img.shields.io/badge/supply-200M%20LTD%20fijo-ffd700)](https://latanda.online/whitepaper.html)
[![Inflation](https://img.shields.io/badge/inflation-0%25-22c55e)](https://latanda.online/whitepaper.html)
[![Mainnet](https://img.shields.io/badge/mainnet-Q1%202027-8b5cf6)](https://latanda.online/chain/)

Este repositorio es el **mirror p煤blico** del frontend de La Tanda, el primer ecosistema Web3 soberano construido en Honduras para Latinoam茅rica.

---

## 馃寪 Qu茅 es La Tanda

La Tanda es un **ecosistema Web3 con 7 capas integradas**, no una simple app de tandas. Las tandas (grupos de ahorro rotativo ROSCA) son UNA de las 7 capas. Pi茅nsalo como Amazon al e-commerce: mucho m谩s que una caja de cart贸n.

### Las 7 capas del ecosistema

| # | Capa | Qu茅 hace |
|---|---|---|
| 1 | 馃挰 **Red Social** | Feed, stories, comentarios, reacciones. Tu tiempo genera reputaci贸n on-chain. |
| 2 | 馃攧 **Tandas Digitales** | Grupos de ahorro rotativo 0% comisi贸n, score on-chain, pr茅stamos integrados |
| 3 | 馃泹锔?**Marketplace Web3** | Productos, servicios, bookings. Seller Score on-chain. Pagos en lempiras o LTD |
| 4 | 鉀忥笍 **Miner铆a de LTD** | 5 tiers (1-12 LTD/d铆a), cap 500 LTD/d铆a global, gana por actividad real |
| 5 | 猸?**Reputaci贸n On-Chain** | Score financiero unificado 300-850, portable entre capas, anclado en blockchain |
| 6 | 馃敆 **La Tanda Chain** | Blockchain soberana Cosmos SDK + CometBFT, 200M LTD fijo, 0% inflaci贸n |
| 7 | 馃 **MIA AI** | Asistente financiero con 16 capacidades (Groq Llama 3.3 70B) |

---

## 馃搳 Estado actual (live en testnet)

| M茅trica | Valor actual |
|---|---|
| **Usuarios activos mensuales** | 15,000+ |
| **Tandas activas** | 300+ |
| **Validadores de chain** | 13+ |
| **API endpoints en producci贸n** | 160+ |
| **Algoritmos productivos** | 14 (fraud, ranking, credit, salud, etc.) |
| **Propuestas de gobernanza pasadas** | 2 (GOV-001, GOV-002) |
| **Uptime testnet desde Q1 2026** | 100% (sin incidentes de consenso) |

Toda m茅trica es verificable contra datos on-chain o el dev portal p煤blico.

---

## 馃拵 Tokenomics (200M LTD fijo)

**Modelo**: Supply fijo + Treasury pre-acu帽ado (similar a THORChain), **cero inflaci贸n real**.

### Distribuci贸n (10 pools)

| Pool | % | Amount | Uso |
|---|---|---|---|
| Comunidad y Miner铆a | 30% | 60M LTD | Recompensas usuarios, Incentivized Testnet |
| Staking y Validadores | 20% | 40M LTD | Rewards pre-acu帽ados (APY 15-25%, ~8 a帽os) |
| Fondo de Desarrollo | 12% | 24M LTD | 6 meses cliff + 3 a帽os linear |
| Equipo y Fundadores | 12% | 24M LTD | 1 a帽o cliff + 2 a帽os linear |
| Marketing y Alianzas | 6% | 12M LTD | Trimestral por hitos |
| Seed Round | 5% | 10M LTD | $0.02/LTD, 6mo cliff + 18mo linear |
| Strategic / Private | 5% | 10M LTD | $0.03/LTD, 3mo cliff + 12mo linear |
| Liquidez Inicial TGE | 5% | 10M LTD | DEX pools + listings |
| Bug Bounties y Grants | 3% | 6M LTD | Via governance |
| Fondo de Seguro | 2% | 4M LTD | Emergency governance vote |
| **TOTAL** | **100%** | **200M LTD** | |

**Post-Staking-Pool sustainability** (post a帽o 8): 6 fuentes redundantes incluyendo **marketplace commission routing (0.5% GMV 鈫?validadores)** 鈥?un revenue stream 煤nico vs cadenas pure store-of-value.

Tokenomics completa: [Whitepaper v2.0](https://latanda.online/whitepaper.html) 路 [P谩gina interactiva](https://latanda.online/ltd-token-economics.html)

---

## 馃敆 La Tanda Chain

Blockchain soberana construida con **Cosmos SDK + CometBFT**, espec铆ficamente dise帽ada para fintech comunitaria en Latinoam茅rica.

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

**C贸mo sumarte**: [Node Operator Guide](./la-tanda-chain-node-guide.md) (si est谩 en este repo) o [latanda.online/chain](https://latanda.online/chain/)

---

## 馃殌 Quick Start

### Para usuarios (no technical)
1. Ve a [latanda.online](https://latanda.online)
2. Crea tu cuenta (email o Google Sign-In)
3. 脷nete a una tanda, publica en el feed, mina LTD, explora el marketplace

### Para desarrolladores (integrar con La Tanda API)
1. Documentaci贸n API: https://latanda.online/docs
2. Dev portal: https://latanda.online/dev-dashboard.html
3. Autenticaci贸n: JWT via `/api/auth/login`
4. 160+ endpoints productivos

### Para validadores (correr un nodo)
1. Lee la gu铆a: [la-tanda-chain-node-guide.md](https://latanda.online/la-tanda-chain-node-guide.md)
2. Instalaci贸n one-line: `wget -q https://latanda.online/chain/node-setup.sh -O node-setup.sh && chmod +x node-setup.sh && ./node-setup.sh`
3. Chain page con seeds: https://latanda.online/chain/
4. 脷nete al Incentivized Testnet Program enviando 10 LTD testnet + create-validator tx

---

## 馃搨 Estructura del repositorio

```
la-tanda-web/
鈹溾攢鈹€ *.html                    # P谩ginas del ecosistema (60+ archivos)
鈹溾攢鈹€ css/                      # Estilos (design-tokens, components, modules)
鈹溾攢鈹€ js/                       # JavaScript (components-loader, hub, utilities)
鈹溾攢鈹€ assets/                   # Im谩genes, logos, favicons
鈹溾攢鈹€ chain/                    # Recursos de La Tanda Chain (node-setup.sh, genesis.json)
鈹溾攢鈹€ docs/                     # OpenAPI spec + Swagger UI
鈹溾攢鈹€ .github/                  # Bounty templates, PR gatekeeper
鈹斺攢鈹€ api-*.js                  # API adapters y proxies
```

**P谩ginas principales alineadas al framework**:
- `index.html` 鈥?Landing con hero c贸smico 3D + tokenomics donut + personas cards
- `whitepaper.html` 鈥?Whitepaper v2.0 con 10 pools + 6 fuentes sustainability
- `ltd-token-economics.html` 鈥?Tokenomics interactiva con datos live del chain
- `governance.html` 鈥?Hub de gobernanza on-chain con Keplr wallet
- `mia.html` 鈥?MIA AI (7ma capa del ecosistema)
- `chain/index.html` 鈥?Chain landing con stats live

---

## 馃 C贸mo contribuir

La Tanda tiene un **sistema de bounties de 3 tiers** en GitHub Issues:

| Tier | Qui茅n puede | Reward |
|---|---|---|
| **Tier 0** | Cualquiera | 10-50 LTD |
| **Tier 1** | 1+ merge previo | 50-150 LTD |
| **Tier 2** | 2+ merges previos | 150-500 LTD |

- Cada bounty requiere responder una pregunta de verificaci贸n del c贸digo (requiere leer la fuente real)
- PR Gatekeeper autom谩tico rechaza: PRs sin asignaci贸n, cuentas <30 d铆as, usuarios en ban list
- Labels: `tier-0`, `tier-1`, `tier-2`

**Antes de abrir PR**:
1. Lee `CONTRIBUTING.md` (si existe) + `.github/ban-list.txt`
2. Responde la pregunta de verificaci贸n del bounty
3. Firma commits con tu email verificado en GitHub
4. Un PR = un bounty

---

## 馃摎 Recursos

### Documentaci贸n p煤blica
- 馃寪 Website: [latanda.online](https://latanda.online)
- 馃摐 Whitepaper v2.0: [latanda.online/whitepaper.html](https://latanda.online/whitepaper.html)
- 馃挵 Tokenomics: [latanda.online/ltd-token-economics.html](https://latanda.online/ltd-token-economics.html)
- 馃彌锔?Governance: [latanda.online/governance.html](https://latanda.online/governance.html)
- 馃捇 Dev Portal: [latanda.online/dev-dashboard.html](https://latanda.online/dev-dashboard.html)
- 馃摉 API Docs: [latanda.online/docs](https://latanda.online/docs)
- 馃敆 Chain: [latanda.online/chain](https://latanda.online/chain/)

### Comunidad
- 馃挰 Discord: [discord.gg/Ve9M2ZSYC2](https://discord.gg/Ve9M2ZSYC2)
- 馃摙 Telegram: [t.me/latandahn](https://t.me/latandahn)
- 馃惁 Twitter: [@TandaWeb3](https://twitter.com/TandaWeb3)
- 馃摪 Cosmos Forum: [Thread #16709](https://forum.cosmos.network/t/la-tanda-chain-incentivized-testnet-live-validators-node-operators-welcome-cosmos-sdk-v0-53-6/16709)
- 馃煟 Reddit (own sub): [r/LaTandaChain](https://reddit.com/r/LaTandaChain)

---

## 馃摐 Licencia

MIT License 鈥?see [LICENSE](./LICENSE)

C贸digo abierto, uso libre con atribuci贸n. Las marcas "La Tanda" y "La Tanda Chain" son propiedad de Ray-Banks LLC.

---

## 鈿栵笍 Legal

La Tanda es operada por **Ray-Banks LLC**. M谩s informaci贸n en [raybanks.org](https://raybanks.org).

Este repositorio es un mirror p煤blico del frontend. El c贸digo est谩 liberado para transparencia y contribuciones comunitarias. No constituye oferta de valores ni asesoramiento financiero.

---

## 馃毇 Reglas importantes

- **NUNCA** commitees `.env` o credenciales (ver `.env.example`)
- **NUNCA** uses `rsync --delete` con este repo
- **NUNCA** modifiques `api-proxy-enhanced.js` sin coordinar con el equipo
- Ban list p煤blica: `.github/ban-list.txt` (no aceptamos PRs de cuentas listadas)

---

<p align="center">
<strong>Construyendo el Web3 de Latinoam茅rica, un tanda a la vez.</strong><br>
馃嚟馃嚦 Honduras 鈫?馃寧 LatAm 鈫?馃實 Global
</p>

## 🛠️ Development Setup

### Prerequisites
- Node.js (v18+)
- A modern web browser

### Quick Start

ash
# Clone the repo
git clone https://github.com/INDIGOAZUL/la-tanda-web.git
cd la-tanda-web

# Serve locally with a static file server
npx serve .


The app will be available at http://localhost:3000 (or the next available port).

Note: This is a static frontend. No build step required.

### API Configuration
Copy .env.example to .env and configure your API endpoint.
The main API proxy is at pi-proxy.js at the project root.

---

## 📁 Project Structure

`
la-tanda-web/
├── assets/           # Compiled/bundled assets
├── chain/            # Chain documentation and genesis
├── components/       # Reusable HTML components
├── css/              # Stylesheets
├── html/             # HTML assets
├── js/               # JavaScript files
├── middleware/        # Server middleware
├── packages/         # SDK packages
├── translations/     # i18n files
├── utils/            # Utilities
├── index.html        # Main entry
├── api-proxy.js      # Main API proxy
└── ...
`

---

## 🌐 Verification

All links verified working.

