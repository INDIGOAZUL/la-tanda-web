# La Tanda — Web3 Ecosystem of Honduras

> **Not an app. An ecosystem.**
> Social network + digital tandas + marketplace + mining + our own blockchain.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Chain](https://img.shields.io/badge/chain-latanda--testnet--1-00d4ff)](https://latanda.online/chain/)
[![Genesis supply](https://img.shields.io/badge/genesis%20supply-200M%20LTD-ffd700)](https://latanda.online/whitepaper.html)

**[English](#english) · [Español](#español)**

---

<a name="english"></a>

# 🇬🇧 English

This repository is the **public mirror** of the La Tanda frontend — a sovereign Web3 ecosystem built in Honduras for Latin America.

## 🌐 What is La Tanda

La Tanda is a **Web3 ecosystem with 7 layers**. Savings groups (tandas / ROSCAs) are the core; the other layers build reputation and community around them.

### The 7 layers

| # | Layer | What it does |
|---|---|---|
| 1 | 💬 **Social Network** | Feed, stories, comments, reactions. Your activity builds your reputation. |
| 2 | 🔄 **Digital Tandas** | Record contributions, turns and payouts for your savings group. No fees charged to date. Members pay each other directly; La Tanda keeps the record. |
| 3 | 🛍️ **Web3 Marketplace** | Listings, services and bookings from local sellers (early stage). Buyer and seller agree on payment directly. |
| 4 | ⛏️ **LTD Mining** | Claim testnet LTD every day for real activity†. 5 tiers (base 1–12 LTD/day + streak bonus), global cap 500 LTD/day |
| 5 | ⭐ **Reputation** | Reputation score from your payment history in groups, portable across layers. Stored off-chain today. Not a credit score. |
| 6 | 🔗 **La Tanda Chain** | Sovereign blockchain, Cosmos SDK + CometBFT, 200M LTD genesis supply; inflation set by on-chain governance |
| 7 | 🤖 **MIA AI** | AI assistant that helps you use La Tanda and understand your groups. Guidance only, not financial advice. |

## 📊 Current status (live on testnet)

We are **early-stage and real**. These are figures from our platform records and the live chain, as of **2026-09-25** — not projections, not rounded up.

| Metric | Value (2026-09-25) |
|---|---|
| **Registered users** | **83** (**67** email-verified; none identity-verified) |
| **Savings groups (tandas)** | **4** created — **3** active with completed payouts |
| **Completed payouts** | **44**, recorded as completed by the group coordinator (paid off-platform, in cash or bank transfer) |
| **Money recorded on the platform** | more than **L 1.5 million** (≈ **US$60,000**) recorded by coordinators as paid out to beneficiaries. No fees charged to date. |
| **Chain validators** | **36 bonded** (48 registered) |
| **Chain** | `latanda-testnet-1`, running since **2026-02-25**; height ~3.3M; average block time ~5.6 s |
| **Governance proposals passed** | **3** |

Chain figures are verifiable on-chain; group figures are platform records, published live at the endpoint below.

**Live figures: https://latanda.online/api/public/metrics** (same query for every surface, 5-minute cache; the table above is a dated snapshot).

**Why we publish numbers this small.** The members of 3 real savings groups have recorded more than **L 1.5 million** in **44 completed payouts** on La Tanda: real people, their own savings, moved among themselves off-platform and recorded here. The chain behind it has **36 bonded validators** and **3 passed governance proposals**. That is the hard part. We would rather earn growth than claim it.

> **How we count users.** "Registered" = an account exists; "email-verified" = its email is confirmed. Neither means identity-verified or KYC'd. La Tanda does not run KYC today; if payments ever move through the app, identity checks will be run by the licensed payment partner.

## 💎 Tokenomics (200M LTD genesis supply)

**Model**: fixed genesis supply + pre-minted treasury (similar to THORChain). Inflation is a governance parameter: the testnet currently runs 5% (GOV-003); the mainnet design is 0%.

### Distribution (10 pools)

| Pool | % | Amount | Use |
|---|---|---|---|
| Community & Mining | 30% | 60M LTD | User rewards, Incentivized Testnet |
| Staking & Validators | 20% | 40M LTD | Pre-minted rewards, programmed distribution (no published yield figure)* |
| Development Fund | 12% | 24M LTD | 6-month cliff + 3-year linear |
| Team & Founders | 12% | 24M LTD | 1-year cliff + 2-year linear |
| Marketing & Partnerships | 6% | 12M LTD | Quarterly, milestone-based |
| Early supporters (private) | 5% | 10M LTD | Private agreements, not offered to the public; vesting applies |
| Strategic partners (private) | 5% | 10M LTD | Private agreements, not offered to the public; vesting applies |
| Liquidity reserve | 5% | 10M LTD | Reserved for mainnet, if and when launched |
| Bug Bounties & Grants | 3% | 6M LTD | Via governance |
| Insurance Fund | 2% | 4M LTD | Emergency governance vote |
| **TOTAL** | **100%** | **200M LTD** | |

**Long-term design** (after year 8): six funding sources for network security are described in the whitepaper. Design only; subject to governance and legal review.

Full tokenomics: [Whitepaper v2.0](https://latanda.online/whitepaper.html) · [Interactive page](https://latanda.online/ltd-token-economics.html)

## 🔗 La Tanda Chain

A sovereign blockchain built with **Cosmos SDK + CometBFT**, purpose-built for community fintech in Latin America.

- **Chain ID (testnet)**: `latanda-testnet-1`
- **Token**: LTD (denom `ultd`, 1 LTD = 1,000,000 ultd)
- **Address prefix**: `ltd`
- **Block time**: ~5.6 seconds (measured average)
- **Consensus**: CometBFT (BFT, Delegated Proof of Stake)
- **Validators**: **36 bonded / 48 registered** (2026-09-25; live count at https://latanda.online/api/public/metrics; full list in the explorer below)
- **Governance**: active, 3 proposals passed
- **Mainnet**: internal target **Q1-2027**, conditional on legal counsel; not a commitment
- **Explorer (community)**: https://exp.utsa.tech/latanda/staking

### Incentivized Testnet Program

Validators and node operators who join before mainnet are eligible for an allocation under the program rules*.

| Tier | Slots | Target allocation* |
|---|---|---|
| Infra Partner | 5 | 5,000 LTD |
| Validator | 10 | 2,000 LTD |
| Full Node | 20 | 500 LTD |
| Bug Reporter | open | 100–1,000 LTD |

<sub>* Targets, not guarantees. Final allocations follow the published program rules (snapshot, uptime, anti-fraud review) and legal review before mainnet.</sub>

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
4. Get 10 testnet LTD from the Discord faucet, create your validator, then run `!verify` in [Discord](https://discord.gg/Ve9M2ZSYC2) to join the Incentivized Testnet Program

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
├── *.html                  # ~55 ecosystem pages, served as-is
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

**Want scoped work assigned to you?** Join us on **[Discord](https://discord.gg/Ve9M2ZSYC2)** and say hello. That is the fastest way to get scoped and assigned.

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

La Tanda is not a bank and does not lend money. It does not hold, move or guarantee group funds: members pay each other directly and La Tanda keeps the record. Figures on this page come from platform records and are not audited. This repository is a public mirror of the frontend, released for transparency and community contribution; nothing here is an offer of securities or financial advice.

<sub>† LTD is currently a testnet token: it has no monetary value and cannot be bought, sold or exchanged for money. Any future mainnet allocation is not guaranteed and will follow published rules. \* Staking rewards have no published yield figure; they depend on validator commission and network activity and are not guaranteed. Earlier versions of this page showed a staking APY estimate and seed-round prices; both were withdrawn in September 2026.</sub>

---

<a name="español"></a>

# 🇭🇳 Español

Este repositorio es el **mirror público** del frontend de La Tanda, un ecosistema Web3 soberano construido en Honduras para Latinoamérica.

## 🌐 Qué es La Tanda

La Tanda es un **ecosistema Web3 de 7 capas**. Las tandas (grupos de ahorro rotativo) son el centro; las demás capas construyen reputación y comunidad alrededor de ellas.

### Las 7 capas del ecosistema

| # | Capa | Qué hace |
|---|---|---|
| 1 | 💬 **Red Social** | Feed, stories, comentarios, reacciones. Tu actividad construye tu reputación. |
| 2 | 🔄 **Tandas Digitales** | Registra aportes, turnos y pagos de tu grupo de ahorro. Sin comisiones cobradas a la fecha. Los miembros se pagan entre ellos; La Tanda lleva el registro. |
| 3 | 🛍️ **Marketplace Web3** | Publicaciones, servicios y reservas de vendedores locales (etapa temprana). Comprador y vendedor acuerdan el pago directamente. |
| 4 | ⛏️ **Minería de LTD** | Reclama LTD de testnet cada día por tu actividad real†. 5 niveles (base 1-12 LTD/día + bono por racha), tope global 500 LTD/día |
| 5 | ⭐ **Reputación** | Puntaje de reputación según tu historial de pagos en grupos, portable entre capas. Hoy se guarda fuera de la cadena. No es un puntaje de crédito. |
| 6 | 🔗 **La Tanda Chain** | Blockchain soberana Cosmos SDK + CometBFT, 200M LTD de suministro inicial; inflación definida por gobernanza on-chain |
| 7 | 🤖 **MIA AI** | Asistente con IA que te ayuda a usar La Tanda y entender tus grupos. Orientación, no asesoría financiera. |

## 📊 Estado actual (live en testnet)

Estamos **en etapa temprana, y es real**. Estas son cifras de los registros de la plataforma y del chain en vivo, al **2026-09-25** — no son proyecciones, y no están redondeadas hacia arriba.

| Métrica | Valor (2026-09-25) |
|---|---|
| **Usuarios registrados** | **83** (**67** con email verificado; ninguno con identidad verificada) |
| **Tandas (grupos de ahorro)** | **4** creadas — **3** activas con pagos completados |
| **Pagos completados** | **44**, registrados como completados por el coordinador del grupo (pagados fuera de la plataforma, en efectivo o transferencia) |
| **Dinero registrado en la plataforma** | más de **L 1.5 millones** (≈ **US$60,000**) registrados por los coordinadores como entregados a beneficiarios. Sin comisiones cobradas a la fecha. |
| **Validadores del chain** | **36 bonded** (48 registrados) |
| **Chain** | `latanda-testnet-1`, en marcha desde el **2026-02-25**; altura ~3.3M; tiempo de bloque promedio ~5.6 s |
| **Propuestas de gobernanza aprobadas** | **3** |

Las cifras de la cadena se verifican on-chain; las de grupos son registros de la plataforma, publicados en vivo en el endpoint de abajo.

**Cifras en vivo: https://latanda.online/api/public/metrics** (la misma consulta para toda superficie, caché de 5 minutos; la tabla de arriba es una foto fechada).

**Por qué publicamos números tan pequeños.** Los miembros de 3 grupos de ahorro reales han registrado más de **L 1.5 millones** en **44 pagos completados** en La Tanda: gente real, con sus propios ahorros, moviéndolos entre ellos fuera de la plataforma y registrándolos aquí. Detrás hay una cadena con **36 validadores bonded** y **3 propuestas de gobernanza aprobadas**. Esa es la parte difícil. Preferimos ganarnos el crecimiento a inventarlo.

> **Cómo contamos usuarios.** "Registrado" = la cuenta existe; "email verificado" = su correo está confirmado. Ninguno significa identidad verificada ni KYC. Hoy La Tanda no hace KYC; si algún día los pagos pasan por la app, la verificación de identidad la hará el socio de pagos con licencia.

## 💎 Tokenomics (200M LTD de suministro inicial)

**Modelo**: suministro inicial fijo + tesorería pre-acuñada (similar a THORChain). La inflación es un parámetro de gobernanza: el testnet corre hoy con 5% (GOV-003); el diseño de mainnet es 0%.

### Distribución (10 pools)

| Pool | % | Amount | Uso |
|---|---|---|---|
| Comunidad y Minería | 30% | 60M LTD | Recompensas usuarios, Incentivized Testnet |
| Staking y Validadores | 20% | 40M LTD | Rewards pre-acuñados, distribución programada (sin cifra de rendimiento publicada)* |
| Fondo de Desarrollo | 12% | 24M LTD | 6 meses cliff + 3 años linear |
| Equipo y Fundadores | 12% | 24M LTD | 1 año cliff + 2 años linear |
| Marketing y Alianzas | 6% | 12M LTD | Trimestral por hitos |
| Apoyos tempranos (privado) | 5% | 10M LTD | Acuerdos privados, no se ofrecen al público; con vesting |
| Socios estratégicos (privado) | 5% | 10M LTD | Acuerdos privados, no se ofrecen al público; con vesting |
| Reserva de liquidez | 5% | 10M LTD | Reservada para mainnet, si y cuando se lance |
| Bug Bounties y Grants | 3% | 6M LTD | Via governance |
| Fondo de Seguro | 2% | 4M LTD | Emergency governance vote |
| **TOTAL** | **100%** | **200M LTD** | |

**Diseño a largo plazo** (después del año 8): el whitepaper describe seis fuentes para financiar la seguridad de la red. Solo diseño; sujeto a gobernanza y revisión legal.

Tokenomics completa: [Whitepaper v2.0](https://latanda.online/whitepaper.html) · [Página interactiva](https://latanda.online/ltd-token-economics.html)

## 🔗 La Tanda Chain

Blockchain soberana construida con **Cosmos SDK + CometBFT**, específicamente diseñada para fintech comunitaria en Latinoamérica.

- **Chain ID (testnet)**: `latanda-testnet-1`
- **Token**: LTD (denom `ultd`, 1 LTD = 1,000,000 ultd)
- **Address prefix**: `ltd`
- **Block time**: ~5.6 segundos (promedio medido)
- **Consensus**: CometBFT (BFT, Delegated Proof of Stake)
- **Validadores**: **36 bonded / 48 registrados** (2026-09-25; conteo en vivo en https://latanda.online/api/public/metrics; lista completa en el explorer de abajo)
- **Governance**: activa, 3 propuestas pasadas
- **Mainnet**: objetivo interno Q1-2027, condicionado a asesoría legal; no es compromiso
- **Explorer (community)**: https://exp.utsa.tech/latanda/staking

### Incentivized Testnet Program

Los validadores y operadores de nodo que se sumen antes del mainnet son elegibles para una asignación según las reglas del programa*.

| Tier | Slots | Asignación objetivo* |
|---|---|---|
| Infra Partner | 5 | 5,000 LTD |
| Validator | 10 | 2,000 LTD |
| Full Node | 20 | 500 LTD |
| Bug Reporter | abierto | 100-1,000 LTD |

<sub>* Montos objetivo, no garantizados. La asignación final sigue las reglas publicadas del programa (snapshot, uptime, revisión antifraude) y revisión legal antes del mainnet.</sub>

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
4. Pide 10 LTD de testnet al faucet de Discord, crea tu validador y ejecuta `!verify` en [Discord](https://discord.gg/Ve9M2ZSYC2) para sumarte al Incentivized Testnet Program

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
├── *.html                  # ~55 páginas del ecosistema, servidas tal cual
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

**¿Quieres que te asignemos una tarea definida?** Pásate por **[Discord](https://discord.gg/Ve9M2ZSYC2)** y saluda. Es la vía más rápida para que te definamos y te asignemos una tarea.

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

La Tanda no es un banco y no presta dinero. No guarda, no mueve ni garantiza el dinero de los grupos: los miembros se pagan entre ellos y La Tanda lleva el registro. Las cifras de esta página vienen de los registros de la plataforma y no están auditadas. Este repositorio es un mirror público del frontend, liberado para transparencia y contribuciones comunitarias; nada aquí es una oferta de valores ni asesoría financiera.

<sub>† LTD es hoy un token de testnet: no tiene valor monetario y no se puede comprar, vender ni cambiar por dinero. Una asignación futura en mainnet no está garantizada y seguirá reglas publicadas. \* Las recompensas de staking no tienen cifra de rendimiento publicada; dependen de la comisión del validador y de la actividad de la red, y no están garantizadas. Versiones anteriores de esta página mostraban una estimación de APY para staking y precios de ronda seed; ambos se retiraron en septiembre de 2026.</sub>

---

<p align="center">
<strong>Construyendo el Web3 de Latinoamérica, una tanda a la vez.</strong><br>
🇭🇳 Honduras → 🌎 LatAm → 🌍 Global
</p>
