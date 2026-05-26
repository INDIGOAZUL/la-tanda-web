# La Tanda Web

La Tanda Web is the public frontend mirror for La Tanda, a Honduras-based Web3 fintech ecosystem for rotating savings groups, marketplace activity, social reputation, and La Tanda Chain.

This repository is intentionally lightweight: most pages are static HTML, CSS, and vanilla JavaScript. There is no required frontend build step for local development.

## Quick Links

- Website: https://latanda.online
- Developer Portal: https://latanda.online/dev-dashboard.html
- Swagger UI / API Docs: https://latanda.online/docs/
- Chain Page: https://latanda.online/chain/
- Chain Explorer: https://exp.utsa.tech/latanda/staking
- Whitepaper: https://latanda.online/whitepaper.html
- Tokenomics: https://latanda.online/ltd-token-economics.html

## What Is La Tanda?

La Tanda is a Web3 ecosystem with several connected product layers:

- Social activity and community reputation
- Digital rotating savings groups, also known as tandas or ROSCAs
- Marketplace pages for products, services, and bookings
- LTD token activity and user rewards
- La Tanda Chain, built with Cosmos SDK and CometBFT
- Developer-facing API and documentation pages
- MIA AI financial assistant pages

## Current Testnet Status

The public frontend points to La Tanda testnet resources and production-facing documentation pages.

| Area | Current reference |
| --- | --- |
| Chain ID | `latanda-testnet-1` |
| Token | LTD, denom `ultd` |
| Address prefix | `ltd` |
| API documentation | https://latanda.online/docs/ |
| Developer portal | https://latanda.online/dev-dashboard.html |
| Chain page | https://latanda.online/chain/ |
| Community explorer | https://exp.utsa.tech/latanda/staking |

## Development Setup

You can work on this repository with a static file server. No package install is required for normal README, HTML, CSS, or vanilla JavaScript edits.

### Requirements

- GitHub account
- A modern browser such as Chrome, Edge, Firefox, or Safari
- Node.js only if you want to use `npx serve .`

### Run Locally

From the repository root, run:

```bash
npx serve .
```

Then open the local URL printed in your terminal, usually:

```text
http://localhost:3000
```

If port 3000 is busy, `serve` may choose another port. Use the URL shown by the command.

### Alternative Static Servers

Any static web server should work because this repository does not require a build step. Examples:

```bash
python -m http.server 3000
```

or open individual HTML files directly for simple content checks.

### Local Verification Checklist

Before opening a pull request, check the pages related to your change:

- Confirm the edited page loads without console errors.
- Confirm links still point to existing pages.
- Confirm desktop and mobile widths are readable.
- For API or developer documentation changes, check the Swagger UI and Developer Portal links.

## Project Structure

The repository is organized around static pages and product areas. Important paths include:

```text
la-tanda-web/
├── .github/                  # GitHub workflows, issue templates, and repository automation
├── assets/                   # Shared images, logos, and public assets
├── chain/                    # La Tanda Chain public resources and setup scripts
├── components/               # Reusable frontend snippets and shared UI pieces
├── css/                      # Global styles, modules, and page-specific CSS
├── docs/                     # API documentation and Swagger UI assets
├── examples/                 # Example integrations or reference pages
├── group/                    # Tanda/group feature pages
├── html/                     # Additional static HTML pages
├── images/                   # Image assets used by public pages
├── img/                      # Legacy or alternate image asset folder
├── js/                       # Browser JavaScript modules and page scripts
├── middleware/               # Middleware-related frontend/server support files
├── negocio/                  # Business and merchant-facing pages
├── packages/sdk/             # SDK package area when present in the mirror
├── api-proxy.js              # Main API proxy entry point
├── marketplace-social.js     # Root marketplace/social script copy
└── README.md                 # Developer onboarding and repository overview
```

### Key JavaScript Notes

- `api-proxy.js` is the main API proxy file referenced by this public mirror.
- `marketplace-social.js` appears at the repository root and also under `js/`.
- Keep changes small and scoped. If a bounty asks for `README.md` only, do not add new docs files.

## Common Development Tasks

### Edit Documentation

1. Update `README.md` or the requested documentation file only.
2. Keep developer-facing content in English.
3. Verify links in the edited section.
4. Open one pull request per issue or bounty.

### Edit Static Pages

1. Find the related `.html`, `.css`, and `.js` files.
2. Run a local static server with `npx serve .`.
3. Open the affected page locally.
4. Check layout at desktop and mobile widths.

### Check API Documentation Links

Use these public links when validating developer documentation:

- Swagger UI: https://latanda.online/docs/
- Developer Portal: https://latanda.online/dev-dashboard.html
- Chain Page: https://latanda.online/chain/
- Chain Explorer: https://exp.utsa.tech/latanda/staking

## Contribution Guidelines

La Tanda uses GitHub Issues for community tasks and bounties. Read the full issue before starting work.

### Bounty Workflow

1. Choose an open issue that matches your experience level.
2. Read the scope and acceptance criteria carefully.
3. Comment with the required verification answer if the issue asks for one.
4. Fork the repository.
5. Make the smallest change that satisfies the issue.
6. Open a pull request that references the issue number.

### Pull Request Checklist

Before submitting, confirm:

- The pull request changes only the files requested by the issue.
- Public links in the changed section work.
- No secrets, credentials, internal URLs, or private data are included.
- The description explains what changed and why.
- The pull request references the issue, for example `Closes #50`.

## Important Rules

- Never commit `.env` files or credentials.
- Never add secrets, private keys, tokens, or internal URLs.
- Never use destructive sync commands such as `rsync --delete` on this repository.
- Do not modify sensitive API proxy files unless the issue explicitly asks for it.
- Keep bounty pull requests focused: one pull request per bounty.

## License

MIT License. See [LICENSE](./LICENSE).

La Tanda and La Tanda Chain names and marks belong to their respective owners.
