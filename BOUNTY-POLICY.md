# 🎯 La Tanda Web - Bounty Program Policy

## Overview

This document outlines the rules and expectations for participating in La Tanda Web's bounty program, which rewards contributors with LTD tokens.

---

## 📋 How to Claim a Bounty

### 1. Find an Open Bounty
- Browse issues with the `bounty` label
- Check that the issue is **OPEN** and **not assigned**
- Read the full requirements carefully

### 2. Comment Your Intent
Post a comment on the issue including:
```markdown
🎯 Claiming this bounty!

**Deliverables:** [List what you'll deliver]
**Technical Approach:** [Brief description of your approach]
**ETA:** [Estimated completion time]
**Experience:** [Relevant experience - optional]
```

### 3. Wait for Confirmation
- Maintainer will review your claim within 24 hours
- You may be asked to provide initial progress before official assignment
- Once approved, the issue will be assigned to you

### 4. Start Working
- **Fork** the repository
- Create a **feature branch**: `bounty-issue-{number}`
- Make regular commits with clear messages
- Open a **draft PR** within 48 hours of assignment

### 5. Submit Your Work
- Complete all requirements listed in the issue
- Ensure all tests pass
- Update documentation if needed
- Convert draft PR to **ready for review**
- Reference the issue: `Closes #XX` in PR description

### 6. Receive Your Reward
- Once PR is merged, LTD tokens will be awarded
- Payment typically within 2-5 days of merge
- Tokens sent to your specified wallet address

---

## ⚠️ Important Rules

### One Bounty at a Time
**Contributors should work on ONE bounty at a time**, unless:
- You have substantial progress on the first bounty (draft PR open)
- Maintainer explicitly approves working on multiple bounties
- The bounties are clearly unrelated and won't interfere

**Why?** This ensures:
- Quality focused work
- Timely delivery
- Fair opportunities for other contributors
- You don't block multiple bounties

### Progress Requirements

**Within 48 hours of assignment:**
- Fork the repository
- Create feature branch
- Open draft PR (even if empty/WIP)

**Regular updates:**
- Comment on the issue every 2-3 days with progress
- Respond to maintainer questions within 24 hours
- Update your PR regularly

**If you go silent for >3 days without update:**
- Maintainer will request status update
- Bounty may be reassigned if no response within 24h

### Quality Standards

All submissions must:
- ✅ Pass all existing tests
- ✅ Include tests for new functionality
- ✅ Follow project code style
- ✅ Update relevant documentation
- ✅ Have clear, descriptive commit messages
- ✅ Be fully functional (no partial implementations)

### Bounty Assignment

**Assignment happens when:**
1. You claim the bounty with a solid plan
2. Maintainer reviews and approves
3. Issue is officially assigned to you
4. You confirm and start work

**Bounty may be reassigned if:**
- No fork/draft PR within 48h of assignment
- No progress updates for 3+ days
- You request to step down
- Maintainer determines work is not progressing

---

## 💰 Bounty Values

Bounty amounts are listed in **LTD tokens** and vary by:
- **Complexity:** Simple (50-150 LTD), Medium (200-400 LTD), Complex (500+ LTD)
- **Priority:** High-priority issues may have bonus rewards
- **Impact:** Features with high user impact may have increased rewards

### Bonus Rewards

Additional LTD tokens may be awarded for:
- ✨ Exceptional code quality
- 📚 Outstanding documentation
- ⚡ Ahead-of-schedule delivery
- 🎁 Extra features beyond requirements
- 🐛 Bug fixes discovered during implementation

---

## 🚫 What's Not Allowed

### Claim Squatting
- Claiming bounties with no intent to complete
- Claiming multiple bounties to block others
- Abandoning claimed bounties without notice

### Plagiarism
- Copying code without attribution
- Submitting others' work as your own
- Using AI-generated code without disclosure and review

### Gaming the System
- Creating fake accounts to claim bounties
- Coordinating with others to monopolize bounties
- Submitting intentionally incomplete work to claim partial rewards

**Violations may result in:**
- Immediate disqualification
- Forfeiture of rewards
- Ban from future bounties

---

## 📞 Communication

