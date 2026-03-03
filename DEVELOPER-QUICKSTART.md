# Developer Quickstart Guide

Get started contributing to La Tanda in 5 minutes.

> **Before you start:** Read the "Codebase Patterns" section in [CONTRIBUTING.md](./CONTRIBUTING.md). It explains the auth token pattern, `escapeHtml()` requirement, file locations, and other rules that are enforced in code review.

---

## Setup

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

### 3. Understand the Architecture

The frontend is **static files** that call the production API at `latanda.online`. There is no local backend.

- **UI changes** (HTML/CSS/JS): test locally, they'll work
- **API-dependent features**: calls go to the live server — you can see real responses
- **Verify endpoints exist**: check [latanda.online/docs](https://latanda.online/docs) (Swagger UI) before calling any API

---

## Key Files

### Pages and Modules

| What | File | Notes |
|------|------|-------|
| Landing page | `index.html` | |
| User dashboard | `home-dashboard.html` | |
| Groups/Tandas | `groups-advanced-system.html` | |
| Marketplace SPA | `marketplace-social.html` + `marketplace-social.js` | **At root, NOT in `js/`** |
| Social feed | `js/hub/social-feed.js` | `SocialFeed` singleton object |
| Sidebar widgets | `js/hub/contextual-widgets.js` + `js/hub/sidebar-widgets.js` | |
| Component loader | `js/components-loader.js` | Loads shared header/footer |
| OpenAPI spec | `docs/swagger/openapi.json` | 220+ paths |

### Styles

| What | File |
|------|------|
| Main layout | `css/dashboard-layout.css` |
| Groups page | `css/groups-page.css` |
| Social feed | `css/hub/social-feed.css` |
| Marketplace | Inside `marketplace-social.html` `<style>` block |

### Design System

```
Dark theme:    #0f172a (background), #1e293b (cards)
Cyan accent:   #00FFFF (--tanda-cyan)
Orange accent:  #FF6B35 (--mp-orange, marketplace)
Green:         #10b981 (success, prices)
Amber:         #f59e0b (warnings)
Red:           #ef4444 (errors)
Glassmorphism: backdrop-filter: blur(20px), semi-transparent backgrounds
```

---

## Common Patterns

### Auth Token

```javascript
// Always use this dual lookup
const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
```

### API Calls

```javascript
const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
const res = await fetch('/api/feed/social/following?limit=20&offset=0', {
    headers: { 'Authorization': `Bearer ${token}` }
});
const result = await res.json();
// Response shape: { success: true, data: { events: [...], pagination: {...} } }
```

### Rendering User Data (XSS Prevention)

```javascript
// ALWAYS escape user data before rendering
el.innerHTML = '<p>' + escapeHtml(user.name) + '</p>';

// NEVER render raw user input
el.innerHTML = '<p>' + user.name + '</p>';  // XSS!
```

### Delegated Event Listeners

The codebase uses delegated events with `data-action` attributes instead of inline `onclick`:

```html
<button data-action="edit-item" data-id="123">Edit</button>
```

```javascript
container.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    switch (btn.dataset.action) {
        case 'edit-item':
            editItem(btn.dataset.id);
            break;
    }
});
```

---

## Workflow

1. **Read** [CONTRIBUTING.md](./CONTRIBUTING.md) codebase patterns section
2. **Claim** a [bounty issue](https://github.com/INDIGOAZUL/la-tanda-web/issues?q=label%3Abounty) by commenting
3. **Explore** the live API at [latanda.online/docs](https://latanda.online/docs)
4. **Code** — modify existing files, follow existing patterns
5. **Test** locally in browser + check console for errors
6. **Submit** PR — the template will guide you through the checklist

---

## Resources

| Resource | URL |
|----------|-----|
| Live Platform | [latanda.online](https://latanda.online) |
| Swagger UI | [latanda.online/docs](https://latanda.online/docs) |
| Dev Portal (sandbox, SDK, WebSocket, chain) | [latanda.online/dev-dashboard.html](https://latanda.online/dev-dashboard.html) |
| Chain Explorer | [latanda.online/chain](https://latanda.online/chain/) |
| Contributing Guide | [CONTRIBUTING.md](./CONTRIBUTING.md) |

---

*Last Updated: March 3, 2026*
*Platform Version: 4.12.0*
