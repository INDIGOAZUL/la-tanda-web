# La Tanda Web

La Tanda is a public mirror of the frontend for the La Tanda Web3 ecosystem in Honduras. It includes social features, digital rotating savings groups, a marketplace, LTD token pages, wallet screens, chain resources, and developer-facing API pages.

The repository is mostly static HTML, CSS, and JavaScript. It can be served locally without a build step.

## Live Resources

| Resource | URL |
| --- | --- |
| Website | https://latanda.online |
| Swagger UI / API docs | https://latanda.online/docs/ |
| Developer portal | https://latanda.online/dev-dashboard.html |
| Chain page | https://latanda.online/chain/ |
| Chain explorer | https://exp.utsa.tech/latanda/staking |
| Whitepaper | https://latanda.online/whitepaper.html |
| LTD tokenomics | https://latanda.online/ltd-token-economics.html |

## Development Setup

Prerequisites:

- Node.js 18 or newer
- npm, included with Node.js
- Git

Run the site locally:

```bash
git clone https://github.com/INDIGOAZUL/la-tanda-web.git
cd la-tanda-web
npx serve .
```

The `serve` command prints a local URL such as `http://localhost:3000`. Open that URL in a browser and navigate to pages directly, for example:

- `http://localhost:3000/index.html`
- `http://localhost:3000/dev-dashboard.html`
- `http://localhost:3000/marketplace-social.html`
- `http://localhost:3000/chain/`

There is no package install or build step required for normal frontend/documentation work.

## Project Structure

This structure reflects the current repository layout:

```text
la-tanda-web/
|-- *.html                         Static pages for the ecosystem
|-- api-*.js                       API adapters, proxies, endpoint config, and handlers
|-- marketplace-social.js          Root-level marketplace implementation
|-- marketplace-social.html        Marketplace page
|-- css/                           Global styles, layout, components, and feature CSS
|-- js/                            Shared JavaScript, components, sidebar, hub, and utilities
|-- js/core/                       Core browser helpers such as API client, cache, and event bus
|-- js/components/                 Reusable UI components
|-- js/hub/                        Social feed, assistant, widgets, and hub modules
|-- chain/                         Chain landing page, node guides, genesis, and setup script
|-- assets/                        Built JavaScript assets and legacy chunks
|-- components/                    Shared page components
|-- group/                         Group-related frontend resources
|-- html/                          Additional HTML fragments/pages
|-- images/, img/, avatars/, covers/ Static image assets
|-- middleware/, utils/            Role guard and shared utility files
|-- examples/                      Example integrations
|-- translations/                  Translation resources
|-- packages/                      Package-related project files
|-- workflows/                     Workflow examples
|-- .github/                       Issue templates, workflows, ban list, and PR template
|-- docs                           Deployment pointer for the live Swagger UI path
|-- README.md                      Developer onboarding documentation
```

Notes for contributors:

- `marketplace-social.js` lives at the repository root, not under `js/`.
- The main API proxy file is `api-proxy-enhanced.js`.
- `docs` is currently a small deployment pointer file, while the public Swagger UI is available at `https://latanda.online/docs/`.
- The issue mentions `CONTRIBUTING.md`, but this branch does not currently include that file. Use `.github/PULL_REQUEST_TEMPLATE.md`, `.github/ban-list.txt`, the developer portal, and the current file tree as the source of truth.

## Key Pages

| File | Purpose |
| --- | --- |
| `index.html` | Main landing page |
| `dev-dashboard.html` | Developer API portal |
| `marketplace-social.html` | Marketplace interface |
| `marketplace-social.js` | Main marketplace logic |
| `my-wallet.html` / `my-wallet.js` | Wallet UI and logic |
| `governance.html` | Governance page |
| `ltd-token-economics.html` / `ltd-token-economics.js` | LTD tokenomics page |
| `chain/index.html` | La Tanda Chain landing page |
| `chain/la-tanda-chain-node-guide.md` | Node operator guide |

## API Files

| File | Purpose |
| --- | --- |
| `api-proxy-enhanced.js` | Main API proxy implementation |
| `api-proxy.js` | Base API proxy |
| `api-proxy-working.js` | Working proxy variant |
| `api-proxy-updated.js` | Updated proxy variant |
| `api-adapter.js` | Frontend API adapter |
| `api-endpoints-config.js` | Endpoint configuration |
| `api-handlers-complete.js` | API handler collection |
| `postman-collection.json` | Postman collection for API exploration |

Before changing API behavior, check the live Swagger UI at https://latanda.online/docs/ and keep endpoint names, request shapes, and response expectations aligned.

## Link Verification

The following links were checked while updating this README:

- Swagger UI: https://latanda.online/docs/
- Developer portal: https://latanda.online/dev-dashboard.html
- Chain explorer: https://exp.utsa.tech/latanda/staking
- Chain page: https://latanda.online/chain/
- Whitepaper: https://latanda.online/whitepaper.html
- LTD tokenomics: https://latanda.online/ltd-token-economics.html

## Contribution Notes

- Keep each pull request scoped to one bounty or one issue.
- Modify existing files unless the issue explicitly asks for a new file.
- Do not commit `.env` files, tokens, credentials, or private keys.
- Check `.github/ban-list.txt` before opening a PR.
- Follow `.github/PULL_REQUEST_TEMPLATE.md` when preparing the PR body.
- Use English for developer documentation.
- Use the existing file layout and naming patterns instead of inventing new structures.

## Bounty Verification Answer

For issue `#50`:

- `marketplace-social.js` lives at the repository root.
- The main API file is `api-proxy-enhanced.js`.

## Legal

This repository is a public frontend mirror for transparency and community contributions. It is not an offer of securities or financial advice.
