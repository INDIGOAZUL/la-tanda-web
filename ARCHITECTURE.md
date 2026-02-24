# La Tanda - Arquitectura del Sistema

**Última actualización: 2025-12-12
**Versión: 2.0.0
---

## 1. Resumen del Sistema

La Tanda es una plataforma fintech para gestión de grupos de ahorro rotativo (tandas/ROSCAs).

### Stack Tecnológico
| Componente | Tecnología |
|------------|------------|
| Backend | Node.js (http nativo, sin Express) |
| Base de datos | PostgreSQL 16 |
| Cache/Sesiones | Redis |
| Proxy | Nginx |
| Process Manager | PM2 |
| Frontend | HTML/CSS/JS vanilla |

### Puertos
| Servicio | Puerto |
|----------|--------|
| API Node.js | 3002 |
| PostgreSQL | 5432 |
| Redis | 6379 |
| Nginx HTTP | 80 |
| Nginx HTTPS | 443 |

---

## 2. Estructura de Archivos

```
/var/www/latanda.online/           # API Backend
├── integrated-api-complete-95-endpoints.js  # API principal (11,688 líneas)
├── db-postgres.js                 # Funciones PostgreSQL (970 líneas)
├── db-unified.js                  # Capa de abstracción (260 líneas)
├── db-helpers-groups.js           # Helpers para grupos
├── database.json                  # Datos JSON legacy (1,139 líneas)
├── export-utils.js                # Utilidades de exportación
├── notifications-utils.js         # Sistema de notificaciones
└── logs/                          # Logs de la API

/var/www/html/main/                # Frontend
├── js/
│   ├── user-sync.js               # Sincronización de usuario
│   ├── dashboard-sections-loader.js
│   ├── admin-guard.js             # Protección páginas admin
│   └── header-sync.js             # Sincronización header
├── home-dashboard.html            # Dashboard principal
├── auth-enhanced.html             # Login/Registro
└── admin-*.html                   # Páginas de administración
```

---

## 3. Base de Datos PostgreSQL

### 3.1 Tablas Principales (25 tablas)

| Tabla | Descripción | Estado |
|-------|-------------|--------|
| `users` | Usuarios del sistema | PRIMARY |
| `groups` | Grupos/Tandas | PRIMARY |
| `group_members` | Miembros de grupos | PRIMARY |
| `contributions` | Pagos de miembros | PRIMARY |
| `tandas` | Configuración de tandas | PRIMARY |
| `notifications` | Notificaciones | PRIMARY |
| `audit_logs` | Registro de auditoría | PRIMARY |
| `user_sessions` | Sesiones de usuario | PRIMARY |
| `user_wallets` | Billeteras | PRIMARY |
| `kyc_documents` | Documentos KYC | PRIMARY |

### 3.2 Schema - users
```sql
user_id VARCHAR(50) PRIMARY KEY  -- Formato: user_[16-char-hex]
name VARCHAR(255) NOT NULL
email VARCHAR(255) UNIQUE
phone VARCHAR(20)
password_hash VARCHAR(255)
role VARCHAR(20) DEFAULT user  -- user, admin
verification_level VARCHAR(20) DEFAULT basic
status VARCHAR(20) DEFAULT active
created_at TIMESTAMP
updated_at TIMESTAMP
```

### 3.3 Schema - groups
```sql
group_id VARCHAR(50) PRIMARY KEY  -- Formato: group_[16-char-hex]
name VARCHAR(255) NOT NULL
contribution_amount NUMERIC(10,2) NOT NULL
frequency VARCHAR(20) NOT NULL    -- weekly, biweekly, monthly
admin_id VARCHAR(50) REFERENCES users(user_id)
status VARCHAR(20) DEFAULT active
max_members INTEGER DEFAULT 12
current_cycle INTEGER DEFAULT 1
```

### 3.4 Schema - contributions
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
user_id VARCHAR(50) NOT NULL
group_id VARCHAR(50) NOT NULL
amount NUMERIC(10,2) NOT NULL
payment_method VARCHAR(50)  -- cash, bank_transfer, crypto, mobile_money
status VARCHAR(50)          -- pending, completed, awaiting_payment, etc.
created_at TIMESTAMPTZ DEFAULT now()
```

### 3.5 Schema - group_members
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
group_id VARCHAR(50) REFERENCES groups(group_id)
user_id VARCHAR(50) REFERENCES users(user_id)
role VARCHAR(20) DEFAULT member  -- creator, coordinator, admin, member
status VARCHAR(20) DEFAULT active
turn_position INTEGER
joined_at TIMESTAMP
```

---

## 4. Formato de IDs

### Estándar Actual: `user_[16-char-hex]`

| Entidad | Formato | Ejemplo |
|---------|---------|---------|
| Usuario | `user_[hex]` | `user_4b21c52be3cc67dd` |
| Grupo | `group_[hex]` | `group_cd6abdf380e66497` |
| Contribución | UUID v4 | `d2b9d611-eb3f-4052-9ddf-f0c3091ae19b` |

### Generación de IDs
```javascript
// Backend (API)
function generateId(prefix) {
    const hex = crypto.randomBytes(8).toString(hex);
    return `${prefix}_${hex}`;
}
// Resultado: user_4b21c52be3cc67dd
```

---

## 5. Endpoints API (84 rutas)

### 5.1 Autenticación
| Método | Ruta | Fuente | Auth |
|--------|------|--------|------|
| POST | `/api/auth/login` | PostgreSQL | No |
| POST | `/api/auth/register` | PostgreSQL | No |
| POST | `/api/auth/refresh` | PostgreSQL | JWT |
| POST | `/api/auth/logout` | - | JWT |

### 5.2 Usuarios
| Método | Ruta | Fuente | Auth |
|--------|------|--------|------|
| GET | `/api/user/profile` | PostgreSQL | JWT/query |
| PUT | `/api/user/profile` | PostgreSQL | JWT |
| GET | `/api/user/transactions` | PostgreSQL | JWT/query |
| GET | `/api/users/payout-methods` | PostgreSQL | JWT |
| POST | `/api/users/payout-methods` | PostgreSQL | JWT |

### 5.3 Grupos
| Método | Ruta | Fuente | Auth |
|--------|------|--------|------|
| GET | `/api/groups` | PostgreSQL | No |
| POST | `/api/groups` | PostgreSQL | JWT |
| GET | `/api/groups/:id` | PostgreSQL | No |
| PUT | `/api/groups/:id/update` | PostgreSQL | JWT |
| GET | `/api/groups/:id/members` | PostgreSQL | No |
| POST | `/api/groups/:id/members/invite` | PostgreSQL | JWT |

