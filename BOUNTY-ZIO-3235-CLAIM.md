# 🎯 BOUNTY: ZIO #3235 - Authorization Header Bug

**Amount:** $100
**Difficulty:** ⭐⭐ Easy (Perfect for you!)
**Time Estimate:** 3-5 hours
**Your Advantage:** You JUST built authentication system!

---

## 📋 ISSUE DETAILS

**Repository:** zio/zio-http
**Issue:** #3235
**Title:** Missing Authorization header is reported as 400 instead of 401
**Type:** Bug fix
**Status:** Checking availability now...

---

## 🎯 THE PROBLEM

**Current behavior (WRONG):**
```
Request without Authorization header
→ Returns: HTTP 400 Bad Request ❌
```

**Expected behavior (CORRECT):**
```
Request without Authorization header  
→ Should return: HTTP 401 Unauthorized ✅
```

**Why this matters:**
- HTTP status codes have specific meanings
- 400 = Client sent bad request (wrong syntax)
- 401 = Authentication required (correct for missing auth)
- This is a standards violation (RFC 7235)

---

## 💡 WHY THIS IS PERFECT FOR YOU

✅ **You literally just implemented JWT authentication**
✅ **You understand HTTP status codes** (400 vs 401)
✅ **You know how auth headers work**
✅ **Small, focused bug fix** (not a big feature)
✅ **Clear acceptance criteria**
✅ **ZIO is Scala, but HTTP concepts are universal**

---

## 🔍 TECHNICAL APPROACH

### **Step 1: Understand the Code (1 hour)**

The bug is likely in the auth middleware that checks for Authorization header.

**Current (wrong) logic:**
```scala
// Pseudo-code
if (request.header("Authorization").isEmpty) {
  return BadRequest(400, "Missing authorization")  // ❌ WRONG
}
```

**Fixed logic:**
```scala
// Pseudo-code  
if (request.header("Authorization").isEmpty) {
  return Unauthorized(401, "Authorization required")  // ✅ CORRECT
}
```

### **Step 2: Find the Bug Location (1 hour)**

**Where to look:**
```bash
# Clone the repo
git clone https://github.com/zio/zio-http.git
cd zio-http

# Search for authorization handling
grep -r "Authorization" --include="*.scala"
grep -r "400" --include="*.scala" | grep -i auth
grep -r "BadRequest" --include="*.scala" | grep -i auth

# Look in these likely files:
# - zio-http/src/main/scala/zio/http/Middleware.scala
# - zio-http/src/main/scala/zio/http/Header.scala  
# - zio-http-*/auth/*.scala
```

### **Step 3: Fix the Bug (30 minutes)**

**Change:**
- Status code: 400 → 401
- Response message: Update to proper auth error
- HTTP header: Add `WWW-Authenticate` if needed (proper 401 response)

**Example fix:**
```scala
// Before
Status.BadRequest

// After  
Status.Unauthorized
```

### **Step 4: Add Tests (1-2 hours)**

**Test cases to add:**
```scala
test("should return 401 when Authorization header is missing") {
  val request = Request.get(URL.root)
  val response = app(request)
  assertTrue(response.status == Status.Unauthorized)
}

test("should return 401 when Authorization header is malformed") {
  val request = Request.get(URL.root).addHeader("Authorization", "invalid")
  val response = app(request)
  assertTrue(response.status == Status.Unauthorized)
}
```

### **Step 5: Documentation (30 minutes)**

Update any docs that reference this behavior.

---

## 📝 CLAIM STRATEGY

### **Step 1: Check Availability**

**Go to:** https://github.com/zio/zio-http/issues/3235

**Look for:**
- Is it still open?
- Any recent comments?
- Anyone already claimed it?
- Is there a PR linked?

### **Step 2: Claim Comment**

**Post this:**
```
Hi! I'd like to work on this bounty.

**Background:**
- Full-stack developer with production auth experience
- Recently implemented JWT authentication system with proper HTTP status codes
- Understand the difference between 400 (Bad Request) and 401 (Unauthorized)
- Familiar with HTTP authentication standards (RFC 7235)

**Approach:**
1. Locate the auth middleware returning 400 for missing Authorization header
2. Change status code to 401 (Unauthorized)
3. Add proper WWW-Authenticate header if not present
4. Write comprehensive tests for:
   - Missing Authorization header → 401
   - Malformed Authorization header → 401
   - Valid Authorization header → proceeds normally
5. Update relevant documentation

**Timeline:** Can deliver within 3-5 days

**Questions:**
- Should the fix also handle other auth-related errors (expired tokens, invalid format)?
- Do you want WWW-Authenticate header included in 401 responses?
- Any specific test coverage requirements?

Ready to contribute!
```

### **Step 3: Wait for Response**

Usually get reply within 24 hours.

---

## 🚨 IF IT'S ALREADY CLAIMED

**Backup options from your list:**

1. **Claper #143** - OIDC fix ($150)
2. **Coder #51** - Module template ($100)
3. **screenpi.pe #793** - PostgreSQL setup ($200)

---

## 🎓 LEARNING VALUE

Even if you don't get this bounty, you'll learn:
- ✅ Scala basics (ZIO is Scala framework)
- ✅ HTTP status code standards
- ✅ Auth middleware patterns
- ✅ Contributing to functional programming projects

---

## 💰 SUCCESS CRITERIA

**Bounty paid when:**
1. PR fixes the 400 → 401 issue
2. Tests prove it works
3. Code review passes
4. PR merged to main

**Payment:** 2-5 days after merge

---

## 🔗 USEFUL LINKS

**ZIO HTTP Docs:**
- https://zio.dev/zio-http/

**HTTP Status Codes:**
- RFC 7235 (Authentication): https://tools.ietf.org/html/rfc7235
- 401 Unauthorized: https://httpstatuses.com/401

**Scala Basics:**
- Quick tutorial: https://docs.scala-lang.org/tour/basics.html

---

## ✅ NEXT STEPS

**Right now:**
1. Go to: https://github.com/zio/zio-http/issues/3235
2. Check if it's available
3. Post claim comment (use template above)
4. Report back: "I claimed it!" or "Already taken, moving to backup"

**After claiming:**
1. Clone the repo
2. Find the bug
3. I'll help you fix it step-by-step!

---

**This is YOUR bounty! You literally just fixed auth. You know this! 🚀**

Let me know what you find at that GitHub link!

