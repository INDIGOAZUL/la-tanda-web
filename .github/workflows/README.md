# 🤖 GitHub Actions Workflows

This directory contains automated workflows for La Tanda Web3 project.

## 📋 Available Workflows

### 1. 🚀 Deploy to GitHub Pages (Staging)
**File:** `deploy-staging.yml`

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main`
- Manual dispatch

**Purpose:**
- Deploys staging environment to GitHub Pages
- Creates staging configuration with demo mode
- Adds staging banner to all pages
- Perfect for testing before production

**Access:** https://indigoazul.github.io/la-tanda-web/

---

### 2. 🏭 Production Deploy
**File:** `production-deploy.yml`

**Triggers:**
- Push to `main` branch (production ready)
- Manual dispatch

**Purpose:**
- Deploys to production server (latanda.online)
- Runs production build and optimization
- Executes smoke tests

---

### 3. ✅ CI - Tests and Quality Checks
**File:** `ci-tests.yml`

**Triggers:**
- Pull requests to `main` or `develop`
- Push to `main` or `develop`

**What it does:**
- ✅ Validates HTML structure
- ✅ Checks JavaScript syntax
- ✅ Validates JSON files
- ✅ Scans for console.log in production
- ✅ Detects hardcoded credentials
- ✅ Checks file sizes
- ✅ Ensures code quality

**Required for:** All PRs must pass before merge

---

### 4. 🏷️ Auto-Label Issues and PRs
**File:** `auto-label-issues.yml`

**Triggers:**
- New issues created or edited
- Pull requests opened or edited

**What it does:**
- Automatically adds labels based on content:
  - `bounty` - If mentions "bounty" or "LTD"
  - `bug` - If mentions "fix" or "error"
  - `enhancement` - If mentions "feature" or "implement"
  - `security` - If mentions security vulnerabilities
  - `high-priority` - If marked as urgent
  - `size: small/medium/large` - Based on files changed
- Adds helpful comment on bounty issues with claim instructions

**Benefits:** Keeps issues organized automatically

---

### 5. 👋 Welcome New Contributors
**File:** `welcome-new-contributors.yml`

**Triggers:**
- First-time contributor opens PR or issue

**What it does:**
- Detects first-time contributors
- Posts welcoming message with:
  - 📚 Links to documentation
  - 💰 Bounty information
  - 🎯 Next steps
  - 💬 How to get help
- Adds `first-time contributor` label to PRs

**Benefits:** Makes new contributors feel welcome and guides them

---

### 6. 💰 Bounty Tracker
**File:** `bounty-tracker.yml`

**Triggers:**
- Issue comment with "work on this" on bounty issue
- Pull request merged that references bounty
- Comment with wallet address (0x...)

**What it does:**

**On Bounty Claim:**
- Acknowledges claim automatically
- Provides timeline and expectations
- Lists next steps

**On Bounty Completion (PR merged):**
- Detects completed bounties
- Posts congratulations message
- Requests wallet address for payment
- Adds `payment-pending` label

**On Wallet Address Provided:**
- Acknowledges receipt
- Adds `payment-processing` label
- Sets expectations for payment

**Benefits:** Fully automated bounty lifecycle tracking

---

### 7. 🛡️ Security Scanning
**File:** `security-scan.yml`

**Triggers:**
- Push to `main` or `develop`
- Pull requests to `main`
- Schedule: Every Monday at 2 AM UTC

**What it scans:**
- 🔍 npm dependency vulnerabilities
- 🔍 Exposed secrets (API keys, passwords, tokens)
- 🔍 SQL injection patterns
- 🔍 XSS vulnerabilities
- 🔍 Insecure HTTP requests
- 🔍 Weak cryptography (MD5, SHA1)
- 🔍 Smart contract vulnerabilities (if .sol files present)

**Benefits:** Proactive security monitoring

---

### 8. 🧹 Stale Issues and PRs Management
**File:** `stale-management.yml`

**Triggers:**
- Schedule: Daily at 1 AM UTC
- Manual dispatch

**What it does:**

**Marking Stale (30 days inactive):**
- Posts warning message
- Asks for update
- Gives 7 days to respond

**Closing Stale (7 days after warning):**
- Closes issue/PR
- Posts closure reason
- For bounties: Reopens for reassignment

**Exemptions:**
- `pinned` label
- `security` label
- `high-priority` label
- `in-progress` label
- `wip` label

**Benefits:** Keeps issue tracker clean and bounties available

---

## 🎯 Workflow Best Practices

### For Contributors

1. **Before Creating PR:**
   - Ensure CI tests pass locally
   - Check for security issues
   - Follow code quality guidelines

2. **Claiming Bounties:**
   - Comment "I'd like to work on this"
   - Bounty tracker will acknowledge automatically
   - Wait for official assignment

3. **Completing Bounties:**
   - Reference issue in PR (e.g., "Fixes #123")
   - Provide wallet address when asked
   - Wait for automated payment notification

### For Maintainers

1. **Labels to Use:**
   - `pinned` - Prevent stale process
   - `do-not-close` - Prevent PR from closing
   - `in-progress` - Active work in progress
   - `payment-pending` - Awaiting wallet address
   - `payment-processing` - Payment being processed

2. **Manual Triggers:**
   - Go to Actions tab → Select workflow → "Run workflow"

---

## 📊 Workflow Status

Check workflow status: [GitHub Actions](https://github.com/INDIGOAZUL/la-tanda-web/actions)

### Recent Runs
- ✅ CI Tests: All passing
- ✅ Security Scan: No issues found
- ✅ Stale Management: Active
- ✅ Auto-labeling: Working

---

## 🔧 Configuration

### Secrets Required

None currently - all workflows use GitHub provided tokens.

### Permissions

Workflows have minimal required permissions:
- `contents: read` - Read repository
- `issues: write` - Manage issues
- `pull-requests: write` - Manage PRs
- `security-events: write` - Security scanning

---

## 🐛 Troubleshooting

### Workflow Failed?

1. **Check logs:**
   - Go to Actions tab
   - Click on failed workflow
   - Review error messages

2. **Common Issues:**
   - Missing permissions
   - Syntax errors in code
   - Security violations detected
   - Failing tests

3. **Get Help:**
   - Open issue with workflow link
   - Tag @INDIGOAZUL
   - Provide error logs

---

## 📚 Learn More

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [La Tanda Contributing Guide](../../CONTRIBUTING.md)

---

**Last Updated:** October 26, 2025
**Workflows:** 8 active
**Automation Level:** High 🚀
