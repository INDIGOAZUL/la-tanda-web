# La Tanda - Web3 Ecosystem of Honduras

> Not an app. An ecosystem.
> Social network, digital tandas, marketplace, mining, reputation, AI, and a sovereign chain.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Chain](https://img.shields.io/badge/chain-latanda--testnet--1-00d4ff)](https://latanda.online/chain/)
[![Supply](https://img.shields.io/badge/supply-200M%20LTD%20fixed-ffd700)](https://latanda.online/whitepaper.html)
[![Inflation](https://img.shields.io/badge/inflation-0%25-22c55e)](https://latanda.online/whitepaper.html)
[![Mainnet](https://img.shields.io/badge/mainnet-Q1%202027-8b5cf6)](https://latanda.online/chain/)

This repository is the public frontend mirror for La Tanda, a sovereign Web3 ecosystem built in Honduras for Latin America.

## What Is La Tanda?

La Tanda is a seven-layer Web3 ecosystem. Digital tandas, also known as rotating savings groups or ROSCAs, are one layer of a wider product and protocol stack.

| # | Layer | Purpose |
|---|---|---|
| 1 | Social Network | Feed, stories, comments, reactions, and activity-based reputation. |
| 2 | Digital Tandas | Rotating savings groups with 0% commission, on-chain score, and lending integrations. |
| 3 | Web3 Marketplace | Products, services, bookings, seller score, and payments in local currency or LTD. |
| 4 | LTD Mining | Activity-based LTD rewards with tiered earning limits. |
| 5 | On-Chain Reputation | Unified financial score anchored to the chain and shared across ecosystem layers. |
| 6 | La Tanda Chain | Sovereign Cosmos SDK and CometBFT chain with fixed LTD supply. |
| 7 | MIA AI | Financial assistant powered by Llama 3.3 70B through Groq. |

## Current Testnet Status

| Metric | Current value |
|---|---|
| Monthly active users | 15,000+ |
| Active tandas | 300+ |
| Chain validators | 13+ |
| Production API endpoints | 160+ |
| Production algorithms | 14 |
| Past governance proposals | 2 |
| Testnet uptime since Q1 2026 | 100% |

All public metrics are intended to be verifiable through on-chain data, the public developer portal, or the chain explorer.

## Tokenomics

LTD uses a fixed-supply model with a pre-minted treasury and 0% real inflation.

| Pool | Share | Amount | Use |
|---|---:|---:|---|
| Community and Mining | 30% | 60M LTD | User rewards and incentivized testnet programs. |
| Staking and Validators | 20% | 40M LTD | Pre-minted validator and delegator rewards. |
| Development Fund | 12% | 24M LTD | Product and protocol development. |
| Team and Founders | 12% | 24M LTD | Long-term team allocation. |
| Marketing and Partnerships | 6% | 12M LTD | Growth, ecosystem, and partnership milestones. |
| Seed Round | 5% | 10M LTD | Early private allocation. |
| Strategic / Private | 5% | 10M LTD | Strategic ecosystem allocation. |
| Initial TGE Liquidity | 5% | 10M LTD | DEX pools and listings. |
| Bug Bounties and Grants | 3% | 6M LTD | Governance-managed rewards and grants. |
| Insurance Fund | 2% | 4M LTD | Emergency reserve governed by vote. |
| Total | 100% | 200M LTD | Fixed supply. |

Read the full tokenomics details in the [whitepaper](https://latanda.online/whitepaper.html) and the [interactive tokenomics page](https://latanda.online/ltd-token-economics.html).

## La Tanda Chain

La Tanda Chain is a sovereign blockchain built with Cosmos SDK and CometBFT for community finance in Latin America.

- Testnet chain ID: `latanda-testnet-1`
- Token: LTD
- Denom: `ultd`
- Conversion: 1 LTD = 1,000,000 ultd
- Address prefix: `ltd`
- Block time: approximately 5 seconds
- Consensus: CometBFT with delegated proof of stake
- Governance: active, with two past proposals
- Planned mainnet: Q1 2027
- Chain page: [latanda.online/chain](https://latanda.online/chain/)
- Community explorer: [exp.utsa.tech/latanda/staking](https://exp.utsa.tech/latanda/staking)

## Quick Start

### For Users

1. Visit [latanda.online](https://latanda.online).
2. Create an account with email or Google Sign-In.
3. Join a tanda, post in the feed, mine LTD, or explore the marketplace.

### For Developers

1. Review the public API docs at [latanda.online/docs](https://latanda.online/docs/).
2. Open the developer portal at [latanda.online/dev-dashboard.html](https://latanda.online/dev-dashboard.html).
3. Use JWT authentication through `/api/auth/login`.
4. Explore the frontend pages and API adapters in this repository.

### For Validators

1. Read the node guide at [latanda.online/la-tanda-chain-node-guide.md](https://latanda.online/la-tanda-chain-node-guide.md).
2. Install with the one-line setup script:

   ```sh
   wget -q https://latanda.online/chain/node-setup.sh -O node-setup.sh && chmod +x node-setup.sh && ./node-setup.sh
   ```

3. Check seeds and current chain information on [latanda.online/chain](https://latanda.online/chain/).
4. Join the Incentivized Testnet Program by sending 10 testnet LTD and creating a validator transaction.

## Development Setup

This project is a static frontend mirror. You can serve it locally with any static file server.

### Prerequisites

- Git
- Node.js 18 or newer, used only for local tooling such as `npx serve`

### Run Locally

1. Clone the repository:

   ```sh
   git clone https://github.com/INDIGOAZUL/la-tanda-web.git
   cd la-tanda-web
   ```

2. Start a local static server:

   ```sh
   npx serve .
   ```

3. Open the local URL printed by `serve`, usually `http://localhost:3000`.

4. Test the page you changed. For example:

   ```text
   http://localhost:3000/index.html
   http://localhost:3000/marketplace-social.html
   http://localhost:3000/dev-dashboard.html
   ```

No build step is required for normal README, HTML, CSS, or vanilla JavaScript changes.

## Project Structure

The repository is organized as a static web frontend with top-level pages, shared assets, API adapters, and chain resources.

```text
la-tanda-web/
|-- *.html                    Main frontend pages and ecosystem screens.
|-- api-*.js                  API adapters, proxies, and endpoint configuration.
|-- marketplace-social.js     Root-level marketplace script loaded by marketplace-social.html.
|-- admin-payouts.js          Admin and payout support scripts.
|-- coordinator-panel.js      Coordinator workflow scripts.
|-- css/                      Shared styles, modules, and design-system CSS.
|-- js/                       Additional JavaScript modules and utilities.
|-- components/               Reusable frontend components.
|-- assets/                   Built assets and generated frontend bundles.
|-- images/, img/             Images, logos, icons, and visual assets.
|-- chain/                    Chain resources such as setup scripts and genesis data.
|-- docs/                     Public API documentation and Swagger UI assets.
|-- translations/             Localization resources.
|-- middleware/, utils/       Runtime helpers and utility code.
|-- workflows/                Workflow-related project files.
|-- .github/                  GitHub issue templates, workflows, and contribution controls.
```

### Important Files

- `index.html` is the main landing page.
- `marketplace-social.html` loads the marketplace experience.
- `marketplace-social.js` at the repository root is the script loaded by `marketplace-social.html`.
- `api-proxy-enhanced.js` is the main API proxy file referenced by the repository safety rules.
- `api-adapter.js` and `api-endpoints-config.js` provide frontend API integration helpers.
- `.github/ban-list.txt` lists accounts blocked by the PR gatekeeper workflow.

## Link Verification

The following public links were checked while updating this README:

| Link | Purpose | Status |
|---|---|---|
| [latanda.online/docs](https://latanda.online/docs/) | Swagger / API documentation | Returns HTTP 200 after redirect from `/docs`. |
| [latanda.online/dev-dashboard.html](https://latanda.online/dev-dashboard.html) | Developer portal | Returns HTTP 200. |
| [latanda.online/chain](https://latanda.online/chain/) | Chain page | Returns HTTP 200. |
| [exp.utsa.tech/latanda/staking](https://exp.utsa.tech/latanda/staking) | Community chain explorer | Returns HTTP 200. |

## Contributing

La Tanda uses GitHub issues for bounty-based contribution.

| Tier | Eligibility | Reward |
|---|---|---|
| Tier 0 | Anyone | 10-50 LTD |
| Tier 1 | 1+ prior merge | 50-150 LTD |
| Tier 2 | 2+ prior merges | 150-500 LTD |

Before opening a PR:

1. Read the bounty issue carefully.
2. Keep the PR scoped to one bounty.
3. Modify only the files requested by the bounty.
4. Answer the bounty verification question in your PR description.
5. Use a GitHub-verified email for commits.
6. Check `.github/ban-list.txt` before contributing.

For documentation bounties, keep changes clear, verifiable, and developer-facing.

## Bounty Verification Notes

For the developer documentation bounty:

- `marketplace-social.html` loads `marketplace-social.js` from the HTML root with `<script src="marketplace-social.js?v=1775778141"></script>`.
- A second `js/marketplace-social.js` file also exists, but it is not the file referenced by `marketplace-social.html`.
- The main API file called out by repository safety rules is `api-proxy-enhanced.js`.
- `CONTRIBUTING.md` is not present in the current repository checkout, so the structure above is based on the current repository tree.

## Public Resources

- Website: [latanda.online](https://latanda.online)
- Whitepaper: [latanda.online/whitepaper.html](https://latanda.online/whitepaper.html)
- Tokenomics: [latanda.online/ltd-token-economics.html](https://latanda.online/ltd-token-economics.html)
- Governance: [latanda.online/governance.html](https://latanda.online/governance.html)
- Developer portal: [latanda.online/dev-dashboard.html](https://latanda.online/dev-dashboard.html)
- API docs: [latanda.online/docs](https://latanda.online/docs/)
- Chain page: [latanda.online/chain](https://latanda.online/chain/)
- Discord: [discord.gg/Ve9M2ZSYC2](https://discord.gg/Ve9M2ZSYC2)
- Telegram: [t.me/latandahn](https://t.me/latandahn)
- X / Twitter: [@TandaWeb3](https://twitter.com/TandaWeb3)
- Cosmos Forum: [La Tanda Chain thread](https://forum.cosmos.network/t/la-tanda-chain-incentivized-testnet-live-validators-node-operators-welcome-cosmos-sdk-v0-53-6/16709)
- Reddit: [r/LaTandaChain](https://reddit.com/r/LaTandaChain)

## License

MIT License. See [LICENSE](./LICENSE).

The code is open source and free to use with attribution. The "La Tanda" and "La Tanda Chain" marks are owned by Ray-Banks LLC.

## Legal

La Tanda is operated by Ray-Banks LLC. More information is available at [raybanks.org](https://raybanks.org).

This repository is a public frontend mirror. It is provided for transparency and community contribution. It is not a securities offering or financial advice.

## Safety Rules

- Never commit `.env` files or credentials. Use `.env.example` for reference.
- Never use `rsync --delete` with this repository.
- Never modify `api-proxy-enhanced.js` without coordinating with the team.
- Check `.github/ban-list.txt` before opening a PR.
