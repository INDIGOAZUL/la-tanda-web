# 🎯 BOUNTY CLAIM: Coder #201 - Oracle Cloud Infrastructure Template

**Amount:** $100
**Platform:** Algora.io
**Status:** CLAIMING NOW
**Date:** 2025-10-21

---

## 📋 BOUNTY DETAILS

**Issue:** Coder #201
**Title:** Add Oracle Cloud Infrastructure (OCI) template example
**Organization:** Coder
**Difficulty:** ⭐⭐ Easy
**Time Estimate:** 5-10 hours

---

## 🎯 CLAIM STRATEGY

### **Step 1: Review the Issue**
**Go to:** https://github.com/coder/coder/issues/201

**What to look for:**
- Existing comments (check if someone already claimed it)
- Requirements/acceptance criteria
- Related PRs or discussions
- Maintainer activity (last response date)

---

### **Step 2: Claim Comment Template**

Copy and paste this into the GitHub issue:

```
Hi! I'd like to work on this bounty.

**Background:**
- Full-stack developer with production infrastructure experience
- Recently deployed authentication system to production (Nginx + PostgreSQL)
- Familiar with cloud infrastructure and template creation
- Active on Algora with GitHub account connected

**Approach:**
I'll create an OCI template following the existing Coder template patterns, including:
- VM provisioning configuration
- Network setup
- Security group rules
- Workspace initialization
- Clear documentation

**Timeline:**
Can deliver within 3-5 days

**Questions:**
- Are there specific OCI services/features you want included?
- Any preferred region or instance types?
- Should I follow the structure of existing cloud templates (AWS/GCP)?

Looking forward to contributing!
```

---

### **Step 3: What Happens Next**

**Scenario A: Immediate Approval** ✅
- Maintainer says "go ahead" or assigns you
- Start working immediately
- Fork the repo and begin

**Scenario B: Questions First**
- Maintainer asks clarifying questions
- Answer promptly (within 24 hours)
- Then start working

