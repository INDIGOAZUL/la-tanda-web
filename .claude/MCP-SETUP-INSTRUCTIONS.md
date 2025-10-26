# MCP (Model Context Protocol) Setup Instructions

## PostgreSQL Connector Configuration

Este conector permite a Claude Code acceder directamente a la base de datos PostgreSQL sin necesidad de escribir comandos `psql` manualmente.

---

## 📋 Instalación

### Para Claude Desktop App:

1. **Abrir configuración de Claude Desktop:**
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%/Claude/claude_desktop_config.json`
   - Linux: `~/.config/Claude/claude_desktop_config.json`

2. **Agregar configuración del servidor MCP:**

```json
{
  "mcpServers": {
    "latanda-postgresql": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://latanda_user:latanda123@localhost:5432/latanda_production"
      ],
      "env": {
        "PGPASSWORD": "latanda123"
      }
    }
  }
}
```

3. **Reiniciar Claude Desktop**

4. **Verificar instalación:**
   - En el chat, Claude debería tener acceso a herramientas como:
     - `mcp__latanda-postgresql__query` - Ejecutar queries SQL
     - `mcp__latanda-postgresql__list_tables` - Listar tablas
     - `mcp__latanda-postgresql__describe_table` - Describir estructura de tabla

---

## 🔧 Para Claude Code (VS Code / CLI):

La configuración ya está creada en:
```
/home/ebanksnigel/la-tanda-web/.claude/mcp-config.json
```

Claude Code debería detectarla automáticamente.

---

## ✅ Verificación

Prueba estos comandos en Claude:

```
"Muéstrame todas las tablas en latanda_production"
"¿Cuántos usuarios hay en la tabla users?"
"Describe la estructura de la tabla groups"
```

Si el conector funciona correctamente, Claude podrá responder sin necesidad de usar comandos bash.

---

## 🎯 Beneficios

**Antes (sin MCP):**
```bash
PGPASSWORD='latanda123' psql -U latanda_user -d latanda_production -h localhost -c "SELECT COUNT(*) FROM users"
```

**Después (con MCP):**
```
Usuario: "¿Cuántos usuarios tenemos?"
Claude: [Consulta automáticamente y responde: "10 usuarios"]
```

---

## 🔐 Seguridad

**IMPORTANTE:** Este conector tiene acceso completo a la base de datos. Asegúrate de:

- ✅ Usar credenciales con permisos apropiados
- ✅ No compartir el archivo de configuración
- ✅ Mantener backups regulares
- ⚠️ Revisar queries antes de ejecutar en producción

---

## 🐛 Troubleshooting

### Error: "MCP server not found"
**Solución:** Instalar el paquete globalmente:
```bash
npm install -g @modelcontextprotocol/server-postgres
```

### Error: "Connection refused"
**Solución:** Verificar que PostgreSQL esté corriendo:
```bash
sudo systemctl status postgresql
```

### Error: "Authentication failed"
**Solución:** Verificar credenciales:
```bash
PGPASSWORD='latanda123' psql -U latanda_user -d latanda_production -h localhost -c "SELECT 1"
```

---

**Version:** 1.0
**Last Updated:** 2025-10-21
**Status:** ✅ Configurado
