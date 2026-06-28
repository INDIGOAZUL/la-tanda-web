# La Tanda Web

La Tanda is a public frontend mirror for the La Tanda Web3 ecosystem in Honduras. The project combines social features, digital rotating savings groups, a marketplace, LTD token utilities, governance pages, and La Tanda Chain resources in a mostly static web frontend.

## Live Resources

- Website: [latanda.online](https://latanda.online)
- Swagger UI / API docs: [latanda.online/docs](https://latanda.online/docs/)
- Developer portal: [latanda.online/dev-dashboard.html](https://latanda.online/dev-dashboard.html)
- Chain page: [latanda.online/chain](https://latanda.online/chain/)
- Community chain explorer: [exp.utsa.tech/latanda/staking](https://exp.utsa.tech/latanda/staking)
- Whitepaper: [latanda.online/whitepaper.html](https://latanda.online/whitepaper.html)
- LTD token economics: [latanda.online/ltd-token-economics.html](https://latanda.online/ltd-token-economics.html)

## Development Setup

This repository is a static frontend mirror. You do not need a framework build step for normal local review.

1. Clone the repository.

   ```bash
   git clone https://github.com/INDIGOAZUL/la-tanda-web.git
   cd la-tanda-web
   ```

2. Serve the repository root locally.

   ```bash
   npx serve .
   ```

3. Open the local URL printed by `serve`, then test the pages you changed. Common starting points are:

   - `index.html`
   - `dev-dashboard.html`
   - `marketplace-social.html`
   - `chain/index.html`

4. Do not commit local secrets. Use `.env.example` as the reference for expected environment names.

## Project Structure

This mirror does not currently include a `CONTRIBUTING.md` file, so this section reflects the checked-in repository layout.

```text
la-tanda-web/
|-- *.html                         # Top-level product, dashboard, marketplace, wallet, and admin pages
|-- css/                            # Shared and feature-specific stylesheets
|-- js/                             # Shared browser scripts, connectors, hub code, and page helpers
|-- assets/                         # Built assets, generated chunks, images, and static bundle output
|-- chain/                          # La Tanda Chain landing page, setup script, guides, and chain assets
|-- components/                     # Reusable HTML fragments such as shared navigation/sidebar pieces
|-- docs/                           # Swagger/OpenAPI-facing documentation assets
|-- examples/                       # Integration examples and sample scripts
|-- i18n/ and translations/         # Translation data and localized content
|-- packages/sdk/                   # SDK examples and package-level integration code
|-- middleware/ and utils/          # Supporting browser/runtime utilities
|-- api-*.js                        # API adapter, proxy, endpoint, and integration files
|-- marketplace-social.js           # Root-level script loaded by marketplace-social.html
|-- dev-dashboard.html              # Developer portal page
`-- README.md                       # Developer onboarding document
```

## API And Chain References

- Swagger UI is served from `/docs/` and is linked at [latanda.online/docs](https://latanda.online/docs/).
- The developer portal is `dev-dashboard.html` and links to Swagger UI, chain RPC, chain REST, and chain resources.
- The chain landing page is `chain/index.html`, published at [latanda.online/chain](https://latanda.online/chain/).
- The community explorer currently linked from the README is [exp.utsa.tech/latanda/staking](https://exp.utsa.tech/latanda/staking).
- The main API proxy file in this mirror is `api-proxy-enhanced.js`. Coordinate with maintainers before changing it.

The links above were checked during this documentation update and returned HTTP 200.

## Bounty Verification Notes

For issue #50:

- `marketplace-social.html` loads the root-level `marketplace-social.js`.
- A second file named `js/marketplace-social.js` also exists, but the marketplace page script tag points to the HTML-root file.
- The main API proxy file is `api-proxy-enhanced.js`.

## Contribution Notes

La Tanda uses GitHub issue bounties. Follow the instructions on the specific issue before opening a pull request.

- Keep one pull request scoped to one bounty.
- Answer the codebase verification question from the issue.
- Modify only the files requested by the issue scope.
- Do not commit `.env` files, credentials, generated secrets, or unrelated build artifacts.
- Do not use destructive sync commands such as `rsync --delete` against this repository.
- Do not change `api-proxy-enhanced.js` without maintainer coordination.

## License

This repository is released under the MIT License. See [LICENSE](./LICENSE).

La Tanda and La Tanda Chain are operated by Ray-Banks LLC. This public mirror is provided for transparency and community contributions and is not financial advice or an offer of securities.
