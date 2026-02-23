# La Tanda Platform - Development Guide

**Version:** 4.11.0 | **Cache:** v30.2

---

## Quick Reference

### Server Access
```bash
ssh root@168.231.67.201  # SSH key auth
```

### Key Locations
| Purpose | Path |
|---------|------|
| API Backend | `/var/www/latanda.online/integrated-api-complete-95-endpoints.js` |
| Frontend | `/var/www/html/main/` |
| Components Loader | `/var/www/html/main/js/components-loader.js` |
| Environment | `/var/www/latanda.online/.env` |
| Backups | `/root/backups/` |
| Swagger UI | https://latanda.online/docs — files at `/var/www/docs/` |
| OpenAPI Spec | `/var/www/docs/openapi.json` (220 paths, 16 tags) |

### Essential Commands
```bash
pm2 reload latanda-api              # Zero-downtime reload
pm2 logs latanda-api --lines 20
curl -s 'http://localhost:3002/health'
nginx -t && systemctl reload nginx
```

---

## Instructions for Claude

### Before Changes
1. **Backup first:** `cp <file> /root/backups/<file>.backup-$(date +%Y%m%d)`
2. **Read file before editing** - Never edit blind
3. **Test on localhost** when possible

### After JS/CSS Changes
1. Bump cache version in `components-loader.js`
2. Tell user: Ctrl+Shift+R to hard refresh

### After API Changes
1. `pm2 reload latanda-api`
2. Verify: `curl -s 'http://localhost:3002/health'`

### Code Style
- Spanish for user-facing text (es-HN locale)
- English for code comments and logs

### ⚠️ HTML Editing Precautions
**NEVER use Python regex with `re.DOTALL` on HTML files.** Use sed with line numbers or BeautifulSoup.

### ⚠️ Syntax Errors Prevention
- Verify with `node --check` before PM2 reload
- Watch for escaped `\!` in shell commands
- Use HTML entities for quotes in innerHTML

---

## Architecture

**Stack:** Node.js | PostgreSQL 16 | Redis | Vanilla JS | PM2 | Nginx

**Ports:** 80/443 (Nginx) | 3002 (API, 127.0.0.1 only) | 5432 (PostgreSQL) | 6379 (Redis)

**DB User:** `latanda_app` (DML-only, no superuser) — NOT `postgres`

**API Endpoints:** 140+ across Auth, Wallet, Groups, Admin, Lottery, Marketplace, Feed

---

## Recent Changes

### 2026-02-23 — Distribution Cycle Notification + Email
- **`distributionExecutedEmail(data)`** — New dark-theme invoice email template in `email-templates.js` (line 408). Parameters: beneficiaryName, beneficiaryEmail, groupName, grossAmount, netAmount, coordinatorFee, platformFee, cycle, date. Shows info table (Grupo, Monto Bruto, Comisión Coordinador, Comisión Plataforma, **Monto Neto** in cyan, Ciclo, Fecha), green success box, CTA "Ver Mi Grupo". Subject: `Distribución de Ciclo N - GroupName`
- **`distribution_executed` notification type** — Added to `notificationTypes` in `notifications-utils.js` (line 187). Icon: 💰, color: `#10b981` (green), `emailEnabled: true`
- **In-app notification on distribution execute** — After COMMIT in `POST /api/groups/:id/distribution/execute` (line 7129). Non-blocking `notificationsUtils.createNotification()` with `.catch(function(){})`. Sends to `finalBeneficiary` with group_id, cycle_number, amount in data payload
- **Email on distribution execute** — Non-blocking async IIFE (line 7135). Checks `notification_preferences.email_enabled`, fetches user email/name, calls `distributionExecutedEmail()`, sends via `sendEmail(email, subject, html, 'pagos')`. Pattern matches `record-for-member` exactly
- **Beneficiary now receives both in-app notification + email** when coordinator executes cycle distribution. Previously only a log entry was created with no user-facing notification

### 2026-02-23 — Mis Grupos Audit Phase 5 (Dark Theme Remnants + Code Quality)
- **QuickPay modal RED debug overlay removed** — `background:rgba(255,0,0,0.9) !important; z-index:999999 !important` → `background:rgba(0,0,0,0.85); z-index:10000`. All `!important` removed from positioning
- **Turns error box → dark** — `#fef2f2`/`#fecaca`/`#dc2626` → `rgba(239,68,68,0.15)`/`rgba(239,68,68,0.3)`/`#fca5a5`
- **Search results 6 light colors → dark** — "Buscando..." `#6b7280` → `#94a3b8`, result border `#f3f4f6` → `rgba(255,255,255,0.06)`, user name `#111827` → `#f8fafc`, email `#6b7280` → `#94a3b8`, verified badge `#dcfce7`/`#166534` → `rgba(16,185,129,0.15)`/`#10b981`, unverified badge `#fef3c7`/`#92400e` → `rgba(245,158,11,0.15)`/`#f59e0b`
- **CSS hover rule** — `.grp-search-result-item:hover` bg `#f9fafb` → `rgba(255,255,255,0.05)`
- **Duplicate auth_token key fixed** — `getItem('auth_token') || getItem('auth_token')` → `getItem('auth_token') || getItem('authToken')`
- **6 duplicate Authorization headers removed** — 6 fetch calls had `...getAuthHeaders()` spread + redundant manual `"Authorization": "Bearer ..."` line. Manual lines removed (getAuthHeaders already provides it)
- **loading-text color** — `#6b7280` → `#94a3b8`
- **selectedUserEmail color** — `#6b7280` → `#94a3b8`
- **transition: all → specific** — `transition: all 0.2s` → `transition: border-color 0.2s, background-color 0.2s` on proofUploadArea
- **Poll interval cleanup guard** — `clearInterval(window._groupsPollInterval)` before reassigning prevents interval leak on re-init
- **escapeHtml on loading overlay text** — `(text || 'Cargando...')` → `escapeHtml(text || 'Cargando...')` defense-in-depth
- **Zero remaining** — 0 `#fef2f2`, 0 `#111827`, 0 `#dcfce7`, 0 `#fef3c7`, 0 `#166534`, 0 `#92400e`, 0 `rgba(255,0,0)`, 0 duplicate auth headers, 0 `transition: all`. 1 `#6b7280` (gradient button — intentional)
- Cache: `css/groups-page.css?v=2.2`
- `.gz` regenerated for HTML + CSS

### 2026-02-23 — Mis Grupos Audit Phase 4 (Security + Dark Theme + Cleanup)
- **15 XSS escapeHtml fixes** — `tanda.group_name`/`coordinator_name`/`collectingMember` in renderTandaCard, `tanda.name`/`group_name`/`beneficiaryName` in quickPay, `tanda_name`/`recipient`/`sender` in openHistoryModal (4 sites), `name` in populateTandaFilter, `tandaName` in renderHistoryList, `displayName` in showMembersModal, invitation `name`/`contact` in loadPendingInvitations, `btn.text`/`title` in showModal
- **14 error message leak fixes** — All 12 `result.error || 'static msg'` → `'static msg'` only (toggleAnonymous, leaveGroup, sendJoinRequest, transferOwnership, sendPaymentReminder, removeMember, saveTurns, deleteGroup, scheduleGroupLottery, uploadProof, calculateDistribution, executeDistribution). 1 `err.message` in editGroup. 2 `result.message` in quickPay/tandaPay `throw`
- **8 IDOR removals** — `user_id` removed from POST bodies: quickPay (2 variants), tanda start, tanda schedule-start, role-requests, contributions/request. `assigned_by` comment removed from assign-position. 5 duplicate `Authorization` headers cleaned (2 token variant + 3 sessionStorage variant)
- **Register Payment modal → dark theme (30 fixes)** — Overlay 50% → 85%, modal `white` → `#0f172a` + cyan border, focus ring blue → cyan. Step indicator, 4 method cards, amount input, instructions list/title/steps, bank details box, verification time box, proof upload area, error divs (`#fee2e2` → `rgba(239,68,68,0.15)`), success state (circle/heading/message/code box), footer + back/cancel buttons. Fixed 4 duplicate `data-method` attributes. Fixed broken `alt=>` → `alt=""`
- **View Members modal → dark theme (14 fixes)** — Overlay, modal bg, spinner, loading text, empty state, member card bg `#f9fafb` → `#1e293b`, member name `#111827` → `#f8fafc`, 3 role badge variants (creator/coordinator/member) → dark translucent bg, position color `#6b7280` → `#94a3b8`, current user highlight `#eff6ff` → `rgba(0,255,255,0.05)`, member actions bg, action button transition + 4 variants (manage/message/remove/leave) → dark theme
- **Invite Members modal → dark theme (20 fixes)** — Overlay, modal bg, focus ring, success state (circle/heading/subtitle), link display bg `#f9fafb` → `#1e293b`, link input color, link copied text, reset button, search section border, search label, selected user display `#eff6ff` → `rgba(0,255,255,0.05)`, selected user name color, textarea `#1e293b` bg, error div dark, pending invitations border/heading, footer + cancel button
- **7 dark artifact fixes** — Invitation cards bg `#f9fafb` → `rgba(255,255,255,0.03)`. Calendar button `#f3f4f6` → `rgba(255,255,255,0.05)` with dark icon bg + text colors. Export section border/label/4 buttons → dark translucent. Edit modal retry button dark
- **7 inline handlers → delegated** — `onsubmit` on editGroupForm + inviteForm, `oninput` on userSearchInput (with 300ms debounce), `onchange` on proofFileInput + 2 tanda filters + 2 history filters. All converted to `addEventListener` in new Phase 4 delegated block
- **9 duplicate `classList.remove('active')` cleaned** — 6 single-line + 3 multi-line duplicate calls in 9 modal close functions (closeRejectModal, closeManualAssignModal, closeTemplateModal, closeMembersModal, closeInviteModal, closeEditGroupModal, closeDeleteGroupModal, closeManageTurnsModal, closeRegisterPaymentModal)
- **Skeleton shimmer → dark** — Light `#f3f4f6`/`#e5e7eb` gradient → dark `rgba(255,255,255,0.05)`/`rgba(255,255,255,0.1)`
- **Zero remaining** — 0 `result.error`, 0 `err.message`, 0 `result.message`, 0 `onsubmit=`, 0 `oninput=`, 0 `onchange=`, 0 `#fee2e2`, 0 `background: white`, 0 `alert(`, 0 `confirm(`. 131 `escapeHtml()` calls present
- `.gz` regenerated for HTML

