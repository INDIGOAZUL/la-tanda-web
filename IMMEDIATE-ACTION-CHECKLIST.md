# La Tanda Web - Immediate Action Checklist
**Generated:** November 18, 2025
**Review Full Report:** MAINTENANCE-REPORT-2025-11-18.md

---

## 🔴 CRITICAL - Do Today

### 1. Fix JWT_SECRET Security Issue
**File:** `routes/api-routes.js:15`

**Current (INSECURE):**
```javascript
const JWT_SECRET = process.env.JWT_SECRET || 'latanda-super-secret-key-change-in-production';
```

**Fixed (SECURE):**
```javascript
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('CRITICAL: JWT_SECRET environment variable must be set');
}
```

**Action:**
- [ ] Update `routes/api-routes.js`
- [ ] Verify JWT_SECRET is set in `.env` file
- [ ] Test authentication flows
- [ ] Deploy to production

---

### 2. Rotate Database Password
**File:** `.claude/skills/latanda-session-start.md:20`

**Exposed:** `PGPASSWORD='latanda123'`

**Action:**
- [ ] Generate strong password (use: `openssl rand -base64 32`)
- [ ] Update database password
- [ ] Update all references in skill files
- [ ] Update production environment variables
- [ ] Test database connectivity

---

### 3. Add package-lock.json
**Issue:** Missing dependency lock file (security risk)

**Action:**
```bash
npm install
git add package-lock.json
git commit -m "security: add package-lock.json for dependency consistency"
git push
```

- [ ] Run `npm install`
- [ ] Commit package-lock.json
- [ ] Push to repository

---

### 4. Update .gitignore
**Issue:** package-lock.json should NOT be ignored

**File:** `.gitignore:25`

**Change:**
```diff
# ========================================
# Dependencies
# ========================================
node_modules/
-package-lock.json
yarn.lock
```

**Action:**
- [ ] Edit `.gitignore`
- [ ] Remove `package-lock.json` line
- [ ] Commit changes

---

## 🟡 HIGH PRIORITY - This Week

### 5. Rotate Documented Passwords

**Locations:**
- `ADMIN-SYSTEM-COMPLETE-GUIDE.md:340` - Admin password: `[REDACTED-ROTATE-PASSWORD]`
- `SYSTEM-INVENTORY-CURRENT-STATE.md:77` - Admin password documented
- `CDN-CACHE-BYPASS-SOLUTION.md:225` - HTTP Basic Auth

**Action:**
- [ ] Generate new admin password
- [ ] Update in database
- [ ] Replace with `[REDACTED]` in documentation
- [ ] Test admin login

---

### 6. Update bcryptjs
**Current:** 2.4.3
**Latest:** 3.0.3
**Type:** MAJOR (breaking changes possible)

**Action:**
```bash
npm install bcryptjs@3.0.3
npm test  # Run all authentication tests
```

- [ ] Update package
- [ ] Test password hashing
- [ ] Test user registration
- [ ] Test user login
- [ ] Deploy if tests pass

---

### 7. Plan ethers.js Migration
**Current:** 5.8.0
**Latest:** 6.15.0
**Impact:** MAJOR API changes

**Action:**
- [ ] Create feature branch: `feature/ethers-v6-migration`
- [ ] Read migration guide: https://docs.ethers.org/v6/migrating/
- [ ] Identify all ethers usage points
- [ ] Create migration checklist
- [ ] Schedule testing phase

---

## 🟢 MEDIUM PRIORITY - This Month

### 8. Update Node.js Engine Requirement
**File:** `package.json:53-54`

**Current:**
```json
"engines": {
  "node": ">=16.0.0",
  "npm": ">=8.0.0"
}
```

**Updated:**
```json
"engines": {
  "node": ">=18.0.0",
  "npm": ">=9.0.0"
}
```

**Reason:** Node.js 16 reached EOL in September 2023

---

### 9. Update Other Dependencies

**Safe to update (test individually):**
```bash
npm install dotenv@latest
npm install helmet@latest
npm install express-rate-limit@latest
npm install nodemailer@latest
npm test
```

**DO NOT UPDATE YET:**
- ❌ express 4.x → 5.x (wait for stability)
- ❌ @openzeppelin/contracts 4.x → 5.x (breaking changes)

---

### 10. Reorganize Documentation

**Create structure:**
```bash
mkdir -p docs/{phases,guides,reports,api}
mv FASE-*.md docs/phases/
mv *-GUIDE.md docs/guides/
mv *-REPORT.md docs/reports/
mv *-COMPLETE*.md docs/reports/
git add docs/
git commit -m "docs: organize documentation into subdirectories"
```

---

### 11. Clean Up Test Files

**Move test files:**
```bash
mkdir -p tests/manual
mv test-*.html tests/manual/
mv debug-*.html tests/manual/
mv quick-login-test.html tests/manual/
git add tests/
git commit -m "refactor: move manual test files to tests/manual/"
```

---

### 12. Enable GitHub Workflows

**Currently disabled:**
- `auto-label-issues.yml.disabled`
- `bounty-tracker.yml.disabled`
- `stale-management.yml.disabled`
- `welcome-new-contributors.yml.disabled`

**Action:**
```bash
cd .github/workflows/
mv auto-label-issues.yml.disabled auto-label-issues.yml
mv bounty-tracker.yml.disabled bounty-tracker.yml
mv welcome-new-contributors.yml.disabled welcome-new-contributors.yml
git add .
git commit -m "ci: enable GitHub workflow automations"
```

---

## 📊 Progress Tracking

### Critical Tasks (Week 1)
- [ ] Task 1: Fix JWT_SECRET
- [ ] Task 2: Rotate DB password
- [ ] Task 3: Add package-lock.json
- [ ] Task 4: Update .gitignore

### High Priority (Week 2)
- [ ] Task 5: Rotate documented passwords
- [ ] Task 6: Update bcryptjs
- [ ] Task 7: Plan ethers.js migration

### Medium Priority (Weeks 3-4)
- [ ] Task 8: Update Node.js requirement
- [ ] Task 9: Update safe dependencies
- [ ] Task 10: Reorganize documentation
- [ ] Task 11: Clean up test files
- [ ] Task 12: Enable workflows

---

## 📝 Testing Checklist

After each change, run:

```bash
# 1. Install dependencies
npm install

# 2. Run tests
npm test

# 3. Check for security issues
npm audit

# 4. Test manually
# - User registration
# - User login
# - Admin functions
# - API endpoints
# - Smart contract interactions

# 5. Check logs
npm run logs
```

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] All tests passing
- [ ] No npm audit vulnerabilities
- [ ] Environment variables set correctly
- [ ] Database backups completed
- [ ] Rollback plan ready
- [ ] Monitoring configured
- [ ] Team notified

---

## 📞 Support

**Questions?**
- Review: `MAINTENANCE-REPORT-2025-11-18.md`
- Security: security@latanda.online
- Issues: https://github.com/INDIGOAZUL/la-tanda-web/issues

---

**Last Updated:** November 18, 2025
**Next Review:** December 18, 2025
