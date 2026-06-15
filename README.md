# La Tanda - Web3 Ecosystem of Honduras

> **No es una app. Es un ecosistema.**
> Red social + tandas digitales + marketplace + mineria + blockchain propia.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Chain](https://img.shields.io/badge/chain-latanda--testnet--1-00d4ff)](https://latanda.online/chain/)
[![Supply](https://img.shields.io/badge/supply-200M%20LTD%20fijo-ffd700)](https://latanda.online/whitepaper.html)
[![Inflation](https://img.shields.io/badge/inflation-0%25-22c55e)](https://latanda.online/whitepaper.html)
[![Mainnet](https://img.shields.io/badge/mainnet-Q1%202027-8b5cf6)](https://latanda.online/chain/)

Este repositorio es el mirror publico del frontend de La Tanda, un ecosistema Web3 construido en Honduras para Latinoamerica.

---

## Que es La Tanda

La Tanda combina varias capas de producto en una sola plataforma. Las tandas digitales son solo una de ellas.

### Capas del ecosistema

| # | Capa | Descripcion |
|---|---|---|
| 1 | Red social | Feed, stories, comentarios y reacciones. |
| 2 | Tandas digitales | Grupos de ahorro rotativo con score on-chain. |
| 3 | Marketplace Web3 | Productos, servicios y pagos en lempiras o LTD. |
| 4 | Mineria de LTD | Recompensas por actividad real. |
| 5 | Reputacion on-chain | Score financiero portable entre capas. |
| 6 | La Tanda Chain | Blockchain basada en Cosmos SDK + CometBFT. |
| 7 | MIA AI | Asistente financiero del ecosistema. |

---

## Estado actual

| Metrica | Valor |
|---|---|
| Usuarios activos mensuales | 15,000+ |
| Tandas activas | 300+ |
| Validadores de chain | 13+ |
| API endpoints en produccion | 160+ |
| Algoritmos productivos | 14 |
| Propuestas de gobernanza pasadas | 2 |
| Uptime testnet desde Q1 2026 | 100% |

---

## Tokenomics

Supply fijo de **200M LTD** con treasury pre-acunado y sin inflacion real.

### Distribucion

| Pool | % | Amount | Uso |
|---|---|---|---|
| Comunidad y mineria | 30% | 60M LTD | Incentivos para usuarios y testnet |
| Staking y validadores | 20% | 40M LTD | Rewards pre-acunados |
| Fondo de desarrollo | 12% | 24M LTD | Desarrollo del protocolo |
| Equipo y fundadores | 12% | 24M LTD | Vesting |
| Marketing y alianzas | 6% | 12M LTD | Growth |
| Seed round | 5% | 10M LTD | Inversion temprana |
| Strategic / Private | 5% | 10M LTD | Inversion privada |
| Liquidez inicial TGE | 5% | 10M LTD | Liquidez |
| Bug bounties y grants | 3% | 6M LTD | Recompensas y grants |
| Fondo de seguro | 2% | 4M LTD | Emergencias |

Mas detalle:
- [Whitepaper v2.0](https://latanda.online/whitepaper.html)
- [Token economics interactiva](https://latanda.online/ltd-token-economics.html)

---

## La Tanda Chain

- **Chain ID (testnet)**: `latanda-testnet-1`
- **Token**: LTD (`ultd`)
- **Address prefix**: `ltd`
- **Block time**: ~5 segundos
- **Consensus**: CometBFT
- **Governance**: activa
- **Mainnet**: planificado para Q1 2027
- **Explorer**: [exp.utsa.tech/latanda/staking](https://exp.utsa.tech/latanda/staking)

### Incentivized Testnet

| Tier | Slots | Reward al genesis |
|---|---|---|
| Infra Partner | 5 | 5,000 LTD |
| Validator | 10 | 2,000 LTD |
| Full Node | 20 | 500 LTD |
| Bug Reporter | abierto | 100-1,000 LTD |

---

## Quick Start

### Para usuarios
1. Ve a [latanda.online](https://latanda.online)
2. Crea tu cuenta
3. Explora tandas, marketplace, mineria y comunidad

### Para desarrolladores
1. Revisa la API en [latanda.online/docs](https://latanda.online/docs)
2. Usa el dev portal en [latanda.online/dev-dashboard.html](https://latanda.online/dev-dashboard.html)
3. Autenticacion via JWT

### Para validadores
1. Revisa la guia en [latanda.online/la-tanda-chain-node-guide.md](https://latanda.online/la-tanda-chain-node-guide.md)
2. Usa la chain page en [latanda.online/chain](https://latanda.online/chain/)

---

## Estructura del repositorio

El repositorio contiene frontend estatico, scripts y recursos operativos.

```text
la-tanda-web/
|- *.html
|- css/
|- js/
|- assets/
|- chain/
|- docs/
|- .github/
`- api-*.js
```

### Estructura verificada en este repo

- `chain/` existe y contiene recursos de chain
- `docs/` existe para documentacion
- `.github/` existe para reglas y templates
- hay multiples archivos `api-*.js`
- hay decenas de paginas `.html` en la raiz

### Paginas principales

- `index.html`
- `whitepaper.html`
- `ltd-token-economics.html`
- `governance.html`
- `mia.html`
- `chain/`

---

## Como contribuir

La Tanda usa un sistema de bounties por tiers:

| Tier | Quien puede | Reward |
|---|---|---|
| Tier 0 | Cualquiera | 10-50 LTD |
| Tier 1 | 1+ merge previo | 50-150 LTD |
| Tier 2 | 2+ merges previos | 150-500 LTD |

Antes de abrir PR:
1. Lee `CONTRIBUTING.md` si existe
2. Revisa `.github/ban-list.txt`
3. Responde la pregunta de verificacion del bounty
4. Un PR por bounty

---

## Recursos

### Documentacion publica

- [Website](https://latanda.online)
- [Whitepaper v2.0](https://latanda.online/whitepaper.html)
- [Tokenomics](https://latanda.online/ltd-token-economics.html)
- [Governance](https://latanda.online/governance.html)
- [Dev Portal](https://latanda.online/dev-dashboard.html)
- [API Docs](https://latanda.online/docs)
- [Chain](https://latanda.online/chain/)

### Comunidad

- [Discord](https://discord.gg/Ve9M2ZSYC2)
- [Telegram](https://t.me/latandahn)
- [Twitter](https://twitter.com/TandaWeb3)
- [Cosmos Forum](https://forum.cosmos.network/t/la-tanda-chain-incentivized-testnet-live-validators-node-operators-welcome-cosmos-sdk-v0-53-6/16709)
- [Reddit](https://reddit.com/r/LaTandaChain)

---

## Licencia

MIT License. Ver [LICENSE](./LICENSE).

---

## Legal

La Tanda es operada por **Ray-Banks LLC**.

Este repositorio es un mirror publico del frontend. El codigo esta liberado para transparencia y contribuciones comunitarias. No constituye oferta de valores ni asesoramiento financiero.

---

## Reglas importantes

- Nunca commitees `.env` o credenciales
- Nunca uses `rsync --delete` con este repo
- No modifiques `api-proxy-enhanced.js` sin coordinar con el equipo
- Revisa la ban list publica en `.github/ban-list.txt`
