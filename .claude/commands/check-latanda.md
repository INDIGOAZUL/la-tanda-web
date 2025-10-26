# Check La Tanda System Status

Ejecuta el checklist completo del sistema La Tanda y genera un reporte del estado actual.

---

## Acciones a Realizar:

1. **Verificar PostgreSQL Database:**
   - Conexión activa
   - Conteo de registros en tablas críticas (users, groups, transactions, wallets)
   - Estado del servicio PostgreSQL

2. **Verificar APIs Corriendo:**
   - Procesos Node.js activos
   - Puertos en uso (3001, 3002, etc.)
   - Logs recientes de errores

3. **Verificar Nginx:**
   - Configuración válida (nginx -t)
   - Servicio activo
   - Document root correcto
   - Proxy_pass configurado

4. **Verificar Archivos Críticos:**
   - Localizar database.json files
   - Verificar permisos
   - Detectar conflictos

5. **Verificar SSL/HTTPS:**
   - Certificado válido
   - Fecha de expiración
   - HTTPS activo en puerto 443

6. **Generar Reporte:**
   - Estado general: ✅ Saludable / ⚠️ Advertencias / ❌ Crítico
   - Lista de problemas encontrados
   - Acciones recomendadas

---

## Reporte Esperado:

```
🔍 LA TANDA SYSTEM CHECK - [TIMESTAMP]

✅ SALUDABLE:
- PostgreSQL: Conectado (10 users, 14 groups, 4 contributions)
- API: Corriendo en puerto 3001 (PID: xxxxx)
- Nginx: Activo y configurado correctamente
- SSL: Válido hasta 2026-01-18

⚠️ ADVERTENCIAS:
- Document root: /var/www/html (debería ser /var/www/html/main)
- database.json encontrado en /home/ebanksnigel/database.json

❌ CRÍTICO:
- Nginx proxy_pass NO configurado para API
- Frontend no puede comunicarse con PostgreSQL

🎯 RECOMENDACIÓN:
Resolver problema crítico: Configurar nginx proxy_pass antes de continuar.
```

---

**Usage:** Escribe `/check-latanda` en cualquier momento para verificar el estado del sistema.
