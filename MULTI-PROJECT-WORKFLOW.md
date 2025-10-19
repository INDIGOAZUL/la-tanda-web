# 🔄 MULTI-PROJECT WORKFLOW GUIDE

**Purpose:** Coordinate team members across multiple La Tanda repositories and technology stacks
**Last Updated:** October 18, 2025
**For:** Project founders managing multiple repos and diverse contributor types

---

## 📚 REPOSITORY OVERVIEW

### Primary Repositories

| Repository | Technology Stack | Focus Area | Team Roles Needed |
|-----------|-----------------|------------|-------------------|
| **INDIGOAZUL/la-tanda-web** | HTML/CSS/JS, Web3, Solidity | Main platform, Smart contracts | Frontend devs, Web3 devs, Content creators |
| **a2aproject/LaTandaEcosystem** | React Native, Expo | Mobile app | Mobile devs, UI/UX designers |
| **latanda-backend** (Private) | Node.js, PostgreSQL, Nginx | API & Infrastructure | Backend devs, DevOps admins |
| **latanda-marketing** (Future) | Content, Media | Marketing materials | Social media, Content creators, Marketers |

---

## 🎯 QUICK PROJECT REFERENCE

### Use This Format for Multi-Repo Coordination

When working across multiple projects, use this shorthand to indicate which repository a task belongs to:

```
repo:INDIGOAZUL/la-tanda-web → Main platform work
repo:a2aproject/LaTandaEcosystem → Mobile app work
repo:latanda-backend → Server/API work
repo:latanda-marketing → Marketing content
```

### Example Use Cases:

**Slack/Discord Messages:**
```
"Working on SEO improvements - repo:INDIGOAZUL/la-tanda-web"
"Need mobile dev for wallet integration - repo:a2aproject/LaTandaEcosystem"
"Server down, investigating - repo:latanda-backend"
```

**GitHub Issue Titles:**
```
[repo:la-tanda-web] Fix transaction history API integration
[repo:LaTandaEcosystem] Implement push notifications
[repo:backend] Optimize PostgreSQL query performance
```

**Email Subject Lines:**
```
[Social Media Manager] - repo:latanda-marketing
[DevOps Admin] - repo:latanda-backend
[Web3 Developer] - repo:la-tanda-web
```

---

## 🗂️ ROLE-TO-REPOSITORY MAPPING

### Developers

**Frontend Developers** → `repo:INDIGOAZUL/la-tanda-web`
- Glassmorphism UI components
- i18n translation system
- Responsive design fixes
- **Skills:** HTML, CSS, JavaScript, React (minimal)

**Web3 Developers** → `repo:INDIGOAZUL/la-tanda-web`
- Smart contract integration
- Wallet connectivity (MetaMask, WalletConnect)
- Transaction handling
- **Skills:** Solidity, ethers.js, Web3.js, Polygon

**Backend Developers** → `repo:latanda-backend`
- API endpoint development
- Database schema design
- Real-time sync systems
- **Skills:** Node.js, Express, PostgreSQL, REST APIs

**Mobile Developers** → `repo:a2aproject/LaTandaEcosystem`
- React Native components
- Native module integration
- Mobile UX optimization
- **Skills:** React Native, Expo, iOS/Android

### Non-Developer Roles

**Social Media Managers** → `repo:latanda-marketing`
- Content calendar management
- Social media posts
- Community engagement
- **Platforms:** Twitter, Instagram, TikTok, LinkedIn, Reddit

**DevOps Administrators** → `repo:latanda-backend`
- Server maintenance (Hostinger VPS)
- Nginx configuration
- PostgreSQL backups
- Monitoring & alerts

**Content Creators** → `repo:latanda-marketing`
- Blog posts
- Video tutorials
- Infographics
- Documentation

**UI/UX Designers** → Multiple repos
- Main platform: `repo:INDIGOAZUL/la-tanda-web`
- Mobile app: `repo:a2aproject/LaTandaEcosystem`
- Marketing: `repo:latanda-marketing`

**Community Managers** → All repos (GitHub Discussions, Discord, Telegram)
- Answer questions across all projects
- Coordinate between different teams
- Onboard new contributors

---

## 🔄 CROSS-REPOSITORY WORKFLOWS

### Workflow 1: Feature Spanning Multiple Repos

**Example:** Implement "Deposit Funds" feature

1. **Smart Contract** → `repo:INDIGOAZUL/la-tanda-web`
   - Write Solidity function for deposits
   - Deploy to Polygon testnet
   - **Assigned to:** Web3 Developer

2. **Backend API** → `repo:latanda-backend`
   - Create `/api/deposits` endpoint
   - Store transaction records in PostgreSQL
   - **Assigned to:** Backend Developer