### 2026-02-22 — Mis Grupos Audit Phase 3 (Dark Theme UX)
- **Edit Group Modal → dark theme** — Blue gradient header → cyan gradient, `white` bg → `#0f172a` with `rgba(0,255,255,0.15)` border, overlay 50% → 85% opacity. 9 labels `#374151` → `#e2e8f0`. 8 inputs + 1 textarea + 2 selects: white → `#1e293b` bg, `#f8fafc` text, `#334155` border. Focus ring blue → cyan. Spinner, loading text, success/error states, footer, cancel/submit buttons all dark themed. Submit button: blue gradient → cyan/teal gradient with black text
- **Toast system → dark theme** — Base toast `white` → `#1e293b`, shadow strengthened. 4 icon backgrounds (success/error/info/warning): light pastels → dark translucent `rgba()`. Title `#111827` → `#f8fafc`, message `#6b7280` → `#94a3b8`, close hover → `rgba(255,255,255,0.1)`. Loading overlay `rgba(255,255,255,0.9)` → `rgba(15,23,42,0.9)`, spinner → `#334155`/`#00FFFF`
- **Confirm dialog → dark theme + XSS fix** — **CRITICAL**: `message` → `escapeHtml(message)` prevents XSS injection via confirm messages. Backdrop 50% → 85% + `backdrop-filter: blur(4px)`. Dialog `white` → `#0f172a` + cyan border. Title/message/cancel button dark themed. Added `white-space: pre-line` for multi-line messages
- **9 browser `confirm()` → `showConfirm()`** — All 9 native `confirm()` calls converted to async-callback `showConfirm()` dark dialog. Sites: `autoAssignPositions`, `activateTanda`, `logout`, `deleteInvitation`, `sendInvitationReminder` (share link), `confirmRemoveMember`, `cp-mark-mora`, `approvePayment`, distribution execute. 3 calls also got `escapeHtml()` on user-controlled names (`inviteeName`, `userName`, `moraName`)
- **7 browser `alert()` → `showNotification()`** — All 7 native `alert()` calls replaced: `cpConfirmSingle` (3: monto, error, conexion), `cpSubmitBulk` (4: monto, success, error, conexion)
- **Delete modal warning → dark** — Warning icon circle `#fef2f2` → `rgba(220,38,38,0.15)`. Warning box `#fef3c7`/`#fbbf24` → `rgba(245,158,11,0.1)`/`rgba(251,191,36,0.3)`. Warning text `#92400e` → `#fbbf24`
- **Zero remaining** — 0 `confirm()`, 0 `alert()` in file (verified by grep)
- `.gz` regenerated for HTML

### 2026-02-22 — Mis Grupos Security Audit Phase 1
- **4 XSS fixes** — `positionData.user_name` in position cell (line 1111), `member.name`/`turnNum`/`groupName` in lottery animation (lines 4209-4217), `user.name`/`user.email_masked` in search results (lines 7800-7810), `displayName` in remove member button (line 6631) — all wrapped in `escapeHtml()`
- **7 IDOR field removals** — `approved_by: USER_ID`, `rejected_by: USER_ID`, `assigned_by: USER_ID` (×2), `activated_by: USER_ID` from fetch bodies (server uses JWT identity). `updateData.updated_by` in edit group. `user_id` in lottery body
- **13 error message leaks** — All `data.error`/`result.data?.error?.message`/`err.message` concatenations in `showNotification()`/`showError()`/`alert()` replaced with static Spanish strings. Prevents server internals from reaching UI
- **52 inline onclick → data-action** — All `onclick="functionName(...)"` in innerHTML converted to `data-action` + `data-*` attributes. Covers: position management (6), modals (9), tanda cards (10), empty states (4), member management (6), invitations (2), turn management (8), lottery (5), toast/confirm (3). 1 intentional exception: dynamic modal buttons in `showModal()` (Phase 2)
- **~30 new handler cases** — Added to main delegated click listener (line ~12385). Each case reads `data-*` attributes and calls existing function with `typeof fn === 'function'` guard
- **Search results rewrite** — `onmouseover`/`onmouseout` inline handlers removed → CSS `.grp-search-result-item:hover` rule. All user data escaped with `escapeHtml()` in both display and `data-*` attributes
- **7 remaining onclick** — 1 dynamic modal (resolved in Phase 2), 6 safe `.onclick = function()` assignments (not innerHTML)
- **CSS** — `.grp-search-result-item:hover` added to `groups-page.css`
- Cache: `css/groups-page.css?v=2.0`
- `.gz` regenerated for HTML + CSS

### 2026-02-22 — Mis Grupos Audit Phase 2 (Code Quality + Performance + Robustness)
- **`showModal()` onclick resolved** — Dynamic `onclick="${btn.onclick}"` in button generation → `data-action="${btn.action}"`. All 5 callers (payment modal ×2, history modal ×1, feedback modal ×2) changed from `onclick:` → `action:` property. Default fallback `"grp-hide-modal"`. 2 new delegated handler cases: `modal-process-payment`, `modal-submit-feedback`
- **Search input debounce** — `addEventListener('input', applyFilters)` wrapped with 300ms `clearTimeout`/`setTimeout` debounce. Prevents `renderGroups()` + `groupsRendered` event cascade on every keystroke
- **`initializePositionRequests` triple-call guard** — Removed redundant `DOMContentLoaded`/`readyState` block (lines 2626-2632). Only `groupsRendered` event listener remains — already fires on startup and on re-renders
- **Polling interval stored** — `setInterval(() => fetchMyGroups(), 60000)` → `window._groupsPollInterval = setInterval(...)`. Enables future cleanup
- **4 `.catch()` additions** — 3 `fetchMyGroups().then(...)` chains (after lottery execute, leave group, schedule lottery) + `navigator.clipboard.writeText(...)` chain. Prevents unhandled promise rejection warnings
- **5 empty catch blocks documented** — Added context comments: expanded turns optional, group data parse fallback, localStorage private browsing, switchTab init timing, sidebar hub cards non-blocking
- **4 stub functions cleaned** — `exportHistory()`: `showToast` → `showNotification` (locally defined). `viewTandaDetails()`: `showInfo` (undefined locally) → `showNotification`. `showTandaHistory()`/`makeTandaPayment()`: dead TODO comments removed (functions already call `openHistoryModal()`/`quickPay()`)
- **Zero remaining inline onclick in innerHTML** — Phase 1 had 1 intentional exception (`showModal()`), now resolved. 6 safe `.onclick = function()` property assignments remain (not innerHTML)
- `.gz` regenerated for HTML
- **GitHub repos synced** — `latanda-frontend` `48159f5`, `la-tanda-web` `e11e254` (1 file each, +32/-35)

### 2026-02-22 (v4.11.0) — Mora y Prórrogas (Payment Deferrals System)
- **`payment_deferrals` table** — New PostgreSQL table tracking mora (late payment flags) and extension requests (prórrogas). Columns: id (UUID), group_id, user_id, cycle_number, type ('mora'|'extension'), status ('active'|'approved'|'rejected'|'resolved'|'cancelled'), mora fields (applied_by, applied_at, mora_method), extension fields (requested_at, proposed_date, reason, responded_by, responded_at, response_notes), positions_count, amount_owed. UNIQUE constraint on (group_id, user_id, cycle_number, type). Partial index on (group_id, status) WHERE status IN ('active', 'approved')
- **`advance_threshold` column** — `ALTER TABLE groups ADD COLUMN advance_threshold INTEGER DEFAULT 80 CHECK (>= 50 AND <= 100)`. Configurable threshold percentage for auto-advancing cycles. Added to `getGroupById()` SELECT, `createGroup()` INSERT ($21), `updateGroup()` ALLOWED_GROUP_COLS allowlist in db-postgres.js
- **Threshold-based auto-advance** — New `checkCycleAdvanceWithMora()` helper function replaces duplicated auto-advance logic in `record-for-member` and `record-bulk`. Cycle advances when paid >= ceil(activeRequired * threshold / 100). Unpaid members automatically get mora records (type='mora', mora_method='auto_threshold') with notifications
- **`POST /api/groups/:id/members/:userId/mark-mora`** — Coordinator manually marks member as mora. Auth: creator/coordinator/admin. Validates target is active member, not already paid. Creates payment_deferrals record with mora_method='manual_coordinator'. Notifies member
- **`POST /api/groups/:id/extensions/request`** — Member requests prórroga. Auth: active member. Body: reason (1-500 chars), proposed_date or next_quincena flag. Next quincena auto-calculates (day < 15 → 15th, else → next month 15th). Max 60 days future. One active extension per cycle. Notifies group creator
- **`GET /api/groups/:id/extensions`** — List deferrals with filters (?status=, ?type=, ?cycle=). Coordinators see all members; members see only their own. Returns deferrals array with user name/avatar + summary counts (active_moras, pending_extensions, approved_extensions, resolved)
- **`PATCH /api/groups/:id/extensions/:extensionId`** — Approve/reject extension. Auth: creator/coordinator/admin. Body: action ('approve'|'reject'), response_notes (optional). Notifies member with extension_approved or extension_rejected
- **Resolve on payment** — Both `record-for-member` and `record-bulk` now UPDATE payment_deferrals SET status='resolved' when a payment is recorded for a member with active/approved mora or extension
- **Cron extension skip** — `check-payment-status` skips late/suspension notifications for members with approved extension where proposed_date >= CURRENT_DATE
- **advanceThreshold in /update** — Added to destructured body and pgUpdateData with validation (50-100 integer, null defaults to 80)
- **Frontend: "Solicitar Prorroga" button** — Amber button on group card for members with pending/late/suspension_recommended payment status. `data-action="grp-request-extension"` with delegated handler
- **Frontend: Extension Request Modal (pr- prefix)** — Dark theme modal with group info, radio selection (Próxima Quincena / Otra Fecha), reason textarea with 500 char counter, submit/cancel. Functions: `showExtensionRequestModal()`, `prSubmitRequest()`, `prClose()`
- **Frontend: Mora button in coordinator payment view** — Red "Mora" button next to "Registrar" per unpaid member. Confirm dialog before marking. `cpMarkMora()` inside `showCoordinatorPaymentView` closure
- **Frontend: Threshold progress bar** — `cpRenderThresholdBar()` shows "Pagos: X/Y (Z%) — Umbral: N% (M necesarios)" in coordinator payment header. Green when threshold met, amber when not
- **Frontend: Extension Manager Panel (ext- prefix)** — "Gestionar Prorrogas" button in Manage Group modal with pending badge count. Panel shows tabs (Pendientes/Aprobadas/Todas), mora/extension records with user info, approve/reject buttons. Functions: `showExtensionManager()`, `extLoadData()`, `extClose()`
- **Frontend: Threshold input in Edit Group** — "Umbral de avance (%)" input (50-100, default 80) submitted via /update as advanceThreshold
- **CSS** — ~160 lines added to `groups-page.css`: `.pr-overlay/modal/header/body/info/section/radio-label/input/textarea/footer/btn-cancel/btn-submit/request-btn` + `.ext-overlay/modal/header/tabs/tab/content/item/item-extension/item-mora/btn-approve/btn-reject/summary` + `.ext-status-active/approved/rejected/resolved`. Mobile responsive at 480px
- **Groups catch-all handler** — Added `/extensions` and `/mark-mora` to exclusion list (line ~7336) to prevent 4 new endpoints being caught by generic group GET
- **Bug fix: payout/eligibility** — Pre-existing: `amount` column → `gross_amount` in payout_requests SELECT query
- **Bug fix: default.jpg 404** — Created `/var/www/uploads/avatars/default.jpg` (nginx `/uploads/` alias points to `/var/www/uploads/`, not `/var/www/html/main/uploads/`)
- **Notifications** — 4 new types: `extension_requested` (→ creator), `extension_approved` (→ member), `extension_rejected` (→ member), `mora_applied` (→ member)
- Cache: `css/groups-page.css?v=1.9`
- `.gz` regenerated for HTML + CSS
- **Version** — API health returns `4.11.0`

