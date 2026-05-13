# La Tanda - Web3 Ecosystem from Honduras

> Not an app. An ecosystem.
> Social network, digital tandas, marketplace, LTD mining, reputation, and a sovereign chain.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Chain](https://img.shields.io/badge/chain-latanda--testnet--1-00d4ff)](https://latanda.online/chain/)
[![Supply](https://img.shields.io/badge/supply-200M%20LTD%20fixed-ffd700)](https://latanda.online/whitepaper.html)
[![Inflation](https://img.shields.io/badge/inflation-0%25-22c55e)](https://latanda.online/whitepaper.html)
[![Mainnet](https://img.shields.io/badge/mainnet-Q1%202027-8b5cf6)](https://latanda.online/chain/)

This repository is the public frontend mirror for La Tanda, a sovereign Web3 ecosystem built in Honduras for Latin America.

---

## What La Tanda Is

La Tanda combines seven product layers into one ecosystem. Digital tandas, also known as ROSCA rotating savings groups, are one layer of a larger platform for community finance.

| # | Layer | Purpose |
|---|---|---|
| 1 | Social network | Feed, stories, comments, reactions, and activity-based reputation. |
| 2 | Digital tandas | Rotating savings groups with 0% commission, on-chain scoring, and integrated lending. |
| 3 | Web3 marketplace | Products, services, bookings, seller score, and payments in lempiras or LTD. |
| 4 | LTD mining | Activity-based LTD rewards with user tiers and global caps. |
| 5 | On-chain reputation | Portable financial score anchored to La Tanda Chain. |
| 6 | La Tanda Chain | Sovereign Cosmos SDK + CometBFT chain with fixed LTD supply. |
| 7 | MIA AI | Financial assistant integrated into the ecosystem experience. |

---

## Current Testnet Status

| Metric | Current value |
|---|---|
| Monthly active users | 15,000+ |
| Active tandas | 300+ |
| Chain validators | 13+ |
| Production API endpoints | 160+ |
| Production algorithms | 14 |
| Governance proposals completed | 2 |
| Testnet uptime since Q1 2026 | 100% consensus uptime |

Public metrics are intended to be verifiable through the chain, API documentation, or the developer portal.

---

## Tokenomics

La Tanda uses a fixed 200M LTD supply and a pre-minted treasury model.

| Pool | Share | Amount | Purpose |
|---|---:|---:|---|
| Community and mining | 30% | 60M LTD | User rewards and incentivized testnet. |
| Staking and validators | 20% | 40M LTD | Validator rewards. |
| Development fund | 12% | 24M LTD | Product and protocol development. |
| Team and founders | 12% | 24M LTD | Team vesting. |
| Marketing and partnerships | 6% | 12M LTD | Growth and ecosystem partnerships. |
| Seed round | 5% | 10M LTD | Early financing allocation. |
| Strategic / private | 5% | 10M LTD | Strategic allocation. |
| Initial liquidity | 5% | 10M LTD | DEX pools and listings. |
| Bug bounties and grants | 3% | 6M LTD | Governance-directed ecosystem work. |
| Insurance fund | 2% | 4M LTD | Emergency governance reserve. |

More details are available in the [whitepaper](https://latanda.online/whitepaper.html) and the [tokenomics page](https://latanda.online/ltd-token-economics.html).

---

## La Tanda Chain

La Tanda Chain is a sovereign blockchain built with Cosmos SDK and CometBFT for community fintech use cases in Latin America.

| Item | Value |
|---|---|
| Testnet chain ID | `latanda-testnet-1` |
| Token | LTD |
| Base denom | `ultd`, where 1 LTD = 1,000,000 ultd |
| Address prefix | `ltd` |
| Block time | Approximately 5 seconds |
| Consensus | CometBFT delegated proof of stake |
| Governance | Active |
| Planned mainnet | Q1 2027 |

Useful chain links:

- Official chain page and explorer: [https://latanda.online/chain/](https://latanda.online/chain/)
- Community explorer: [https://exp.utsa.tech/latanda/staking](https://exp.utsa.tech/latanda/staking)
- Node guide: [chain/la-tanda-chain-node-guide.md](./chain/la-tanda-chain-node-guide.md)
- Beginner node guide: [chain/la-tanda-node-beginner-guide.md](./chain/la-tanda-node-beginner-guide.md)
- Genesis file: [chain/genesis.json](./chain/genesis.json)
- Setup script: [chain/node-setup.sh](./chain/node-setup.sh)

---

## Quick Start

### For users

1. Open [latanda.online](https://latanda.online).
2. Create an account with email or Google Sign-In.
3. Join a tanda, publish in the feed, mine LTD, or explore the marketplace.

### For developers integrating with La Tanda

1. Open the Swagger UI: [https://latanda.online/docs](https://latanda.online/docs).
2. Review the developer portal: [https://latanda.online/dev-dashboard.html](https://latanda.online/dev-dashboard.html).
3. Authenticate through `POST /api/auth/login`.
4. Use the published API and chain links from the developer portal.

### For validators

1. Read the [node operator guide](./chain/la-tanda-chain-node-guide.md).
2. Review the live chain page: [https://latanda.online/chain/](https://latanda.online/chain/).
3. Install with the setup script only after reviewing it:

```bash
wget -q https://latanda.online/chain/node-setup.sh -O node-setup.sh
chmod +x node-setup.sh
./node-setup.sh
```

---

## Development Setup

This mirror is a static frontend. No build step is required for the root HTML pages.

Prerequisites:

- Node.js 18 or newer.
- A browser with standard JavaScript module support.

Serve the repository locally:

```bash
npx serve .
```

Then open the local URL printed by `serve`, usually `http://localhost:3000`.

Local development notes:

- Root HTML files are served directly from the repository root.
- The developer-facing Swagger UI is available in production at [https://latanda.online/docs](https://latanda.online/docs).
- The public developer portal is available at [https://latanda.online/dev-dashboard.html](https://latanda.online/dev-dashboard.html).
- The chain explorer is available at [https://latanda.online/chain/](https://latanda.online/chain/).
- `api-proxy-enhanced.js` is the main API proxy used by the frontend simulation layer.
- `api-proxy.js` is the simpler local development proxy.
- Do not edit `api-proxy-enhanced.js` without coordinating with maintainers.

---

## Project Structure

The key directories and files in this mirror are:

```text
la-tanda-web/
|-- *.html                    Root pages for the ecosystem.
|-- marketplace-social.js     Marketplace script loaded by marketplace-social.html.
|-- api-proxy-enhanced.js     Main API proxy and simulation layer.
|-- api-proxy.js              Simple local development API proxy.
|-- api-adapter.js            Fetch adapter for La Tanda API calls.
|-- css/                      Global styles, dashboard styles, and component CSS.
|-- js/                       Shared JavaScript modules and page helpers.
|-- js/core/                  API client, cache, and event bus helpers.
|-- components/               Shared header, sidebar, footer, and widgets.
|-- assets/                   Built static assets, icons, images, and manifest files.
|-- chain/                    Chain page, guides, genesis file, validator assets, and setup script.
|-- html/                     Alternate built copies of selected runtime assets.
|-- packages/sdk/             SDK package source, types, and tests.
|-- .github/                  Issue templates, PR template, workflows, and public ban list.
```

Marketplace verification:

- `marketplace-social.html` loads `marketplace-social.js` from the HTML root.
- A `js/marketplace-social.js` file also exists, but it is not the script referenced by `marketplace-social.html`.
- The main API proxy file is `api-proxy-enhanced.js`.

---

## Public Resources

| Resource | Link |
|---|---|
| Website | [https://latanda.online](https://latanda.online) |
| Whitepaper | [https://latanda.online/whitepaper.html](https://latanda.online/whitepaper.html) |
| Tokenomics | [https://latanda.online/ltd-token-economics.html](https://latanda.online/ltd-token-economics.html) |
| Governance | [https://latanda.online/governance.html](https://latanda.online/governance.html) |
| Swagger UI | [https://latanda.online/docs](https://latanda.online/docs) |
| Developer portal | [https://latanda.online/dev-dashboard.html](https://latanda.online/dev-dashboard.html) |
| Chain explorer | [https://latanda.online/chain/](https://latanda.online/chain/) |
| Community explorer | [https://exp.utsa.tech/latanda/staking](https://exp.utsa.tech/latanda/staking) |

Community links:

- Discord: [https://discord.gg/Ve9M2ZSYC2](https://discord.gg/Ve9M2ZSYC2)
- Telegram: [https://t.me/latandahn](https://t.me/latandahn)
- X / Twitter: [https://twitter.com/TandaWeb3](https://twitter.com/TandaWeb3)
- Cosmos Forum thread: [https://forum.cosmos.network/t/la-tanda-chain-incentivized-testnet-live-validators-node-operators-welcome-cosmos-sdk-v0-53-6/16709](https://forum.cosmos.network/t/la-tanda-chain-incentivized-testnet-live-validators-node-operators-welcome-cosmos-sdk-v0-53-6/16709)
- Reddit: [https://reddit.com/r/LaTandaChain](https://reddit.com/r/LaTandaChain)

---

## Contributing

La Tanda uses GitHub issue bounties with three public tiers.

| Tier | Who can claim | Reward range |
|---|---|---|
| Tier 0 | Anyone | 10-50 LTD |
| Tier 1 | Contributors with at least one previous merge | 50-150 LTD |
| Tier 2 | Contributors with at least two previous merges | 150-500 LTD |

Before opening a pull request:

1. Read the bounty issue carefully.
2. Answer the codebase verification question from the issue.
3. Check `.github/ban-list.txt`.
4. Keep one pull request scoped to one bounty.
5. Sign commits with an email verified on GitHub.

---

## Important Rules

- Never commit `.env` files, secrets, private keys, or credentials.
- Never use destructive sync commands such as `rsync --delete` against this repository.
- Never modify `api-proxy-enhanced.js` without maintainer coordination.
- Keep documentation updates in English when the content is developer-facing.

---

## License

MIT License. See [LICENSE](./LICENSE).

The code is open source with attribution. The "La Tanda" and "La Tanda Chain" marks are owned by Ray-Banks LLC.

---

## Legal

La Tanda is operated by Ray-Banks LLC. More information is available at [raybanks.org](https://raybanks.org).

This repository is a public frontend mirror. It is provided for transparency and community contributions. It is not an offer of securities or financial advice.
