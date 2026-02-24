# Sistema de Gestión de Miembros de Grupo
## La Tanda Platform - Documentación Técnica

**Fecha:** 2025-12-18
**Versión:** 1.0

---

## 1. Diagrama de Flujo: Proceso de Invitación y Unión

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FLUJO DE INVITACIÓN A GRUPO                              │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │   ADMIN      │
    │  del Grupo   │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐      ┌─────────────────────────────────┐
    │ Crear        │      │ POST /api/groups/:id/members/   │
    │ Invitación   │─────▶│      invite                     │
    └──────────────┘      │                                 │
                          │ Body:                           │
                          │ - is_reusable: true/false       │
                          │ - max_uses: null o número       │
                          │ - message: texto                │
                          └─────────────┬───────────────────┘
                                        │
                                        ▼
                          ┌─────────────────────────────────┐
                          │ Se genera:                      │
                          │ - token único (64 chars)        │
                          │ - link: /invite/{token}         │
                          │ - expires_at: +7 días           │
                          └─────────────┬───────────────────┘
                                        │
                                        ▼
                          ┌─────────────────────────────────┐
                          │ Admin comparte link vía:        │
                          │ - WhatsApp                      │
                          │ - SMS                           │
                          │ - Email                         │
                          │ - Redes sociales                │
                          └─────────────┬───────────────────┘
                                        │
                                        ▼
    ┌──────────────┐      ┌─────────────────────────────────┐
    │   USUARIO    │      │ Usuario abre link               │
    │  Invitado    │─────▶│ /invite/{token}                 │
    └──────────────┘      └─────────────┬───────────────────┘
                                        │
                          ┌─────────────┴─────────────┐
                          │                           │
                          ▼                           ▼
                   ┌────────────┐              ┌────────────┐
                   │ ¿Usuario   │              │ ¿Usuario   │
                   │ registrado?│              │ NO         │
                   │ SÍ         │              │ registrado?│
                   └─────┬──────┘              └─────┬──────┘
                         │                           │
                         │                           ▼
                         │                    ┌────────────────┐
                         │                    │ Redirigir a    │
                         │                    │ /auth-enhanced │
                         │                    │ ?ref={token}   │
                         │                    └───────┬────────┘
                         │                            │
                         │                            ▼
                         │                    ┌────────────────┐
                         │                    │ Usuario se     │
                         │                    │ registra       │
                         │                    └───────┬────────┘
                         │                            │
                         └────────────┬───────────────┘
                                      │
                                      ▼
                          ┌─────────────────────────────────┐
                          │ POST /api/invitations/token/    │
                          │      {token}/accept             │
                          └─────────────┬───────────────────┘
                                        │
                                        ▼
                          ┌─────────────────────────────────┐
                          │ VALIDACIONES:                   │
                          │ 1. ¿Token existe?               │
                          │ 2. ¿No expirado?                │
                          │ 3. ¿Invitación válida?          │
                          │    - Si is_reusable=false:      │
                          │      status='pending'           │
                          │    - Si is_reusable=true:       │
                          │      use_count < max_uses       │
                          │ 4. ¿Usuario no es miembro?      │
                          │ 5. ¿Grupo no está lleno?        │
                          └─────────────┬───────────────────┘
                                        │
                          ┌─────────────┴─────────────┐
                          │                           │
                          ▼                           ▼
                   ┌────────────┐              ┌────────────┐
                   │ ÉXITO      │              │ ERROR      │
                   └─────┬──────┘              └─────┬──────┘
                         │                           │
                         ▼                           ▼
              ┌──────────────────┐         ┌──────────────────┐
              │ TRANSACCIÓN      │         │ Mostrar mensaje  │
              │ ATÓMICA:         │         │ de error al      │
              │                  │         │ usuario          │
              │ 1. INSERT        │         │                  │
              │    group_members │         │ Registrar en     │
              │                  │         │ failed_joins     │
              │ 2. UPDATE groups │         │ para seguimiento │
              │    member_count  │         └──────────────────┘
              │    (via trigger) │
              │                  │
              │ 3. UPDATE        │
              │    invitation    │
              │    status/count  │
              └────────┬─────────┘
                       │
                       ▼
              ┌──────────────────┐
              │ Notificar:       │
              │ - Usuario: ✅    │
              │ - Admin: 🔔      │
              │                  │
              │ Crear entry en   │
              │ notifications    │
              └──────────────────┘
```

---

## 2. Diagrama: Sincronización Automática de member_count

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              TRIGGER: sync_group_member_count                                │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────┐
                    │ group_members   │
                    │ tabla           │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
    ┌─────────┐        ┌─────────┐        ┌─────────┐
    │ INSERT  │        │ UPDATE  │        │ DELETE  │
    │         │        │ status  │        │         │
    └────┬────┘        └────┬────┘        └────┬────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ TRIGGER FIRES   │
                    │ AFTER INSERT,   │
                    │ UPDATE, DELETE  │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────────────────┐
                    │ UPDATE groups               │
                    │ SET member_count = (        │
                    │   SELECT COUNT(*)           │
                    │   FROM group_members        │
                    │   WHERE group_id = X        │
                    │   AND status = 'active'     │
                    │ )                           │
                    └─────────────────────────────┘
```

