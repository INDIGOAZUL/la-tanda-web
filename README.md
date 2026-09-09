# La Tanda — Web3 Ecosystem of Honduras

> **Not an app. An ecosystem.**
> Social network + digital tandas + marketplace + mining + our own blockchain.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Chain](https://img.shields.io/badge/chain-latanda--testnet--1-00d4ff)](https://latanda.online/chain/)
[![Supply](https://img.shields.io/badge/supply-200M%20LTD%20fixed-ffd700)](https://latanda.online/whitepaper.html)
[![Inflation](https://img.shields.io/badge/inflation-0%25-22c55e)](https://latanda.online/whitepaper.html)
[![Mainnet](https://img.shields.io/badge/mainnet-Q1%202027-8b5cf6)](https://latanda.online/chain/)

**[English](#english) · [Español](#español)**

---

<a name="english"></a>

# 🇬🇧 English

This repository is the **public mirror** of the La Tanda frontend — the first sovereign Web3 ecosystem built in Honduras for Latin America.

## 🌐 What is La Tanda

La Tanda is a **Web3 ecosystem with 7 integrated layers**, not a simple savings app. Tandas (rotating savings groups, ROSCAs) are ONE of the 7 layers. Think of it the way Amazon relates to e-commerce: much more than a cardboard box.

### The 7 layers

| # | Layer | What it does |
|---|---|---|
| 1 | 💬 **Social Network** | Feed, stories, comments, reactions. Your activity builds on-chain reputation. |
| 2 | 🔄 **Digital Tandas** | Rotating savings groups, 0% commission, on-chain score, integrated lending |
| 3 | 🛍️ **Web3 Marketplace** | Products, services, bookings. On-chain Seller Score. Pay in lempiras or LTD |
| 4 | ⛏️ **LTD Mining** | 5 tiers (1–12 LTD/day), global cap 500 LTD/day, earned through real activity |
| 5 | ⭐ **On-Chain Reputation** | Unified financial score 300–850, portable across layers, anchored on-chain |
| 6 | 🔗 **La Tanda Chain** | Sovereign blockchain, Cosmos SDK + CometBFT, 200M LTD fixed, 0% inflation |
| 7 | 🤖 **MIA AI** | Financial assistant with 16 capabilities (Groq Llama 3.3 70B) |

## 📊 Current status (live on testnet)

We are **early-stage and real**. These are the actual figures from our production database and the live chain, as of **2026-09-09** — not projections, not rounded up.

| Metric | Actual value |
|---|---|
| **Registered users** | **80** (of which **66** are email-verified) |
| **Groups (tandas)** | **5** (3 with completed real-money payouts) |
| **Completed payouts** | **41** (coordinator-confirmed with a transfer reference) |
| **Contributions recorded** | **883** |
| **Money cycled through tandas** | **L 1,652,100 HNL** collected (≈ **US$63,500**); **L 1,574,500** net to beneficiaries |
| **Chain validators** | **36 bonded** (45 registered) |
| **Chain height** | 3,058,040 (`latanda-testnet-1`) |
| **Governance proposals passed** | **3** |
| **Testnet uptime since Q1 2026** | 100% (no consensus incidents) |

**Every metric on this page is verifiable** against on-chain data or the public dev portal. We would rather you check.

**Live figures: https://latanda.online/api/public/metrics** (same query for every surface, 5-minute cache; the table above is a dated snapshot of that endpoint).

**Why we publish numbers this small.** 80 registered users have cycled **≈US$63,500 (L 1,652,100)** of their own money through **41 completed payouts** in 3 groups — that is real retention, real money, and a fully working 7-layer product with a sovereign chain, 36 bonded validators and 3 passed governance proposals behind it. Those are the hard parts. Growth is the easy part, and we would rather earn it than claim it.

> **A note on how we count users.** "Registered" means an account exists; "email-verified" means its email is confirmed. Neither means identity-verified or KYC'd — we do **not** currently run KYC on end users (the platform never holds the group's money — payments settle off-platform today; identity verification is a pre-mainnet workstream). We will never describe these users as "verified users" or "KYC'd users", and neither should anyone citing us.

## 💎 Tokenomics (200M LTD fixed)

**Model**: fixed supply + pre-minted treasury (similar to THORChain), **zero real inflation**.

### Distribution (10 pools)

| Pool | % | Amount | Use |
|---|---|---|---|
| Community & Mining | 30% | 60M LTD | User rewards, Incentivized Testnet |
| Staking & Validators | 20% | 40M LTD | Pre-minted rewards (APY 15–25%, ~8 years) |
| Development Fund | 12% | 24M LTD | 6-month cliff + 3-year linear |
| Team & Founders | 12% | 24M LTD | 1-year cliff + 2-year linear |
| Marketing & Partnerships | 6% | 12M LTD | Quarterly, milestone-based |
| Seed Round | 5% | 10M LTD | $0.02/LTD, 6mo cliff + 18mo linear |
| Strategic / Private | 5% | 10M LTD | $0.03/LTD, 3mo cliff + 12mo linear |
| Initial TGE Liquidity | 5% | 10M LTD | DEX pools + listings |
| Bug Bounties & Grants | 3% | 6M LTD | Via governance |
| Insurance Fund | 2% | 4M LTD | Emergency governance vote |
| **TOTAL** | **100%** | **200M LTD** | |

**Post-staking-pool sustainability** (after year 8): 6 redundant sources, including **marketplace commission routing (0.5% of GMV → validators)** — a revenue stream that pure store-of-value chains do not have.

Full tokenomics: [Whitepaper v2.0](https://latanda.online/whitepaper.html) · [Interactive page](https://latanda.online/ltd-token-economics.html)

## 🔗 La Tanda Chain

A sovereign blockchain built with **Cosmos SDK + CometBFT**, purpose-built for community fintech in Latin America.

- **Chain ID (testnet)**: `latanda-testnet-1`
- **Token**: LTD (denom `ultd`, 1 LTD = 1,000,000 ultd)
- **Address prefix**: `ltd`
- **Block time**: ~5 seconds
- **Consensus**: CometBFT (BFT, Delegated Proof of Stake)
- **Validators**: **36 bonded / 45 registered** (2026-09-09; live count at https://latanda.online/api/public/metrics) — genesis, PRO Delegators, drops, UTSA/lesnik, OwlStake, StakerHouse, ANODE.TEAM, AlxVoy, VALIDARIOS, narkosha, oleg1, + community
- **Governance**: active, 3 proposals passed
- **Mainnet**: planned for **Q1 2027**
- **Explorer (community)**: https://exp.utsa.tech/latanda/staking

### Incentivized Testnet Program

~100K LTD reserved for validators who join before mainnet:

| Tier | Slots | Reward at genesis |
|---|---|---|
| Infra Partner | 5 (4 taken) | 5,000 LTD |
| Validator | 10 | 2,000 LTD |
| Full Node | 20 | 500 LTD |
| Bug Reporter | open | 100–1,000 LTD |

**How to join**: [Node Operator Guide](./chain/la-tanda-chain-node-guide.md) · [Beginner's Guide](./chain/la-tanda-node-beginner-guide.md) · [latanda.online/chain](https://latanda.online/chain/)

## 🚀 Quick Start

### For users (non-technical)
1. Go to [latanda.online](https://latanda.online)
2. Create an account (email or Google Sign-In)
3. Join a tanda, post to the feed, mine LTD, explore the marketplace

### For developers (integrating with the La Tanda API)
1. API documentation (Swagger UI): https://latanda.online/docs
2. Dev portal: https://latanda.online/dev-dashboard.html
3. Auth: JWT via `/api/auth/login`
4. The full endpoint list is in the Swagger UI above — it is the source of truth
5. The API base URL is **`latanda.online`** — there is **no** `api.` subdomain. Chain endpoints are at `latanda.online/chain/rpc/` and `latanda.online/chain/api/`.

### For validators (running a node)
1. Read the guide: [chain/la-tanda-chain-node-guide.md](https://latanda.online/chain/la-tanda-chain-node-guide.md) (new to node operation? start with the [beginner's guide](https://latanda.online/chain/la-tanda-node-beginner-guide.md))
2. One-line install: `wget -q https://latanda.online/chain/node-setup.sh -O node-setup.sh && chmod +x node-setup.sh && ./node-setup.sh`
3. Chain page with seeds: https://latanda.online/chain/
4. Join the Incentivized Testnet Program by sending 10 testnet LTD + a create-validator tx

## 🛠️ Development Setup

This is a **static, build-free frontend**. No bundler, no framework, no transpile step — what is in the repo is what ships. There is no root `package.json` and no build command.

```bash
git clone https://github.com/INDIGOAZUL/la-tanda-web.git
cd la-tanda-web
npx serve .
```

Open the printed URL (usually <http://localhost:3000>) and navigate to the page you are working on, e.g. `/marketplace-social.html`.

Any static server works (`python3 -m http.server`, VS Code Live Server, …). Opening files directly via `file://` is **not** supported — relative fetches and the component loader will fail.

The pages talk to the **live production API** at `https://latanda.online`; there is no local backend in this repo.

## 📂 Project Structure

```
la-tanda-web/
├── *.html                  # ~60 ecosystem pages, served as-is
├── *.js                    # Root-level browser scripts — these are the ones
│                           #   the HTML pages actually load (no build step)
├── css/                    # Stylesheets (design tokens, components, modules)
├── js/                     # Newer page/feature modules (groups-system, trabajo,
│                           #   mi-perfil, hub/, …)
├── components/             # Shared header/footer partials (components-loader.js)
├── utils/                  # Small helpers (roleGuard.js)
├── middleware/             # Client-side middleware
├── chain/                  # Chain resources: genesis.json, node-setup.sh,
│                           #   node operator guides, chain landing page
├── docs/                   # OpenAPI spec + Swagger UI
├── packages/sdk/           # JS SDK (the only npm package in the repo)
├── translations/           # en.json / es.json / pt.json (partial i18n)
├── assets/                 # Vite-built bundles, images, logos, favicons
└── .github/                # Workflows, bounty issue templates, ban list
```

⚠️ **Gotcha**: a few scripts exist **both** at the HTML root and under `js/` (e.g. `marketplace-social.js`), the two copies have **diverged**, and the HTML pages load the **root** copy. Editing the `js/` copy does nothing. Always `grep` the page's `<script src=…>` before editing. Details in [CONTRIBUTING.md](./CONTRIBUTING.md).

**Key pages**:
- `index.html` — landing page (3D cosmic hero, tokenomics donut, persona cards)
- `whitepaper.html` — Whitepaper v2.0 (10 pools + 6 sustainability sources)
- `ltd-token-economics.html` — interactive tokenomics with live chain data
- `governance.html` — on-chain governance hub with Keplr wallet
- `mia.html` — MIA AI (the 7th layer)
- `chain/index.html` — chain landing page with live stats

## 🤝 How to contribute

**Read [CONTRIBUTING.md](./CONTRIBUTING.md) first.** It is short, and it will save you wasted work.

The single most important rule:

> **Bounties are assigned before work begins.** Comment on the issue with a proposal → a maintainer assigns you → *then* you open a PR.

A bot (`pr-gatekeeper.yml`) **automatically closes** pull requests that reference a bounty issue not assigned to their author, that come from accounts under 30 days old, or that come from accounts on `.github/ban-list.txt`. This is spam control, but it means claiming first is not optional.

We **no longer run open-ended Tier-0 bounties**. Work is scoped and assigned to one contributor, with a named reviewer.

**Want to be assigned real, paid work?** Join us on **[Discord](https://discord.gg/Ve9M2ZSYC2)** and say hello. That is the fastest way to get scoped and assigned.

## 📚 Resources

### Public documentation
- 🌐 Website: [latanda.online](https://latanda.online)
- 📜 Whitepaper v2.0: [latanda.online/whitepaper.html](https://latanda.online/whitepaper.html)
- 💰 Tokenomics: [latanda.online/ltd-token-economics.html](https://latanda.online/ltd-token-economics.html)
- 🏛️ Governance: [latanda.online/governance.html](https://latanda.online/governance.html)
- 💻 Dev Portal: [latanda.online/dev-dashboard.html](https://latanda.online/dev-dashboard.html)
- 📖 API Docs (Swagger UI): [latanda.online/docs](https://latanda.online/docs)
- 🔗 Chain: [latanda.online/chain](https://latanda.online/chain/)

### Community
- 💬 Discord: [discord.gg/Ve9M2ZSYC2](https://discord.gg/Ve9M2ZSYC2)
- 📢 Telegram: [t.me/latandahn](https://t.me/latandahn)
- 🐦 Twitter/X: [@TandaWeb3](https://twitter.com/TandaWeb3)
- 📰 Cosmos Forum: [Thread #16709](https://forum.cosmos.network/t/la-tanda-chain-incentivized-testnet-live-validators-node-operators-welcome-cosmos-sdk-v0-53-6/16709)
- 🟣 Reddit: [r/LaTandaChain](https://reddit.com/r/LaTandaChain)

## 🚫 Important rules

- **NEVER** commit `.env` files or credentials
- **NEVER** use `rsync --delete` against this repo
- **NEVER** modify `api-proxy-enhanced.js` without coordinating with the team
- Public ban list: `.github/ban-list.txt` (we do not accept PRs from listed accounts)

## 📜 License

MIT License — see [LICENSE](./LICENSE)

Open source, free to use with attribution. The marks "La Tanda" and "La Tanda Chain" are the property of Ray-Banks LLC.

## ⚖️ Legal

La Tanda is operated by **Ray-Banks LLC**. More at [raybanks.org](https://raybanks.org).

This repository is a public mirror of the frontend. The code is released for transparency and community contribution. It does not constitute an offer of securities or financial advice.

---

<a name="español"></a>

# 🇭🇳 Español

Este repositorio es el **mirror público** del frontend de La Tanda, el primer ecosistema Web3 soberano construido en Honduras para Latinoamérica.

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

## 📊 Estado actual (live en testnet)

Estamos **en etapa temprana, y es real**. Estas son las cifras reales de nuestra base de datos de producción y del chain en vivo, al **2026-09-09** — no son proyecciones, y no están redondeadas hacia arriba.

| Métrica | Valor real |
|---|---|
| **Usuarios registrados** | **80** (de los cuales **66** tienen email verificado) |
| **Grupos (tandas)** | **5** (3 con pagos reales completados) |
| **Pagos completados** | **41** (confirmados por el coordinador con referencia de transferencia) |
| **Aportaciones registradas** | **883** |
| **Dinero ciclado en tandas** | **L 1,652,100 HNL** recaudados (≈ **US$63,500**); **L 1,574,500** netos a beneficiarios |
| **Validadores del chain** | **36 bonded** (45 registrados) |
| **Altura del chain** | 3,058,040 (`latanda-testnet-1`) |
| **Propuestas de gobernanza pasadas** | **3** |
| **Uptime testnet desde Q1 2026** | 100% (sin incidentes de consenso) |

**Toda métrica de esta página es verificable** contra datos on-chain o el dev portal público. Preferimos que la compruebes.

**Cifras en vivo: https://latanda.online/api/public/metrics** (la misma consulta para toda superficie, caché de 5 minutos; la tabla de arriba es una foto fechada de ese endpoint).

**Por qué publicamos números tan pequeños.** 80 usuarios registrados han ciclado **≈US$63,500 (L 1,652,100)** de su propio dinero en **41 pagos completados** en 3 grupos — eso es retención real, dinero real, y un producto de 7 capas funcionando, con chain soberana, 36 validadores bonded y 3 propuestas de gobernanza aprobadas detrás. Esa es la parte difícil. Crecer es la parte fácil, y preferimos ganárnoslo a inventarlo.

> **Nota sobre cómo contamos usuarios.** "Registrado" significa que la cuenta existe; "email verificado" significa que su correo está confirmado. Ninguno de los dos significa identidad verificada ni KYC — hoy **no** hacemos KYC a los usuarios finales (la plataforma nunca retiene el dinero del grupo — hoy los pagos se liquidan fuera de la plataforma; la verificación de identidad es un workstream previo al mainnet). Nunca describimos a estos usuarios como "usuarios verificados" ni "usuarios con KYC".

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

## 🔗 La Tanda Chain

Blockchain soberana construida con **Cosmos SDK + CometBFT**, específicamente diseñada para fintech comunitaria en Latinoamérica.

- **Chain ID (testnet)**: `latanda-testnet-1`
- **Token**: LTD (denom `ultd`, 1 LTD = 1,000,000 ultd)
- **Address prefix**: `ltd`
- **Block time**: ~5 segundos
- **Consensus**: CometBFT (BFT, Delegated Proof of Stake)
- **Validadores**: **36 bonded / 45 registrados** (2026-09-09; conteo en vivo en https://latanda.online/api/public/metrics) — genesis, PRO Delegators, drops, UTSA/lesnik, OwlStake, StakerHouse, ANODE.TEAM, AlxVoy, VALIDARIOS, narkosha, oleg1, +community
- **Governance**: activa, 3 propuestas pasadas
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

**Cómo sumarte**: [Guía de Node Operator](./chain/la-tanda-chain-node-guide.md) · [Guía para principiantes](./chain/la-tanda-node-beginner-guide.md) · [latanda.online/chain](https://latanda.online/chain/)

## 🚀 Quick Start

### Para usuarios (no technical)
1. Ve a [latanda.online](https://latanda.online)
2. Crea tu cuenta (email o Google Sign-In)
3. Únete a una tanda, publica en el feed, mina LTD, explora el marketplace

### Para desarrolladores (integrar con La Tanda API)
1. Documentación API: https://latanda.online/docs
2. Dev portal: https://latanda.online/dev-dashboard.html
3. Autenticación: JWT via `/api/auth/login`
4. El listado completo de endpoints está en el Swagger UI de arriba — esa es la fuente de verdad
5. La API base es **`latanda.online`** — **no** existe un subdominio `api.`. Los endpoints del chain están en `latanda.online/chain/rpc/` y `latanda.online/chain/api/`.

### Para validadores (correr un nodo)
1. Lee la guía: [chain/la-tanda-chain-node-guide.md](https://latanda.online/chain/la-tanda-chain-node-guide.md) (¿primera vez? empieza por la [guía para principiantes](https://latanda.online/chain/la-tanda-node-beginner-guide.md))
2. Instalación one-line: `wget -q https://latanda.online/chain/node-setup.sh -O node-setup.sh && chmod +x node-setup.sh && ./node-setup.sh`
3. Chain page con seeds: https://latanda.online/chain/
4. Únete al Incentivized Testnet Program enviando 10 LTD testnet + create-validator tx

## 🛠️ Entorno de desarrollo

Este es un frontend **estático, sin build**. No hay bundler, ni framework, ni paso de transpilación — lo que está en el repo es lo que se sirve. No hay `package.json` en la raíz ni comando de build.

```bash
git clone https://github.com/INDIGOAZUL/la-tanda-web.git
cd la-tanda-web
npx serve .
```

Abre la URL que imprime (normalmente <http://localhost:3000>) y navega a la página que estés tocando, por ejemplo `/marketplace-social.html`.

Sirve cualquier servidor estático (`python3 -m http.server`, Live Server de VS Code…). Abrir los archivos directamente con `file://` **no** funciona: los fetch relativos y el component loader fallan.

Las páginas hablan con la **API de producción** en `https://latanda.online`; en este repo no hay backend local.

## 📂 Estructura del repositorio

```
la-tanda-web/
├── *.html                  # ~60 páginas del ecosistema, servidas tal cual
├── *.js                    # Scripts de navegador en la raíz — estos son los que
│                           #   las páginas HTML realmente cargan (sin build)
├── css/                    # Estilos (design tokens, components, modules)
├── js/                     # Módulos más nuevos (groups-system, trabajo, mi-perfil, hub/…)
├── components/             # Header/footer compartidos (components-loader.js)
├── utils/                  # Helpers (roleGuard.js)
├── middleware/             # Middleware de cliente
├── chain/                  # Recursos de La Tanda Chain: genesis.json, node-setup.sh,
│                           #   guías de node operator, landing del chain
├── docs/                   # OpenAPI spec + Swagger UI
├── packages/sdk/           # SDK de JS (el único paquete npm del repo)
├── translations/           # en.json / es.json / pt.json (i18n parcial)
├── assets/                 # Bundles de Vite, imágenes, logos, favicons
└── .github/                # Workflows, templates de bounties, ban list
```

⚠️ **Gotcha**: algunos scripts existen **dos veces** — en la raíz y en `js/` (ej. `marketplace-social.js`), las dos copias **han divergido**, y las páginas HTML cargan la copia de la **raíz**. Editar la copia de `js/` no hace nada. Haz siempre `grep` del `<script src=…>` de la página antes de editar. Detalles en [CONTRIBUTING.md](./CONTRIBUTING.md).

**Páginas principales alineadas al framework**:
- `index.html` — Landing con hero cósmico 3D + tokenomics donut + personas cards
- `whitepaper.html` — Whitepaper v2.0 con 10 pools + 6 fuentes sustainability
- `ltd-token-economics.html` — Tokenomics interactiva con datos live del chain
- `governance.html` — Hub de gobernanza on-chain con Keplr wallet
- `mia.html` — MIA AI (7ma capa del ecosistema)
- `chain/index.html` — Chain landing con stats live

## 🤝 Cómo contribuir

**Lee [CONTRIBUTING.md](./CONTRIBUTING.md) primero.** Es corto, y te va a ahorrar trabajo perdido.

La regla más importante:

> **Los bounties se asignan ANTES de empezar a trabajar.** Comenta en el issue con tu propuesta → un maintainer te asigna → *entonces* abres el PR.

Un bot (`pr-gatekeeper.yml`) **cierra automáticamente** los pull requests que referencian un bounty que no está asignado a su autor, los que vienen de cuentas con menos de 30 días, y los de cuentas en `.github/ban-list.txt`. Es control de spam, pero significa que reclamar primero **no es opcional**.

**Ya no corremos bounties Tier-0 abiertos.** El trabajo se define y se asigna a un contribuidor, con un revisor con nombre y apellido.

**¿Quieres que te asignemos trabajo real y pagado?** Pásate por **[Discord](https://discord.gg/Ve9M2ZSYC2)** y saluda. Es la vía más rápida para que te definamos y te asignemos una tarea.

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

## 🚫 Reglas importantes

- **NUNCA** commitees `.env` o credenciales
- **NUNCA** uses `rsync --delete` con este repo
- **NUNCA** modifiques `api-proxy-enhanced.js` sin coordinar con el equipo
- Ban list pública: `.github/ban-list.txt` (no aceptamos PRs de cuentas listadas)

## 📜 Licencia

MIT License — see [LICENSE](./LICENSE)

Código abierto, uso libre con atribución. Las marcas "La Tanda" y "La Tanda Chain" son propiedad de Ray-Banks LLC.

## ⚖️ Legal

La Tanda es operada por **Ray-Banks LLC**. Más información en [raybanks.org](https://raybanks.org).

Este repositorio es un mirror público del frontend. El código está liberado para transparencia y contribuciones comunitarias. No constituye oferta de valores ni asesoramiento financiero.

---

<p align="center">
<strong>Construyendo el Web3 de Latinoamérica, una tanda a la vez.</strong><br>
🇭🇳 Honduras → 🌎 LatAm → 🌍 Global
</p>
