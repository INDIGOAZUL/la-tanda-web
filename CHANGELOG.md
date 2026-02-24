# Changelog - La Tanda Platform

Todos los cambios notables en producción serán documentados aquí.

## [1.2.0] - 2025-12-10

### 🔐 Seguridad - Autenticación JWT
- **NUEVO**: Sistema de autenticación JWT real (jsonwebtoken)
- **NUEVO**: Tokens de acceso con expiración de 24 horas
- **NUEVO**: Refresh tokens con expiración de 7 días
- **NUEVO**: Funciones `generateAuthToken()`, `generateRefreshToken()`, `verifyAuthToken()`
- **NUEVO**: Endpoint `/api/auth/refresh` mejorado con validación real
- **MEJORADO**: Login ahora devuelve JWT real en lugar de IDs aleatorios
- **MEJORADO**: Respuestas incluyen `refresh_token` y `expires_in: 86400`

### 💰 Balance y Wallet
- **CORREGIDO**: API `/api/wallet/balance` ahora usa PostgreSQL real
- **CORREGIDO**: Eliminado doble anidamiento en respuesta (era `data.data.balance`)
- **CORREGIDO**: Balance muestra contribuciones reales (1500 HNL) en lugar de 0
- **CORREGIDO**: `dashboard-sections-loader.js` - función `normalizeApiData()` mejorada
- **CORREGIDO**: Carousel y profile ahora muestran balance real
- **AGREGADO**: Campos `balance.available` y `savings.total` en normalización

### 📊 Dashboard y UI
- **CORREGIDO**: `#carouselBalance`, `#carouselSavings`, `#profileBalance` muestran datos reales
- **CORREGIDO**: Error de sintaxis en `home-dashboard.html` línea 2945 (faltaba `function uploadAvatar()`)
- **CORREGIDO**: Error `Cannot read properties of null (reading 'contains')` línea 3945
- **CORREGIDO**: HeaderSync ahora muestra balance 1500 correctamente

### 🔄 Transacciones
- **CORREGIDO**: Endpoint `/api/wallet/transactions` migrado a PostgreSQL
- **CORREGIDO**: Devuelve 22 transacciones reales de la tabla `contributions`

### 👤 Perfil y Roles
- **AGREGADO**: Columna `role` en tabla `users` (VARCHAR(20), default 'user')
- **MEJORADO**: `/api/user/profile` incluye campo `role`
- **MEJORADO**: Login response incluye `user.role`
- **MEJORADO**: `getUserByEmail()` en db-postgres.js incluye `role`

### 🛡️ Protección Admin
- **NUEVO**: Script `/js/admin-guard.js` para proteger páginas admin
- **PROTEGIDAS**: 5 páginas admin requieren rol 'admin':
  - admin-audit-logs-viewer.html
  - admin-kyc-review.html
  - admin-panel-v2.html
  - admin-portal.html
  - admin-realtime-dashboard.html

### 📝 Notificaciones
- **VERIFICADO**: Ya usaba PostgreSQL (`notificationsUtils.getNotifications`)
- **CONFIRMADO**: 7 notificaciones reales en base de datos

---

## [1.1.0] - 2025-12-09 (Sesión anterior)

### 🔧 Sincronización
- **CORREGIDO**: 76+ archivos con URL incorrecta (`api.latanda.online` → `latanda.online`)
- **MEJORADO**: `header/sync.js` v1.2 usando `LaTandaUser.getId()`
- **CORREGIDO**: Orden de carga de scripts en `home-dashboard.html`
- **CAMBIADO**: Endpoint `/health` → `/api/system/status`

### 📄 Perfil
- **REESCRITO**: `mi-perfil.html` completo con 5 tabs
- **UNIFICADO**: Uso de `latanda_user` como key principal en localStorage

---

## [1.0.0] - Pre-2025-12-09

### Estado inicial
- Plataforma La Tanda fintech funcionando
- API con 95 endpoints
- PostgreSQL + Redis
- PM2 para gestión de procesos
- Nginx como reverse proxy

---

## Archivos Principales Modificados

### Backend (/var/www/latanda.online/)
- `integrated-api-complete-95-endpoints.js` - API principal
- `db-postgres.js` - Funciones de base de datos
- `db-unified.js` - Capa de abstracción DB

### Frontend (/var/www/html/main/)
- `home-dashboard.html` - Dashboard principal
- `js/dashboard-sections-loader.js` - Cargador de datos
- `js/header/sync.js` - Sincronización de header
- `js/admin-guard.js` - Protección de admin (NUEVO)
- `js/user-sync.js` - Gestión de usuario

---

## Notas de Producción

### Credenciales actualizadas
- Usuario admin: ebanksnigel@gmail.com
- Password: Admin12345 (cambiado 2025-12-10)
- JWT_SECRET: latanda-secure-key-change-in-production-2024

### Comandos útiles
```bash
# Reiniciar API
pm2 restart 0

# Ver logs
pm2 logs 0 --lines 50

# Verificar sintaxis antes de deploy
node --check integrated-api-complete-95-endpoints.js

# Backup antes de cambios
cp file.js file.js.backup-20251210-103942
```

## [1.2.1] - 2025-12-10

### 📋 Audit Logging
- **NUEVO**: Tabla `audit_logs` en PostgreSQL
- **NUEVO**: Funciones `auditLog()` y `getClientInfo()`
- **NUEVO**: Logging de LOGIN_SUCCESS con IP y user agent
- **NUEVO**: Logging de LOGIN_FAILED (user not found, wrong password)
- **NUEVO**: Logging de USER_REGISTERED
- **NUEVO**: Logging de PROFILE_UPDATED
- **NUEVO**: Logging de CONTRIBUTION_CREATED