3. **Frontend UI** → `repo:INDIGOAZUL/la-tanda-web`
   - Add deposit form with glassmorphism styling
   - Integrate with smart contract
   - **Assigned to:** Frontend Developer

4. **Mobile App** → `repo:a2aproject/LaTandaEcosystem`
   - Implement mobile deposit flow
   - Native payment integrations
   - **Assigned to:** Mobile Developer

5. **Marketing** → `repo:latanda-marketing`
   - Create tutorial video: "How to Deposit Funds"
   - Social media announcement
   - **Assigned to:** Content Creator + Social Media Manager

**Coordination:** Use GitHub Projects board spanning multiple repos OR Discord channels

---

### Workflow 2: Bug Affecting Multiple Systems

**Example:** Transaction history not loading

1. **Investigate Backend** → `repo:latanda-backend`
   - Check API endpoint `/api/user/transactions`
   - Verify database queries
   - **Assigned to:** Backend Developer

2. **Check Frontend Integration** → `repo:INDIGOAZUL/la-tanda-web`
   - Verify API calls from wallet UI
   - Check error handling
   - **Assigned to:** Frontend Developer

3. **Test Mobile App** → `repo:a2aproject/LaTandaEcosystem`
   - Confirm same bug exists on mobile
   - Test various scenarios
   - **Assigned to:** Mobile Developer

4. **Server Logs** → `repo:latanda-backend`
   - Review Nginx access logs
   - Check for API rate limiting or errors
   - **Assigned to:** DevOps Admin

**Coordination:** Create master issue in `la-tanda-web` repo, reference sub-issues in other repos

---

### Workflow 3: Launch Campaign (Multi-Role, Multi-Repo)

**Example:** Full public launch (November 2025)

**Week 1: Preparation**
- `repo:la-tanda-web` → Developers fix final bugs, optimize performance
- `repo:LaTandaEcosystem` → Mobile devs polish app store submission
- `repo:latanda-backend` → DevOps ensures scalability, backups
- `repo:latanda-marketing` → Content creators prepare launch materials

**Week 2: Launch**
- `repo:latanda-marketing` → Social media managers execute announcement blitz
- `repo:la-tanda-web` → Developers monitor for issues, deploy hotfixes
- `repo:latanda-backend` → DevOps monitors server load, scales if needed
- All repos → Community managers handle influx of new users

**Week 3: Post-Launch**
- All repos → Developers fix bugs reported by users
- `repo:latanda-marketing` → Content creators publish user success stories
- `repo:latanda-marketing` → Marketers analyze campaign performance

**Coordination:** Weekly all-hands video calls + daily async updates in Discord

---

## 📊 PROJECT BOARDS & TRACKING

### Recommended Structure

**Option 1: GitHub Projects (Recommended)**
Create organization-level project boards that span multiple repos:

1. **La Tanda Development** (Overall roadmap)
   - Columns: Backlog, In Progress, Review, Done
   - Includes issues from all repos
   - High-level features and milestones

2. **La Tanda Bugs** (Bug tracking)
   - Columns: Reported, Investigating, In Progress, Fixed
   - Tag with repo labels

3. **La Tanda Marketing** (Content & campaigns)
   - Columns: Ideas, Planned, In Progress, Published
   - Separate from technical work

**Option 2: External Tools**
- **Notion:** Comprehensive workspace with databases
- **Trello:** Simple kanban boards
- **Asana:** Task management with dependencies
- **Linear:** Modern issue tracking (dev-focused)

---

## 🗣️ COMMUNICATION CHANNELS

### By Repository

| Repository | Primary Channel | Secondary Channel | Purpose |
|-----------|----------------|-------------------|---------|
| **la-tanda-web** | GitHub Issues | Discord #dev-web | Development discussion |
| **LaTandaEcosystem** | GitHub Issues | Discord #dev-mobile | Mobile app development |
| **latanda-backend** | Private Slack/Discord | Email | Server/infrastructure (sensitive) |
| **latanda-marketing** | Discord #marketing | Email | Marketing coordination |

### Cross-Repo Channels

**Discord Server Structure:**
```
LA TANDA WEB3 DISCORD
│
├── 📢 ANNOUNCEMENTS
│   ├── #announcements (All repos, important updates)
│   └── #releases (Version releases across all projects)
│
├── 💻 DEVELOPMENT
│   ├── #dev-web (repo:la-tanda-web)
│   ├── #dev-mobile (repo:LaTandaEcosystem)
│   ├── #dev-backend (repo:latanda-backend)
│   └── #dev-web3 (Smart contracts across repos)
│
├── 🎨 DESIGN & MARKETING
│   ├── #marketing (repo:latanda-marketing)
│   ├── #design (UI/UX across all repos)
│   └── #content (Content creation)
│
├── 🛠️ OPERATIONS
│   ├── #devops (repo:latanda-backend infrastructure)
│   └── #support (User support across all products)
│
└── 💬 COMMUNITY
    ├── #general (Casual chat)
    ├── #ideas (Feature suggestions)
    └── #off-topic
```