### 5.4 Contribuciones
| Método | Ruta | Fuente | Auth |
|--------|------|--------|------|
| POST | `/api/contributions/request` | PostgreSQL | JWT |
| POST | `/api/contributions` | PostgreSQL | JWT |
| GET | `/api/groups/:id/contributions` | PostgreSQL | No |

### 5.5 Wallet/Pagos
| Método | Ruta | Fuente | Auth |
|--------|------|--------|------|
| GET | `/api/wallet/balance` | PostgreSQL | JWT/query |
| POST | `/api/wallet/deposit/bank-transfer` | JSON | JWT |
| POST | `/api/wallet/deposit/crypto` | JSON | JWT |
| POST | `/api/wallet/deposit/mobile` | JSON | JWT |

### 5.6 Notificaciones
| Método | Ruta | Fuente | Auth |
|--------|------|--------|------|
| GET | `/api/notifications` | PostgreSQL | JWT/query |
| POST | `/api/notifications/read-all` | PostgreSQL | JWT |
| GET | `/api/notifications/preferences` | PostgreSQL | JWT |
| PUT | `/api/notifications/preferences` | PostgreSQL | JWT |

### 5.7 Admin
| Método | Ruta | Fuente | Auth |
|--------|------|--------|------|
| POST | `/api/admin/login` | PostgreSQL | No |
| GET | `/api/admin/deposits/pending` | JSON | Admin |
| POST | `/api/admin/deposits/confirm` | JSON | Admin |
| POST | `/api/admin/deposits/reject` | JSON | Admin |
| GET | `/api/admin/contributions/pending` | PostgreSQL | Admin |
| GET | `/api/admin/dashboard/stats` | PostgreSQL | Admin |
| GET | `/api/admin/payouts/pending` | PostgreSQL | Admin |

### 5.8 Sistema
| Método | Ruta | Fuente | Auth |
|--------|------|--------|------|
| GET | `/api/system/status` | - | No |
| POST | `/api/mobile/init` | JSON | No |
| POST | `/api/sync/status` | JSON | JWT |

---

## 6. Fuentes de Datos

### 6.1 Estadísticas de Uso
- **PostgreSQL queries:** 140 llamadas
- **JSON database:** 207 accesos

### 6.2 Mapeo por Colección

| Colección | PostgreSQL | JSON | Migración |
|-----------|-----------|------|-----------|
| users | ✅ PRIMARY | ⚠️ Legacy | COMPLETA |
| groups | ✅ PRIMARY | ⚠️ Legacy | COMPLETA |
| group_members | ✅ PRIMARY | ❌ | COMPLETA |
| contributions | ✅ PRIMARY | ❌ | COMPLETA |
| notifications | ✅ PRIMARY | ⚠️ Legacy | PARCIAL |
| deposits | ❌ | ✅ PRIMARY | PENDIENTE |
| transactions | ❌ | ✅ PRIMARY | PENDIENTE |
| payments | ❌ | ✅ PRIMARY | PENDIENTE |

### 6.3 Colecciones en database.json
```json
[
  "app_sessions",
  "groupMembers",
  "groups",
  "matchingPreferences",
  "mia_conversations",
  "notifications",
  "payments",
  "sync_data",
  "tandas",
  "users",
  "verifications"
]
```

---

## 7. Autenticación JWT

### 7.1 Configuración
```javascript
JWT_SECRET = process.env.JWT_SECRET || "latanda-secure-key-change-in-production-2024"
JWT_EXPIRES_IN = "24h"
REFRESH_TOKEN_EXPIRES_IN = "7d"
```

### 7.2 Payload del Token
```javascript
{
  userId: "user_4b21c52be3cc67dd",
  email: "user@example.com",
  role: "admin",  // o "user"
  iat: 1702214400,
  exp: 1702300800
}
```

### 7.3 Endpoints por Nivel de Auth

| Nivel | Descripción | Endpoints |
|-------|-------------|-----------|
| Ninguno | Sin autenticación | `/api/auth/login`, `/api/system/status` |
| JWT/Query | Token O user_id query param | `/api/wallet/balance`, `/api/user/profile` GET |
| JWT Requerido | Solo token válido | `/api/user/profile` PUT, `/api/contributions/request` |
| Admin | Token + role=admin | `/api/admin/*` |

---

## 8. Flujos de Datos

### 8.1 Login
```
1. Frontend envía {email, password}
2. API busca usuario en PostgreSQL
3. Compara password con bcrypt
4. Genera JWT (auth_token + refresh_token)
5. Registra en audit_logs
6. Devuelve tokens + user info
```

### 8.2 Contribución
```
1. Frontend envía {group_id, amount, payment_method}
2. API valida JWT
3. Crea registro en PostgreSQL contributions
4. Genera reference_code único
5. Envía notificación
6. Registra en audit_logs
```

### 8.3 Balance de Wallet
```
1. Frontend solicita balance con JWT o user_id
2. API busca en PostgreSQL contributions completadas
3. Suma amounts donde status = completed
4. Devuelve balance + transacciones recientes
```

---

## 9. Dependencias entre Secciones

```
Dashboard
├── /api/wallet/balance (PostgreSQL)
├── /api/groups (PostgreSQL)
├── /api/notifications (PostgreSQL)
└── /api/dashboard/summary (PostgreSQL)

Groups
├── /api/groups/:id (PostgreSQL)
├── /api/groups/:id/members (PostgreSQL)
├── /api/groups/:id/contributions (PostgreSQL)
└── /api/tandas (PostgreSQL)

Admin Panel
├── /api/admin/dashboard/stats (PostgreSQL)
├── /api/admin/contributions/pending (PostgreSQL)
├── /api/admin/deposits/pending (JSON)
└── /api/admin/payouts/pending (PostgreSQL)
```

---

## 10. Problemas Conocidos

