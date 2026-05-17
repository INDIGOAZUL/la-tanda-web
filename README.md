# La Tanda Web

La Tanda Web is the public frontend mirror for La Tanda, a Honduras-built Web3 ecosystem for collaborative finance in Latin America.

The product combines a social layer, digital tandas, marketplace flows, LTD activity mining, on-chain reputation, La Tanda Chain, and the MIA financial assistant. This repository is developer-facing: it helps contributors inspect the static frontend, understand the key files, and submit focused bounty pull requests.

## Live Resources

- Website: https://latanda.online
- Swagger UI: https://latanda.online/docs/
- Developer portal: https://latanda.online/dev-dashboard.html
- Chain page: https://latanda.online/chain/
- Community chain explorer: https://exp.utsa.tech/latanda/staking
- Whitepaper: https://latanda.online/whitepaper.html
- LTD tokenomics: https://latanda.online/ltd-token-economics.html

Link check: Swagger UI, Developer Portal, Chain page, community chain explorer, Whitepaper, and LTD tokenomics were verified with HTTP 200 responses on 2026-05-17.

## Development Setup

This repository is a static frontend mirror. You can serve it locally without a build step.

1. Install Node.js 18 or newer.
2. From the repository root, run:

```bash
npx serve .
```

3. Open the local URL printed by `serve`, usually:

```text
http://localhost:3000
```

4. Test key pages after changes:

```text
/index.html
/dev-dashboard.html
/marketplace-social.html
/chain/
/docs/
```

Alternative local server:

```bash
python -m http.server 3000
```

No `.env` file is required for static README, HTML, CSS, or client-side JavaScript changes. Never commit credentials, wallet private keys, API keys, or generated local secrets.

## Project Structure

```text
la-tanda-web/
├── *.html                         # Static app pages and ecosystem entry points
├── css/                           # Global styles, design tokens, modules, and page CSS
├── js/                            # Shared JavaScript, components, helpers, and feature modules
├── js/hub/                        # Social hub modules such as feed, comments, and widgets
├── components/                    # Shared header, footer, sidebar, and UI snippets
├── assets/                        # Images, icons, generated bundles, and PWA assets
├── docs/                          # Swagger UI and OpenAPI documentation assets
├── chain/                         # La Tanda Chain landing page, node guides, genesis, setup script
├── packages/sdk/                  # TypeScript SDK source, tests, and examples
├── translations/                  # Locale JSON files
├── .github/                       # Issue templates, PR template, workflows, and ban list
└── api-*.js                       # API adapters, proxy layers, and API simulation helpers
```

Important codebase notes:

- The canonical marketplace social files live at the repository root: `marketplace-social.html` and `marketplace-social.js`.
- There is also a `js/marketplace-social.js`, but the bounty verification target is the root `marketplace-social.js`.
- The main API proxy file is `api-proxy-enhanced.js`. Do not modify it without explicit coordination.
- The OpenAPI specification is served through `docs/` and surfaced at https://latanda.online/docs/.
- Chain node resources live under `chain/`, including `node-setup.sh`, `genesis.json`, and the node guides.

## Key Pages

| Page | Purpose |
| --- | --- |
| `index.html` | Main landing page for the La Tanda ecosystem |
| `dev-dashboard.html` | Developer portal, API overview, bounty guidance, and codebase patterns |
| `marketplace-social.html` | Marketplace social experience |
| `whitepaper.html` | Whitepaper and ecosystem thesis |
| `ltd-token-economics.html` | LTD supply and distribution information |
| `governance.html` | Governance hub |
| `mia.html` | MIA assistant page |
| `chain/index.html` | La Tanda Chain entry point |

## API and Integration Notes

Use the public Swagger UI as the source of truth for API endpoints:

```text
https://latanda.online/docs/
```

Common integration flow:

1. Authenticate with the REST API.
2. Store and read auth tokens using the codebase conventions documented in the Developer Portal.
3. Verify endpoint request and response shapes against Swagger UI before changing frontend calls.
4. Keep user-facing UI text aligned with the product language for the page, and keep code comments and logs in English.

For API proxy work, coordinate first. The enhanced proxy contains broad simulation and fallback logic used across many pages.

## Chain and Validator Resources

La Tanda Chain is a Cosmos SDK and CometBFT testnet.

- Testnet chain page: https://latanda.online/chain/
- Community explorer: https://exp.utsa.tech/latanda/staking
- Local node guide: `chain/la-tanda-chain-node-guide.md`
- Beginner guide: `chain/la-tanda-node-beginner-guide.md`
- Setup script: `chain/node-setup.sh`
- Genesis file: `chain/genesis.json`

## Contributing

La Tanda uses GitHub issues for bounty-based contributions.

Before opening a pull request:

1. Work on one bounty per PR.
2. Answer the issue's codebase verification question.
3. Keep the change inside the requested scope.
4. Verify links and file paths from the actual repository, not from memory.
5. Check `.github/ban-list.txt` before investing work.
6. Fill out `.github/PULL_REQUEST_TEMPLATE.md`.
7. Include the bounty issue number in the PR description.

For this repository, documentation bounties should avoid adding extra files unless the issue explicitly asks for them. Keep developer onboarding content in `README.md` concise and link to the Developer Portal instead of duplicating it.

## Local Verification Checklist

Use this checklist before submitting a documentation PR:

- `README.md` only changed when the issue scope says README only.
- Development setup includes `npx serve .`.
- Project structure matches the current repository.
- Swagger UI link returns 200.
- Developer Portal link returns 200.
- Chain page or explorer link returns 200.
- The bounty verification answer is included in the issue comment or PR body.
- No secrets, wallet keys, or generated local files are committed.

## License

MIT License. See [LICENSE](./LICENSE).

La Tanda and La Tanda Chain are operated by Ray-Banks LLC. This repository is a public frontend mirror for transparency and community contributions. It is not financial advice and does not constitute a securities offering.