**Scenario C: Already Claimed** ⚠️
- Someone else is working on it
- Move to backup option (Coder #51 or ZIO #3235)
- Don't waste time arguing

---

## 🔧 TECHNICAL APPROACH

### **Research Phase (1-2 hours)**

**Study existing templates:**
```bash
# Clone Coder repo
git clone https://github.com/coder/coder.git
cd coder

# Find existing cloud templates
ls examples/templates/

# Study AWS/GCP templates for structure
cat examples/templates/aws-linux/main.tf
cat examples/templates/gcp-linux/main.tf
```

**OCI Documentation:**
- OCI Terraform Provider: https://registry.terraform.io/providers/oracle/oci/latest/docs
- OCI Compute Instances: https://docs.oracle.com/en-us/iaas/Content/Compute/Tasks/launchinginstance.htm

---

### **Implementation Phase (3-5 hours)**

**Create OCI Template Structure:**
```
examples/templates/oci-linux/
├── main.tf              # Main Terraform configuration
├── README.md            # Setup instructions
├── variables.tf         # Input variables
└── .terraform.lock.hcl  # Provider lock file
```

**Key Components:**
1. **Provider Configuration**
   - OCI authentication
   - Region/tenancy setup

2. **Compute Instance**
   - VM shape (e.g., VM.Standard.E2.1.Micro - free tier)
   - Image selection (Ubuntu/Oracle Linux)
   - Boot volume

3. **Networking**
   - VCN (Virtual Cloud Network)
   - Subnet
   - Internet Gateway
   - Security Lists

4. **Coder Integration**
   - Coder agent installation
   - Workspace metadata
   - Resource cleanup

5. **Documentation**
   - Prerequisites (OCI account, Terraform)
   - Setup instructions
   - Configuration options

---

### **Testing Phase (1-2 hours)**

**Test locally:**
```bash
# Initialize Terraform
terraform init

# Validate configuration
terraform validate

# Plan (dry run)
terraform plan

# Apply (if you have OCI account)
terraform apply
```

**What to verify:**
- Template deploys successfully
- Coder agent connects
- Workspace is accessible
- Resources clean up properly

---

## 📝 DELIVERABLES CHECKLIST

Before submitting PR:

### **Code:**
- [ ] main.tf with OCI provider and resources
- [ ] variables.tf with clear descriptions
- [ ] README.md with setup instructions
- [ ] .terraform.lock.hcl (generated)

### **Documentation:**
- [ ] Clear prerequisites section
- [ ] Step-by-step setup guide
- [ ] Configuration examples
- [ ] Troubleshooting section
- [ ] Links to OCI documentation

### **Quality:**
- [ ] Terraform formatting (terraform fmt)
- [ ] No hardcoded credentials
- [ ] Uses Coder's best practices
- [ ] Follows existing template structure
- [ ] Works with OCI free tier

---

## 🎯 SUCCESS CRITERIA

**Bounty will be awarded when:**
1. ✅ PR is submitted
2. ✅ Template deploys successfully
3. ✅ Code review passes
4. ✅ PR is merged to main branch
5. ✅ Algora payment triggered

**Payment timeline:** Usually 1-3 days after merge

---

## 🚨 POTENTIAL BLOCKERS

### **Problem: Don't have OCI account**
**Solution:** 
- Create OCI free tier account (300 credits)
- Use existing templates as reference
- Test with `terraform validate` and `terraform plan`

### **Problem: Unfamiliar with Terraform**
**Solution:**
- Study existing Coder templates
- Follow OCI Terraform provider docs
- Copy structure from AWS/GCP templates

### **Problem: Someone claims it first**
**Solution:**
- Move immediately to Coder #51 (Module template)
- Or ZIO #3235 (Auth header bug)
- Don't wait - claim backup option same day

---

## 📊 LEARNING OUTCOMES

**Skills you'll gain:**
- ✅ Terraform infrastructure-as-code
- ✅ OCI cloud platform knowledge
- ✅ Open source contribution workflow
- ✅ Technical documentation writing
- ✅ Bounty claiming process

**Portfolio addition:**
- ✅ Merged PR in active open source project
- ✅ Cloud infrastructure template
- ✅ Algora reputation boost

---

## 🔄 BACKUP OPTIONS

If Coder #201 is already claimed:

### **Option B: Coder #51 - Template for Module Development ($100)**
- Similar difficulty
- Template/documentation work
- Same organization (easier to switch)

### **Option C: ZIO #3235 - Authorization Header ($100)**
- Leverages your auth expertise
- Bug fix (different skill)
- Slightly harder but you have experience

---

## 💡 PRO TIPS

**Before claiming:**
1. Check issue for recent comments (last 48 hours)
2. Look for `/claim` or assignment in thread
3. Verify no open PRs reference this issue

**After claiming:**
1. Respond to questions within 24 hours
2. Provide progress updates every 2-3 days
3. Ask for help if stuck (maintainers appreciate communication)

**During work:**
1. Commit frequently with clear messages
2. Test thoroughly before submitting PR
3. Write detailed PR description

**After submitting:**
1. Respond to review feedback quickly
2. Make requested changes promptly
3. Be professional and grateful

---

## ✅ IMMEDIATE NEXT STEPS

**Right now (5 minutes):**
1. [ ] Go to https://github.com/coder/coder/issues/201
2. [ ] Read the full issue and comments
3. [ ] Check if anyone claimed it recently
4. [ ] Copy claim comment template above
5. [ ] Post your claim comment

**After claiming (1 hour):**
1. [ ] Fork coder/coder repository
2. [ ] Clone to your local machine
3. [ ] Study existing templates
4. [ ] Read OCI Terraform provider docs

**This week:**
1. [ ] Build OCI template
2. [ ] Test configuration
3. [ ] Write documentation
4. [ ] Submit PR

---

**You've got this! Go claim that bounty! 🚀**

**Report back:** Did you post the claim comment?