### 2026-02-21 (v4.10.8) — Saldos Administrativos de Tanda + Distribución Corregida
- **Distribution preview/execute rewritten** — Beneficiary now determined from `turns_order[nextDistCycle - 1]` (was always `ORDER BY turn_position ASC LIMIT 1` = always member #1). Distribution cycle counter independent from `groups.current_cycle` (uses `MAX(cycle_number) + 1` from `cycle_distributions`)
- **`target_total` column** — `ALTER TABLE cycle_distributions ADD COLUMN target_total NUMERIC(12,2)`. Stores `max_members × contribution_amount` at distribution time (snapshot). Preview returns `target_total`, `actual_collected`, `positions_filled`, `positions_total`, `collection_percentage`, `next_distribution_cycle`
- **Fee calculation fixed** — Commissions based on `targetTotal` (23 × 3,000 = 69,000) not `totalCollected`. Coordinator turn detected by `beneficiaryUserId === group.admin_id` (was `turn_position === 1`). Custom group `commission_rate` respected in both preview and execute (execute was ignoring it)
- **Execute transactional** — Wrapped in `BEGIN`/`COMMIT` with `FOR UPDATE` duplicate check (prevents double-distribution for same cycle). No longer increments `groups.current_cycle` (record-bulk auto-advance handles that). Increments `tandas.current_turn` instead
- **`GET /api/groups/:id/tanda-balances`** — New endpoint. Auth: `requireAuth` + membership or admin. Returns per-member balance (total_contributed - total_received via target_total). Includes contributions from all statuses (completed + coordinator_approved + archived). Summary with total_contributed_all, total_distributed_all, positions filled/total
- **Frontend distribution modal** — Dark theme (#0f172a) with `dist-` CSS prefix. Shows target total, progress bar with collection %, offline amount, commission breakdown, beneficiary card with turn number. Admin note: "Saldo administrativo - no se acredita a wallet"
- **Frontend tanda balances modal** — New `#tandaBalancesModal` with `tb-` CSS prefix. Stats row (meta/ciclo, distribuciones, posiciones), member table with turn #, name, contributed, balance (green positive / red negative). Multi-position badge (×2). Empty positions indicator. All escaped with `escapeHtml()`
- **Manage group button** — "Saldos de Tanda" button added after "Gestionar Turnos" (canManage only). Event delegation: `gm-show-balances` → `showTandaBalances()`, `grp-close-balances` → `closeTandaBalancesModal()`
- **CSS** — ~120 lines added to `groups-page.css`: `.dist-overlay/modal/header/footer/section/progress-bar/beneficiary-card/admin-note/status` + `.tb-overlay/modal/header/stats/table-header/member-row/balance-positive/negative/summary`. Mobile responsive at 480px
- Cache: `css/groups-page.css?v=1.8`
- `.gz` regenerated for HTML + CSS
- **Version** — API health returns `4.10.8`

### 2026-02-21 (v4.10.7) — Gestor de Comisiones (Commission Manager)
- **Commission Manager Panel** — Full-screen overlay replacing the old "Notificar Comision" button in Manage Group modal. Shows per-member commission acceptance status (accepted/declined/undecided), rate badge (Estandar/Custom/Sin comision), summary stats bar, and action buttons
- **`GET /api/groups/:id/commission/members`** — New endpoint returning per-member commission acceptance. Auth: creator/coordinator/admin. Returns `commission_rate`, `commission_type`, `summary` (accepted/declined/undecided counts), `members[]` (user_id, user_name, avatar_url, role, commission_accepted). Members ordered: creator → coordinators → by join date
- **`PATCH /api/groups/:id/commission/rate`** — New endpoint to change commission rate with automatic member reset. Auth: creator/coordinator/admin. Accepts `commission_rate` (0-5 or null) + `auto_notify` bool. Transaction: UPDATE groups → RESET all non-creator members' commission_accepted to NULL. Auto-notify sends `commission_request` notifications (non-blocking)
- **`/update` endpoint** — Added `commissionRate` to destructured body and `pgUpdateData` with validation (0-5, 2 decimal precision, null = platform default)
- **`db-postgres.js`** — Added `commission_rate` to `getGroupById()` SELECT (was missing, consumers couldn't see current rate)
- **Frontend panel** — `showCommissionManager()` replaces `notifyCommission()`. Full delegated event listener (no inline onclick), all data escaped with `escapeHtml()`. Functions: `cmLoadData`, `cmRenderBadge`, `cmRenderStats`, `cmRenderMembers`, `cmToggleForm`, `cmSaveRate`, `cmNotify`, `cmClose`. Change rate inline form with type select (Estandar/Personalizada/Sin comision) + custom number input
- **CSS** — ~75 lines with `cm-` prefix in `groups-page.css`: `.cm-overlay`, `.cm-modal`, `.cm-rate-badge`, `.cm-stats`, `.cm-member-row`, `.cm-inline-form`, `.cm-badge-accepted/declined/undecided`, `.cm-spinner`. Mobile responsive at 480px
- Cache: `css/groups-page.css?v=1.6`
- `.gz` regenerated for HTML + CSS

### 2026-02-21 (v4.10.6) — Payment Email Notifications + Cycle Auto-Advance + num_positions Fix
- **Email Templates System** — New file `email-templates.js` (v1.1.0) with 5 dark-themed, invoice-style HTML email templates: `paymentRecordedEmail` (confirmation), `paymentReminderEmail` (gentle, 1-3 days late), `paymentLateEmail` (warning, 4-7 days), `suspensionWarningEmail` (urgent, 8+ days), `coordinatorLateAlertEmail` (daily digest table)
- **Email templates polished** — Logo image in header (40x40 from CDN), preheader text for inbox preview, Outlook VML buttons (Word engine compat), MSO conditional comments for 600px width, `@media (max-width:620px)` mobile responsive, `color-scheme:dark` meta, `x-apple-disable-message-reformatting`, HTML entities for Spanish accents, `num_positions` display in all templates ("Tienes 2 numeros, Llevas 1/2 pagos"), total pendiente row + summary badge in coordinator digest
- **Payment confirmation emails** — `record-for-member` and `record-bulk` now send confirmation emails to members via `pagos@latanda.online`. Non-blocking (async IIFE), checks `notification_preferences.email_enabled` before sending. Includes group name, amount, cycle, confirmation code, coordinator name, payment method
- **Cron email escalation** — `check-payment-status` endpoint now sends escalating emails alongside in-app notifications: `payment_late` → reminder email, `suspension_warning` → late email, `suspension_recommended` → suspension warning email. Piggybacks on existing 24h dedup via `last_payment_notification_at`
- **Cron num_positions** — `check-payment-status` query now includes `num_positions`, `current_cycle`, and `contributions_this_cycle` (subquery). After date-based status calc, overrides `up_to_date` → `pending` if `actualContributions < requiredContributions`. Email `amountOwed` multiplied by `requiredContributions`. Coordinator digest `amountOwed` also multiplied
- **Coordinator daily digest** — After processing all memberships, sends one email per group to the creator listing all late members with days late and amounts owed. Includes total pendiente summary row
- **Payment Reminder Cron** — New PM2 process `payment-reminder-cron.js` (fork mode), calls `POST /api/cron/check-payment-status` daily at 8:00 AM Honduras time (14:00 UTC) via `node-cron`. Uses `CRON_SECRET_KEY` for auth
- **Cycle auto-advance** — `current_cycle` now auto-increments when all active members complete the current cycle. Logic added to both `record-for-member` and `record-bulk` (counts total positions required vs contributions completed)
- **num_positions fix** — Members with `num_positions > 1` (e.g., Melony with 2 numbers) now correctly require that many contributions per cycle. Previous logic used `NOT EXISTS` (binary: paid/not paid), new logic uses `COUNT(*) < num_positions`. Affects: unpaid cycle queries in both `record-for-member` and `record-bulk`, auto-advance total count (`SUM(COALESCE(num_positions, 1))` instead of `COUNT(*)`), cron payment status check, and payment-status endpoint (LATERAL join counting fully-paid cycles)
- **payment-status endpoint** — LEFT JOIN subquery rewritten to LATERAL join: counts contributions per cycle vs `num_positions`, a cycle is "fully paid" only when contributions >= positions. Added `num_positions` to response object. `amount_pending` now multiplied by `memberPositions`
- **Frontend num_positions** — Coordinator payment view shows "2 numeros" cyan badge for multi-position members (individual + bulk tabs). `cpConfirmSingle` changed from local state update to `await cpLoadData()` to handle partial payments correctly
- **Cron bug fix** — `last_payment` subquery used `status = 'verified'` but all contributions are `'completed'`. Fixed to `status IN ('completed', 'coordinator_approved', 'verified')`
- **sendEmail logging** — Added success log `"Email sent"` with to/subject/senderType/messageId for audit trail
- **Group query updated** — `record-for-member` and `record-bulk` group queries now include `name` column (needed for email template)
- **Version** — API health returns `4.10.6`
- **Evidence** — `/root/backups/email-evidence-v4106/` contains 17 files: API responses, PM2 logs (5 emails sent), 5 original + 5 polished HTML template previews
- **PM2** — `payment-reminder-cron` process running (id 16, fork mode)
- **GitHub repos synced** — `latanda-fintech`, `latanda-frontend`, `la-tanda-web` updated with v4.10.5 + v4.10.6 changes

### 2026-02-20 (v4.10.5) — Coordinator Payment Management
- **`GET /api/groups/:id/members/payment-status`** — Returns all members with `cycles_paid`, `cycles_pending`, `amount_pending`, `payment_status`, `last_paid_date` per member. Supports `?cycle=N` query param
- **`POST /api/groups/:id/contributions/record-bulk`** — Bulk payment recording (max 50), transactional, `verification_method: 'coordinator_bulk'`, auto-reactivates suspended members
- **Both record endpoints** auto-find next unpaid cycle via `generate_series EXCEPT paid_cycles`
- **`registerGroupPayment()`** — role-based routing: creator/coordinator → `showCoordinatorPaymentView()`, member → existing self-payment wizard
- **DB column gotchas** — `users.avatar_url` (NOT `avatar`), `groups.frequency` (NOT `payment_frequency`)
- Cache: `css/groups-page.css?v=1.5`
- `.gz` regenerated for HTML + CSS

### 2026-02-20 (v4.10.3) — Groups System: Bugs, Security & Dead Code Cleanup
- **Ronda 1: API crash fixes (3)** — `authUserStats.userId/role` → `authUser.userId/role` in update-pg handler (copy-paste from stats handler caused ReferenceError), `edited_by` → `requesterId` in `/edit` handler (undefined variable), `turn_order` → `turn_position` in 3 payout handler locations (column doesn't exist, payout eligibility always failed)
- **Ronda 2: Missing endpoint secured** — `GET /api/groups/:id/contributions/pending` upgraded: `getAuthenticatedUser` → `requireAuth`, added membership check (creator/coordinator/admin only), added `'pending'` to status filter. New endpoint: `POST /api/groups/:id/contributions/record-for-member` — coordinator records payment on behalf of member, pre-verified, uses `authUser.userId` as `verified_by`
- **Ronda 3: Frontend function added** — `toggleCollapsible(btn)` defined for Create Group Step 3 collapsible sections (was data-action with no handler). CSS added for `.collapsible-header`, `.collapsible-content`, `.collapsible-icon` transitions
- **Ronda 4: Frontend security (11 fixes)** — 11 `err.message` leaks replaced with generic Spanish messages (2 were in innerHTML = XSS). `verified_by: userId` removed from verify-payment body (2 locations). `executed_by: userId` removed from distribution execute body. `?user_id=` removed from DELETE group URL. 2 inline `onclick` converted to `data-action` (`grp-close-distribution` footer button, `grp-close-calendar` close button)
- **Ronda 5: API auth (4 endpoints secured)** — `GET /api/groups/:id/export/members` — added `requireAuth` + membership check (was exposing member PII). `GET /api/groups/:id/finances/summary` — added `requireAuth` (was fully public). `GET /api/invitations/sent/:userId` — added `requireAuth`, uses JWT userId instead of URL param (was IDOR). `GET /api/tandas/:id` — added `requireAuth` (was exposing participant details)
- **Ronda 6: Dead code cleanup** — `groups-advanced-system-integration.js` deleted (1,100 lines, `GroupsSystemIntegration` class never initialized — polled forever for `window.laTandaSystemComplete` which was removed in v4.10.0). Script tag removed from HTML
- **Version** — API health returns `4.10.3`
- Cache: `css/groups-page.css?v=1.4`
- `.gz` regenerated for HTML + CSS

### 2026-02-20 (v4.10.2) — Group Card UI Redesign
- **Card layout rewritten** — `renderGroupCard()` completely rebuilt: removed 7+ stacked info-rows, flat badge pills, and tooltip wrapper. New layout: status-colored left border (4px) + avatar circle + 2x2 stat grid + alert banners + contextual action buttons
- **Left border by status** — `#00FFFF` (active), `#f59e0b` (pending/paused), `#ef4444` (suspended/late), `#22c55e` (completed). Overrides to red when payment status is late/suspended
- **Avatar circle** — First letter of group name, background matches status color, dark text (white for suspended/cancelled)
- **Header row** — Avatar + group name (h3, ellipsis overflow) + role pill (right-aligned). Role pills color-coded: purple=creator (`gc-role-creator`), green=coordinator (`gc-role-coord`), blue=member (`gc-role-member`)
- **Subtitle line** — Category + location merged into one muted line with `&middot;` separator, replacing separate `.group-category` block and `.location-badge`
- **2x2 stat grid** — Replaced 7 info-rows with 4-cell grid: Aporte (with frequency label), Recibes (payout), Miembros (X/Y), Frecuencia. Dark translucent cells with centered values
- **Data fallbacks** — `_gcFmtL()` helper: `parseFloat` + `isNaN` check → `"--"` for zero/null values. No more "L. 0.000", "NaN", or "Desconocida"
- **Alert banners** — Full-width, `word-wrap: break-word`, never truncated. Severity-colored backgrounds (`.gc-alert-success/warning/danger/info`)
- **Contextual actions** — Admin/coordinator: "Ver Detalles" (primary) + "Administrar" (secondary) + icon button (members). Member: "Ver Detalles" + "Ver Grupo"
- **Removed from card** — Frecuencia row (redundant), Total Recaudado, Total Pagado, Creado date, flat badges row (status/role/payment pills), tooltip hover
- **CSS rewrite** — 320 lines replaced with `gc-*` prefixed classes. `.btn-icon` added for members icon button. `.badge` + `.badge-goal-reached` kept for Tandas tab. Mobile query updated for new classes
- **Description line** — Optional 2-line clamp description below header (was tooltip hover)
- **Security** — All data escaped with `escapeHtml()`, zero inline `onclick`, entity-encoded alert icons
- Cache: `css/groups-page.css?v=1.3`
- `.gz` regenerated for HTML + CSS

### 2026-02-20 (v4.10.1) — Groups Page: UX Redesign + Audit Fixes (Auth + XSS)
- **Stats to sidebar** — 5 stat cards (Total Grupos, Activos, Pagos Pendientes, Total Pagado, Alertas) moved from main content to right sidebar as compact "Resumen" card. Desktop: visible in right sidebar. Mobile: visible when EdgeSwipe opens drawer
- **Compact filter bar** — Removed vertical labels from 3 filter inputs, added `placeholder` text inside selects ("Rol: Todos", "Pago: Todos"), search input inline. Single-row on desktop, wraps on mobile
- **Better empty states** — New user (0 groups): onboarding CTA "Comienza tu primera tanda" with create button. Filtered (0 results but has groups): "Sin resultados" with "Limpiar Filtros" button
- **Mobile compact cards** — Group cards: reduced padding (12px), smaller fonts (0.9rem titles, 0.78rem info), tighter badges (0.65rem), smaller action buttons (0.75rem)
- **View Details modal dark theme** — Complete rewrite with #0f172a background, cyan accents, backdrop blur. All data escaped via `_vdEsc()`. 3 onclick → data-action (`grp-vd-manage`, `grp-vd-calendar`, `grp-vd-tandas`). `encodeURIComponent(groupId)` in API fetch
- **Manage Group modal dark theme** — Complete rewrite with dark hub aesthetic. 10 onclick → data-action (`gm-close`, `gm-view-members`, `gm-view-payments`, `gm-invite`, `gm-register-payment`, `gm-verify-payments`, `gm-distribute`, `gm-manage-turns`, `gm-toggle-pause`, `gm-edit-group`, `gm-delete-group`). Helper functions `_gmBtn()` + `_gmIcon()`
- **XSS fixes (3 functions):**
  - `loadPendingPayments()`: escaped `user_name`, `user_email/phone`, `reference_code`, `proof_url`. 3 onclick → data-action (`grp-approve-payment`, `grp-reject-payment`, `grp-show-proof`) with delegated listener. `err.message` removed from innerHTML
  - `displayPaymentInstructions()`: escaped `bank_name`, `account_number`, `account_holder`, `account_type` via `_piEsc()`
  - `submitSimpleInvitation()`: API `error.message` replaced with generic "Error al crear invitacion"
- **5 API endpoints secured (was fully unauthenticated):**
  - `GET /api/groups/:id` — `requireAuth()` + membership check (was exposing full group object to anyone)
  - `GET /api/groups/:id/members` — `requireAuth()` + membership check (was exposing member PII: names, emails, positions)
  - `GET /api/groups/:id/calendar` — `requireAuth()` + membership check (was exposing payment schedule with user names/IDs)
  - `GET /api/groups/:id/stats` — `requireAuth()` + membership check (was exposing financial stats, top contributors)
  - `GET /api/groups/:id/contributions` — `requireAuth()` + membership check (was exposing emails, transaction IDs, confirmation codes)
  - All 5 check: active group member OR platform admin. Returns 403 "No tienes acceso a este grupo" otherwise
  - Duplicate dead-code members handler (line ~14358) also got `requireAuth()` for defense-in-depth
- **Stale references removed** — `groups-advanced-system-v3.css` link (404), `groups-advanced-system-complete.js` script (1,830 lines dead Dec 2024 code), `increasePositions` undefined ref, `dashboard-real-data-patch.js` script (not needed on groups page), `sw-register.js` → `registerSW.js`
- **Cross-page fixes** — `sidebar/index.js` orphan object literal fixed, `dashboard-real-data-patch.js` orphan object literal fixed, payout-methods 500 error fixed (wrong column names `provider_name`/`account_alias` → actual `bank_name`/`bank_account_number`/etc.), Permissions-Policy `notifications=(self)` removed (invalid directive)
- **Version** — API health returns `4.10.1`
- Cache: `css/groups-page.css?v=1.2`
- `.gz` regenerated for HTML

### 2026-02-20 (v4.10.0) — Groups Page Rebuild: Hub Layout + Dead Code Removal + XSS Hardening
- **Phase 1: Dead weight removed** — 10 dead `<script>` tags deleted (tanda-event-bus.js 404, api-adapter.js, api-proxy-enhanced/updated.js, smart-suggestions-engine.js, dashboard-metrics/real-time-enhancements.js, value-propositions-engine.js, groups-advanced-system.min.js, api-handlers-complete.js). 3 broken sections removed (calculator, matching, analytics). 6 duplicate modals removed (editProfile, myWallet, KYC, settings, helpCenter, feedback). 4 duplicate overlays removed (userMenu, notifications, search, themeToggle). After-`</body>` scripts moved inside `<body>`
- **Phase 2: Hub layout conversion** — Standard 3-column layout (left-sidebar + main-feed + right-sidebar) matching explorar.html pattern. ~2,800 lines inline CSS extracted to new `css/groups-page.css`. 6 English tabs consolidated to 3 Spanish tabs (Mis Grupos / Mis Tandas / Crear Grupo) with `data-action` attributes. Standard hub CSS/JS imports added (variables.css, header.css, dashboard-layout.css, mobile-drawer.css, etc.). Dead CSS imports removed (translation-styles.css, live-preview-card.css, smart-suggestions.css)
- **Phase 3: XSS hardening** — 6 JS files fixed: `coordinator-panel.js` (added `_cpEscapeHtml()`, 7 onclick→data-action), `payout-frontend.js` (14 onclick→data-action, bank data escaped, 3 error.message removed), `disputes-frontend.js` (added `_dispEscapeHtml()`, 12 onclick→data-action, CSS class allowlists), `member-management-frontend.js` (added `_mmEscapeHtml()`, 10 onclick→data-action, `encodeURIComponent`), `create-group-form-handler-v2.js` (added `_cgfEscapeHtml()`, error.message→generic), `groups-advanced-system-integration.js` (added `_gasiEscapeHtml()`, 62 escape calls, 11 onclick→data-action)
- **Static HTML onclick: 69 → 0** — All static HTML onclick handlers converted to `data-action` with delegated click listeners. 76 remaining onclick are in `<script>` blocks (dynamic HTML generation, handled by per-file delegated listeners)
- **Metrics:** HTML 15,356→9,948 lines (-35%), 718KB→504KB (-30%), 32→20 external scripts, 3 tabs (all working) instead of 6 (3 broken), default view: Mis Grupos (was Calculator)
- Cache: `coordinator-panel.js?v=1771545600`, `payout-frontend.js?v=1.3`, `disputes-frontend.js?v=1.1`, `member-management-frontend.js?v=11.9`, `create-group-form-handler-v2.js?v=20260220001`, `groups-advanced-system-integration.js?v=1.3.0`
- `.gz` regenerated for 8 files (HTML + CSS + 6 JS)
- **GitHub repos synced** — `latanda-frontend` `7a9332c` (8 files), `la-tanda-web` `0c8a485` (8 files)

### 2026-02-19 (v4.9.0) — Security Audit Round 29
- **Platform Audit Round 29** — 12 fixes (2C, 3H, 4M, 3L) across 7 files
- **2 CRITICAL** — Hardcoded API key fallback `'lottery-internal-2025'` in lottery-scraper.js (removed, env-only now) + empty-string safeCompare bypass in lottery-api.js subscription-notifications endpoint (auth bypassed when INTERNAL_API_KEY unset). 9 unescaped user vars in marketplace-social.js `showShareModal()` innerHTML (itemTitle, itemOwner, itemImage, referralLink, referralCode all escaped)
- **3 HIGH** — SQL string interpolation in lottery-scraper.js `updateStatistics()` (period/time now parameterized via `$N`). 6 inline onclick handlers in share modal (converted to data-attributes + delegated listener). Pagination count queries in marketplace-api.js `getServices()`/`getProducts()` ignored WHERE filters (count always returned total unfiltered, now reuses same WHERE clause)
- **4 MEDIUM** — No 0-99 range validation on parsed lottery numbers (added in both scrapeAlternative + scrapeWeb). error.message in innerHTML (2 sites in marketplace-social.js replaced with generic text). Empty catch in marketplace-api.js deleteImageFile (descriptive comment added). Stale sw.js precache entries removed (stats.html, ROADMAP-TRACKER.html + roadmapTracker JS assets)
- **3 LOW** — 15 console.log stripped from lottery-scraper.js. 4 error.message info leaks in social-feed.js replaced with generic Spanish messages. Nginx rate limit documentation comment added to security-middleware.js (cluster mode note)
- **Version** — API health returns `4.9.0`, all version strings updated
- Cache: `marketplace-social.js?v=29.0`, `social-feed.js?v=11.9`, sw.js v7.55.0-audit29
- `.gz` regenerated for 4 frontend files
- **GitHub repos synced** — `latanda-fintech` `7c926a8` (6 files + openapi rename), `latanda-frontend` `d52be04` (7 files), `la-tanda-web` `ab8d259` (7 files)

### 2026-02-19 (v4.8.1) — Explorar Section Redesign with Real API Data
- **Explorar section redesigned** — Replaced 100% hardcoded mock data in `id="marketplace"` section (fake sellers "TechStore HN", "Artesanías Maya", fake services "Limpieza de Hogar", "Reparaciones") with dynamic feed system loading real API data
- **Horizontal sub-tabs** — 4 pill-style tabs (🏪 Tiendas, 📦 Productos, 🛠️ Servicios, 🆕 Recientes) with horizontal scroll on mobile, cyan active state. Default anchor on Tiendas
- **Category filter pills** — Tiendas tab shows city pills (Todos, Tegucigalpa, San Pedro Sula, La Ceiba, Comayagua, Choluteca). Products/Services tabs show API categories from `GET /api/marketplace/categories`. Clicking a pill filters the feed
- **Real API feed** — `loadExplorarFeed(tab, append)` fetches from existing endpoints: providers (`/api/marketplace/providers`), products (`/api/marketplace/products`), services (`/api/marketplace/services`). Pagination via offset + "Cargar más" button. Skeleton loading placeholders, empty state, error state with retry
- **Feed cards** — `_renderExpCard(item, tab)` renders horizontal cards (avatar + body + arrow). Provider cards show avatar/initial, business name, verified badge, rating, city, shop type pill. Product cards show image, title, price (L.), condition. Service cards show image, title, price type, rating, category. All fields escaped with `escapeHtml()`
- **Bug fix: switchTab crash** — `document.querySelector('[data-tab="${tabName}"]')` returned null because sidebar uses `onclick` handlers not `data-tab` attributes. Added null checks on `querySelector` and `getElementById`
- **Bug fix: init error toast** — "Error inicializando el marketplace" always showed. Root cause 1: `Promise.all` → `Promise.allSettled` (subscription 401 for guests rejected the whole chain). Root cause 2: all 5 data-loading methods read `response.X` but API wraps as `response.data.X` — fixed `loadCategories`, `loadMarketplaceData`, `loadServicesData`, `loadMarketplaceStats`, `loadUserSubscription` to read `response.data?.X || response.X`
- **Bug fix: updateMarketStats crash** — stat elements (`totalProducts`, `totalSellers`, etc.) removed from HTML but method still accessed them. Added null guards
- **Bug fix: category pills crash** — `_loadExpCategoryPills` used `this.categories` (hardcoded constructor object) instead of `this.categoriesData` (API array). `.forEach()` on an object would throw when clicking Productos/Servicios tabs
- **Delegated click actions** — 7 new cases: `exp-load-more`, `exp-sell-product` (opens create product modal), `exp-view-tienda` (navigates to `/negocio/{handle}`), `exp-view-producto`, `exp-view-servicio`, `exp-retry`
- **CSS** — ~45 lines: `.exp-tabs`, `.exp-tab`, `.exp-category-pills`, `.exp-pill`, `.exp-feed`, `.exp-card`, `.exp-card-avatar`, `.exp-card-body`, `.exp-card-title`, `.exp-card-price`, `.exp-card-badge`, `.exp-card-action`, `.exp-load-more-btn`, `.exp-sell-fab` (fixed bottom-right cyan circle), `.exp-skeleton` (shimmer animation), `.exp-empty`
- **Security** — All user data escaped, `encodeURIComponent()` on handle in URLs, no `innerHTML` with raw data, no `body.user_id`
- Cache: `marketplace-social.js?v=28.1`, `.gz` regenerated for 3 files
- **GitHub repos synced** — `latanda-fintech` `e8c4a04` (no changes), `latanda-frontend` `721eb65` (3 files), `la-tanda-web` `cbb18fb` (3 files)

### 2026-02-19 (v4.8.0) — Mi Tienda Gaps Fix + Explorar Tiendas Tab
- **Gap 1: Product images safety parse** — Added `JSON.parse()` fallback in `getProducts()` and `getProductById()` (marketplace-api.js) to ensure images always return as arrays. Existing data was already correct jsonb arrays; this is defense-in-depth
- **Gap 2: Portfolio API missing fields** — Added `profile_image` and `service_areas` to the `GET /api/marketplace/portfolio/:handle` provider response object. Fixed `negocio/index.html` to read `p.service_areas` instead of `p.social_links.service_areas` (was reading wrong field path, always null)
- **Gap 3: Profile image upload UI** — Added avatar upload section at top of edit store modal (`openEditStoreModal()`): 64px circular preview (current image or initial), "Cambiar logo" button → `_compressImage()` (400x400) → upload to `/api/marketplace/services/upload-images` → preview update → sends `profile_image` URL in PUT body on save. CSS: `.store-edit-avatar-section`, `.store-edit-avatar-preview`, `.store-btn-upload`, `.store-edit-avatar-hint`. Both copies of `marketplace-social.js` updated identically
- **Gap 4: Category display on item cards** — Added `LEFT JOIN marketplace_categories` to: `getProviderById()` service sub-query (was missing `category_name`/`category_icon`), portfolio endpoint service + product queries. `_buildStoreItemCards()` now shows category pill (`category_icon + category_name`) above title. Portfolio page (`negocio/index.html`) shows `.item-card-category` on service and product cards. CSS added in both `marketplace-social.html` and `negocio/index.html`
- **Gap 4 bonus: Image extraction fix** — `_buildStoreItemCards()` now handles both string URLs and `{url, thumbnail}` objects: `typeof item.images[0] === 'object' ? item.images[0].url : item.images[0]`
- **Explorar > Tiendas tab** — Added `u.handle` to `getProviders()` SELECT list (marketplace-api.js). Added "Tiendas" tab button in `explorar.html` (auto-discovered by `setupTabs()`). Added `loadTiendas()` method in `explore.js`: fetches `GET /api/marketplace/providers?limit=12`, renders 2-column grid of shop cards (avatar, business name, verified badge, rating, city, shop type pill), click navigates to `/negocio/{handle}`. Empty state + error state with retry. All data escaped with `_esc()` helper. Color: `#f59e0b` (amber/gold)
- **Security** — All user data escaped, `encodeURIComponent()` on handle in URLs, no `innerHTML` with raw data, profile image upload reuses existing validated endpoint, category JOINs use parameterized queries
- Cache: `marketplace-social.js?v=28.0`, `explore.js?v=1.1`, `.gz` regenerated for 3 JS files
- **GitHub repos synced** — `latanda-fintech` `e8c4a04` (1 file), `latanda-frontend` `a141078` (6 files), `la-tanda-web` `a333bca` (6 files)

### 2026-02-18 — OpenAPI Spec Expansion + CI Workflows Cleanup
- **OpenAPI spec expanded** — 123 paths (156 operations) → 220 paths (244 operations). Added ~101 new operations covering: WebAuthn (5), Recovery (5), Contributions (5), Social Feed (10), Groups (25), Invitations (3), Wallet security (3), Payments (3), Tandas (4), Lottery (10), Marketplace extras (6), Matching (4), Conversion (2), File serving (5), User extras (4), Referrals (3). All with proper request/response schemas, security requirements, and parameter definitions
- **CI workflows cleanup** — 4 broken workflows deleted: `latanda-fintech/ci-cd.yml` (wrong Node/PM2/deploy model), `la-tanda-web/deploy-staging.yml` (conflicts with Jekyll, hardcoded creds), `la-tanda-web/production-deploy.yml` (no secrets configured), `la-tanda-web/security-scan.yml` (disabled by GitHub inactivity). Broken `avatars` symlink removed from `la-tanda-web` git tracking, `.nojekyll` added to prevent Jekyll build issues
- **CI fixes blocked** — `latanda-fintech/ci.yml` (deploy stub removed, Node 18→20) and `la-tanda-web/ci-tests.yml` (component HTML exclusion) modified locally but can't push — `gh` OAuth token lacks `workflow` scope. Files at `/tmp/latanda-fintech/.github/workflows/ci.yml` and `/tmp/la-tanda-web/.github/workflows/ci-tests.yml`
- **GitHub repos synced** — `latanda-fintech` `9e3e36d` (openapi.json + ci-cd.yml deleted), `la-tanda-web` `ca81b0e` (openapi.json + 3 workflows deleted + .nojekyll + avatars symlink removed)

### 2026-02-18 (v4.7.0) — Deposits In-Memory DB → PostgreSQL (C6 Resolved)
- **C6 RESOLVED** — Deposits migrated from 3 in-memory arrays (`database.deposits`, `database.crypto_deposits`, `database.mobile_deposits`) persisted via `writeFileSync` to a proper PostgreSQL `deposits` table. Data was lost on crashes between saves; admin confirm flow updated `database.users[].balance` instead of `user_wallets`. Deferred since v4.1.0
- **`deposits` table** — Unified table for all 3 deposit types (bank_transfer, crypto, mobile_payment) with `type` column + CHECK constraint. Columns for bank fields, crypto fields, mobile fields, JSONB for instructions/receipt/status_history/modification_history/extension_history, admin fields, extension fields. 5 indexes (user_id, status, type, created_at DESC, reference_number). `user_id VARCHAR(50) REFERENCES users(user_id)`
- **11 db-postgres.js helpers** — `createDeposit()`, `getDepositById()`, `getDepositByIdAndUser()`, `updateDepositStatus()`, `getPendingDeposits()`, `updateDepositReceipt()`, `confirmDepositWithWalletCredit()`, `rejectDeposit()`, `cancelDeposit()`, `modifyDeposit()`, `extendDeposit()`. All follow existing patterns (explicit columns, no RETURNING *, parameterized queries)
- **`confirmDepositWithWalletCredit()` — transactional** — `BEGIN` → `SELECT FOR UPDATE` on deposit → UPDATE deposit status → `INSERT INTO user_wallets ON CONFLICT DO UPDATE` (credit balance) → `INSERT INTO wallet_transactions` → `COMMIT`. Atomically prevents double-credit. Fail returns `{ success: false, error }` without throwing
- **12 endpoints rewritten** — All `database.deposits` / `database.crypto_deposits` / `database.mobile_deposits` references replaced with PostgreSQL queries. All `saveDatabase()` calls removed from deposit handlers. Endpoints: create bank/crypto/mobile (3), upload-receipt (1), track (1), update-status (1), admin pending (1), admin confirm (1), admin reject (1), cancel (1), modify (1), extend (1)
- **TransactionStateManager refactored** — `updateTransactionState()` removed (was in-memory mutator referencing `database.deposits`). Kept `isValidTransition()` + `getStateDescription()` for validation only. State updates happen in db helper functions via `status_history || $1::jsonb`
- **Security fixes (7):**
  - **Admin confirm/reject IDOR** — `body.admin_id` → `authUser.userId` (was trusting client-provided admin identity)
  - **Track endpoint unauthenticated** — Added `requireAuth()` + ownership check via `getDepositByIdAndUser()` (anyone could query any deposit by ID)
  - **Upload-receipt IDOR** — `body.user_id` → `authUser.userId` from JWT (was trusting client-provided user_id in multipart form)
  - **Auth standardized** — All 12 endpoints now use `requireAuth()` (was `getAuthenticatedUser()` on 7 user-facing endpoints)
  - **Amount validation** — Added `parseFloat`/`Number.isFinite` checks on bank-transfer and mobile deposit amounts
  - **Input validation** — Added type checks for `account_number` and `phone_number` fields
  - **Admin endpoints** — Removed redundant admin session token checks (was double-auth: `requireAuth()` + manual session lookup)
- **Bug fixes:**
  - `sendDepositNotification()` — Fixed `deposit.parsedAmount` → `deposit.amount` (was throwing/undefined on all 3 notification types), added missing `receipt_uploaded` switch case
  - Cancel/modify/extend responses — Fixed undefined `user_id` variable → `authUser.userId`
  - Mobile deposit — Fixed duplicate SMS code generation (two different `crypto.randomInt()` calls), now generates once and reuses
  - Modify deposit — Fixed `old_reference` reading already-overwritten value
- **Cleanup** — `JSON_BACKUP_COLLECTIONS` no longer includes "deposits", `loadDatabase()` log no longer counts deposits, dead `getStatusSummary()` function removed, all `⚠️ DEPRECATED` comments removed from admin endpoints
- **Zero data migration needed** — All 3 arrays were empty (0 deposits in `database.json`)
- **Version** — API health returns `4.7.0`
- **GitHub repos synced** — `latanda-fintech` `eaa014b` (10 files, +7276/-2709), `latanda-frontend` `c2bcda3` (92 files, +8338/-10800), `la-tanda-web` `2844261` (302 files, +138242/-1444, hardcoded credentials cleaned)

### 2026-02-18 (v4.6.3) — Token Blacklist Enforcement (C3 Resolved)
- **C3 RESOLVED** — Logged-out/revoked JWT tokens now immediately rejected at the HTTP pipeline level. Previously, `blacklistToken()` stored tokens in Redis on logout/password-change, but `authenticateRequest()` never checked the blacklist (synchronous function, 104+ call sites). Revoked tokens remained valid until natural JWT expiry (24h)
- **Approach: Early pipeline check** — Single `await securityMiddleware.isTokenBlacklisted()` call added at the top of the main HTTP handler (line ~2393), after rate limiting and OPTIONS, before any route matching. Zero changes to `authenticateRequest()`, `requireAuth()`, or any of the 104+ call sites
- **Fail-open design** — If Redis is unavailable, the check silently skips (existing fail-open pattern). Public endpoints (no token) have zero overhead
- **Performance** — ~0.1ms per authenticated request (SHA256 hash + Redis GET on localhost)
- **OpenAPI spec updated (v4.6.3)** — `Unauthorized` response now covers 3 cases (missing, expired, revoked) with examples; 401 added to all 89 secured endpoints (was only 3); `BearerAuth` description mentions revocation; info block documents revocation behavior
- **GitHub repos synced** — `latanda-fintech` `0745646` (API code + openapi.json, stale YAML specs removed), `la-tanda-web` `4b4e9ed` (docs/swagger/openapi.json updated), `latanda-frontend` no changes

### 2026-02-17 (v4.6.2) — Swagger UI + OpenAPI Spec + Security Hardening
- **Swagger UI deployed** — Interactive API documentation at `https://latanda.online/docs/`, dark theme matching La Tanda aesthetic, `tryItOutEnabled: false`, filter/search by tag, JWT Authorize button
- **OpenAPI 3.0.3 spec** — 220 paths (244 operations) across 16 tags: Auth (24), User (25), Wallet (36), Groups (35), Tandas (9), Contributions (7), Social Feed (27), Marketplace-Services (23), Marketplace-Products (11), Marketplace-Providers (7), Marketplace-Portfolio (6), Marketplace-Bookings (4), Lottery (18), MIA AI (2), Notifications (3), Public (7). Component schemas: User, Provider, Service, Product, Group, Portfolio, Pagination, Deposit, SuccessResponse, ErrorResponse
- **Nginx static serving** — `location ^~ /docs` with `alias /var/www/docs`, rate limited (`zone=general burst=5 nodelay`), `X-Robots-Tag: noindex, nofollow`, security headers included. NOTE: `sites-enabled/latanda.online` is a separate file (NOT a symlink) — must update BOTH sites-available and sites-enabled
- **Security audit + fixes (4C, 6H):**
  - **C1** Personal email removed from spec → `dev@latanda.online`
  - **C2** Real user data replaced with generic examples (María López, Mi Negocio HN)
  - **C3** `/api/status` stripped — removed user count, pending alerts, uptime, DB type, services, environment. Now returns only: status, version, database.status, timestamp
  - **C4** `/api/users/search-mentions` — added `requireAuth()` (was fully unauthenticated, allowed user enumeration)
  - **H1** Rate limiting added to `/docs` nginx block
  - **H3** Fixed 4 spec-vs-reality auth mismatches: `/api/tandas`, `/api/tandas/available-positions`, `/api/referrals/apply`, `/api/link-preview` — all now correctly marked as `BearerAuth` in spec
  - **H4** `/api/mia/status` — removed `model` and `configured` fields (was leaking LLM provider/model name)
  - **H5** All 12 admin endpoints + Admin tag + AdminSession scheme removed from public spec
  - **H6** `persistAuthorization: false` — JWT tokens no longer persist in localStorage
- **GitHub repos synced** — `latanda-fintech` `e529fb1` (API security fixes), `la-tanda-web` `61343ac` (docs/swagger/ with CDN-based Swagger UI + openapi.json)

### 2026-02-14 (v4.4.0) — Mi Tienda: Crear y Configurar Tienda
- **"Mi Tienda" real system** — Replaced 100% mock store section (fake avatar "U", fake stats 23/4.8/156, fake sales chart) with dynamic system: onboarding flow for new sellers, real dashboard for existing sellers, edit modal for updating store info
- **Onboarding flow** — If user has no provider profile: shows creation form (business name, description, phone, WhatsApp, email, city, neighborhood, service areas, social links). Early Adopter banner with real-time progress bar (first 50 sellers participate in 1,000 LTD token raffle). Success screen shows seller number + raffle badge
- **Store Dashboard** — Real data from API: header with avatar/name/badges (Verified, Early Seller), 4-stat grid (rating, completed jobs, reviews, response rate), services list from `/providers/:id`, products list from `/products?sellerId=`, contact info section with social links
- **Edit Store Modal** — Pre-populated form with all fields, PUTs to `/api/marketplace/providers/me`, reloads dashboard on success
- **API: `PUT /api/marketplace/providers/me`** — New route for updating own provider profile. JWT-authenticated, validates business_name (max 255), description (max 2000). Uses `authResult.user.userId` exclusively (no IDOR)
- **API: `social_links` in `updateProvider()`** — Added JSONB field to update query with sanitization: allowlisted keys (github, linkedin, website, facebook, instagram, twitter), URL protocol validation, length cap 500
- **API: `registerProvider()` improvements** — Added `social_links` support at creation, input validation (business_name required, length caps), status defaults to `'active'` (was `'pending'`)
- **Token key fix** — 3 inline `localStorage.getItem('latanda_token')` → `auth_token || authToken` in marketplace-social.html (checkProviderStatus, provider registration, service creation)
- **CSS** — ~80 lines added: `.store-onboarding`, `.early-adopter-banner`, `.early-adopter-progress`, `.store-success`, `.store-dashboard`, `.store-header`, `.store-stats-grid`, `.store-section`, `.store-edit-overlay/.store-edit-modal`, `.store-contact-grid`, responsive breakpoints
- **JS** — 5 new methods: `loadMyStore()`, `renderStoreOnboarding()`, `renderStoreDashboard()`, `openEditStoreModal()`. 5 new `data-action` cases: `edit-store`, `close-edit-store`, `view-my-store`, `add-service`, `add-product`. All data escaped with `escapeHtml()`, no inline `onclick`, generic error messages
- **Security** — All provider data escaped, no `body.user_id`, social_links validated (allowlisted keys, URL protocol, length cap), no `error.message` to UI
- Cache: `marketplace-social.js?v=27.3`, `.gz` regenerated for 3 files

### 2026-02-13 — GitHub Repos Sync & PR Review
- **PR #29 Review** — TypeScript SDK by `Rajkoli145` (`feat/typescript-sdk` branch). 3rd round of changes requested. ~27/35 endpoints incorrect (contributor guessed paths without server access). Posted detailed comment with complete correct endpoint mapping table (~237 production endpoints verified). Lottery module entirely wrong concept (SDK assumes tanda draw system, actual is Honduras national lottery predictor). Contributor is a student at ISU India, responsive but overclaims alignment. Path: external contributor → SDK maintainer if next PR is clean.
- **Repo Sync to v4.3.1** — All 3 GitHub repos updated from v3.95.0:
  - `latanda-fintech` (private): 7 backend files (+811, -455) — `712e2fa`
  - `latanda-frontend` (private): 91 files, 5 deletions (+1,282, -8,639) — `0e1e2cf`
  - `la-tanda-web` (public): 22 frontend files (+35,440, -14,120) — `e8d2b31`
- **Credential Cleanup** — 32 files in `la-tanda-web` public repo: `Admin123!` removed from 16 files, `demo@latanda.online` → `user@example.com` in 31 files, `demo123` removed, hardcoded admin login block deleted from `api-proxy-enhanced.js` — `f9687e1`

### 2026-02-12 (v4.3.1) — Mobile Video Playback & Fullscreen Fix
- **Video Lightbox/Fullscreen** — Videos now open in lightbox (previously filtered out), `<video>` element added to lightbox with controls, `updateLightboxImage()` detects video URLs and swaps `<img>`/`<video>`, `closeLightbox()` pauses and clears video
- **Single Video Playback** — Only one feed video plays at a time; starting a video auto-pauses all others via delegated `play` event listener
- **Auto-Pause on Scroll** — `IntersectionObserver` (threshold 0.25) watches feed videos, pauses them when scrolled out of view
- **Playback Performance** — Feed videos changed from `preload="metadata"` → `preload="auto"` for ahead buffering; compose preview also uses `preload="auto"`
- **Mobile Camera Optimization** — Resolution lowered to 640x480 on mobile (was 1280x720), VP8 codec preferred over VP9 (faster encoding), bitrate capped at 1.5 Mbps mobile / 2.5 Mbps desktop
- **Mobile Video CSS** — Portrait max-height increased from 280px → 70vh, landscape mode (`@media orientation: landscape`) gives 90vh max-height, lightbox video gets full viewport with `object-fit: contain`
- **Lightbox video→video fix** — `video.pause()` added before src change when navigating between videos; `videoVisibilityObserver` cleanup added to `destroy()`
- **home-dashboard.html C1** — Broken mobile nav HTML fixed: unclosed `<a>` tag for "Inicio" + duplicate `moreMenuDropdown` block removed (duplicate ID)
- **home-dashboard.html C2** — `updateSidebarHubCards()` auth token key fixed: `authToken` → `auth_token || authToken` (sidebar data was never loading)
- **home-dashboard.html C3** — Orphaned CSS properties removed (lines ~1087-1089 outside selector block), extra `}` closing media query prematurely removed
- **social-feed.js C4/C5** — 8 `event.id` data-attributes + `actor.id` + `event.event_type` + `meta.members` now escaped with `escapeHtml(String(...))` in `renderEventCard()`
- **H4 ID type mismatch** — All `e.id === eventId` comparisons → `String(e.id) === eventId` (6 locations: delete, edit, find, share, poll, isOwnPost). Delete/edit now work correctly
- **H5 Like/bookmark debounce** — `button.disabled` flag prevents rapid double-click on like and bookmark buttons (disabled during fetch, re-enabled in `finally`)
- **H6 loadEvents HTTP check** — `if (!response.ok) throw` before `response.json()` prevents crash on 401/500 HTML responses
- **H7 renderError onclick** — Inline `onclick="SocialFeed.loadEvents(true)"` → `data-action="retry-feed"` with `addEventListener`
- **H8 home-dashboard onclick elimination** — All 20 inline `onclick=` handlers converted to `data-action` attributes with single delegated `document.addEventListener("click")` handler (sidebar nav, mobile drawer, FAB, bottom nav, follow buttons, lottery modal)
- **H9 innerHTML → textContent** — `getInitials(user.name)` now uses `createElement`/`textContent`; `balance.toFixed(2)` uses `createTextNode` + `createElement('small')`
- **H10 PWA theme-color** — Added `<meta name="theme-color" content="#0f172a">`
- **H11 Stylesheet in head** — `shared-components.css` moved from `<body>` to `<head>` (prevents FOUC)
- **H12 Dead CSS selector** — Removed `video:not([paused])` (DOM property, not HTML attribute — never matched)
- **H13 Focus-visible** — Added `:focus-visible { outline: 2px solid #00FFFF }` for 12 interactive element selectors
- **H14 transition: all** — All 24 `transition: all` instances replaced with specific properties (`color, background, opacity, transform`)
- **H15 Safari backdrop-filter** — Added `-webkit-backdrop-filter` prefix to 4 missing locations (`.compose-image-remove`, `.post-edit-modal-overlay`, `.compose-image-menu`, `.compose-media-menu`)
- **H16 Cache busting** — Added `?v=1` to `real-time-api-integration.js`, `dashboard-integration-fix.js`, `network-switcher.js`
- **Feed Search** — Sidebar search bar now filters feed by text (server-side `ILIKE` on title/description/actor_name). API: `GET /api/feed/social?search=term`. Frontend: debounced input (500ms) + Enter key, cyan filter bar with clear button, `setupSearch()` in social-feed.js. Inline `onkeypress` removed from search input
- **M1 updateImageButton() fix** — `composeImageBtn` → `composeMediaBtn` (wrong element ID, function was a no-op)
- **M2 Mention search debounce** — `searchMentions()` now debounced 200ms (was firing API call per keystroke after `@`)
- **M3 Camera modal listener stacking** — `modal.addEventListener("click")` → `modal.onclick` (prevented stacking on repeated opens)
- **M4 Sticky hover on touch** — `.social-card:hover` and `.feed-tab:hover` wrapped in `@media (hover: hover)` (prevents sticky transform on mobile)
- **M5 Landscape threshold** — Video landscape media query `max-height: 500px` → `700px` (covers more phone landscape heights)
- **M6 Duplicate CSS blocks** — Removed duplicate `.event-media` block (lines 241-253, overridden by 859), merged `background` into surviving block. Merged two duplicate `@media (max-width: 768px)` compose blocks into one
- **M7 Feed tab touch target** — Added `min-height: 44px; box-sizing: border-box` to `.feed-tab` (was ~34px, below WCAG 44px minimum)
- **M8 Duplicate keyframes** — Removed 2 duplicate `@keyframes pulse` (kept last definition), renamed second `@keyframes float` → `floatOrb` for gradient orbs (was overriding body::after animation)
- **M9 Invalid CSS comment** — `// transform: translateY(-2px)` → `/* ... */` in `.wallet-connect:hover`
- **M11 ARIA attributes** — Added `role="button"` + `aria-expanded` + `aria-controls` to more-menu toggle, `role="menu"` to dropdown, `aria-label` to search input/FAB/mobile nav buttons, `role="navigation"` to bottom nav. `toggleMoreMenu()`/`closeMoreMenu()` sync `aria-expanded`
- **M12 Empty catch blocks** — 3 empty `catch(error){}` blocks now have descriptive comments (mining status, dashboard init, sidebar data)
- Cache: `social-feed.js?v=11.8`, `social-feed.css?v=11.7`

### 2026-02-12 (v4.3.0)
- **Platform Audit Round 28** — 50+ fixes (4C, 10H, 15M, 5L) across API, db-postgres, mia-api, frontend, infrastructure
- **4 CRITICAL API** — SQL injection via dynamic column names in db-postgres.js (4 update functions got column allowlists + quoting), update-pg IDOR (any user could update any group — admin/coordinator auth check added), 9x RETURNING * eliminated in db-postgres.js (all explicit columns now), email verification timing attack (safeCompare)
- **10 HIGH** — MIA chat no auth (JWT required now), MIA input length uncapped (2000 char limit), PIN threshold used string `amount` instead of `parsedAmount`, auto-assign used body.coordinator_id (IDOR → authUser.userId), notificaciones.html XSS (5 notification fields unescaped in innerHTML), mi-perfil.html XSS (activities + achievements), user-sync.js missing auth headers, tigo-money.js wrong token key, group/index.html wrong token key, mensajes.js XSS (conv.name + lastMessage unescaped)
- **15 MEDIUM** — Admin 2FA status/disable no requireAdminSession, lottery-predictor duplicate DB pool (5 wasted connections → shared pool), MIA status leaked model name + API key status, system status leaked uptime/memory, conversationHistory role injection (only user/assistant now), creator-hub.js XSS, popup-manager.js innerHTML, module-cards.js XSS, configuracion.html showNotification XSS, hub-api-connector.js missing encodeURIComponent, tigo-money.js hardcoded sandbox creds, tigo-money.js infinite recursion, api-client.js missing auth header, 119 console.log stripped from 10 files, SELECT gi.* → explicit
- **Additional Infra** — PUBLIC backup archive moved from webroot (83KB tar.gz was downloadable!), logs dir 777→750, global PG statement_timeout=60s, stale PG roles (n8n, motoshop) dropped, guardados.js + trabajo.js render XSS escaped
- **Infra cleanup** — Orphaned pm2 logs killed (54MB), motoshop .next/ deleted (425MB), motoshop cert deleted, n8n + motoshop_prod DBs dropped (backed up), 92 old log files cleaned, pg-node .env locked
- Zero RETURNING * in db-postgres.js, zero SELECT alias.*
- Deferred: database.json migration, PasarGuard Xray container (hosting provider)
- C3 token blacklist enforcement: **RESOLVED** (v4.6.3) — early pipeline check, no async refactor needed

### 2026-02-11 (v4.2.0)
- **Platform Audit Round 27** — 47 fixes (5C, 12H, 18M, 12L) across marketplace-api.js, main API, frontend JS, infrastructure
- **5 CRITICAL** — 2 SQL injections in marketplace-api.js (updateBookingStatus notes, getBookings status — string interpolation in SQL), stock oversell race (createProductOrder no FOR UPDATE), debitLTDTokens race (no transaction), creditLTDTokens race (no transaction)
- **12 HIGH** — 17x RETURNING * eliminated in marketplace-api.js, 12x SELECT alias.* replaced with explicit columns, requestPayout race condition (no transaction, no commission_status update), u.phone exposed on public product endpoint, createProduct + createService zero input validation, 5x SELECT gm.*/cd.*/gi.*/c.* in main API, auth token key mismatch (wallet-dropdown.js, mobile-drawer.js used `authToken` instead of `auth_token`), dashboard-sections-loader.js compose avatar XSS, marketplace-social.js conversation item XSS, explore.js external API data as innerHTML
- **18 MEDIUM** — marketplace deleteImageFile path traversal guard, referral_commission_percent capped 0-20, self-purchase blocked, app_sessions bounded (cap 1000), db-unified.js 4 console removed, onboarding error message XSS, URL param user_id fallback removed (2 files), 13 console.log stripped from 6 frontend files, port 62050 blocked (UFW), telegraf-bridge disabled, stale webroot backup moved, pg_dump added to backup script, stale certs deleted, nginx /app/ recursive location fixed, Docker cleanup (n8n image + postgres:13 container + volumes = 1.4 GB freed), 5 empty duplicate lottery tables dropped
- **12 LOW** — raybanks www redirect fixed, sidebar/index.js auth key fixed, Docker volume prune, stale PM2 logs cleaned, .gz regenerated for 3 modified JS files
- marketplace-api.js: Version 4.2.0, zero RETURNING *, zero SELECT alias.*, 9 FOR UPDATE locks, 5 transactions
- Disk freed: ~1.4 GB (Docker images + volumes + stale backups)

### 2026-02-11 (v4.1.0)
- **Platform Audit Round 26** — 18 fixes (3C, 5H, 7M, 3L) across API, Frontend, Infrastructure
- **3 CRITICAL API** — Tanda non-wallet payment unlimited contributions (duplicate check added + payment_method whitelist), token conversion TOCTOU race (wrapped in FOR UPDATE transaction), group creation IDOR (body.createdBy → authUser.userId, eliminated 2,866-char user resolution block)
- **5 HIGH** — Social feed image_url no validation (protocol whitelist: /uploads/ or https://), search-to-invite leaked full email (removed from response), mention search matched on email prefix (removed SPLIT_PART search vector from 3 queries), payout notification undefined variables fixed (autoApproved, payoutRequest), admin-payouts.js missing Authorization headers (added to all 5 fetch calls)
- **2 CRITICAL Frontend** — admin-panel-v2.html (42 user data interpolations escaped, isValidToken permissive→JWT-only, error.message removed from innerHTML, 130 console stripped), admin-kyc-review.html (8 user data escaped, error.message replaced, onclick→data-attribute, 5 console stripped)
- **2 HIGH Frontend** — admin-payouts.js (10 bank data escaped, 3 copyToClipboard onclick→data-attributes, 3 action onclick→data-attributes, delegated listener, 8 console stripped), admin-audit-logs-viewer.html (5 log data escaped + JSON.stringify details, 2 console stripped)
- **1 HIGH Frontend** — my-wallet.html isValidToken permissive→JWT-only (dev/demo tokens removed)
- **Infrastructure** — ngrok-latanda-ecosystem service disabled (was crash-looping), version 4.1.0
- **Deferred** — marketplace-api.js (17x RETURNING *, stock oversell race, commission payout race, createProduct validation), deposit in-memory DB migration, admin deposit body.admin_id
- .gz regenerated for 5 modified files

### 2026-02-11 (v4.0.0)
- **Platform Audit Round 25** — 38 fixes (8C, 12H, 13M, 5L) across API, Frontend, Infrastructure
- **3 CRITICAL API** — Mobile withdrawal race condition (FOR UPDATE), crypto withdrawal race condition (FOR UPDATE), mining claim double-spend (cooldown check moved inside transaction)
- **4 HIGH API** — Onboarding reward double-claim (transaction re-check), mobile/crypto amount validation (parseFloat/isNaN/isFinite/100K cap + string type checks), business analytics missing admin check, performance dashboard missing admin check
- **2 CRITICAL Infra** — Docker cleanup 4.8 GB freed (17→3 images), motoshop hardcoded secrets in ecosystem.config.js removed
- **3 HIGH Infra** — raybanks.org full security headers (HSTS, CSP, Permissions-Policy), stale node_modules 1.34 GB freed, duplicate X-Frame-Options in admin nginx block removed
- **CRITICAL Frontend** — marketplace-social.js (js/ copy): escapeHtml + 33 escapes + all onclick→data-attributes + delegated listener + 22 console stripped
- **Frontend XSS** — payout-frontend.js (bank data escaped), groups-advanced-system-integration.js (group data escaped), dashboard-sections-loader.js (avatar/activity data escaped), guardados.js + trabajo.js (search query XSS fixed), popup-manager.js (textContent)
- **Cleanup** — web3-dashboard.js + commission-system.js orphans moved to backups, 2 stale PG roles + 1 empty DB dropped, 121 temp scripts cleaned, PM2 restarts reset, 232 MB stale files moved, journald capped 500M/7d
- **Disk:** 30 GB → 21 GB (22% of 96 GB)
- Cache: `marketplace-social.js?v=27.1`, `payout-frontend.js?v=1.1`, `groups-advanced-system-integration.js?v=1.2.0`, `dashboard-sections-loader.js?v=14.1`, `guardados.js?v=1.1`, `trabajo.js?v=1.1`

### 2026-02-11 (v3.99.0)
- **Platform Audit Round 24** — 22 fixes (6C, 6H, 7M, 3L)
- **3 INFRA CRITICAL** — 2 cron files with hardcoded `latanda-cron-2026` secret (payment-check + recruitment-reminders silently failing daily, fixed to source from .env), live Groq API key in dead api.latanda.online .env (project archived to /root/backups/), world-writable /var/www/claude-access/ 777 (fixed to 700)
- **3 API CRITICAL** — Withdrawal race condition (bank: balance check + INSERT without transaction, fixed with BEGIN/FOR UPDATE/COMMIT), missing auth on /api/analytics/:userId (financial data exposed, added JWT + ownership check), IDOR in /api/matching/preferences POST (body.user_id → authUser.userId)
- **4 FRONTEND CRITICAL** — groups-advanced-system.html zero escapeHtml (15,597 lines, 92 innerHTML: added escapeHtml + escaped group.name/description/category/location/alert.message/request data, showError/showToast now escape, 250 console stripped), member-management-frontend.js zero escapeHtml (member names/emails/onclick injection fixed, 17 console stripped), shared-components.js search XSS (query+results+error.message, 9 console stripped), create-group-form-handler-v2.js formData in innerHTML (10 console stripped)
- **6 HIGH** — Missing auth on /api/invitations/:userId + /api/matching/preferences/:userId GET, withdrawal amount not validated as number (added parseFloat+isNaN+isFinite+cap 100K), withdrawal string fields unsanitized (type checks + length caps), admin deposit confirm body.admin_id (→ session identity), disputes-frontend.js groupName XSS (6 console stripped)
- **7 MEDIUM** — address_type whitelist validation (bank/mobile/crypto only), wallet-dropdown.js tx.hash/token/status unescaped (escaped + onclick→data-attribute), journald unbounded 1.2GB (limited 500M/7d), ssl_prefer_server_ciphers conflict (nginx.conf → certbot managed), elena-backend archived (saved 24MB + live secrets), version bump 3.99.0, cache bumps
- **3 LOW** — .gz regenerated for 6 modified files, shared-components.js v7.18, groups-advanced cache bumps
- Cache: `shared-components.js?v=7.18`, `member-management-frontend.js?v=11.8`, `create-group-form-handler-v2.js?v=20260211001`, `disputes-frontend.js?v=1.0`

### 2026-02-11 (v3.98.0)
- **Platform Audit Round 23** — 11 fixes (1C, 1H, 5M, 4L)
- **1 CRITICAL** — my-wallet.js stored XSS: zero escapeHtml() in 11,745-line file. admin_message raw in innerHTML (line 1370), JSON.stringify(transaction) in onclick attribute (line 1676). Added escapeHtml(), escaped admin_message in 3 locations, converted ALL 24 onclick handlers with transaction.id to data-attributes with delegated event listener. 272 console.log/warn/error stripped.
- **1 HIGH** — Legacy .env files world-readable (644) at elena-backend, api.latanda.online, smart-contracts — 14 secrets exposed. Permissions fixed to 600.
- **5 MEDIUM** — Kernel send_redirects=1 (ICMP redirects enabled, fixed to 0 with sysctl persistence), Klipy GIF URL validation (safeGifUrl validates HTTPS protocol on external API responses), notification-center.js group_id not URL-encoded (added encodeURIComponent), service-worker.js dead code removed (239 lines, never registered — moved to backups), version bump to 3.98.0
- **4 LOW** — Header/sidebar JS 10 console.warn/error stripped (5 files), cache bumps (my-wallet.js v20260211001, notification-center.js v2.7), .gz regenerated for 7 modified JS files, sysctl hardening persisted in /etc/sysctl.d/99-latanda-hardening.conf
- Cache: `my-wallet.js?v=20260211001`, `notification-center.js?v=2.7`

### 2026-02-11 (v3.97.0)
- **Platform Audit Round 22** — 13 fixes (1C, 2H, 4M, 6L)
- **1 CRITICAL** — marketplace-social.js stored XSS: zero escapeHtml(), 41 innerHTML with raw user data (chat messages, product titles, usernames). Added escapeHtml() + escaped 75 interpolations. All inline onclick handlers (20+) converted to data-attributes with delegated event listener. 44 console.log/warn/error stripped. Error.message eliminated from innerHTML (4 locations).
- **2 HIGH** — wallet-dropdown.js showError() XSS (message unescaped in innerHTML, added escapeHtml()), marketplace-social.js contactSeller onclick had 4 user-controlled values in inline JS context (converted to data-attributes)
- **4 MEDIUM** — API timing attack on session token comparison line 19033 (`===` → `safeCompare()`), SSH hardening (PermitRootLogin prohibit-password, X11Forwarding no, PasswordAuthentication no), getTag() regex injection defense-in-depth (escape prop before RegExp construction), unified-feed.js dead code removed from components-loader.js + deleted from disk
- **6 LOW** — n8n CREATEDB revoked, latanda_app CONNECTION LIMIT 30, n8n CONNECTION LIMIT 20, version bump 3.97.0, marketplace-social.js cache bump v27.0, .gz regenerated for 2 modified JS files
- Cache: `marketplace-social.js?v=27.0`

### 2026-02-11 (v3.96.0)
- **Platform Audit Round 21** — 16 fixes (1C, 4H, 8M, 3L)
- **1 CRITICAL** — PasarGuard blockchain node port 62050 publicly accessible via UFW (rule removed, container continues internally)
- **4 HIGH** — Group creation array DoS (rules capped 50, coordinators 10), transfer-ownership type injection (new_owner_id string validation), unsafe onclick in contextual-widgets.js (converted to data-attribute + delegated listener), actionUrl domain bypass in contextual-alerts.js (`startsWith("https://latanda.online")` → `new URL().origin` comparison + `//` check)
- **8 MEDIUM** — Payout notes uncapped (sliced to 1000 chars), reorder-turns element validation (user_id type, position range, num_positions 1-50, array cap 500), 3 uncapped pagination endpoints → `Math.min(..., 100)`, 21 console.log/warn/error stripped from 5 component files, avatar URL protocol validation in sidebar-widgets.js (only `https://` or `/uploads/`), OCSP stapling warning removed (cert lacks OCSP URL), raybanks.org duplicate `ipv6only=on` removed, version bump to 3.96.0
- **3 LOW** — insights-engine.js color length check before regex, cache bumps (contextual-widgets/sidebar-widgets v1770829609, contextual-alerts/insights-engine v1.03, notification-center v2.6), .gz regenerated for 9 modified JS files
- Cache: `contextual-widgets.js?v=1770829609`, `sidebar-widgets.js?v=1770829609`, `notification-center.js?v=2.6`

### 2026-02-11 (v3.95.0)
- **Platform Audit Round 20** — 17 fixes (3C, 5H, 6M, 3L)
- **3 CRITICAL** — XSS in notification-center.js (unescaped title/message/id in innerHTML), open redirect in sw.js push notificationclick (arbitrary URL from payload), dead MIA stub endpoints (6 unauthenticated/IDOR stubs using in-memory DB deleted ~164 lines)
- **5 HIGH** — Sync endpoint crash (`.map()` on undefined DoS), path traversal defense-in-depth (`path.resolve()` on proof/receipt serving), push notification URL validation on API side, `notifications=(self)` in Permissions-Policy, 22 stale nginx configs moved to backups
- **6 MEDIUM** — Toast XSS (unescaped title/message), CSS injection via color in insights-engine.js (hex validation), console.log stripped from pwa-manager.js, dead MIA capabilities/feedback stubs (deleted with C3), version bump to 3.95.0, push subscribe rate limit (login zone)
- **3 LOW** — notification-center.js cache bump v2.4→v2.5, SW version bump for re-registration, .gz regeneration for 4 modified JS files
- Cache: `notification-center.js?v=2.5`, `sw.js?v=1770768001`

### 2026-02-10 (v3.94.0)
- **Platform Audit Round 19 (FINAL)** — 41 fixes applied (12C, 17H, 12M)
- **Video Upload Fixes** — Extension whitelist expanded (.mov/.avi/.mkv), media_type:video in metadata, upload progress bar with XHR
- **12 CRITICAL** — Nested functions broke safeCompare/toMoney/validatePassword (733 errors), hardcoded cron key (lotteries broken), mining column mismatch, reorder-turns no auth, activate-tanda IDOR, verify-email non-JWT, MIA XSS, contextual-alerts XSS, insights-engine XSS, media URLs unescaped, permissive token validation, eval() in admin dashboard
- **17 HIGH** — escapeHtml quote escaping in 4 files, avatar/time_ago XSS, dead unified-feed.js removed, MIA auth header, onerror regression, 3 unauthenticated endpoints, GET /api/tandas IDOR, source maps blocked, appendFileSync removed, .htpasswd perms, inline CSP conflict, stats.html removed, cache versions unified, 4 redundant indexes dropped
- **12 MEDIUM** — Version 3.94.0, motoshop nginx disabled, 2 orphan pages moved, UUID/VARCHAR mismatch fixed, 3 financial CHECK constraints, 2 performance indexes, users.role CHECK, sidebar onclick injection
- Cache: `social-feed.js?v=11.5`, `social-feed.css?v=11.4`

> **Older changes (v3.65.0–v3.93.0):** See `/home/ebanksnigel/CHANGELOG-OLD.md`
> **Full changelog:** See `/home/ebanksnigel/CHANGELOG.md`

---

## Cache Locations (IMPORTANT)

### social-feed.css (8 locations)
| File | Current |
|------|---------|
| All HTML files + `components-loader.js` | `v=11.7` |

### social-feed.js (2 locations)
| File | Current |
|------|---------|
| `home-dashboard.html` + `components-loader.js` | `v=11.9` |

### components-loader.js (31 HTML files)
| File | Current |
|------|---------|
| All 31 HTML files that use it | `v=30.2` |

### contextual-widgets (8 HTML files)
| File | Current |
|------|---------|
| All HTML files | `v=1770829609` |

### sidebar-widgets (8 HTML files)
| File | Current |
|------|---------|
| All HTML files | `v=1770829609` |

### marketplace-social.js (1 location)
| File | Current |
|------|---------|
| `marketplace-social.html` | `v=29.0` |

### explore.js (1 location)
| File | Current |
|------|---------|
| `explorar.html` | `v=1.1` |

### groups-page.css (1 location)
| File | Current |
|------|---------|
| `groups-advanced-system.html` | `v=2.2` |

### Service Workers
| File | Version |
|------|---------|
| `service-worker.js` | `7.55.0` |
| `sw.js` | Workbox precache (update revision hashes when HTML changes) |

### Quick Update Command
```bash
ssh root@168.231.67.201 "
  sed -i 's|social-feed.css?v=OLD|social-feed.css?v=NEW|g' /var/www/html/main/*.html /var/www/html/main/js/components-loader.js
  sed -i 's|social-feed.js?v=OLD|social-feed.js?v=NEW|g' /var/www/html/main/home-dashboard.html /var/www/html/main/js/components-loader.js
"
```

---

## Key Files

### Layout Files
- CSS: `dashboard-layout.css`, `mobile-drawer.css`, `edge-swipe.css`
- JS: `social-feed.js`, `comments-modal.js`, `mobile-drawer.js`, `edge-swipe.js`
- Sidebar: `contextual-widgets.js`, `contextual-widgets.css`, `sidebar-widgets.js`

### Pages
- `home-dashboard.html`, `explorar.html`, `trabajo.html`, `creator-hub.html`
- `guardados.html`, `mensajes.html`, `mia.html`, `mineria.html`

### MIA AI
- Backend: `mia-api.js`, `mia-knowledge-base.js`
- API: `POST /api/mia/chat`, `GET /api/mia/status`
- Model: Groq Llama 3.3 70B

---

## Documentation

| Doc | Location |
|-----|----------|
| Full Changelog | `/home/ebanksnigel/CHANGELOG.md` |
| Architecture | `/var/www/latanda.online/FULL-STACK-ARCHITECTURE.md` |
| API Docs (Swagger UI) | https://latanda.online/docs |
| OpenAPI Spec | `/var/www/docs/openapi.json` (source also at `/tmp/openapi.json`) |

---

*Always: backup before changes, read before editing, test before deploying*
