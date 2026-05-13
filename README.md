# La Tanda — Web3 Ecosystem of Honduras

> **Not an app. An ecosystem.** Social network + digital tandas + marketplace + LTD mining + sovereign blockchain.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Chain](https://img.shields.io/badge/chain-latanda--testnet--1-00d4ff)](https://latanda.online/chain/)
[![Supply](https://img.shields.io/badge/supply-200M%20LTD%20fixed-ffd700)](https://latanda.online/whitepaper.html)
[![Inflation](https://img.shields.io/badge/inflation-0%25-22c55e)](https://latanda.online/whitepaper.html)
[![Mainnet](https://img.shields.io/badge/mainnet-Q1%202027-8b5cf6)](https://latanda.online/chain/)

La Tanda is the public frontend mirror for a sovereign Web3 ecosystem built in Honduras for Latin America. It combines a social network, rotating savings groups, marketplace features, LTD mining, on-chain reputation, La Tanda Chain, and MIA AI.

---

## What is La Tanda?

La Tanda is a seven-layer Web3 ecosystem. Digital tandas, also known as ROSCAs or rotating savings groups, are one layer of a broader platform.

| # | Layer | Purpose |
|---|---|---|
| 1 | Social Network | Feed, stories, comments, reactions, and activity-based reputation |
| 2 | Digital Tandas | 0% commission rotating savings groups, on-chain scoring, and lending integrations |
| 3 | Web3 Marketplace | Products, services, bookings, seller reputation, and payments in HNL or LTD |
| 4 | LTD Mining | Activity-based LTD rewards across multiple user tiers |
| 5 | On-Chain Reputation | Portable financial reputation score anchored to the chain |
| 6 | La Tanda Chain | Sovereign Cosmos SDK + CometBFT blockchain with fixed LTD supply |
| 7 | MIA AI | Financial assistant integrated into the ecosystem |

---

## Current Status

| Metric | Current value |
|---|---|
| Monthly active users | 15,000+ |
| Active tandas | 300+ |
| Chain validators | 13+ |
| Production API endpoints | 160+ |
| Production algorithms | 14, including fraud, ranking, credit, and health checks |
| Governance proposals passed | 2 |
| Testnet uptime since Q1 2026 | 100% consensus uptime reported by the project |

Project metrics should be verified against public chain data, the developer portal, or the project maintainers before being used in external materials.

---

## Tokenomics

La Tanda uses a fixed-supply LTD model with a pre-minted treasury and 0% real inflation.

| Pool | Share | Amount | Purpose |
|---|---:|---:|---|
| Community and Mining | 30% | 60M LTD | User rewards and incentivized testnet |
| Staking and Validators | 20% | 40M LTD | Pre-minted validator and staking rewards |
| Development Fund | 12% | 24M LTD | Core development |
| Team and Founders | 12% | 24M LTD | Team allocation |
| Marketing and Partnerships | 6% | 12M LTD | Growth and ecosystem partnerships |
| Seed Round | 5% | 10M LTD | Seed allocation |
| Strategic / Private | 5% | 10M LTD | Strategic allocation |
| Initial TGE Liquidity | 5% | 10M LTD | DEX pools and listings |
| Bug Bounties and Grants | 3% | 6M LTD | Governance-funded ecosystem work |
| Insurance Fund | 2% | 4M LTD | Emergency governance reserve |
| **Total** | **100%** | **200M LTD** | |

Full tokenomics:
- [Whitepaper v2.0](https://latanda.online/whitepaper.html)
- [Interactive tokenomics page](https://latanda.online/ltd-token-economics.html)

---

## La Tanda Chain

La Tanda Chain is a sovereign blockchain built with Cosmos SDK and CometBFT for community fintech use cases in Latin America.

| Item | Value |
|---|---|
| Chain ID | `latanda-testnet-1` |
| Token | LTD |
| Denom | `ultd` |
| Unit | 1 LTD = 1,000,000 ultd |
| Address prefix | `ltd` |
| Block time | ~5 seconds |
| Consensus | CometBFT delegated Proof of Stake |
| Governance | Active |
| Planned mainnet | Q1 2027 |

Useful links:
- [Chain page](https://latanda.online/chain/)
- [Community chain explorer](https://exp.utsa.tech/latanda/staking)
- [Node operator guide](https://latanda.online/la-tanda-chain-node-guide.md)

---

## Quick Start

### For users

1. Visit [latanda.online](https://latanda.online).
2. Create an account with email or Google Sign-In.
3. Join a tanda, publish in the feed, mine LTD, or explore the marketplace.

### For developers integrating with the API

1. Open the [API documentation](https://latanda.online/docs/).
2. Open the [developer portal](https://latanda.online/dev-dashboard.html).
3. Authenticate with JWT using `POST /api/auth/login`.
4. Use the documented REST, WebSocket, marketplace, wallet, and chain endpoints.

### For validators and node operators

1. Review the [chain page](https://latanda.online/chain/).
2. Run the node setup script from the chain resources page.
3. Check seed, RPC, REST, and validator information before joining the incentivized testnet.

---

## Development Setup

This repository is a static frontend mirror. You can serve it locally with any static HTTP server.

### Prerequisites

- Node.js 18 or newer
- npm
- A terminal
- A modern browser

### Serve locally

From the repository root:

```bash
npx serve .
```

Then open the local URL printed by `serve`, commonly:

```text
http://localhost:3000
```

### Suggested validation steps

1. Open `index.html` through the local server, not directly with a `file://` URL.
2. Open `dev-dashboard.html` and confirm that static assets load.
3. Open one or two hub pages that depend on shared JavaScript and CSS.
4. Check the browser console for missing files or JavaScript errors.
5. Do not commit `.env` files, credentials, generated secrets, or local-only artifacts.

---

## Project Structure

```text
la-tanda-web/
├── *.html                 # Main static pages at the repository root
├── html/                  # Additional HTML pages
├── css/                   # Stylesheets, layout styles, design tokens, and component styles
├── js/                    # Shared frontend JavaScript modules and utilities
├── assets/                # Static assets, logos, favicons, and images
├── images/                # Image resources used by pages
├── img/                   # Additional image resources
├── components/            # Reusable page components
├── chain/                 # La Tanda Chain resources such as setup scripts and chain data
├── docs/                  # API documentation and Swagger UI resources
├── examples/              # Example integrations or sample flows
├── group/                 # Group and tanda-related frontend resources
├── middleware/            # Middleware-related project files
├── negocio/               # Business-facing pages or resources
├── packages/sdk/          # SDK package resources
├── translations/          # Translation files
├── utils/                 # Utility scripts
├── workflows/             # Workflow-related project resources
├── .github/               # GitHub templates, bounty workflows, and repository automation
└── api-*.js               # API adapters, handlers, and proxy files
```

Important root-level files include:

| File | Purpose |
|---|---|
| `index.html` | Main landing page |
| `dev-dashboard.html` | Developer portal entry point |
| `documentation.html` | Documentation landing page |
| `whitepaper.html` | Whitepaper page |
| `ltd-token-economics.html` | Interactive tokenomics page |
| `governance.html` | Governance hub |
| `api-proxy-enhanced.js` | Main enhanced API proxy file |
| `api-adapter.js` | API adapter utilities |
| `api-endpoints-config.js` | Endpoint configuration |
| `marketplace-social.js` | Marketplace social frontend logic at the repository root |

---

## Main Pages

| Page | Description |
|---|---|
| `index.html` | Landing page with ecosystem overview |
| `whitepaper.html` | Whitepaper v2.0 |
| `ltd-token-economics.html` | Interactive tokenomics data |
| `governance.html` | On-chain governance hub with wallet flows |
| `mia.html` | MIA AI page |
| `chain/index.html` | La Tanda Chain landing page |
| `dev-dashboard.html` | Developer portal and API explorer |

---

## Developer Resources

- [Website](https://latanda.online)
- [Developer Portal](https://latanda.online/dev-dashboard.html)
- [API Docs / Swagger UI](https://latanda.online/docs/)
- [Chain](https://latanda.online/chain/)
- [Chain Explorer](https://exp.utsa.tech/latanda/staking)
- [Whitepaper v2.0](https://latanda.online/whitepaper.html)
- [Tokenomics](https://latanda.online/ltd-token-economics.html)

---

## Contributing

La Tanda uses GitHub issues for bounty-based contributions.

| Tier | Contributor requirement | Reward range |
|---|---|---|
| Tier 0 | Anyone | 10–50 LTD |
| Tier 1 | At least one previous merged Tier 0 contribution | 50–150 LTD |
| Tier 2 | At least two previous merged contributions | 150–500 LTD |

Before opening a pull request:

1. Read the issue description carefully.
2. Answer the codebase verification question in the issue comment when required.
3. Modify only the files listed in the issue scope.
4. Keep one pull request focused on one bounty.
5. Sign commits with a verified GitHub email.
6. Never commit `.env` files, credentials, or secrets.

---

## Community

- [Discord](https://discord.gg/Ve9M2ZSYC2)
- [Telegram](https://t.me/latandahn)
- [Twitter / X](https://twitter.com/TandaWeb3)
- [Cosmos Forum thread](https://forum.cosmos.network/t/la-tanda-chain-incentivized-testnet-live-validators-node-operators-welcome-cosmos-sdk-v0-53-6/16709)
- [Reddit](https://reddit.com/r/LaTandaChain)

---

## License

MIT License — see [LICENSE](./LICENSE).

The code is open source with attribution. The “La Tanda” and “La Tanda Chain” marks belong to Ray-Banks LLC.

---

## Legal

La Tanda is operated by Ray-Banks LLC. More information is available at [raybanks.org](https://raybanks.org).

This repository is a public frontend mirror. It is provided for transparency and community contributions. It does not constitute a securities offering or financial advice.
