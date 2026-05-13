# La Tanda - Web3 Ecosystem of Honduras

> Not an app. An ecosystem.
> Social network + digital tandas + marketplace + mining + sovereign chain.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Chain](https://img.shields.io/badge/chain-latanda--testnet--1-00d4ff)](https://latanda.online/chain/)
[![Supply](https://img.shields.io/badge/supply-200M%20LTD%20fixed-ffd700)](https://latanda.online/whitepaper.html)
[![Inflation](https://img.shields.io/badge/inflation-0%25-22c55e)](https://latanda.online/whitepaper.html)
[![Mainnet](https://img.shields.io/badge/mainnet-Q1%202027-8b5cf6)](https://latanda.online/chain/)

This repository is the public frontend mirror for La Tanda, a sovereign Web3 ecosystem built in Honduras for Latin America.

La Tanda combines rotating savings groups, social reputation, marketplace activity, LTD token mining, governance, and AI-assisted financial workflows into one public web experience.

---

## What Is La Tanda?

La Tanda is a seven-layer Web3 ecosystem. Digital tandas, also known as rotating savings and credit associations, are one layer of the platform rather than the whole product.

| # | Layer | What it does |
|---|---|---|
| 1 | Social network | Feed, stories, comments, reactions, and reputation-generating activity. |
| 2 | Digital tandas | Rotating savings groups with 0% platform commission, on-chain score, and integrated lending. |
| 3 | Web3 marketplace | Products, services, bookings, seller score, and payments in local currency or LTD. |
| 4 | LTD mining | Activity-based LTD earning with tiered rewards and a global daily cap. |
| 5 | On-chain reputation | Portable financial score across the ecosystem. |
| 6 | La Tanda Chain | Cosmos SDK + CometBFT sovereign blockchain with fixed LTD supply. |
| 7 | MIA AI | Financial assistant for user support and platform workflows. |

---

## Current Testnet Status

| Metric | Current value |
|---|---|
| Monthly active users | 15,000+ |
| Active tandas | 300+ |
| Chain validators | 13+ |
| Production API endpoints | 160+ |
| Production algorithms | 14, including fraud, ranking, credit, and health logic |
| Passed governance proposals | 2, GOV-001 and GOV-002 |
| Testnet uptime since Q1 2026 | 100% consensus uptime |

Public data can be checked through the Dev Portal, chain page, or community explorer.

---

## Tokenomics

LTD has a fixed supply model with 200M LTD and 0% inflation.

| Pool | Allocation | Amount | Use |
|---|---:|---:|---|
| Community and mining | 30% | 60M LTD | User rewards and incentivized testnet |
| Staking and validators | 20% | 40M LTD | Pre-minted validator rewards |
| Development fund | 12% | 24M LTD | Product and protocol development |
| Team and founders | 12% | 24M LTD | Vesting allocation |
| Marketing and partnerships | 6% | 12M LTD | Milestone-based growth |
| Seed round | 5% | 10M LTD | Early funding |
| Strategic / private | 5% | 10M LTD | Strategic allocation |
| Initial TGE liquidity | 5% | 10M LTD | DEX pools and listings |
| Bug bounties and grants | 3% | 6M LTD | Governance-managed incentives |
| Insurance fund | 2% | 4M LTD | Emergency governance reserve |

More detail:

- [Whitepaper v2.0](https://latanda.online/whitepaper.html)
- [Interactive tokenomics page](https://latanda.online/ltd-token-economics.html)

---

## La Tanda Chain

La Tanda Chain is a sovereign blockchain built with Cosmos SDK and CometBFT for community fintech workflows in Latin America.

| Property | Value |
|---|---|
| Testnet chain ID | `latanda-testnet-1` |
| Token | LTD |
| Denom | `ultd` |
| Conversion | 1 LTD = 1,000,000 ultd |
| Address prefix | `ltd` |
| Block time | About 5 seconds |
| Consensus | CometBFT BFT delegated proof of stake |
| Mainnet target | Q1 2027 |

Validator resources:

- [Chain page](https://latanda.online/chain/)
- [Community explorer](https://exp.utsa.tech/latanda/staking)
- [Node setup script](https://latanda.online/chain/node-setup.sh)
- [Node operator guide](https://latanda.online/chain/la-tanda-chain-node-guide.md)

---

## Quick Start

### Users

1. Visit [latanda.online](https://latanda.online).
2. Create an account with email or Google Sign-In.
3. Join a tanda, publish in the feed, mine LTD, or explore the marketplace.

### Developers

1. Open the [API documentation](https://latanda.online/docs).
2. Explore the [Dev Portal](https://latanda.online/dev-dashboard.html).
3. Use JWT authentication through `/api/auth/login`.
4. Review the frontend API integration files in this repository before changing API behavior.

### Validators

1. Read the [node operator guide](https://latanda.online/chain/la-tanda-chain-node-guide.md).
2. Run the setup script:

   ```sh
   wget -q https://latanda.online/chain/node-setup.sh -O node-setup.sh
   chmod +x node-setup.sh
   ./node-setup.sh
   ```

3. Check seeds and validator information on the [chain page](https://latanda.online/chain/).
4. Join the incentivized testnet by sending 10 testnet LTD and submitting a create-validator transaction.

---

## Development Setup

This frontend mirror is primarily a static web application. You can serve it locally without installing project dependencies.

### Requirements

- Node.js 18+ recommended
- `npx`, included with npm
- A modern browser

### Serve Locally

From the repository root:

```sh
npx serve .
```

Then open the local URL printed by `serve`, usually:

```txt
http://localhost:3000
```

Useful local entry points:

- `index.html` - public landing page
- `dev-dashboard.html` - developer portal UI
- `marketplace-social.html` - marketplace page
- `chain/index.html` - chain landing page
- `packages/sdk/README.md` - TypeScript SDK notes

### Link Verification

The main public developer links are:

- Swagger UI / API docs: https://latanda.online/docs
- Dev Portal: https://latanda.online/dev-dashboard.html
- Chain page: https://latanda.online/chain/
- Chain explorer: https://exp.utsa.tech/latanda/staking

These links should remain valid when README content is changed.

---

## Project Structure

The repository mixes static HTML pages, shared frontend modules, chain assets, and a TypeScript SDK package.

```txt
la-tanda-web/
├── *.html                         # Public and admin-facing static pages
├── api-*.js                       # Root-level API proxy, adapter, and endpoint configuration files
├── marketplace-social.js          # Root marketplace script loaded by marketplace-social.html
├── css/                           # Shared CSS, layout styles, mobile fixes, and design tokens
├── js/                            # Shared JavaScript modules, components, helpers, and page logic
├── js/core/                       # Core frontend utilities such as api-client, cache, and event-bus
├── js/components/                 # Reusable UI components
├── js/hub/                        # Hub-specific modules and widgets
├── components/                    # Shared HTML and JavaScript UI fragments
├── chain/                         # Chain page, genesis file, node setup script, and node guides
├── assets/, img/, images/         # Logos, generated bundles, images, icons, and Open Graph assets
├── translations/                  # Locale JSON files
├── packages/sdk/                  # TypeScript SDK package with tests and examples
├── workflows/                     # CI/CD workflow examples
└── .github/                       # Issue templates, PR template, workflows, and ban list
```

Important implementation notes:

- `marketplace-social.html` currently loads the root-level `marketplace-social.js`.
- A second `js/marketplace-social.js` file also exists, so check the HTML script tag before editing marketplace behavior.
- `api-proxy-enhanced.js` is the main enhanced API proxy used by the static frontend simulation layer.
- `api-proxy.js`, `api-adapter.js`, and `api-endpoints-config.js` are also API-related and should be reviewed before changing endpoint behavior.
- `docs` is a production path pointer in this mirror; use the public Swagger UI at `https://latanda.online/docs` for API browsing.

---

## Contributing

La Tanda uses GitHub Issues for community bounties.

| Tier | Eligibility | Reward |
|---|---|---|
| Tier 0 | Anyone | 10-50 LTD |
| Tier 1 | 1+ previous merge | 50-150 LTD |
| Tier 2 | 2+ previous merges | 150-500 LTD |

Before opening a pull request:

1. Read the bounty issue carefully.
2. Answer the issue's codebase verification question in the PR body.
3. Check `.github/ban-list.txt`.
4. Modify existing files instead of adding unrelated standalone files.
5. Keep one PR scoped to one bounty.
6. Verify relevant public links and local pages.
7. Do not commit credentials, `.env` files, private keys, or generated secrets.

The PR template may reference `CONTRIBUTING.md`; that file is not present in this mirror at the time of writing, so use the issue requirements, README notes, and `.github/` templates as the source of truth.

---

## Public Resources

- Website: https://latanda.online
- Whitepaper: https://latanda.online/whitepaper.html
- Tokenomics: https://latanda.online/ltd-token-economics.html
- Governance: https://latanda.online/governance.html
- Dev Portal: https://latanda.online/dev-dashboard.html
- API Docs: https://latanda.online/docs
- Chain: https://latanda.online/chain/
- Chain explorer: https://exp.utsa.tech/latanda/staking

Community:

- Discord: https://discord.gg/Ve9M2ZSYC2
- Telegram: https://t.me/latandahn
- X / Twitter: https://twitter.com/TandaWeb3
- Cosmos Forum: https://forum.cosmos.network/t/la-tanda-chain-incentivized-testnet-live-validators-node-operators-welcome-cosmos-sdk-v0-53-6/16709
- Reddit: https://reddit.com/r/LaTandaChain

---

## License

MIT License - see [LICENSE](./LICENSE).

The code is open for use with attribution. The "La Tanda" and "La Tanda Chain" marks are owned by Ray-Banks LLC.

---

## Legal

La Tanda is operated by Ray-Banks LLC. More information is available at [raybanks.org](https://raybanks.org).

This repository is a public frontend mirror released for transparency and community contributions. It is not a securities offering, investment advice, or financial advice.

---

## Important Rules

- Never commit `.env` files or credentials. Use `.env.example` as the reference.
- Never use `rsync --delete` with this repository.
- Do not modify `api-proxy-enhanced.js` without coordinating with the maintainers.
- Check `.github/ban-list.txt` before opening a PR.

---

<p align="center">
<strong>Building Latin America's Web3 ecosystem, one tanda at a time.</strong><br>
Honduras -> LatAm -> Global
</p>
