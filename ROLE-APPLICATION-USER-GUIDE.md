# Role Application User Guide

## Purpose
`role-system.html` lets users:
- Review all role levels (1 to 8)
- Apply for eligible elevated roles
- Track application status in real time
- Reapply after rejection cooldown

## User Flow
1. Open `/role-system.html` from dashboard menu (`Mas -> Sistema de Roles`).
2. Review role cards and requirements.
3. Select an application-enabled role.
4. Enter a reason with at least 100 characters.
5. Click `Verificar elegibilidad`.
6. Submit with `Enviar aplicacion`.
7. Monitor status updates in the `Estado de Aplicaciones` panel.

## Status Meanings
- `Pendiente`: waiting for admin review
- `En revision`: currently being reviewed
- `En espera`: deferred/hold
- `Aprobada`: accepted
- `Rechazada`: denied (reapply enabled after 30 days)

## Notifications
- Immediate toast notification after submit
- Toast notification when application status changes
- Dashboard badge sync via localStorage (`lt_role_app_badge_count`)
- Best-effort email trigger call on status change (`/api/roles/notifications/email`)

## API Endpoints Used
- `GET /api/roles/requirements`
- `POST /api/roles/apply`
- `GET /api/roles/applications`
- `POST /api/roles/check-upgrade`
- `POST /api/roles/notifications/email` (best-effort)

## Auth
Uses token from localStorage in this order:
- `auth_token`
- `latanda_auth_token`

If token is missing, page still renders role definitions but protected requests can fail.

## Dashboard Badge Integration
- Dashboard adds `Sistema de Roles` entry in the more menu.
- Badge script: `js/role-application-badge.js`
- Badge updates via:
  - storage key: `lt_role_app_badge_count`
  - custom event: `lt-role-app-badge`

## Accessibility and Mobile
- Form labels and `aria-live` regions for status/toasts
- Keyboard-friendly controls
- Responsive layout for mobile widths (320px+)

