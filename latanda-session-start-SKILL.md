---
name: La Tanda Session Start
description: Verifica el estado completo del sistema La Tanda antes de comenzar a trabajar. Ejecuta checks de PostgreSQL, APIs, Nginx, SSL y detecta conflictos entre database.json files.
---

# La Tanda Session Start Checklist

Ejecuta este procedimiento SIEMPRE al inicio de cada sesión de trabajo.

## PASO 1: Leer Documentos de Estado

Lee estos archivos PRIMERO para contexto:

1. `ADMIN-PANEL-FINAL-STATUS.md` - Estado del admin panel
2. `BACKEND-ANALYSIS-COMPLETE.md` - Estado de APIs
3. Último `SESSION-START-CHECKLIST-*.md` (si existe)

## PASO 2: Verificar PostgreSQL

```bash
PGPASSWORD='latanda123' psql -U latanda_user -d latanda_production -h localhost -c "
SELECT
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL SELECT 'groups', COUNT(*) FROM groups
UNION ALL SELECT 'contributions', COUNT(*) FROM contributions
UNION ALL SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL SELECT 'user_wallets', COUNT(*) FROM user_wallets;
"
```

## PASO 3: Verificar APIs Corriendo

```bash
# APIs activas
ps aux | grep -E "node.*api|node.*server" | grep -v grep

# Puertos en uso
sudo netstat -tlnp | grep -E ":300[0-9]"
```

## PASO 4: Verificar Nginx

```bash
# Test config
sudo nginx -t

# Status
sudo systemctl status nginx | head -10

# Configuración crítica
sudo grep -E "root |proxy_pass" /etc/nginx/sites-enabled/latanda.online
```

## PASO 5: Buscar database.json Files

```bash
find / -name "database.json" -type f 2>/dev/null
```

⚠️ **ALERTA:** Si encuentra más de 1 archivo, hay conflicto de datos.

## PASO 6: Verificar SSL

```bash
sudo certbot certificates 2>/dev/null | grep -A 3 latanda.online
```

## GENERAR REPORTE

Después de ejecutar todos los pasos, presenta:

### ✅ Estado Saludable:
- PostgreSQL: [CONECTADO/DESCONECTADO]
- Usuarios en DB: [N]
- API en puerto: [PUERTO]
- Nginx: [ACTIVO/INACTIVO]
- SSL válido hasta: [FECHA]

### ⚠️ Advertencias:
- Database.json duplicados
- Document root incorrecto
- Nginx config warnings

### ❌ Problemas Críticos:
- PostgreSQL no conecta
- API no corriendo
- Nginx caído
- SSL expirado
- proxy_pass faltante

## DECISIÓN POST-CHECK

**Si TODO verde (✅):** Proceder con la tarea

**Si hay advertencias (⚠️):** Informar al usuario, preguntar si proceder

**Si hay críticos (❌):** DETENER y resolver antes de continuar

## RECORDATORIOS

- ✅ SIEMPRE ejecuta este check al inicio
- ✅ NUNCA asumas que el estado es igual a sesión anterior
- ✅ SIEMPRE lee docs de estado antes de cambios
- ✅ PREGUNTA antes de cambios en producción
