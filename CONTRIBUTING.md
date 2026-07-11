# Contributing to La Tanda

Thanks for your interest in La Tanda. This document is the single source of truth for how contributions work in this repository. Our automation (the **PR Gatekeeper**) links here, so please read it before opening a pull request — following it is the difference between your PR being reviewed and being auto-closed by a bot.

This document is in English because it is developer-facing and our CI links to it. **User-facing UI copy in the product is Spanish** — see [Language conventions](#language-conventions).

---

## ⚠️ The one rule that gets PRs auto-closed

**Do not open a pull request against a bounty issue that is not assigned to you.** A bot will close it automatically, within seconds, before a human ever sees it.

This is not us being unfriendly — it is spam control (this repo receives a high volume of drive-by AI-generated PRs). But it means the order of operations matters enormously:

> **Comment on the issue → a maintainer assigns you → *then* you open a PR.**

If you write the code first and open the PR first, the bot closes it and your work is wasted. We are sorry. Please claim first.

---

## How to contribute

### Step 1: Find something to work on

- Browse [open issues](https://github.com/INDIGOAZUL/la-tanda-web/issues). Bounty issues carry a `bounty` label plus a tier label (`tier-1`, `tier-2`).
- Or come talk to us on **[Discord](https://discord.gg/Ve9M2ZSYC2)** and we will scope something for you.

### Step 2: Claim It (MANDATORY)

**Comment on the issue with a short proposal** before you write any code. A good proposal says:

- how you intend to solve it (which files, what approach);
- roughly how long you expect to take;
- the answer to the bounty's verification question, if the issue has one (these exist to confirm you actually read the source).

**Then wait to be assigned.** A maintainer will assign the issue to you (GitHub "Assignees") and name a reviewer. **Assignment is what unlocks the PR.**

Only once *your GitHub username appears in the issue's Assignees list* should you open a pull request.

If nobody responds to your proposal within a few days, ping us on [Discord](https://discord.gg/Ve9M2ZSYC2) rather than opening a PR anyway — an unassigned PR will simply be closed by the bot.

### Step 3: Do the work

Read [Codebase Patterns](#-codebase-patterns-read-this-first) below. Our CI enforces several of them mechanically.

### Step 4: Open the PR

- Reference the issue in the PR body (`Closes #123`).
- One PR per issue/bounty. Do not bundle unrelated changes.
- Keep the diff scoped to what the issue asked for.

---

## Bounty policy

**Bounties are assigned before work begins.** One issue, one contributor, one named reviewer, agreed up front.

- **We no longer run open-ended Tier-0 bounties.** Historically, anyone could attempt any low-tier bounty and submit a PR. That produced hundreds of duplicate, competing, and low-quality submissions and zero good outcomes — including for contributors, who did real work that could never be merged. We ended that model.
- Bounties are now paid in LTD to the **assigned** contributor upon merge.
- Higher tiers (`tier-2`) are generally offered to contributors with a merge history in this repo, or to people we have scoped work with directly.
- If you want to be assigned real, paid work: **[join the Discord](https://discord.gg/Ve9M2ZSYC2)** and say hello. That is the fastest path, and it is the only way to get scoped into the larger bounties.

We would rather assign you a task and pay you for it than have you gamble unpaid effort on a PR our own bot will close.

---

## What the automation actually enforces

Three workflows run against pull requests. Here is precisely what they do, so nothing surprises you.

### `pr-gatekeeper.yml` — runs when a PR is **opened**; can auto-close it

It will **close your PR** if any of the following is true:

1. **You are on the ban list.** `.github/ban-list.txt` — accounts with a history of spam PRs.
2. **Your GitHub account is less than 30 days old.** An anti-spam measure. If you are new to GitHub, you will need to wait; we cannot make an exception in the bot.
3. **Your PR references a bounty issue that is not assigned to you.** The bot scans your PR **title and body** for any `#123` reference. For every referenced issue carrying a `bounty`, `tier-0`, `tier-1`, or `tier-2` label, it checks whether *you* are in that issue's Assignees. If you are not — the PR is closed.

It will additionally **warn** you (label `needs-fix`, no close) if you have 3+ previously closed-unmerged PRs in this repo.

> Note the mechanism carefully: merely *mentioning* an unassigned bounty issue number anywhere in your PR title or body is enough to trigger the close. Get assigned first.

### `pr-lint.yml` — codebase pattern check; **fails the build**

Runs on changed files only. It **fails** on:

| Check | Rule |
|---|---|
| Auth tokens | Auth tokens live in `localStorage`, never `sessionStorage`. Use `localStorage.getItem('auth_token')` (the tolerated fallback is `localStorage.getItem('authToken')`). `getItem('jwtToken')` is rejected. |
| `Math.random()` | Banned in `.js`. Use `crypto.getRandomValues()` (browser) or `crypto.randomInt()` (Node). |
| Fabricated URLs | Hosts invented by past spam PRs are rejected on sight: `api[.]latanda[.]online`, `my[.]tanda[.]co`, `rpc[.]latandachain`, `explorer[.]latandachain`, `testnet-rpc[.]latandachain`. **None of them exist.** The real API is at **`latanda.online`** with **no `api.` prefix**; chain endpoints are `latanda.online/chain/rpc/` and `latanda.online/chain/api/`. |
| `src/` directory | **This repo has no `src/` directory.** Any file added under `src/` fails the build. |

> **Why the `[.]` above?** The linter greps the raw text of *every* changed file, including Markdown. Writing those hostnames literally in this document would make this document fail the check it is describing (ask us how we know). They are deliberately defanged — please leave them that way.

And it **warns** (does not fail) on:

| Check | Rule |
|---|---|
| Inline `onclick="` | Use `data-action` + a delegated listener instead. See below. |

### `ci-tests.yml` — tests and quality; **fails the build**

- **HTML structure**: every root-level `*.html` must contain `</head>`, `</body>` and `</html>`. (`realtime-dashboard-stats-component.html` is exempt — it is a partial.)
- **JSON**: every root-level `*.json` must parse.
- **JS syntax**: files under `js/` are run through `node --check` (informational; root-level browser scripts are skipped, as they are not parseable standalone).
- Credential scan (Stripe/AWS/Google key shapes) and a large-file warning at 500 KB.

---

## 🎯 Codebase Patterns (Read This First)

This is a **static, build-free frontend**. There is no bundler, no framework, no transpile step at the root. What is in the repo is what ships. Please match the surrounding code rather than introducing new tooling.

### Click handlers: `data-action`, not `onclick`

New interactive elements use a `data-action` attribute and a delegated listener:

```html
<button class="btn" data-action="grp-view-group" data-group-id="123">Ver Detalles</button>
```

```js
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  if (el.dataset.action === 'grp-view-group') viewGroup(el.dataset.groupId);
});
```

**Honesty about the current state:** the migration is incomplete. Roughly 34 HTML files use `data-action`, and about 37 still contain legacy inline `onclick="`. `pr-lint.yml` only *warns* about `onclick`, it does not fail. That is deliberate — we cannot fail the build on our own legacy. But **new code must use `data-action`**, and we will ask you to change it in review if it does not.

### Escaping user data: always

Any value that originates from a user (names, descriptions, messages, product titles, social proof strings…) and gets interpolated into `innerHTML` **must** be escaped. Unescaped user data in `innerHTML` is an XSS bug and is an automatic request-changes in review.

```js
el.innerHTML = '<div class="name">' + escapeHtml(group.name) + '</div>';
```

**Honesty about the current state:** there is **no single shared/exported `escapeHtml()`**. Each module defines its own local copy. You will find definitions in, among others:

- `js/groups-system.js`
- `js/trabajo.js` (`// XSS prevention helper`)
- `js/mi-perfil.js`, `js/mensajes.js`, `js/creator-hub.js`, `js/dashboard-sections-loader.js`, `js/hub/module-cards.js`, `js/invitation-card-generator.js`
- `payout-frontend.js`, `admin-payouts.js`
- `shared-components.js` — note this one is named **`escapeHtmlSC()`**, not `escapeHtml()`
- `utils/roleGuard.js` — exposes it as a **static class method**

Several HTML pages also define one inline (`my-tandas.html`, `governance.html`, `configuracion.html`, the admin pages, `chain/index.html`, …).

**So: reuse the escaping helper that already exists in the file you are editing.** Do not import one from another module, and do not add a new global. (Unifying these into one shared helper would be a genuinely useful contribution — talk to us in Discord first.)

### ⚠️ Duplicate files: edit the copy the page actually loads

Some scripts exist **twice** — once at the HTML root and once under `js/` — and **the HTML pages load the root copy**. Editing the `js/` copy will do nothing at all, and this has burned contributors before.

Confirmed case:

| File | Root copy | `js/` copy | Loaded by the page? |
|---|---|---|---|
| `marketplace-social.js` | 512,759 bytes | 255,746 bytes | **Root copy.** `marketplace-social.html` loads `<script src="marketplace-social.js?v=…">` |

The two copies are **not identical** — they have diverged. Before you edit any file, `grep` for its `<script src=…>` in the HTML page you are targeting and edit *that* path:

```bash
grep -rn "marketplace-social.js" *.html
```

### Cache-busting

Script tags carry a `?v=` query string (e.g. `marketplace-social.js?v=1775778141`). If you change a JS/CSS file that a page loads, bump the `?v=` value on that `<script>`/`<link>` so users are not served a stale cached copy.

### Language conventions

- **UI text is Spanish.** The product's users are in Honduras and LatAm. New user-facing strings should be Spanish, matching the page you are editing (`"Al día"`, `"Pendiente"`, `"Ver Detalles"`, …).
- **Code comments, identifiers, commit messages, PR descriptions and developer docs are English.**
- A partial i18n layer exists (`translations/en.json`, `es.json`, `pt.json`) but is **not** wired through every page — most UI strings are still hardcoded in the HTML/JS. Do not assume a translation pipeline exists for the page you are touching; check first.

### Known messy areas (we would rather tell you than pretend)

- **`api-proxy*.js` — five files at the root**: `api-proxy.js`, `api-proxy-enhanced.js`, `api-proxy-updated.js`, `api-proxy-working.js`, `api-proxy-simple-test.js`, plus `api-adapter.js`. **No root HTML page loads any of them via a `<script src>` tag.** The README singles out `api-proxy-enhanced.js` as "do not modify without coordinating with the team", and the Vite-built bundles under `assets/js/` do reference an api-proxy chunk — but **we cannot honestly tell you from this repo alone which one is canonical.** So: **do not touch any `api-proxy*.js` file in a contribution.** If a task seems to require it, ask in Discord first and we will get you a definitive answer.
- Root-level `.txt`/`.patch`/`.restore-point` artifacts (`WEEK1-2-SUMMARY.txt`, `fix_dom_error.patch`, `index.html.restore-point`, …) are historical. Ignore them; do not build on them.

---

## Project structure

```
la-tanda-web/
├── *.html                  # ~60 ecosystem pages, served as-is (index, my-wallet,
│                           #   marketplace-social, governance, whitepaper, mia, …)
├── *.js                    # Root-level browser scripts. These are the ones the
│                           #   HTML pages actually load. Not modules — no build step.
├── css/                    # Stylesheets (design tokens, components, modules)
├── js/                     # Newer page/feature modules (groups-system, trabajo,
│                           #   mi-perfil, hub/, …). Beware root-vs-js/ duplicates.
├── components/             # Shared header/footer partials (components-loader.js)
├── utils/                  # Small helpers (roleGuard.js)
├── middleware/             # Client-side middleware
├── chain/                  # La Tanda Chain: genesis.json, node-setup.sh,
│                           #   node operator guides, chain landing page
├── docs/                   # OpenAPI spec + Swagger UI
├── packages/sdk/           # JS SDK (the only npm package in the repo)
├── translations/           # en.json / es.json / pt.json (partial i18n)
├── assets/                 # Vite-built bundles, images, logos, favicons
└── .github/
    ├── workflows/          # pr-gatekeeper.yml, pr-lint.yml, ci-tests.yml, …
    ├── ISSUE_TEMPLATE/     # Bounty templates
    └── ban-list.txt        # Auto-closed accounts
```

There is **no `src/`** and **no root `package.json`** — the only `package.json` is `packages/sdk/package.json`. Do not add a build step.

---

## Local development

No build, no dependencies, no Docker. Serve the repo root as static files:

```bash
git clone https://github.com/INDIGOAZUL/la-tanda-web.git
cd la-tanda-web
npx serve .
```

Then open the printed URL (typically <http://localhost:3000>) and navigate to the page you are working on, e.g. `/marketplace-social.html`.

Any static server works (`python3 -m http.server`, VS Code Live Server, …). Opening the HTML files directly via `file://` is **not** supported — relative fetches and the component loader will fail.

The pages talk to the **live production API** at `https://latanda.online`. There is no local backend in this repo. Features requiring authentication will need you to log in against the real site.

---

## Pull request conventions

- **Title**: conventional-commit style — `fix: …`, `feat: …`, `docs: …`, `chore: …`.
- **Body**: reference the issue (`Closes #123`), describe *what* changed and *why*, and note anything you could not verify.
- **Scope**: one bounty per PR. No drive-by reformatting, no unrelated files, no mass whitespace or "cleanup" diffs.
- **No generated noise**: do not commit `node_modules/`, build output, editor config, or `.env` files.
- **Never commit secrets.** Ever. This includes API keys in examples.
- **Never** use `rsync --delete` against this repo.
- CI (`pr-lint.yml`, `ci-tests.yml`) must be green.
- Be honest in your PR description. If you did not test something, say so. We would much rather read "I could not test the payout flow without a funded account" than discover it in production.

## Reporting security issues

Do **not** open a public issue for a security vulnerability. See [SECURITY.md](./SECURITY.md).

---

## Code of conduct

Be decent. We are a small team building financial infrastructure for people who have been badly served by financial infrastructure. Spam PRs, plagiarized work, and AI-generated slop submitted at volume take review time away from the community — that is why the Gatekeeper exists and why the ban list exists.

Contributors who engage honestly get assigned work, get reviewed, and get paid.

**Questions? [Join the Discord](https://discord.gg/Ve9M2ZSYC2).** It is the fastest way to reach a maintainer and the only way to get scoped into the bigger bounties.

— The La Tanda maintainers
