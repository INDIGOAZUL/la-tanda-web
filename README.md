# La Tanda - Web3 Ecosystem of Honduras

> **Not an app. An ecosystem.**
> Social network + digital tandas + marketplace + mining + sovereign chain.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Chain](https://img.shields.io/badge/chain-latanda--testnet--1-00d4ff)](https://latanda.online/chain/)
[![Supply](https://img.shields.io/badge/supply-200M%20LTD%20fixed-ffd700)](https://latanda.online/whitepaper.html)
[![Inflation](https://img.shields.io/badge/inflation-0%25-22c55e)](https://latanda.online/whitepaper.html)
[![Mainnet](https://img.shields.io/badge/mainnet-Q1%202027-8b5cf6)](https://latanda.online/chain/)

This repository is the public frontend mirror for La Tanda, a sovereign Web3 ecosystem built in Honduras for Latin America.

---

## What La Tanda Is

La Tanda is a Web3 ecosystem with seven integrated layers. Tandas, also known as rotating savings groups or ROSCAs, are one layer of the product rather than the whole application.

| # | Layer | What it does |
|---|---|---|
| 1 | Social Network | Feed, stories, comments, and reactions. User activity can generate on-chain reputation. |
| 2 | Digital Tandas | Rotating savings groups with 0% commission, on-chain scoring, and integrated lending. |
| 3 | Web3 Marketplace | Products, services, bookings, seller score, and payments in lempiras or LTD. |
| 4 | LTD Mining | Activity-based rewards across five tiers with a global cap. |
| 5 | On-Chain Reputation | Portable financial score across ecosystem layers. |
| 6 | La Tanda Chain | Sovereign Cosmos SDK + CometBFT chain with fixed LTD supply. |
| 7 | MIA AI | Financial assistant powered by Groq Llama 3.3 70B. |

---

## Current Status

| Metric | Current value |
|---|---|
| Monthly active users | 15,000+ |
| Active tandas | 300+ |
| Chain validators | 13+ |
| Production API endpoints | 160+ |
| Production algorithms | 14 |
| Past governance proposals | 2 |
| Testnet uptime since Q1 2026 | 100% |

Metrics are intended to be verifiable against public on-chain data or the public developer portal.

---

## Development Setup

The frontend can be served as a static site. From the repository root:

```bash
npx serve .
```

Then open the local URL printed by `serve`, usually `http://localhost:3000`.

Recommended local verification:

1. Open `index.html` and confirm the landing page loads.
2. Open `dev-dashboard.html` and confirm the developer portal route works.
3. Open `docs` or visit the hosted Swagger UI at [latanda.online/docs](https://latanda.online/docs).
4. Open [latanda.online/chain](https://latanda.online/chain/) to compare chain links and explorer references.
5. Check the browser console for missing assets or broken relative paths.

---

## Project Structure

The repository is a static frontend mirror with HTML pages at the root and supporting assets split by purpose.

```text
la-tanda-web/
â”œâ”€â”€ *.html                         # Main ecosystem pages and product surfaces
â”œâ”€â”€ api-*.js                       # API adapters, proxy files, and endpoint helpers
â”œâ”€â”€ assets/                        # Built/static assets used by hosted pages
â”œâ”€â”€ chain/                         # Chain resources such as node setup and genesis files
â”œâ”€â”€ components/                    # Shared component fragments
â”œâ”€â”€ css/                           # Design tokens, page styles, and module styles
â”œâ”€â”€ examples/                      # Example files and integration references
â”œâ”€â”€ html/                          # Mirrored HTML/static assets for deployment variants
â”œâ”€â”€ i18n/                          # Internationalization resources
â”œâ”€â”€ images/, img/, assets/         # Images, logos, favicons, and media assets
â”œâ”€â”€ js/                            # Frontend modules, loaders, hub code, and utilities
â”œâ”€â”€ middleware/                    # Middleware-related frontend helpers
â”œâ”€â”€ packages/                      # Package-level code and grouped assets
â”œâ”€â”€ translations/                  # Translation files and localization support
â”œâ”€â”€ utils/                         # Shared utility code
â”œâ”€â”€ workflows/                     # Workflow-related assets
â””â”€â”€ .github/                       # Issue templates, PR template, ban list, and CI workflows
```

Important root files:

- `api-proxy-enhanced.js` is the main API proxy file referenced by the project rules.
- `marketplace-social.js` exists at the HTML root, and there is also a copy under `js/`.
- `dev-dashboard.html` is the public developer portal surface.
- `docs` points to the hosted API documentation path.
- `.github/PULL_REQUEST_TEMPLATE.md` contains the PR checklist for bounty contributors.

---

## API And Developer Links

- Swagger UI / API docs: [latanda.online/docs](https://latanda.online/docs)
- Developer portal: [latanda.online/dev-dashboard.html](https://latanda.online/dev-dashboard.html)
- Chain page: [latanda.online/chain](https://latanda.online/chain/)
- Community explorer: [exp.utsa.tech/latanda/staking](https://exp.utsa.tech/latanda/staking)
- Authentication entry point: `/api/auth/login`

---

## Tokenomics

LTD uses a fixed-supply model with a pre-minted treasury, no real inflation, and ten allocation pools.

| Pool | Allocation | Amount | Purpose |
|---|---:|---:|---|
| Community and Mining | 30% | 60M LTD | User rewards and incentivized testnet |
| Staking and Validators | 20% | 40M LTD | Pre-minted validator rewards |
| Development Fund | 12% | 24M LTD | Development runway |
| Team and Founders | 12% | 24M LTD | Team allocation |
| Marketing and Partnerships | 6% | 12M LTD | Growth milestones |
| Seed Round | 5% | 10M LTD | Seed allocation |
| Strategic / Private | 5% | 10M LTD | Strategic allocation |
| Initial TGE Liquidity | 5% | 10M LTD | DEX pools and listings |
| Bug Bounties and Grants | 3% | 6M LTD | Governance-managed rewards |
| Insurance Fund | 2% | 4M LTD | Emergency governance reserve |

More details:

- [Whitepaper v2.0](https://latanda.online/whitepaper.html)
- [Interactive tokenomics](https://latanda.online/ltd-token-economics.html)

---

## La Tanda Chain

La Tanda Chain is a sovereign blockchain built with Cosmos SDK and CometBFT for community fintech in Latin America.

- Testnet chain ID: `latanda-testnet-1`
- Token: LTD
- Denom: `ultd`
- Unit: `1 LTD = 1,000,000 ultd`
- Address prefix: `ltd`
- Block time: about 5 seconds
- Consensus: CometBFT delegated proof of stake
- Mainnet target: Q1 2027
- Explorer: [exp.utsa.tech/latanda/staking](https://exp.utsa.tech/latanda/staking)

Validator resources:

- Chain page: [latanda.online/chain](https://latanda.online/chain/)
- Node operator guide: [latanda.online/la-tanda-chain-node-guide.md](https://latanda.online/la-tanda-chain-node-guide.md)

---

## Quick Start

### Users

1. Visit [latanda.online](https://latanda.online).
2. Create an account with email or Google Sign-In.
3. Join a tanda, publish in the feed, mine LTD, or explore the marketplace.

### Developers

1. Read the API docs at [latanda.online/docs](https://latanda.online/docs).
2. Open the developer portal at [latanda.online/dev-dashboard.html](https://latanda.online/dev-dashboard.html).
3. Authenticate with JWT through `/api/auth/login`.
4. Integrate against the production API surfaces.

### Validators

1. Review the chain page at [latanda.online/chain](https://latanda.online/chain/).
2. Follow the node operator guide.
3. Use the setup script only after reviewing it locally.
4. Join the incentivized testnet program through the chain instructions.

---

## Main Pages

- `index.html` - Landing page with ecosystem overview.
- `whitepaper.html` - Whitepaper v2.0.
- `ltd-token-economics.html` - Interactive tokenomics.
- `governance.html` - On-chain governance hub.
- `mia.html` - MIA AI page.
- `chain/index.html` - Chain landing page.
- `marketplace-social.html` - Marketplace social layer.
- `dev-dashboard.html` - Developer portal.

---

## Contributing

La Tanda uses a three-tier bounty system through GitHub Issues.

| Tier | Who can claim | Reward |
|---|---|---|
| Tier 0 | Anyone | 10-50 LTD |
| Tier 1 | Contributors with at least one previous merge | 50-150 LTD |
| Tier 2 | Contributors with at least two previous merges | 150-500 LTD |

Before opening a pull request:

1. Read the bounty issue carefully and answer its verification question.
2. Check `.github/ban-list.txt`.
3. Use the PR template in `.github/PULL_REQUEST_TEMPLATE.md`.
4. Keep each PR scoped to one bounty.
5. Sign commits with an email verified on GitHub.

Pull requests are expected to modify existing files rather than adding unrelated standalone scripts.

---

## Community

- Website: [latanda.online](https://latanda.online)
- Discord: [discord.gg/Ve9M2ZSYC2](https://discord.gg/Ve9M2ZSYC2)
- Telegram: [t.me/latandahn](https://t.me/latandahn)
- X / Twitter: [@TandaWeb3](https://twitter.com/TandaWeb3)
- Cosmos Forum: [Thread #16709](https://forum.cosmos.network/t/la-tanda-chain-incentivized-testnet-live-validators-node-operators-welcome-cosmos-sdk-v0-53-6/16709)
- Reddit: [r/LaTandaChain](https://reddit.com/r/LaTandaChain)

---

## License

MIT License - see [LICENSE](./LICENSE).

The code is open for transparency and community contributions. The "La Tanda" and "La Tanda Chain" marks are owned by Ray-Banks LLC.

---

## Legal

La Tanda is operated by Ray-Banks LLC. More information is available at [raybanks.org](https://raybanks.org).

This repository is a public frontend mirror. It is not a securities offering or financial advice.

---

## Important Rules

- Never commit `.env` files or credentials. Use `.env.example` for reference.
- Never run destructive sync commands such as `rsync --delete` against this repository.
- Do not modify `api-proxy-enhanced.js` without coordinating with the maintainers.
- Check the public ban list at `.github/ban-list.txt` before contributing.

---

<p align="center">
<strong>Building Latin America's Web3 ecosystem, one tanda at a time.</strong><br>
Honduras -> LatAm -> Global
</p>
