# La Tanda Session Start Checklist

**Trigger:** Al inicio de cada sesión de trabajo en La Tanda
**Purpose:** Verificar estado del sistema antes de hacer cambios

---

## 🔍 PROCEDIMIENTO AUTOMÁTICO

### Step 1: Leer Documentos de Estado
Siempre lee estos archivos PRIMERO:

1. `ADMIN-PANEL-FINAL-STATUS.md` - Estado del admin panel
2. `BACKEND-ANALYSIS-COMPLETE.md` - Estado de APIs y backend
3. `SESSION-START-CHECKLIST-*.md` - Último checklist (si existe)

### Step 2: Verificar PostgreSQL
```bash
# Check PostgreSQL connection and data
PGPASSWORD='latanda123' psql -U latanda_user -d latanda_production -h localhost -c "
SELECT
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL SELECT 'groups', COUNT(*) FROM groups
UNION ALL SELECT 'contributions', COUNT(*) FROM contributions
UNION ALL SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL SELECT 'user_wallets', COUNT(*) FROM user_wallets;
"
```

### Step 3: Verificar APIs Corriendo
```bash
# Check running Node.js APIs
ps aux | grep -E "node.*api|node.*server" | grep -v grep

# Check API ports
sudo netstat -tlnp | grep -E ":300[0-9]"
```

### Step 4: Verificar Nginx
```bash
# Test nginx configuration
sudo nginx -t

# Check nginx is running
sudo systemctl status nginx | head -10

# Verify document root and proxy settings
sudo grep -E "root |proxy_pass" /etc/nginx/sites-enabled/latanda.online
```

### Step 5: Buscar database.json Files
```bash
# Find all database.json files (potential conflicts)
find / -name "database.json" -type f 2>/dev/null
```

### Step 6: Verificar HTTPS/SSL
```bash
# Check SSL certificate expiration
sudo certbot certificates 2>/dev/null | grep -A 3 latanda.online
```

---

## 📊 GENERAR REPORTE

Después de ejecutar los pasos, genera un reporte con:

### ✅ Estado Saludable:
- PostgreSQL conectado: [SÍ/NO]
- Número de usuarios en DB: [N]
- API corriendo en puerto: [PUERTO]
- Nginx funcionando: [SÍ/NO]
- SSL válido hasta: [FECHA]

### ⚠️ Advertencias Detectadas:
- Múltiples database.json encontrados
- APIs corriendo en puertos inesperados
- Nginx config warnings
- Document root incorrecto

### ❌ Problemas Críticos:
- PostgreSQL no conecta
- API no corriendo
- Nginx caído
- SSL expirado
- Proxy_pass no configurado

---

## 🎯 DECISIÓN POST-CHECKLIST

Basado en el reporte:

**Si TODO está verde (✅):**
→ Proceder con la tarea solicitada

**Si hay advertencias (⚠️):**
→ Informar al usuario y preguntar si proceder o resolver primero

**Si hay problemas críticos (❌):**
→ DETENER y resolver problemas críticos primero antes de continuar

---

## 💡 RECORDATORIOS

- **SIEMPRE** ejecuta este checklist al inicio de sesión
- **NUNCA** asumas que el estado es igual a la sesión anterior
- **SIEMPRE** lee los documentos de estado antes de hacer cambios
- **PREGUNTA** al usuario antes de hacer cambios que afecten producción

---

**Version:** 1.0
**Last Updated:** 2025-10-21