### 10.1 Caracteres Especiales en Contraseñas
- **Problema:** JSON.parse() falla con caracteres como `\!`, `"`, `\`
- **Estado:** PENDIENTE de fix

### 10.2 Datos Duplicados
- **Problema:** users y groups existen en PostgreSQL y JSON
- **Solución:** Eliminar escritura a JSON, mantener solo como backup

### 10.3 IDs Inconsistentes
- **Problema:** Algunos endpoints esperan UUID, otros user_HEX
- **Estándar:** Usar `user_[16-char-hex]` en toda la plataforma

---

## 11. Roadmap de Migración

### Fase 1 (COMPLETADA)
- ✅ Users a PostgreSQL
- ✅ Groups a PostgreSQL
- ✅ Group members a PostgreSQL
- ✅ Contributions a PostgreSQL

### Fase 2 (PENDIENTE)
- ⏳ Deposits → PostgreSQL
- ⏳ Transactions → PostgreSQL
- ⏳ Payments → PostgreSQL

### Fase 3 (PLANIFICADA)
- 📋 Eliminar dual-write a JSON
- 📋 JSON como backup read-only

---

## 12. Validación de IDs

### Funciones de Validación (Nuevas)

```javascript
// Validate ID format: prefix_[16-char-hex]
function isValidId(id, expectedPrefix) {
    if (\!id || typeof id \!== "string") return false;
    const pattern = new RegExp(`^${expectedPrefix}_[a-f0-9]{16}$`);
    return pattern.test(id);
}

// Validate user_id format
function isValidUserId(userId) {
    return isValidId(userId, "user");
}