### Estructura audit_logs
```sql
- id (UUID)
- timestamp
- user_id, user_email
- action (LOGIN_SUCCESS, LOGIN_FAILED, etc.)
- resource, resource_id
- details (JSONB)
- ip_address, user_agent
- status (success/failure)
- error_message
```

### Índices creados
- idx_audit_logs_user_id
- idx_audit_logs_action
- idx_audit_logs_timestamp
- idx_audit_logs_resource

## [1.2.2] - 2025-12-10

### 📋 Extended Audit Logging
- **AGREGADO**: Audit para LOGIN_SUCCESS con IP y user agent
- **AGREGADO**: Audit para GROUP_JOINED cuando usuario se une a grupo

### Audit Events Totales
- LOGIN_SUCCESS - Login exitoso
- LOGIN_FAILED - Login fallido  
- GROUP_JOINED - Usuario unido a grupo
- (Más eventos pendientes de agregar)

## [1.3.0] - 2025-12-10

### 📋 Complete Audit Logging System
Implementación completa de audit logging para todas las acciones críticas.

**Eventos de Autenticación:**
- LOGIN_SUCCESS - Login exitoso con IP y user agent
- LOGIN_FAILED - Login fallido (2 variantes: user not found, wrong password)
- ADMIN_LOGIN - Login de administrador

**Eventos de Usuario:**
- USER_REGISTERED - Nuevo registro de usuario
- PROFILE_UPDATED - Actualización de perfil

**Eventos de Grupos/Tandas:**
- GROUP_CREATED - Creación de grupo
- GROUP_JOINED - Usuario se une a grupo
- TANDA_CREATED - Creación de tanda

**Eventos de Contribuciones:**
- CONTRIBUTION_CREATED - Nueva contribución/pago
- CONTRIBUTION_APPROVED - Pago aprobado por coordinador
- CONTRIBUTION_REJECTED - Pago rechazado

### Consultas SQL Útiles
```sql
-- Ver todos los eventos de un usuario
SELECT * FROM audit_logs WHERE user_id = 'user_xxx' ORDER BY timestamp DESC;

-- Ver intentos de login fallidos
SELECT * FROM audit_logs WHERE action = 'LOGIN_FAILED' ORDER BY timestamp DESC;

-- Ver actividad de admin
SELECT * FROM audit_logs WHERE action = 'ADMIN_LOGIN' ORDER BY timestamp DESC;

-- Ver contribuciones aprobadas/rechazadas hoy
SELECT * FROM audit_logs 
WHERE action IN ('CONTRIBUTION_APPROVED', 'CONTRIBUTION_REJECTED')
AND timestamp > CURRENT_DATE
ORDER BY timestamp DESC;
```

## [1.4.0] - 2025-12-10

### 🔐 JWT Token Validation en Endpoints

**Funciones de autenticación agregadas:**
- `getAuthenticatedUser(req, query)` - Prefiere JWT, fallback a user_id
- `requireAuth(req, res)` - Requiere JWT obligatorio

**Endpoints actualizados para soportar JWT:**
- `/api/wallet/balance` - GET
- `/api/wallet/transactions` - GET
- `/api/user/profile` - GET, PUT
- `/api/notifications` - GET

**Compatibilidad hacia atrás:**
- Los endpoints aún aceptan `user_id` como query param (legacy)
- Se registra warning cuando se usa legacy auth
- JWT es la forma preferida de autenticación

**Nginx actualizado:**
- Agregado `proxy_set_header Authorization` para pasar JWT al backend

### Uso de JWT
```bash
# 1. Login para obtener token
TOKEN={
  "success": false,
  "data": {
    "error": {
      "code": 400,
      "message": "Email y contraseña son requeridos",
      "details": null,
      "timestamp": "2025-12-10T17:10:29.751Z"
    }
  },
  "meta": {
    "timestamp": "2025-12-10T17:10:29.751Z",
    "version": "2.0.0",
    "server": "production-168.231.67.201",
    "environment": "production"
  }
}

# 2. Usar token en requests
curl https://latanda.online/api/wallet/balance \
  -H Authorization: Bearer $TOKEN
```

## [1.4.0] - 2025-12-10

### 🔐 JWT Token Validation en Endpoints

**Funciones de autenticación agregadas:**
- `getAuthenticatedUser(req, query)` - Prefiere JWT, fallback a user_id
- `requireAuth(req, res)` - Requiere JWT obligatorio

**Endpoints actualizados para soportar JWT:**
- `/api/wallet/balance` - GET
- `/api/wallet/transactions` - GET
- `/api/user/profile` - GET, PUT
- `/api/notifications` - GET

**Compatibilidad hacia atrás:**
- Los endpoints aún aceptan `user_id` como query param (legacy)
- Se registra warning cuando se usa legacy auth
- JWT es la forma preferida de autenticación

**Nginx actualizado:**
- Agregado `proxy_set_header Authorization` para pasar JWT al backend

## [1.4.1] - 2025-12-10

### 🔒 JWT Obligatorio en Endpoints Críticos

**Endpoints que ahora REQUIEREN JWT (sin fallback):**
- `PUT /api/user/profile` - Modificar perfil
- `POST /api/contributions/request` - Crear contribución/pago
- `POST /api/groups` - Crear grupo

**Comportamiento:**
- Sin token → 401 "No token provided"
- Token inválido → 401 "Invalid or expired token"  
- Token válido → Procesa request usando `authUser.userId`

**Función utilizada:** `requireAuth(req, res)`
- Retorna `null` y envía error 401 si no hay token válido
- Retorna `{userId, email, role}` si token es válido
