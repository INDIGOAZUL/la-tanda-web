# 🤖 GitHub Actions Workflows

Automated workflows for the La Tanda Web3 public repository.

## Active Workflows

### ✅ CI — Tests and Quality Checks (`ci-tests.yml`)
**Triggers:** pull requests and pushes to `main` / `develop`

Validates HTML structure, checks JavaScript syntax, validates JSON files,
scans for stray `console.log` and hardcoded credentials, and checks file
sizes. All PRs must pass before merge.

### 🛡️ PR Gatekeeper (`pr-gatekeeper.yml`)
**Triggers:** pull request opened

Checks the PR author against `.github/ban-list.txt` and auto-closes PRs from
banned accounts. First line of defense against bounty-farming spam.

### 🔎 PR Code Pattern Check (`pr-lint.yml`)
**Triggers:** pull requests to `main`

Lints changed files against codebase conventions and flags pattern
violations.

### 👋 Welcome New Contributors (`welcome-new-contributors.yml`)
**Triggers:** pull request opened

Posts a welcome message to first-time contributors with links to docs,
bounty information, and next steps.

### 🧹 Stale Issues and PRs Management (`stale-management.yml`)
**Triggers:** daily at 01:00 UTC, plus manual dispatch

Marks issues/PRs stale after 30 days of inactivity and closes them 7 days
later. Exempts `pinned`, `security`, `high-priority`, `in-progress`, and
`wip` labels. For bounties, closure reopens the bounty for reassignment.

## Notes

- Bounty lifecycle and issue auto-labeling are handled by the La Tanda
  contributor-triage cron running on the production server, not by GitHub
  Actions. The previous `auto-label-issues.yml` and `bounty-tracker.yml`
  workflows were retired to avoid duplicate automation.
- Workflows use the GitHub-provided token; no repository secrets are required.

## Learn More

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