---

## 🎯 ONBOARDING NEW TEAM MEMBERS

### Step-by-Step Multi-Repo Onboarding

**1. Identify Primary Repository**
Based on role, determine main repo they'll work in:
- Developer (Frontend/Web3) → `repo:la-tanda-web`
- Developer (Mobile) → `repo:LaTandaEcosystem`
- Developer (Backend) → `repo:latanda-backend`
- Social Media Manager → `repo:latanda-marketing`
- DevOps Admin → `repo:latanda-backend`

**2. Grant Repository Access**
```bash
# GitHub team-based permissions
# Add to appropriate team:
- @latanda/web-developers
- @latanda/mobile-developers
- @latanda/backend-developers
- @latanda/marketing-team
- @latanda/devops-team
```

**3. Setup Development Environment**
Provide repo-specific setup guides:
- `repo:la-tanda-web` → [DEVELOPER-QUICKSTART.md](./DEVELOPER-QUICKSTART.md)
- `repo:LaTandaEcosystem` → Mobile setup guide (React Native + Expo)
- `repo:latanda-backend` → Server access credentials (secure handoff)

**4. Assign First Task**
Small, scoped task in their primary repo:
- Developers: Easy bounty (50-100 LTD)
- Social media: 1 week of content
- DevOps: Review current infrastructure
- Content creator: 1 blog post/video

**5. Introduce to Team**
- Discord introduction message
- Tag them in relevant channels
- Pair with mentor in same role

**6. Schedule Check-in**
- 1-week check-in: How's it going? Any blockers?
- 1-month review: Performance feedback, increase responsibilities

---

## 📝 BEST PRACTICES

### For Project Founders

**1. Clear Ownership**
Assign each repository a primary maintainer:
- `repo:la-tanda-web` → [Your name or lead dev]
- `repo:LaTandaEcosystem` → [Mobile lead]
- `repo:latanda-backend` → [Backend lead]
- `repo:latanda-marketing` → [Marketing lead]

**2. Regular Sync Meetings**
- **Weekly all-hands:** 30-min update from each repo team
- **Monthly planning:** Roadmap alignment across repos
- **Quarterly retrospectives:** What's working, what's not

**3. Consistent Documentation**
Every repo should have:
- `README.md` - Project overview, setup instructions
- `CONTRIBUTING.md` - How to contribute
- `TEAM-ORGANIZATION.md` - Role descriptions (link to main repo)
- `CHANGELOG.md` - Version history

**4. Unified Branding**
Even though work happens in different repos, maintain consistent:
- Visual design (logos, colors, typography)
- Voice/tone in communication
- Quality standards
- Code style guides

**5. Cross-Functional Collaboration**
Encourage team members to understand other repos:
- Backend devs learn frontend needs
- Mobile devs understand smart contract limitations
- Marketers learn technical features to promote

---

## 🚀 RECRUITING ACROSS PROJECTS

### Recruitment Message Template

When posting job openings or bounties, specify which repo:

```markdown
**Role:** [Frontend Developer]
**Repository:** repo:INDIGOAZUL/la-tanda-web
**Type:** Bounty-based (50-500 LTD per task)
**Technologies:** HTML, CSS, JavaScript, Web3
**Time Commitment:** Flexible (5-20 hours/week)

**What You'll Work On:**
- Glassmorphism UI components
- i18n translation system
- Web3 wallet integrations

**How to Apply:**
Browse bounties: https://github.com/INDIGOAZUL/la-tanda-web/issues?q=is%3Aissue+is%3Aopen+label%3Abounty
Comment to claim, submit PR, earn LTD tokens!
```

### Role-Specific Recruitment Channels

**Developers:**
- GitHub (direct repo issues)
- Dev.to
- Hacker News
- Reddit (r/forhire, r/web3careers)

**Social Media Managers:**
- LinkedIn
- Twitter/X job boards
- Marketing communities (GrowthHackers, Inbound.org)

**DevOps:**
- Stack Overflow Jobs
- DevOps subreddits
- Hacker News Who's Hiring

**Content Creators:**
- Medium
- YouTube creator communities
- Upwork/Fiverr (for initial projects)

**Designers:**
- Dribbble
- Behance
- Designer News

---

## 📞 QUICK REFERENCE COMMANDS

### GitHub CLI (gh) for Multi-Repo Management