### Where to Ask Questions
- **Issue comments:** Technical questions about the bounty
- **GitHub Discussions:** General questions about the program
- **Email:** bounties@latanda.online (for private matters)

### Response Times
- **Your questions:** Maintainer responds within 24 hours
- **Maintainer questions:** You should respond within 24 hours
- **PR reviews:** Typically within 48 hours of submission

---

## 🎯 Tips for Success

### Before Claiming
- ✅ Read the full issue description
- ✅ Check CONTRIBUTING.md
- ✅ Review existing codebase
- ✅ Ensure you have time to complete it
- ✅ Verify tech stack matches your skills

### During Development
- ✅ Open draft PR early
- ✅ Commit regularly with clear messages
- ✅ Post progress updates every 2-3 days
- ✅ Ask questions when stuck
- ✅ Follow code style guidelines

### Before Submitting
- ✅ Test thoroughly
- ✅ Run all existing tests
- ✅ Update documentation
- ✅ Self-review your code
- ✅ Write clear PR description

---

## 📊 Bounty Workflow

```
1. Find Bounty → 2. Claim → 3. Get Assigned → 4. Fork/Branch → 5. Draft PR
     ↓                                                                ↓
10. Get Paid ← 9. PR Merged ← 8. Review ← 7. Ready PR ← 6. Complete Work
```

**Timeline:**
- Claim to Assignment: 24 hours
- Assignment to Draft PR: 48 hours
- Work Duration: As specified in bounty (usually 3-10 days)
- PR Review: 24-48 hours
- Merge to Payment: 2-5 days

---

## 🔄 Reassignment Policy

A bounty may be reassigned if:

**Automatic (immediate):**
- Contributor explicitly requests to step down
- Contributor is unresponsive for 72 hours after maintainer question

**After Warning (24h grace period):**
- No fork/PR after 48h of assignment
- No progress update for 3+ days
- Work quality doesn't meet standards

**Reassignment Process:**
1. Maintainer posts warning comment
2. 24 hour grace period for response
3. If no response, issue is unassigned
4. Issue reopened for other contributors

---

## 💎 Payment Details

### LTD Token Distribution
- Tokens awarded after PR merge
- Payment to your specified wallet address
- Typical processing time: 2-5 business days

### Providing Wallet Address
When claiming a bounty, include:
```markdown
**Wallet Address:** 0x... (Polygon network)
```

Or update your GitHub profile with wallet info.

### Tax Considerations
- You are responsible for any tax implications
- Token value calculated at time of payment
- Consult local tax professional if needed

---

## ❓ FAQ

**Q: Can I work on multiple bounties?**
A: Generally one at a time. Multiple allowed if first bounty has substantial progress and maintainer approves.

**Q: What if I can't finish?**
A: Let us know ASAP! It's okay to step down. Just comment on the issue so we can reassign.

**Q: How long do I have?**
A: Deadlines vary by bounty (usually 3-10 days). Check the issue description or ask maintainer.

**Q: Can I get partial payment?**
A: No. Payment only after complete implementation that meets all requirements and passes review.

**Q: What if requirements change?**
A: Maintainer will update the issue and may adjust deadline/payment. You can choose to continue or step down.

**Q: Can I use AI tools (ChatGPT, Copilot)?**
A: Yes, but you must review and understand all code. You're responsible for quality and accuracy.

---

## 📜 Code of Conduct

All contributors must follow:
- Be respectful and professional
- Communicate clearly and timely
- Deliver quality work
- Give proper attribution
- Help others when possible

Violations may result in disqualification and ban.

---

## 🔗 Related Documents

- [CONTRIBUTING.md](./CONTRIBUTING.md) - General contribution guidelines
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) - Community standards
- [DEVELOPER-TOKENOMICS-REWARDS.md](./DEVELOPER-TOKENOMICS-REWARDS.md) - Full reward system

---

## 📞 Contact

Questions about the bounty program?

- **GitHub Issues:** Comment on the bounty issue
- **GitHub Discussions:** https://github.com/INDIGOAZUL/la-tanda-web/discussions
- **Email:** bounties@latanda.online

---

**Last Updated:** October 26, 2025
**Version:** 1.0

Thank you for contributing to La Tanda Web! 🚀
