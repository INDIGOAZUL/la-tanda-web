# Contributing to La Tanda

La Tanda is a fintech platform that digitizes tandas (ROSCAs) for Honduras — where 60%+ of the population is unbanked. We have 35+ real users moving real money on a live platform.

We pay contributors in **LTD tokens** for merged PRs.

> **Read this fully before submitting.** PRs that skip the process below are auto-closed.

---

## Contribution Tiers

We use a progression system. Start at Tier 0, prove you can work with the codebase, then unlock higher tiers.

### Tier 0 — Docs, Translation, Tests (10-50 LTD)

**Who:** Anyone. No prior contributions required.

- Fix typos, broken links, accessibility text
- Translate pages or docs (Spanish ↔ English)
- Add `aria-label` attributes to a specific page
- Write a test for a specific user flow
- Improve README sections

**Scope:** 1 file, 1-2 hours of work.

### Tier 1 — Isolated Frontend (50-150 LTD)

**Who:** Contributors with 1+ merged Tier 0 PR.

- CSS improvements with measurable results (e.g., Lighthouse score improvement)
- Add keyboard navigation to a specific modal
- Create a static component (no API changes)
- Bug fixes in existing JS modules

**Scope:** 2-3 files, no API or backend changes.

### Tier 2 — Guided Features (150-500 LTD)

**Who:** Contributors with 2+ merged Tier 1 PRs.

- Feature implementation following a detailed spec provided by maintainers
- Specs include exact file paths, function signatures, expected behavior
- You'll have read access to private repos for full context

**Scope:** Defined per task. Maintainer provides pseudocode/skeleton.

### Core Team — Ongoing Roles (2M-4M LTD vesting)

**Who:** Sustained Tier 2 contributors invited by maintainers.