```bash
# List issues across all repos
gh issue list --repo INDIGOAZUL/la-tanda-web
gh issue list --repo a2aproject/LaTandaEcosystem

# Create issue in specific repo
gh issue create --repo INDIGOAZUL/la-tanda-web --title "[BOUNTY] Fix SEO tags" --label bounty

# View PRs across repos
gh pr list --repo INDIGOAZUL/la-tanda-web
gh pr list --repo a2aproject/LaTandaEcosystem

# Switch between repos quickly
cd ~/la-tanda-web && git status
cd ~/LaTandaEcosystem && git status
cd ~/latanda-backend && git status
```

### Git Aliases for Multi-Repo Work

```bash
# Add to ~/.gitconfig
[alias]
    repo-status = "!f() { \
        echo '=== la-tanda-web ===' && cd ~/la-tanda-web && git status -sb && \
        echo '\n=== LaTandaEcosystem ===' && cd ~/LaTandaEcosystem && git status -sb && \
        echo '\n=== latanda-backend ===' && cd ~/latanda-backend && git status -sb; \
    }; f"

    repo-pull = "!f() { \
        cd ~/la-tanda-web && git pull && \
        cd ~/LaTandaEcosystem && git pull && \
        cd ~/latanda-backend && git pull; \
    }; f"
```

---

## 🎯 EXAMPLE SCENARIOS

### Scenario 1: Hiring Your First Social Media Manager

**You want:** Someone to manage Twitter, Instagram, create content
**Which repo?** `repo:latanda-marketing` (future repo for marketing assets)

**Steps:**
1. Create GitHub repo: `latanda-marketing` (or use Notion/Google Drive initially)
2. Post opening using [SOCIAL MEDIA TASK template](/.github/ISSUE_TEMPLATE/social-media-task.md)
3. Share on LinkedIn: "[Social Media Manager] - repo:latanda-marketing - Earn LTD tokens managing Web3 project socials"
4. Interview candidates, check portfolio
5. Assign: 1 week of content as trial
6. Grant access: Twitter account, brand assets folder
7. Weekly sync: Review analytics, plan next week

---

### Scenario 2: Need Server Admin for Infrastructure

**You want:** DevOps admin to maintain Hostinger VPS
**Which repo?** `repo:latanda-backend` (private)

**Steps:**
1. Create issue in private `latanda-backend` repo OR email directly
2. Use [DEVOPS TASK template](/.github/ISSUE_TEMPLATE/devops-task.md)
3. Post on DevOps communities: "[DevOps Admin] - repo:latanda-backend - PostgreSQL + Nginx + Node.js"
4. Interview focusing on security, backups, monitoring
5. Assign: Infrastructure audit (document current setup)
6. Grant access: SSH credentials, database access (secure handoff)
7. Set expectations: On-call rotation, monthly retainer (200-400 LTD)

---

### Scenario 3: Multiple Developers on Different Stacks

**You want:** 3 developers - frontend, backend, mobile
**Which repos?** All 3 development repos

**Steps:**
1. Post 3 separate bounty listings:
   - `repo:INDIGOAZUL/la-tanda-web` - Frontend bounties
   - `repo:latanda-backend` - Backend bounties
   - `repo:a2aproject/LaTandaEcosystem` - Mobile bounties
2. Share on Dev.to: "La Tanda is hiring across all stacks - pick your repo!"
3. Use repo tags in job posts so applicants know where to focus
4. Onboard each developer to their specific repo
5. Create cross-repo issues when features span multiple projects
6. Weekly sync to coordinate dependencies

---

## ✅ CHECKLIST: Am I Managing Multi-Repo Correctly?

- [ ] Each repository has clear ownership and maintainer
- [ ] Role-to-repository mapping is documented (this file)
- [ ] Communication channels are organized by repo
- [ ] GitHub issue templates include repo tags
- [ ] Recruitment posts specify which repo/stack
- [ ] Cross-repo workflows are documented
- [ ] Team members know which repo(s) they work in
- [ ] Regular sync meetings keep everyone aligned
- [ ] Consistent branding across all repos
- [ ] Easy onboarding for new contributors to find right repo

---

## 🌟 CONCLUSION

Managing multiple repositories and diverse team roles requires clear organization. This workflow guide helps you:

✅ **Identify** which repo each role belongs to
✅ **Coordinate** work spanning multiple projects
✅ **Recruit** the right people for the right repos
✅ **Communicate** effectively across teams
✅ **Scale** your organization as the project grows

**Questions about multi-repo workflows?** Email team@latanda.online

---

**Document Version:** 1.0
**Last Updated:** October 18, 2025
**Next Review:** November 1, 2025

**Maintained by:** La Tanda Web3 Core Team