---

## 3. Diagrama: Manejo de Errores y Recuperación

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SISTEMA DE RECUPERACIÓN DE ERRORES                        │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────────────┐
    │ ERROR DETECTADO  │
    │ durante unión    │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────────────────────────┐
    │ 1. REGISTRAR ERROR                   │
    │    - Tabla: failed_group_joins       │
    │    - Campos:                         │
    │      * user_id                       │
    │      * group_id                      │
    │      * invitation_id                 │
    │      * error_type                    │
    │      * error_message                 │
    │      * created_at                    │
    │      * resolved: false               │
    └────────────────┬─────────────────────┘
                     │
                     ▼
    ┌──────────────────────────────────────┐
    │ 2. NOTIFICAR USUARIO                 │
    │    - Tipo: 'join_failed'             │
    │    - Mensaje personalizado           │
    │    - Link para reintentar            │
    │    - Contacto de soporte             │
    └────────────────┬─────────────────────┘
                     │
                     ▼
    ┌──────────────────────────────────────┐
    │ 3. NOTIFICAR ADMIN DEL GRUPO         │
    │    - Alerta de error                 │
    │    - Info del usuario afectado       │
    │    - Opciones:                       │
    │      * Agregar manualmente           │
    │      * Enviar nueva invitación       │
    │      * Contactar usuario             │
    └────────────────┬─────────────────────┘
                     │
                     ▼
    ┌──────────────────────────────────────┐
    │ 4. CRON JOB DIARIO                   │
    │    - Revisa failed_group_joins       │
    │    - Intenta resolver automático     │
    │    - Genera reporte para admins      │
    └──────────────────────────────────────┘
```

---

## 4. Tipos de Errores y Acciones

| Error | Causa | Acción Automática | Notificación |
|-------|-------|-------------------|--------------|
| `INVITATION_EXPIRED` | Token expiró | Sugerir nueva invitación | Usuario + Admin |
| `INVITATION_USED` | Ya fue usada | Mostrar que ya es miembro o solicitar nueva | Usuario |
| `GROUP_FULL` | Grupo lleno | Agregar a lista de espera | Usuario + Admin |
| `ALREADY_MEMBER` | Ya es miembro | Redirigir al grupo | Usuario |
| `USER_NOT_FOUND` | Error de registro | Reintentar registro | Usuario |
| `DB_ERROR` | Error de BD | Reintentar + Alerta admin | Admin |
| `TRANSACTION_FAILED` | Rollback | Reintentar automático | Usuario + Admin |

---

## 5. Tabla de Seguimiento: failed_group_joins

```sql
CREATE TABLE failed_group_joins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(50),
    user_email VARCHAR(255),
    group_id VARCHAR(50),
    invitation_id UUID,
    error_type VARCHAR(50) NOT NULL,
    error_message TEXT,
    error_details JSONB,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,
    resolved_by VARCHAR(50),
    resolution_type VARCHAR(50), -- 'auto', 'manual', 'expired'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_failed_joins_unresolved ON failed_group_joins(resolved) WHERE resolved = FALSE;
CREATE INDEX idx_failed_joins_user ON failed_group_joins(user_id);
CREATE INDEX idx_failed_joins_group ON failed_group_joins(group_id);
```

---

## 6. Implementación del Trigger de Sincronización

```sql
-- Función que sincroniza member_count
CREATE OR REPLACE FUNCTION sync_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar el grupo afectado
    IF TG_OP = 'DELETE' THEN
        UPDATE groups
        SET member_count = (
            SELECT COUNT(*) FROM group_members
            WHERE group_id = OLD.group_id AND status = 'active'
        )
        WHERE group_id = OLD.group_id;
        RETURN OLD;
    ELSE
        UPDATE groups
        SET member_count = (
            SELECT COUNT(*) FROM group_members
            WHERE group_id = NEW.group_id AND status = 'active'
        )
        WHERE group_id = NEW.group_id;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger que ejecuta la función
CREATE TRIGGER trigger_sync_member_count
AFTER INSERT OR UPDATE OR DELETE ON group_members
FOR EACH ROW
EXECUTE FUNCTION sync_group_member_count();
```

---

## 7. Mensajes de Notificación

### Para Usuario (error al unirse):
```
🔔 Hubo un problema al unirte al grupo

Hola {nombre},

No pudimos completar tu solicitud para unirte a "{nombre_grupo}".

❌ Error: {mensaje_error}

¿Qué puedes hacer?
1. Intenta nuevamente con este link: {retry_link}
2. Contacta al administrador del grupo
3. Si el problema persiste, escríbenos a soporte@latanda.online

El equipo de La Tanda
```

### Para Admin (nuevo error):
```
⚠️ Error en unión a tu grupo

Un usuario tuvo problemas al intentar unirse a "{nombre_grupo}":

👤 Usuario: {nombre_usuario} ({email})
📅 Fecha: {fecha}
❌ Error: {tipo_error}

Opciones:
• [Agregar manualmente]
• [Enviar nueva invitación]
• [Ver detalles]
```
