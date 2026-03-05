# Contributing to La Tanda

Thank you for your interest in contributing to La Tanda! We welcome all contributions and offer LTD token rewards for merged Pull Requests.

> **Read this page fully before submitting a PR.** Most rejected PRs fail because contributors skip the [Codebase Patterns](#-codebase-patterns-read-this-first) section.

---

## Bounty Program

We pay contributors in LTD tokens for every merged PR!

| Type | Reward |
|------|--------|
| Bug Fixes | 25-100 LTD |
| Features | 100-500 LTD |
| Documentation | 25-200 LTD |
| Testing | 50-400 LTD |

**Active Bounties:** [Issues with `bounty` label](https://github.com/INDIGOAZUL/la-tanda-web/issues?q=is%3Aopen+label%3Abounty)

---

## Before You Start (MANDATORY)

### Step 1: Claim the Issue

1. Comment on the bounty issue with a **short proposal** (3-5 sentences):
   - What is your approach?
   - Which files will you modify?
   - Have you read the existing code in those files?
2. Wait for a maintainer to **assign you** the issue
3. **Do NOT submit a PR before being assigned** — unassigned PRs will be closed without review

### Step 2: Proof of Reading

Every PR description **must** include this exact line:

```
Verification: TANDA-PROTOCOL
```

This confirms you read CONTRIBUTING.md. PRs without it are auto-closed. Do not explain or modify this phrase — just include it as-is in your PR body.

### Step 3: One Bounty = One PR

Submit each bounty as a **separate PR**. Don't combine multiple bounties — it forces all-or-nothing review.

### Timelines

- You have **7 days** to submit a PR after assignment
- If you need more time, comment on the issue
- If inactive for 7 days, bounty reopens for others

---

## Codebase Patterns (READ THIS FIRST)

These are **mandatory requirements**. PRs that violate them will be rejected.

### 1. Auth Token Key

The JWT token is stored as `auth_token` (snake_case) in `localStorage`.

```javascript
// CORRECT
const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');

// WRONG - will always be null
const token = sessionStorage.getItem('jwtToken');
const token = localStorage.getItem('token');
```

### 2. XSS Prevention — `escapeHtml()` Required

**Every** piece of user-supplied data rendered in HTML **must** go through `escapeHtml()`. The codebase has been audited 20+ times for this.

```javascript
// CORRECT
listEl.innerHTML = '<p>' + escapeHtml(user.name) + '</p>';

// WRONG - XSS vulnerability, instant rejection
listEl.innerHTML = '<p>' + user.name + '</p>';
listEl.innerHTML = `<p>${post.content}</p>`;
```

### 3. Spanish UI / English Code

- **User-facing text** (labels, buttons, messages, toasts): Spanish (`es-HN`)
- **Code comments, variable names, logs**: English

```javascript
// CORRECT
showNotification('Operacion exitosa', 'success');  // Spanish for UI
// Fetch user's following feed                       // English for comments

// WRONG
showNotification('Operation successful', 'success'); // English UI text
// Obtener el feed del usuario                        // Spanish comments
```

### 4. Modify Existing Files — Never Create Standalone Scripts

The frontend uses singleton class instances. **Add methods to existing classes**, don't create parallel scripts.

```
CORRECT: Edit js/hub/social-feed.js → add to the SocialFeed object
WRONG:   Create src/js/hub/social-feed.js (new standalone file)
WRONG:   Create my-feature.js that does document.querySelector() from scratch
```

Key singletons:
- `SocialFeed` in `js/hub/social-feed.js` — social feed module
- `MarketplaceSocial` in `marketplace-social.js` — marketplace SPA (at HTML root, NOT in `js/`)

### 5. Backend: Integrate Into the Main API File

All API endpoints go in `integrated-api-complete-95-endpoints.js`. This is a vanilla Node.js HTTP server — **NOT Express**.

```
CORRECT: Add your endpoint handler inside integrated-api-complete-95-endpoints.js
WRONG:   Create api/my-feature-api.js with Express middleware (require, router, etc.)
WRONG:   Create a standalone file with integration instructions
```

There is no `require()`, no `app.get()`, no middleware chain. Read the existing file to understand the pattern.

### 6. Verify API Endpoints — Don't Fabricate

Before documenting or calling an endpoint, verify it exists:
- **Swagger UI**: [latanda.online/docs](https://latanda.online/docs) (220+ documented paths)
- **Dev Portal Sandbox**: [latanda.online/dev-dashboard.html](https://latanda.online/dev-dashboard.html) (try endpoints live)

```
REAL:   GET  /api/feed/social/following
REAL:   POST /api/feed/social/:id/toggle-like
REAL:   GET  /api/groups/my-groups-pg

FAKE:   GET  /api/feed/social/para-ti          (does not exist)
FAKE:   POST /api/feed/social/:id/like         (wrong — it's toggle-like)
FAKE:   GET  /api/groups                       (wrong — it's my-groups-pg)
```

### 7. Security Rules

These are enforced in code review. Violations = instant rejection.

| Rule | Reason |
|------|--------|
| Never use `Math.random()` | Use `crypto.randomInt()` or `crypto.getRandomValues()` |
| Never use `body.user_id` for auth | Always use `authUser.userId` from JWT (prevents IDOR) |
| Never send `error.message` to clients | Generic Spanish messages only (never leak internals) |
| Never use `SELECT *` or `RETURNING *` | Explicit column lists only |
| Never use inline `onclick` handlers | Use delegated event listeners with `data-action` attributes |
| Financial operations need transactions | `BEGIN` + `SELECT FOR UPDATE` + `COMMIT` |

### 8. File Locations (Don't Guess)

```
la-tanda-web/
├── *.html                        # Pages at root (home-dashboard, explorar, etc.)
├── marketplace-social.js         # Marketplace JS (AT ROOT, not in js/)
├── marketplace-social.html       # Marketplace HTML (AT ROOT)
├── js/
│   ├── hub/                      # Core modules
│   │   ├── social-feed.js        # Social feed (SocialFeed singleton)
│   │   ├── contextual-widgets.js
│   │   ├── sidebar-widgets.js
│   │   └── ...
│   ├── core/                     # Shared utilities
│   ├── components-loader.js      # Dynamic component loading
│   └── ...
├── css/
│   ├── hub/                      # Hub styles (social-feed.css)
│   ├── dashboard-layout.css      # Main layout
│   ├── groups-page.css           # Groups/Tandas styles
│   └── ...
├── docs/swagger/openapi.json     # OpenAPI spec (220+ paths)
├── chain/                        # Blockchain explorer + files
└── smart-contracts/              # Solidity (Polygon Amoy)
```

### 9. What NOT to Do (Lessons from Rejected PRs)

| Mistake | What happened |
|---------|---------------|
| Created standalone `api/report-api.js` with Express | Wrong — no Express, all endpoints in main API file |
| Created file at `src/js/hub/social-feed.js` | Wrong path — no `src/` directory exists |
| Used `sessionStorage.getItem('jwtToken')` | Wrong — platform uses `localStorage.getItem('auth_token')` |
| Documented `POST https://my.tanda.co/oauth/token` | Fabricated URL — real API is at `latanda.online` |
| Deleted 8,700 lines of openapi.json to replace with 4 endpoints | Destroyed existing work — always additive |
| Submitted all UI text in Chinese | Platform is in Spanish for Honduran users |
| Rendered `post.content` without `escapeHtml()` | XSS vulnerability |
| Combined 4 bounties in 1 PR | Each bounty = separate PR for clean review |
| Used ethers.js for chain examples | La Tanda Chain is Cosmos SDK (not EVM) |
| Provided Polygon/Solana wallet for payment | LTD is on La Tanda Chain — provide `ltd1...` address |
| PR with "Integration Instructions" instead of actual integration | Code must work as submitted, not require manual wiring |

---

## Quick Start

### 1. Fork & Clone

```bash
git clone https://github.com/YOUR_USERNAME/la-tanda-web.git
cd la-tanda-web
git checkout -b feature/your-feature-name
```

### 2. Serve Locally

```bash
npx serve .
# Open http://localhost:3000
```

> **Note:** The frontend calls the production API at `latanda.online`. There is no local backend. You can test UI changes but API-dependent features will use the live server.

### 3. Explore the Real API

- **Swagger UI**: [latanda.online/docs](https://latanda.online/docs) — browse all endpoints
- **Dev Portal**: [latanda.online/dev-dashboard.html](https://latanda.online/dev-dashboard.html) — try endpoints live, see WebSocket docs, SDK examples in 5 languages, chain API docs

### 4. Submit Your PR

```bash
git add <specific-files>
git commit -m "feat(scope): brief description"
git push origin feature/your-feature-name
```

Include in your PR description:
- `Verification: TANDA-PROTOCOL`
- Your `ltd1...` wallet address for payment
- Which bounty issue it closes (`Closes #XX`)

---

## Code Quality Standards

### HTML
- Semantic HTML5, kebab-case classes
- No inline `onclick` — use `data-action` attributes
- No inline styles — use CSS classes

### CSS
- Use existing CSS variables (`--mp-orange`, `--bg-primary`, `--bg-secondary`, `--text-primary`)
- Dark theme: `#0f172a` background, cyan `#00FFFF` accent, orange `#FF6B35` for marketplace
- Mobile responsive (test at 768px and 480px)

### JavaScript
- ES6+ (async/await, template literals, destructuring)
- `escapeHtml()` on all user data rendered in HTML
- Error handling with try/catch on all fetch calls
- No `console.log()` in production code
- Follow existing patterns in the file you're modifying

---

## Bounty Payment

- **Token:** LTD on La Tanda Chain (Cosmos SDK, NOT EVM/Polygon/Solana)
- **Address format:** `ltd1...` (bech32). Get one by running a node or request a custodial address
- **When:** Within 24 hours of PR merge
- **Include your `ltd1...` address in the PR description**
- If you don't have a chain address yet, mention it in the PR — we'll coordinate

---

## Security

### Never Commit
- Private keys or mnemonics
- API keys or secrets
- `.env` files
- Hardcoded credentials (even "demo" ones)

### Report Vulnerabilities
- **DO NOT** create a public issue
- Email: `contact@latanda.online`
- Priority bounty: up to 500 LTD

---

## Resources

| Resource | URL |
|----------|-----|
| Live Platform | [latanda.online](https://latanda.online) |
| Swagger UI (API docs) | [latanda.online/docs](https://latanda.online/docs) |
| Dev Portal (sandbox, WebSocket, SDK, chain) | [latanda.online/dev-dashboard.html](https://latanda.online/dev-dashboard.html) |
| La Tanda Chain Explorer | [latanda.online/chain](https://latanda.online/chain/) |
| GitHub Discussions | [Discussions](https://github.com/INDIGOAZUL/la-tanda-web/discussions) |

---

## FAQ

**Q: Do I need to ask before working on something?**
A: For bounties, yes — claim the issue first with a proposal. For small fixes (<10 lines), submit directly.

**Q: Can I work on multiple bounties?**
A: Yes, but one at a time is recommended. One PR per bounty.

**Q: The API calls hit production — is that OK for testing?**
A: Yes, that's the intended workflow. The frontend is static files that call the live API. You can test UI changes locally but API responses come from the server.

**Q: What's the La Tanda Chain?**
A: A Cosmos SDK blockchain (NOT EVM). Chain ID `latanda-testnet-1`, token LTD. See [chain docs](https://latanda.online/dev-dashboard.html#chain).

**Q: I don't have an `ltd1...` address. How do I get paid?**
A: Mention it in your PR. We can either set up a custodial address for you or coordinate an alternative.

**Q: What does `Verification: TANDA-PROTOCOL` mean?**
A: It proves you read this guide. Just include it in your PR description exactly as written.

---

*Last Updated: March 5, 2026*
*Platform Version: 4.12.4*