See open roles at [latanda.online/dev-dashboard.html](https://latanda.online/dev-dashboard.html).

---

## How to Contribute

### Step 1: Pick a Bounty Issue

Browse issues labeled [`tier-0`](https://github.com/INDIGOAZUL/la-tanda-web/labels/tier-0), [`tier-1`](https://github.com/INDIGOAZUL/la-tanda-web/labels/tier-1), or [`tier-2`](https://github.com/INDIGOAZUL/la-tanda-web/labels/tier-2).

### Step 2: Claim It (MANDATORY)

Comment on the issue with:
1. **Your approach** (3-5 sentences)
2. **Which files** you will modify
3. **The answer** to the codebase verification question in the issue

Wait for a maintainer to **assign you**. Unassigned PRs are auto-closed.

### Step 3: Submit Your PR

- One bounty = one PR (don't combine multiple bounties)
- Include `Closes #XX` referencing the bounty issue
- Include your `ltd1...` wallet address for payment
- You have **7 days** after assignment. Need more? Comment on the issue

### What Gets Auto-Closed

| Violation | Why |
|-----------|-----|
| No issue assignment | Prevents spam — claim first |
| Wrong codebase verification answer | Proves you didn't read the source |
| Account less than 30 days old | Bot prevention |
| 3+ rejected PRs from same account | Quality gate |

---

## Codebase Patterns (MANDATORY)

PRs that violate these are rejected.

### 1. Auth Token Key

```javascript
// CORRECT
const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');

// WRONG — will always be null
const token = sessionStorage.getItem('jwtToken');
const token = localStorage.getItem('token');
```

### 2. XSS Prevention — `escapeHtml()` Required

```javascript
// CORRECT
el.innerHTML = '<p>' + escapeHtml(user.name) + '</p>';

// WRONG — XSS vulnerability, instant rejection
el.innerHTML = `<p>${user.name}</p>`;
```

### 3. Spanish UI / English Code

- **User-facing text** (buttons, labels, toasts): Spanish (`es-HN`)
- **Code comments, variable names**: English

### 4. Modify Existing Files — Never Create Standalone Scripts

Add methods to existing classes. Don't create parallel scripts.

```
CORRECT: Edit js/hub/social-feed.js (add to SocialFeed object)
WRONG:   Create src/js/social-feed.js or my-feature.js
```

Key singletons:
- `SocialFeed` → `js/hub/social-feed.js`
- `MarketplaceSocial` → `marketplace-social.js` (at HTML root, NOT in `js/`)

### 5. Backend: One API File

All endpoints live in `integrated-api-complete-95-endpoints.js`. Vanilla Node.js HTTP server — **no Express**.

```
CORRECT: Add handler inside integrated-api-complete-95-endpoints.js
WRONG:   Create api/my-feature.js with Express router
```

### 6. Verify API Endpoints — Don't Fabricate

Check [Swagger UI](https://latanda.online/docs) or [Dev Portal](https://latanda.online/dev-dashboard.html) before using any endpoint.

```
REAL:   POST /api/feed/social/:id/toggle-like
FAKE:   POST /api/feed/social/:id/like         (wrong path)
FAKE:   GET  /api/groups                       (wrong — it's my-groups-pg)
```

### 7. Security Rules

| Rule | Use Instead |
|------|-------------|
| Never `Math.random()` | `crypto.randomInt()` or `crypto.getRandomValues()` |
| Never `body.user_id` for auth | `authUser.userId` from JWT |
| Never `error.message` to clients | Generic Spanish messages |
| Never `SELECT *` / `RETURNING *` | Explicit column lists |
| Never inline `onclick` | `data-action` + delegated listeners |
| Financial ops | `BEGIN` + `FOR UPDATE` + `COMMIT` |

### 8. File Structure

```
la-tanda-web/
├── *.html                        # Pages at root
├── marketplace-social.js         # Marketplace JS (AT ROOT, not js/)
├── js/
│   ├── hub/social-feed.js        # Social feed module
│   ├── components-loader.js      # Dynamic component loading
│   └── ...
├── css/
│   ├── hub/social-feed.css
│   ├── dashboard-layout.css
│   └── ...
├── chain/                        # Blockchain explorer
└── docs/swagger/openapi.json     # API spec (240+ paths)
```

---

## Common Rejection Reasons

| Mistake | What to do instead |
|---------|-------------------|
| Created standalone script | Modify the existing singleton class |
| Used `sessionStorage` for auth | Use `localStorage.getItem('auth_token')` |
| Fabricated API endpoints | Check [Swagger UI](https://latanda.online/docs) first |
| UI text in English or Chinese | Use Spanish (`es-HN`) |
| Combined multiple bounties | One PR per bounty |
| "Integration instructions" instead of code | Code must work as submitted |
| Used ethers.js for chain | La Tanda Chain is Cosmos SDK, not EVM |

---

## Quick Start

```bash
git clone https://github.com/YOUR_USERNAME/la-tanda-web.git
cd la-tanda-web
git checkout -b feature/your-feature-name
npx serve .    # Open http://localhost:3000
```

The frontend calls the production API at `latanda.online`. No local backend needed.

---

## Bounty Payment

- **Token:** LTD on La Tanda Chain (Cosmos SDK, address prefix `ltd1`)
- **When:** Within 24 hours of merge
- **Include your `ltd1...` address in the PR description**
- No address yet? Mention it in your PR — we'll coordinate

---

## Progression Rewards

| Stage | Token Reward | Non-Token Reward |
|-------|-------------|-----------------|
| Tier 0 merge | 10-50 LTD | README contributors section |
| Tier 1 merge | 50-150 LTD | Discord role + private repo read access |
| Tier 2 merge | 150-500 LTD | Build log mention + mentorship |
| Core Team | 2M-4M LTD (vesting) | Full stack access + production systems |

---

## Resources

| Resource | URL |
|----------|-----|
| Live Platform | [latanda.online](https://latanda.online) |
| Swagger UI | [latanda.online/docs](https://latanda.online/docs) |
| Dev Portal | [latanda.online/dev-dashboard.html](https://latanda.online/dev-dashboard.html) |
| Chain Explorer | [latanda.online/chain](https://latanda.online/chain/) |

---

## Security

- **Never commit** private keys, API keys, `.env` files, or credentials
- **Report vulnerabilities** to `contact@latanda.online` (not public issues)
- Security bounty: up to 500 LTD

---

*Platform Version: 4.16.11 | Last Updated: March 2026*