// Validate group_id format  
function isValidGroupId(groupId) {
    return isValidId(groupId, "group");
}
```

### Ejemplos de IDs Válidos
| Entidad | ID Válido | ID Inválido |
|---------|-----------|-------------|
| Usuario | `user_4b21c52be3cc67dd` | `user_001`, `1762387098125` |
| Grupo | `group_cd6abdf380e66497` | `group_001`, `tanda_test` |
| Contribución | UUID v4 | - |

### Reglas de Validación
1. Prefijo obligatorio (`user_`, `group_`, etc.)
2. Sufijo: exactamente 16 caracteres hexadecimales
3. Solo minúsculas (a-f, 0-9)
4. Longitud total: prefijo + `_` + 16 = variable según prefijo

---

## 13. Estado de Migración de Datos

### Datos en PostgreSQL (Producción)
| Tabla | Registros | Estado |
|-------|-----------|--------|
| users | 4 | PRIMARY |
| groups | 1 | PRIMARY |
| group_members | 3 | PRIMARY |
| contributions | 25 | PRIMARY |
| notifications | 1 | PRIMARY |
| audit_logs | varios | PRIMARY |

### Datos en JSON (Legacy/Testing)
| Colección | Registros | Estado |
|-----------|-----------|--------|
| payments | 3 | DEPRECATED - usar contributions |
| deposits | 0 | DEPRECATED - usar contributions |
| users | 11 | LEGACY - no usar |
| groups | 18 | LEGACY - no usar |

### Endpoints que usan JSON (a migrar)
1. `/api/wallet/deposit/*` - usa database.deposits
2. `/api/payments/*` - usa database.payments
3. `/api/admin/deposits/*` - usa database.deposits

### Recomendación
Todos los pagos/depósitos deben usar la tabla `contributions` de PostgreSQL.
La tabla tiene todos los campos necesarios:
- payment_method (cash, bank_transfer, crypto, mobile_money)
- status (pending, completed, awaiting_payment, etc.)
- proof_url, verified_by, verified_at
- reference_code, confirmation_code

---

## 14. Configuración de Dual-Write

### Variables de Entorno
```bash
# Deshabilitar escritura de backup a JSON
ENABLE_JSON_BACKUP=false
```

### Colecciones y su Estado
| Colección | PostgreSQL | JSON Write | Estado |
|-----------|------------|------------|--------|
| users | PRIMARY | DISABLED | ✅ Solo PostgreSQL |
| groups | PRIMARY | DISABLED | ✅ Solo PostgreSQL |
| groupMembers | PRIMARY | DISABLED | ✅ Solo PostgreSQL |
| contributions | PRIMARY | N/A | ✅ Solo PostgreSQL |
| deposits | PENDING | ENABLED | ⚠️ Pendiente migración |
| payments | PENDING | ENABLED | ⚠️ Pendiente migración |
| admin_sessions | N/A | ENABLED | Temporal (sesiones) |

### Código de Configuración
```javascript
// integrated-api-complete-95-endpoints.js línea ~95
const ENABLE_JSON_BACKUP_WRITE = process.env.ENABLE_JSON_BACKUP \!== "false";
const JSON_BACKUP_COLLECTIONS = ["deposits", "payments", "admin_sessions"];
```

---

## 15. JWT en Frontend (Actualizado 2025-12-10)

### Archivos Modificados
| Archivo | Cambio |
|---------|--------|
| `js/dashboard-api-connector.js` | `getAuthToken()` + headers en `fetchWithCache()` |
| `js/header.js` | `getAuthToken()` + headers en `loadUserData()` y `loadNotifications()` |
| `js/dashboard-sections-loader.js` | `getAuthHeaders()` + headers en fetch calls |
| `home-dashboard.html` | JWT en Profile GET (línea 2674) y PUT (línea 2878) |

### Patrón de Uso
```javascript
// Obtener token
const token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");

// Incluir en headers
const headers = token ? { "Authorization": "Bearer " + token } : {};

// Usar en fetch
const response = await fetch(url, { headers });
```

### Endpoints con JWT
- `/api/wallet/balance` - JWT/query
- `/api/notifications` - JWT/query
- `/api/dashboard/summary` - JWT/query
- `/api/user/profile` GET - JWT/query
- `/api/user/profile` PUT - JWT requerido

---

## 16. JWT en Groups System (Actualizado 2025-12-10)

### Archivo Modificado
`/var/www/html/main/groups-advanced-system.html` (650KB)

### Cambios Realizados
| Antes | Después |
|-------|---------|
| 23 fetch con JWT | 50 fetch con JWT |
| 30 fetch sin JWT | 0 fetch sin JWT |

### Función Helper Agregada (línea 3155)
```javascript
function getAuthHeaders() {
    const token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token") || "";
    return token ? { "Authorization": "Bearer " + token } : {};
}
```

### Patrones de Uso
```javascript
// Fetch simple
fetch(url, { headers: getAuthHeaders() });

// Fetch con Content-Type
fetch(url, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(data)
});
```

### Endpoints Protegidos
- `/api/groups/:id/members`
- `/api/groups/:id/contributions`
- `/api/groups/:id/update`
- `/api/contributions/request`
- `/api/contributions/:id/verify`
- `/api/groups/:id/join-pg`
- Y 44 más...

---

## 17. Sistema de Turnos y Tombola (Actualizado 2025-12-10)

### 17.1 Fuente de Verdad: `tandas.turns_order`

El orden de turnos se almacena en la columna `turns_order` de la tabla `tandas` como un array PostgreSQL.

```sql
-- Schema tandas (columnas relevantes)
turns_order TEXT[]  -- Array de user_ids en orden de turno
                    -- Ejemplo: {user_4b21c52be3cc67dd, user_0a7015c00d0b88c0, user_ae7372dd47b2319c}
```

**Importante:** `group_members.turn_position` existe por compatibilidad pero `tandas.turns_order` es la fuente de verdad.

### 17.2 Endpoints de Turnos

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/groups/:id/members` | Devuelve miembros con posiciones desde `turns_order` |
| PUT | `/api/groups/:id/reorder-turns` | Actualiza `turns_order` + `turn_position` |
| POST | `/api/groups/:id/lottery-assign` | Ejecuta tombola (shuffle aleatorio) |
| GET | `/api/groups/:id/start-summary` | Resumen para modal "Iniciar Tanda" |

### 17.3 Endpoint: Tombola (`/api/groups/:id/lottery-assign`)

**Método:** POST

**Descripción:** Ejecuta la tombola para asignar turnos aleatoriamente usando el algoritmo Fisher-Yates.

**Request:**
```javascript
POST /api/groups/group_cd6abdf380e66497/lottery-assign
Headers: { "Authorization": "Bearer <token>" }
```

**Response:**
```json
{
  "success": true,
  "message": "Tombola ejecutada exitosamente",
  "data": {
    "turns_order": [
      { "position": 1, "user_id": "user_4b21c52be3cc67dd", "name": "Ebanks" },
      { "position": 2, "user_id": "user_0a7015c00d0b88c0", "name": "Hugo ramirez" },
      { "position": 3, "user_id": "user_ae7372dd47b2319c", "name": "La Tanda" }
    ]
  }
}
```

**Acciones del Backend:**
1. Obtiene miembros activos del grupo
2. Mezcla aleatoriamente (Fisher-Yates)
3. Actualiza `tandas.turns_order`
4. Actualiza `group_members.turn_position` (compatibilidad)

### 17.4 Endpoint: Reordenar Turnos (`/api/groups/:id/reorder-turns`)

**Método:** PUT

**Request:**
```javascript
PUT /api/groups/group_cd6abdf380e66497/reorder-turns
Headers: { "Authorization": "Bearer <token>", "Content-Type": "application/json" }
Body: {
  "member_turns": [
    { "user_id": "user_4b21c52be3cc67dd", "new_position": 1 },
    { "user_id": "user_0a7015c00d0b88c0", "new_position": 2 },
    { "user_id": "user_ae7372dd47b2319c", "new_position": 3 }
  ]
}
```

**Acciones del Backend:**
1. Actualiza `group_members.turn_position` para cada miembro
2. Construye nuevo array `turns_order` ordenado por posición
3. Actualiza `tandas.turns_order`

### 17.5 Flujo de Tombola (Frontend)

```
Usuario hace clic "Iniciar Tombola"
        ↓
startLotteryCountdown()
        ↓
Animación 3-2-1 con dados girando
        ↓
executeLotteryFromModal()
        ↓
POST /api/groups/:id/lottery-assign
        ↓
Backend mezcla y actualiza BD
        ↓
openStartTandaModal() - recarga modal
        ↓
refreshTandas() - actualiza Tab Tandas
        ↓
fetchMyGroups() - actualiza Tab Groups
```

---

## 18. Sincronización entre Tabs (Actualizado 2025-12-10)

### 18.1 Variables Globales de Estado

| Variable | Contenido | Actualizada por |
|----------|-----------|-----------------|
| `window.currentGroupsData` | Array de grupos del usuario | `fetchMyGroups()` |
| `window.tandasData` | Array de tandas del usuario | `refreshTandas()` |
| `window.filteredTandas` | Tandas filtradas por estado | `filterTandas()` |

### 18.2 Funciones de Carga

| Función | Endpoint | Actualiza |
|---------|----------|-----------|
| `fetchMyGroups()` | `/api/groups/my-groups-pg` | `window.currentGroupsData` |
| `refreshTandas()` | `/api/tandas/my-tandas` | `window.tandasData` |
| `loadMatchingTab()` | `/api/groups/public-pg` | Vista matching |
| `loadAnalyticsDashboard()` | `/api/groups/:id/stats` | Vista analytics |

### 18.3 Matriz de Sincronización

| Acción | `fetchMyGroups()` | `refreshTandas()` |
|--------|-------------------|-------------------|
| Guardar Turnos | ✅ | ✅ |
| Ejecutar Tombola | ✅ | ✅ |
| Eliminar Grupo | ✅ | ✅ |
| Crear Grupo | ✅ | ✅ |
| Salir de Grupo | ✅ | ✅ |
| Invitar Miembro | ✅ | - |
| Iniciar Tanda | - | ✅ |
| Programar Tanda | - | ✅ |

### 18.4 Flujo de Sincronización

```
Acción del usuario (ej: Guardar Turnos)
        ↓
    API Backend
        ↓
Base de datos actualizada
        ↓
  ┌─────┴─────┐
  ↓           ↓
fetchMyGroups()  refreshTandas()
  ↓           ↓
window.currentGroupsData  window.tandasData
  ↓           ↓
renderGroups()  renderTandas()
  ↓           ↓
Tab Groups    Tab Tandas
actualizado   actualizado
```

### 18.5 Tabs y su Comportamiento de Carga

| Tab | Carga Inicial | Refresh Automático | Carga al switchTab |
|-----|---------------|--------------------|--------------------|
| Calculator | N/A (estático) | N/A | No |
| Groups | DOMContentLoaded | Sí (acciones) | No |
| Create | switchTab | No | Sí |
| Tandas | DOMContentLoaded | Sí (acciones) | No |
| Matching | switchTab | No | Sí (siempre fresco) |
| Analytics | switchTab | No | Sí (siempre fresco) |

---

## 19. Endpoints de Tandas (Actualizado 2025-12-10)

### 19.1 Nuevos Endpoints

| Método | Ruta | Descripción | Agregado |
|--------|------|-------------|----------|
| GET | `/api/groups/:id/start-summary` | Resumen para iniciar tanda | 2025-12-10 |
| POST | `/api/tandas/:id/schedule-start` | Programar inicio de tanda | 2025-12-10 |
| POST | `/api/groups/:id/lottery-assign` | Ejecutar tombola | 2025-12-10 |

### 19.2 Endpoint: Start Summary (`/api/groups/:id/start-summary`)

**Response:**
```json
{
  "success": true,
  "data": {
    "group_id": "group_cd6abdf380e66497",
    "group_name": "Grupo Familiar Ebanks",
    "member_count": 3,
    "max_members": 8,
    "contribution_amount": 1500,
    "frequency": "semanal",
    "total_duration": "8 semanas",
    "lottery_executed": true,
    "members_with_positions": [
      { "user_id": "user_...", "name": "Ebanks", "position": 1, "role": "creator" },
      { "user_id": "user_...", "name": "Hugo", "position": 2, "role": "member" }
    ]
  }
}
```

### 19.3 Endpoint: Schedule Start (`/api/tandas/:id/schedule-start`)

**Request:**
```json
{
  "start_at": "2025-12-15T10:00:00Z"
}
```

**Acciones:**
1. Actualiza `tandas.status` a `'scheduled'`
2. Guarda `tandas.scheduled_start_at`

### 19.4 Estados de Tanda

| Estado | Descripción | UI Label |
|--------|-------------|----------|
| `recruiting` | Reclutando miembros | "En Reclutamiento" |
| `scheduled` | Programada para iniciar | "Programada" |
| `active` | En curso | "Activa" |
| `collecting` | Usuario actual cobra | "Cobrando" |
| `completed` | Finalizada | "Completada" |
| `cancelled` | Cancelada | "Cancelada" |

---

## 20. Frontend: groups-advanced-system.html

### 20.1 Estructura de Funciones Principales

```
groups-advanced-system.html (~14,000 líneas)
├── Tabs Navigation
│   ├── switchTab()
│   └── Tab overrides (analytics, matching, create)
├── Groups Tab
│   ├── fetchMyGroups()
│   ├── renderGroups()
│   └── filterGroups(), sortGroups()
├── Tandas Tab
│   ├── refreshTandas()
│   ├── renderTandas()
│   ├── updateTandasDashboard()
│   └── filterTandas(), sortTandas()
├── Modals
│   ├── Gestionar Turnos
│   │   ├── manageTurns()
│   │   ├── loadTurnsMembers()
│   │   ├── saveTurnsOrder()
│   │   └── moveTurnUp(), moveTurnDown()
│   ├── Iniciar Tanda
│   │   ├── openStartTandaModal()
│   │   ├── executeLotteryFromModal()
│   │   └── startLotteryCountdown()
│   └── Invitar Miembro
│       ├── showInviteModal()
│       └── sendInvitation()
└── Utilities
    ├── getAuthHeaders()
    ├── getCurrentUserId()
    └── showNotification()
```

### 20.2 Funciones de Tombola

| Función | Ubicación | Descripción |
|---------|-----------|-------------|
| `startLotteryCountdown()` | Línea ~8361 | Animación 3-2-1 antes de tombola |
| `executeLotteryFromModal()` | Línea ~8425 | Llama API y refresca datos |

### 20.3 Funciones de Sincronización

| Función | Llamada después de |
|---------|-------------------|
| `fetchMyGroups()` | Crear/eliminar/salir grupo, tombola, guardar turnos |
| `refreshTandas()` | Todas las acciones de grupos y tandas |
| `renderGroups()` | `fetchMyGroups()` |
| `renderTandas()` | `refreshTandas()` |

---

## Historial de Cambios (2025-12-10)

### Versión 1.6.1
- Agregado endpoint `/api/groups/:id/lottery-assign` para tombola
- Agregado endpoint `/api/groups/:id/start-summary` para modal iniciar tanda
- Agregado endpoint `/api/tandas/:id/schedule-start` para programar inicio
- Corregido `/api/groups/:id/start-summary` para usar `tandas.turns_order`
- Corregido `/api/groups/:id/reorder-turns` para actualizar `tandas.turns_order`
- Agregada función `startLotteryCountdown()` con animación
- Implementada sincronización completa entre Tab Groups y Tab Tandas
- Corregido `leaveGroup` para usar `fetchMyGroups()` en lugar de `loadMyGroups()`
- Agregado `refreshTandas()` después de crear grupo
- Agregado `fetchMyGroups()` después de invitar miembro

---

## 21. Dashboard Sync System (Actualizado 2025-12-11)

### 21.1 Archivos del Sistema de Sincronización

| Archivo | Propósito | Versión |
|---------|-----------|---------|
| `js/dashboard-api-connector.js` | Conector central API | - |
| `js/dashboard-real-data-patch.js` | Parche para datos reales | v2.1 |
| `home-dashboard.html` | Dashboard principal | - |

### 21.2 Flujo de Sincronización del Dashboard

```
Carga de página
      ↓
dashboard-api-connector.js (init)
      ↓
  dashboardAPI.syncAll()
      ↓
┌─────┴─────┐
↓           ↓
getWalletBalance()  getTandasCount()
      ↓           ↓
      ↓      /api/tandas/my-tandas
      ↓           ↓
/api/wallet/balance?user_id=X
      ↓
dashboard-real-data-patch.js
      ↓
┌─────┴─────┐
↓           ↓
updateCarouselStats()  updateProfileModalStats()
      ↓           ↓
Carousel cards     Profile modal
actualizados       actualizado
```

### 21.3 Mapeo de Campos API

```javascript
// API Response
{
  "data": {
    "balance": 1500,           // ← Usar este
    "balances": {
      "total_usd": 1500        // ← Y este para total
    }
  }
}

// Mapeo correcto en dashboard-api-connector.js
available: data.data?.balance || 0
total: data.data?.balances?.total_usd || 0
```

### 21.4 Elementos DOM Sincronizados

| ID | Descripción | Sincronizado |
|----|-------------|--------------|
| `headerBalance` | Balance en header | ✅ |
| `carouselBalance` | Balance en carousel | ✅ |
| `carouselSavings` | Ahorros en carousel | ✅ |
| `carouselTandas` | Tandas activas carousel | ✅ |
| `carouselNextPayment` | Próximo pago carousel | ✅ |
| `profileBalance` | Balance en modal perfil | ✅ |
| `profileTandas` | Tandas en modal perfil | ✅ |

---

## 22. Notification Center v2.0 (Actualizado 2025-12-11)

### 22.1 Arquitectura

```
ANTES (v1.x):                    DESPUÉS (v2.0):
┌─────────────────┐             ┌─────────────────┐
│   localStorage  │ ←Primary    │  PostgreSQL API │ ←Primary
└────────┬────────┘             └────────┬────────┘
         │                               │
         ↓                               ↓
┌─────────────────┐             ┌─────────────────┐
│   Mock Data     │ ←Fallback   │   localStorage  │ ←Cache
└─────────────────┘             └─────────────────┘
```

### 22.2 Archivo Modificado

`/var/www/html/main/js/components/notification-center.js` (v2.0)

### 22.3 Endpoints Utilizados

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/notifications?user_id=X&limit=50` | Cargar notificaciones |
| POST | `/api/notifications/read/:id` | Marcar una como leída |
| POST | `/api/notifications/read-all` | Marcar todas como leídas |

### 22.4 Características v2.0

- Polling cada 60 segundos
- Refresh al abrir panel
- Botón refresh manual
- localStorage como cache/fallback
- Indicador "Sincronizado con servidor"
- UI en español

### 22.5 Mapeo de Tipos de Notificación

| Tipo API | Categoría UI |
|----------|--------------|
| `lottery_scheduled` | tandas |
| `lottery_result` | tandas |
| `payment_received` | transactions |
| `payment_sent` | transactions |
| `member_joined` | social |
| `security_alert` | system |

---

## 23. Backups y Mantenimiento (Actualizado 2025-12-11)

### 23.1 Ubicación de Backups

```
/root/backups/
├── backup-production-20251211.tar.gz   # Archivos críticos actuales (238 KB)
├── old-backups-archive-20251211.tar.gz # Backups antiguos archivados (6.3 MB)
├── pre-update-20251118.tar.gz          # Pre-actualización
├── database_20251130.json              # DB JSON snapshot
└── postgres_20251130.sql               # DB PostgreSQL snapshot
```

### 23.2 Contenido de backup-production-20251211.tar.gz

```
├── integrated-api-complete-95-endpoints.js  (514 KB)
├── db-postgres.js                           (31 KB)
├── notifications-utils.js                   (9 KB)
├── db-helpers-groups.js                     (7 KB)
├── home-dashboard.html                      (184 KB)
├── groups-advanced-system.html              (656 KB)
├── notification-center.js                   (19 KB)
├── dashboard-api-connector.js               (10 KB)
└── dashboard-real-data-patch.js             (10 KB)
```

### 23.3 Comandos de Restauración

```bash
# Restaurar archivos de producción
cd / && tar -xzvf /root/backups/backup-production-20251211.tar.gz

# Restaurar backups antiguos
cd / && tar -xzvf /root/backups/old-backups-archive-20251211.tar.gz
```

### 23.4 Limpieza de Logs

```bash
# Journal logs (mantener 500MB)
journalctl --vacuum-size=500M

# PM2 logs
pm2 flush
```

---

## Historial de Cambios

### Versión 1.6.1 (2025-12-11)
- Corregido mapeo de campos en `dashboard-api-connector.js`
  - `confirmed_balance` → `balance`
  - `total_balance` → `balances.total_usd`
- Actualizado `dashboard-real-data-patch.js` a v2.1
  - Agregado `updateCarouselStats()`
  - Agregado `updateProfileModalStats()`
  - Mejorado timing con `waitForEverything()`
- Actualizado `notification-center.js` a v2.0
  - Sincronización con PostgreSQL API
  - Polling cada 60 segundos
  - localStorage como cache fallback
- Creado backup de producción
- Archivados 68 backups antiguos
- Limpieza de servidor: 3GB liberados

---

## 24. Sistema Híbrido de Base de Datos (Actualizado 2025-12-12)

### 24.1 Arquitectura de Datos



### 24.2 Reglas de Uso

| Operación | Base de Datos | Justificación |
|-----------|---------------|---------------|
| Auth/Login | PostgreSQL | Seguridad crítica |
| User CRUD | PostgreSQL | Integridad referencial |
| Groups/Tandas | PostgreSQL | Relaciones complejas |
| Contributions | PostgreSQL | Auditoría financiera |
| KYC/Compliance | PostgreSQL | Regulación |
| Recovery/2FA | PostgreSQL | Seguridad |
| Session temp | JSON | Velocidad, no persistente |
| MIA Chat | JSON | Datos no críticos |

### 24.3 Flujo de Decisión



---

## 25. Phase 6: Account Recovery System (2025-12-12)

### 25.1 Backup Codes

**Tabla:** user_backup_codes


**Endpoints:**
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/recovery/backup-codes/generate | Genera 10 códigos |
| POST | /api/recovery/backup-codes/verify | Verifica y usa código |
| GET | /api/recovery/backup-codes/status | Estado de códigos |

**Flujo de Generación:**


### 25.2 Security Questions

**Tabla:** user_security_questions


**Endpoints:**
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/recovery/security-questions/set | Configurar preguntas |
| GET | /api/recovery/security-questions/get | Obtener preguntas (sin respuestas) |
| POST | /api/recovery/security-questions/verify | Verificar respuestas |

**Reglas de Verificación:**
- Respuestas normalizadas: lowercase + trim
- Requiere 2/3 respuestas correctas
- Audit log en cada intento

---

## 26. Phase 6: Transaction PIN System (2025-12-12)

### 26.1 Schema

**Tabla:** user_transaction_pins


### 26.2 Configuración



### 26.3 Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/wallet/pin/set | Configurar PIN (4-6 dígitos) |
| POST | /api/wallet/pin/verify | Verificar PIN |
| GET | /api/wallet/pin/status | Estado del PIN |

### 26.4 Flujo de Verificación en Transacción



---

## 27. Phase 6: AML Transaction Monitoring (2025-12-12)

### 27.1 Risk Thresholds



### 27.2 Risk Scoring

| Flag | Puntos | Descripción |
|------|--------|-------------|
| HIGH_VALUE_TRANSACTION | +30 | >= L. 50,000 |
| POSSIBLE_STRUCTURING | +20 | L. 9,500 - 49,999 |
| STRUCTURING_PATTERN | +35 | 3+ cerca del umbral en 24h |
| RAPID_TRANSACTIONS | +25 | 5+ en 1 hora |
| HIGH_DAILY_VOLUME | +30 | >= L. 100,000 diario |
| NEW_USER_HIGH_VALUE | +20 | Usuario <7 días, >= L. 10,000 |
| UNUSUAL_HOURS | +10 | 1 AM - 5 AM |
| NEW_RECIPIENT | +15 | Primera transferencia a destinatario |
| NEW_DEVICE | +15 | Dispositivo diferente |

### 27.3 Risk Levels

| Score | Nivel | Acción |
|-------|-------|--------|
| 0-29 | low | ALLOW |
| 30-49 | medium | ALLOW + Log |
| 50-69 | high | REVIEW_REQUIRED |
| 70+ | critical | BLOCK |

### 27.4 Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/monitoring/analyze-transaction | Analizar riesgo |
| GET | /api/monitoring/alerts | Ver alertas |
| POST | /api/monitoring/alerts/:id/resolve | Resolver alerta |
| GET | /api/monitoring/dashboard | Stats de compliance |

---

## 28. Phase 7: WebAuthn/Biometrics (2025-12-12)

### 28.1 Schema

**Tabla:** user_webauthn_credentials


### 28.2 Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/auth/webauthn/register-options | Opciones para registro |
| POST | /api/auth/webauthn/register | Registrar credencial |
| POST | /api/auth/webauthn/authenticate-options | Opciones para auth |
| POST | /api/auth/webauthn/authenticate | Autenticar |
| GET | /api/auth/webauthn/credentials | Listar dispositivos |
| DELETE | /api/auth/webauthn/:id | Eliminar dispositivo |

### 28.3 Flujo de Registro



---

## 29. Phase 7: Custom Transaction Limits (2025-12-12)

### 29.1 Schema

**Tabla:** user_custom_limits


### 29.2 Límites por Defecto

| Límite | Valor | Descripción |
|--------|-------|-------------|
| daily_withdrawal_limit | L. 50,000 | Máximo retiro diario |
| single_transaction_limit | L. 25,000 | Máximo por transacción |
| monthly_limit | L. 500,000 | Máximo mensual |
| require_pin_threshold | L. 1,000 | Umbral para PIN |

### 29.3 Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/wallet/limits | Obtener límites |
| PUT | /api/wallet/limits | Actualizar límites |
| POST | /api/wallet/limits/request-increase | Solicitar aumento |

---

## 30. Phase 7: Withdrawal Whitelist (2025-12-12)

### 30.1 Schema

**Tabla:** user_withdrawal_whitelist


### 30.2 Tipos de Dirección

| Tipo | Campos Requeridos |
|------|-------------------|
| bank | bank_name, account_number, account_holder |
| mobile | phone_number, provider |
| crypto | wallet_address, network |

### 30.3 Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/wallet/whitelist | Listar direcciones |
| POST | /api/wallet/whitelist | Agregar dirección |
| POST | /api/wallet/whitelist/:id/verify | Verificar dirección |
| DELETE | /api/wallet/whitelist/:id | Eliminar dirección |

---

## 31. Session Timeout (Frontend)

### 31.1 Configuración



### 31.2 Eventos Monitoreados



### 31.3 Flujo



---

## Historial de Cambios (2025-12-12)

### Versión 2.0.0
- Documentado sistema híbrido de bases de datos
- Agregado Phase 6: Account Recovery System
  - Backup codes (10 códigos únicos)
  - Security questions (3 preguntas, 2/3 correctas)
  - Transaction PIN (4-6 dígitos, lockout 30min)
  - AML monitoring (risk scoring, alertas)
- Agregado Phase 7: Advanced Security
  - WebAuthn/Biometrics (6 endpoints)
  - Custom limits (3 endpoints)
  - Withdrawal whitelist (4 endpoints)
- Session timeout documentado (15 min)
- Total de endpoints: ~100
- Total de tablas PostgreSQL: 25+



---

## 24. Sistema Hibrido de Base de Datos (Actualizado 2025-12-12)

### 24.1 Arquitectura de Datos

La plataforma utiliza un sistema HIBRIDO con dos fuentes de datos:

**database.json (34KB) - Datos Legacy/Temporales:**
- users (11) - LEGACY, no usar
- groups (18) - LEGACY, no usar
- groupMembers
- tandas
- payments - DEPRECATED
- notifications
- verifications
- mia_conversations
- app_sessions
- sync_data
- matchingPreferences

**PostgreSQL (25+ tablas) - Datos Primarios:**
- users - PRIMARY
- groups - PRIMARY
- group_members - PRIMARY
- tandas - PRIMARY
- contributions - PRIMARY
- notifications - PRIMARY
- kyc_documents - PRIMARY
- audit_logs - PRIMARY
- compliance_alerts
- user_backup_codes
- user_security_questions
- user_transaction_pins
- user_webauthn_credentials
- user_custom_limits
- user_withdrawal_whitelist

### 24.2 Reglas de Uso

| Operacion | Base de Datos | Justificacion |
|-----------|---------------|---------------|
| Auth/Login | PostgreSQL | Seguridad critica |
| User CRUD | PostgreSQL | Integridad referencial |
| Groups/Tandas | PostgreSQL | Relaciones complejas |
| Contributions | PostgreSQL | Auditoria financiera |
| KYC/Compliance | PostgreSQL | Regulacion |
| Recovery/2FA | PostgreSQL | Seguridad |
| Session temp | JSON | Velocidad, no persistente |
| MIA Chat | JSON | Datos no criticos |

---

## 25. Phase 6: Account Recovery System (2025-12-12)

### 25.1 Backup Codes

**Tabla:** user_backup_codes

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | SERIAL | Primary key |
| user_id | VARCHAR(100) | ID del usuario |
| code_hash | VARCHAR(255) | Hash bcrypt del codigo |
| used | BOOLEAN | Si fue usado |
| used_at | TIMESTAMP | Cuando se uso |
| created_at | TIMESTAMP | Fecha creacion |

**Endpoints:**

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | /api/recovery/backup-codes/generate | Genera 10 codigos |
| POST | /api/recovery/backup-codes/verify | Verifica y usa codigo |
| GET | /api/recovery/backup-codes/status | Estado de codigos |

### 25.2 Security Questions

**Tabla:** user_security_questions

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | SERIAL | Primary key |
| user_id | VARCHAR(100) | ID usuario (UNIQUE) |
| question1-3 | TEXT | Preguntas |
| answer1-3_hash | VARCHAR(255) | Hash de respuestas |
| created_at | TIMESTAMP | Fecha creacion |
| updated_at | TIMESTAMP | Ultima actualizacion |

**Endpoints:**

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | /api/recovery/security-questions/set | Configurar preguntas |
| GET | /api/recovery/security-questions/get | Obtener preguntas |
| POST | /api/recovery/security-questions/verify | Verificar respuestas |

**Reglas:** Requiere 2/3 respuestas correctas para verificar.

---

## 26. Phase 6: Transaction PIN System (2025-12-12)

### 26.1 Schema

**Tabla:** user_transaction_pins

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | SERIAL | Primary key |
| user_id | VARCHAR(100) | ID usuario (UNIQUE) |
| pin_hash | VARCHAR(255) | Hash bcrypt del PIN |
| failed_attempts | INTEGER | Intentos fallidos |
| locked_until | TIMESTAMP | Bloqueado hasta |
| created_at | TIMESTAMP | Fecha creacion |

### 26.2 Configuracion

- PIN_THRESHOLD: L. 1,000 (requiere PIN para montos mayores)
- MAX_PIN_ATTEMPTS: 3 intentos
- PIN_LOCKOUT_MINUTES: 30 minutos de bloqueo

### 26.3 Endpoints

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | /api/wallet/pin/set | Configurar PIN (4-6 digitos) |
| POST | /api/wallet/pin/verify | Verificar PIN |
| GET | /api/wallet/pin/status | Estado del PIN |

---

## 27. Phase 6: AML Transaction Monitoring (2025-12-12)

### 27.1 Risk Thresholds

| Umbral | Valor | Descripcion |
|--------|-------|-------------|
| HIGH_VALUE_SINGLE | L. 50,000 | Transaccion unica |
| HIGH_VALUE_DAILY | L. 100,000 | Total diario |
| RAPID_TRANSACTIONS | 5 | En 1 hora |
| STRUCTURING_AMOUNT | L. 9,500 | Cerca del umbral |
| STRUCTURING_COUNT | 3 | En 24h |
| NEW_USER_HIGH_VALUE | L. 10,000 | Usuario nuevo |

### 27.2 Risk Scoring

| Flag | Puntos |
|------|--------|
| HIGH_VALUE_TRANSACTION | +30 |
| POSSIBLE_STRUCTURING | +20 |
| STRUCTURING_PATTERN | +35 |
| RAPID_TRANSACTIONS | +25 |
| HIGH_DAILY_VOLUME | +30 |
| NEW_USER_HIGH_VALUE | +20 |
| UNUSUAL_HOURS | +10 |
| NEW_RECIPIENT | +15 |
| NEW_DEVICE | +15 |

### 27.3 Risk Levels

| Score | Nivel | Accion |
|-------|-------|--------|
| 0-29 | low | ALLOW |
| 30-49 | medium | ALLOW + Log |
| 50-69 | high | REVIEW_REQUIRED |
| 70+ | critical | BLOCK |

### 27.4 Endpoints

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | /api/monitoring/analyze-transaction | Analizar riesgo |
| GET | /api/monitoring/alerts | Ver alertas |
| POST | /api/monitoring/alerts/:id/resolve | Resolver alerta |
| GET | /api/monitoring/dashboard | Stats de compliance |

---

## 28. Phase 7: WebAuthn/Biometrics (2025-12-12)

### 28.1 Schema

**Tabla:** user_webauthn_credentials

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | SERIAL | Primary key |
| user_id | VARCHAR(100) | ID usuario |
| credential_id | TEXT | ID de credencial (UNIQUE) |
| public_key | TEXT | Llave publica |
| counter | INTEGER | Contador de uso |
| device_name | VARCHAR(255) | Nombre dispositivo |
| created_at | TIMESTAMP | Fecha registro |
| last_used_at | TIMESTAMP | Ultimo uso |

### 28.2 Endpoints

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | /api/auth/webauthn/register-options | Opciones registro |
| POST | /api/auth/webauthn/register | Registrar credencial |
| POST | /api/auth/webauthn/authenticate-options | Opciones auth |
| POST | /api/auth/webauthn/authenticate | Autenticar |
| GET | /api/auth/webauthn/credentials | Listar dispositivos |
| DELETE | /api/auth/webauthn/:id | Eliminar dispositivo |

---

## 29. Phase 7: Custom Transaction Limits (2025-12-12)

### 29.1 Schema

**Tabla:** user_custom_limits

| Columna | Tipo | Default |
|---------|------|---------|
| id | SERIAL | - |
| user_id | VARCHAR(100) | UNIQUE |
| daily_withdrawal_limit | DECIMAL(15,2) | 50,000.00 |
| single_transaction_limit | DECIMAL(15,2) | 25,000.00 |
| monthly_limit | DECIMAL(15,2) | 500,000.00 |
| require_pin_threshold | DECIMAL(15,2) | 1,000.00 |
| limit_increase_request_status | VARCHAR(50) | NULL |

### 29.2 Endpoints

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /api/wallet/limits | Obtener limites |
| PUT | /api/wallet/limits | Actualizar limites |
| POST | /api/wallet/limits/request-increase | Solicitar aumento |

---

## 30. Phase 7: Withdrawal Whitelist (2025-12-12)

### 30.1 Schema

**Tabla:** user_withdrawal_whitelist

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | SERIAL | Primary key |
| user_id | VARCHAR(100) | ID usuario |
| address_type | VARCHAR(50) | bank, mobile, crypto |
| address_label | VARCHAR(100) | Etiqueta |
| bank_name | VARCHAR(100) | Nombre banco |
| account_number | VARCHAR(50) | Numero cuenta |
| account_holder | VARCHAR(100) | Titular |
| phone_number | VARCHAR(20) | Telefono |
| provider | VARCHAR(50) | Proveedor |
| wallet_address | VARCHAR(255) | Direccion crypto |
| network | VARCHAR(50) | Red crypto |
| is_verified | BOOLEAN | Verificado |
| verification_code | VARCHAR(10) | Codigo verificacion |

### 30.2 Endpoints

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /api/wallet/whitelist | Listar direcciones |
| POST | /api/wallet/whitelist | Agregar direccion |
| POST | /api/wallet/whitelist/:id/verify | Verificar direccion |
| DELETE | /api/wallet/whitelist/:id | Eliminar direccion |

---

## 31. Session Timeout (Frontend)

### 31.1 Configuracion

- SESSION_TIMEOUT: 15 minutos
- WARNING_BEFORE: 2 minutos antes

### 31.2 Eventos Monitoreados

mousedown, mousemove, keypress, scroll, touchstart, click

### 31.3 Comportamiento

1. Usuario inactivo por 13 minutos
2. Muestra modal de advertencia con countdown
3. Usuario puede hacer clic "Continuar sesion" o esperar
4. Si no responde en 2 minutos, logout automatico
5. Limpia localStorage y redirige a login

---

## Historial de Cambios (2025-12-12)

### Version 2.0.0
- Documentado sistema hibrido de bases de datos
- Agregado Phase 6: Account Recovery System
  - Backup codes (10 codigos unicos)
  - Security questions (3 preguntas, 2/3 correctas)
  - Transaction PIN (4-6 digitos, lockout 30min)
  - AML monitoring (risk scoring, alertas)
- Agregado Phase 7: Advanced Security
  - WebAuthn/Biometrics (6 endpoints)
  - Custom limits (3 endpoints)
  - Withdrawal whitelist (4 endpoints)
- Session timeout documentado (15 min)
- Total de endpoints: ~100
- Total de tablas PostgreSQL: 25+
