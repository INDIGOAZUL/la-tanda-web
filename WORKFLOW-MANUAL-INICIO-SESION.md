# 📋 WORKFLOW MANUAL - Inicio de Sesión La Tanda

**Versión:** 1.0
**Fecha:** 2025-10-21
**Tipo:** Procedimiento obligatorio al inicio de cada sesión

---

## 🎯 REGLA DE ORO

**AL INICIO DE CADA SESIÓN, EL USUARIO ESCRIBE:**

```
session-start
```

**O cualquiera de estas variantes:**
- `session-start`
- `inicio de sesión`
- `ejecuta session-start`
- `lee status docs y ejecuta session-start check`

---

## 🤖 PROCEDIMIENTO AUTOMÁTICO DE CLAUDE

Cuando recibo el comando "session-start", DEBO ejecutar en orden:

### **PASO 1: Leer Documentos de Estado** ⏱️ ~10 seg

```bash
# Leer estos archivos SIEMPRE:
1. ADMIN-PANEL-FINAL-STATUS.md
2. BACKEND-ANALYSIS-COMPLETE.md
3. SESSION-START-CHECKLIST-*.md (más reciente)
```

**Por qué:** Contexto de sesión anterior, problemas conocidos, estado último.

---

### **PASO 2: Ejecutar Script de Checklist** ⏱️ ~20 seg

```bash
./session-start-check.sh
```

**Genera reporte con:**
- ✅ PostgreSQL (conexión, datos en tablas)
- ✅ APIs corriendo (procesos, puertos)
- ✅ Nginx (config válida, estado)
- ✅ Proxy_pass (configurado o no)
- ✅ database.json files (ubicaciones, conflictos)
- ✅ SSL/HTTPS (validez)

---

### **PASO 3: Analizar y Categorizar** ⏱️ ~10 seg

**Clasificar hallazgos en:**

#### ✅ **SALUDABLE:**
- PostgreSQL conectado
- API corriendo
- Nginx activo
- SSL válido

#### ⚠️ **ADVERTENCIAS:**
- Document root incorrecto
- database.json duplicados
- Nginx config warnings (no críticos)

#### ❌ **CRÍTICO:**
- PostgreSQL desconectado
- API no corriendo
- Nginx caído
- proxy_pass faltante
- SSL expirado

---

### **PASO 4: Presentar Reporte** ⏱️ ~5 seg

**Formato:**

```markdown
# 🔍 SESSION-START REPORT - [TIMESTAMP]

## ✅ ESTADO SALUDABLE
- PostgreSQL: Conectado (10 users, 14 groups, 4 contributions)
- API: Corriendo en puerto 3001 (PID: xxxxx)
- Nginx: Activo

## ⚠️ ADVERTENCIAS DETECTADAS
- Document root: /var/www/html (debería ser /var/www/html/main)
- database.json encontrado en /home/ebanksnigel/database.json

## ❌ PROBLEMAS CRÍTICOS
- Nginx proxy_pass NO configurado
- Frontend no puede comunicarse con PostgreSQL API

## 🎯 RECOMENDACIÓN
[Acción sugerida basada en prioridad]
```

---

### **PASO 5: Preguntar al Usuario** ⏱️ Espera respuesta

**Si TODO verde (✅):**
```
✅ Sistema saludable. ¿En qué quieres trabajar hoy?
```

**Si hay advertencias (⚠️):**
```
⚠️ Hay advertencias no críticas.
¿Quieres:
A) Resolver advertencias primero
B) Continuar con otra tarea
```

**Si hay problemas críticos (❌):**
```
❌ PROBLEMA CRÍTICO DETECTADO
Recomiendo resolver antes de continuar:
1. [Problema 1]
2. [Problema 2]

¿Procedo a resolver o prefieres trabajar en otra cosa?
```

---

## 📊 EJEMPLO COMPLETO

### **Usuario escribe:**
```
session-start
```

### **Claude responde:**

```markdown
🔍 Ejecutando session-start checklist...

📖 Leyendo documentos de estado...
   ✅ ADMIN-PANEL-FINAL-STATUS.md
   ✅ BACKEND-ANALYSIS-COMPLETE.md
   ✅ SESSION-START-CHECKLIST-20251021-153000.md

🔧 Ejecutando checks del sistema...
   ✅ PostgreSQL: Conectado
   ✅ API: Corriendo en puerto 3001
   ✅ Nginx: Activo
   ⚠️ Proxy_pass: NO configurado
   ✅ SSL: Válido hasta 2026-01-18

---

# 🔍 SESSION-START REPORT - 2025-10-21 15:35:00

## ✅ ESTADO SALUDABLE
- PostgreSQL: Conectado (10 users, 14 groups, 4 contributions, 0 transactions)
- API: Corriendo en puerto 3001 (PID: 31138)
- Nginx: Activo y configuración válida
- SSL: Válido hasta 2026-01-18

## ⚠️ ADVERTENCIAS
- database.json encontrado en /home/ebanksnigel/database.json
- 0 transactions en PostgreSQL (puede necesitar migración)

## ❌ PROBLEMAS CRÍTICOS
- Nginx proxy_pass NO configurado
- Frontend no puede comunicarse con PostgreSQL API

## 🎯 RECOMENDACIÓN
**Prioridad:** Configurar nginx proxy_pass para conectar frontend con API

**Contexto (de docs):**
- Última sesión estábamos en "Opción A paso a paso"
- PostgreSQL migración completada
- Endpoint /api/user/transactions agregado
- Falta conectar nginx a puerto 3001

---

❌ PROBLEMA CRÍTICO DETECTADO
¿Quieres que configure nginx proxy_pass ahora?

A) Sí, configurar proxy_pass
B) No, trabajar en otra cosa
```

---

## 🔄 VARIACIONES DEL COMANDO

**Acepto cualquiera de estos:**

```
session-start
inicio de sesión
ejecuta session-start
lee status docs
check system
verifica estado
start session
comienza sesión
```

**Palabras clave que activan el procedimiento:**
- `session-start`
- `inicio` + `sesión`
- `check` + `system`
- `status` + `docs`

---

## ⚠️ DISCIPLINA REQUERIDA

### **COMPROMISO DEL USUARIO:**

✅ **SIEMPRE escribir "session-start" al inicio de cada nueva conversación**

✅ **NO asumir que recuerdo la sesión anterior**

✅ **Esperar el reporte completo antes de dar instrucciones**

### **COMPROMISO DE CLAUDE:**

✅ **SIEMPRE ejecutar el procedimiento completo cuando reciba "session-start"**

✅ **NUNCA saltarse pasos del checklist**

✅ **SIEMPRE leer los docs de estado antes de responder**

✅ **NUNCA asumir que el estado es igual a sesión anterior**

---

## 📁 ARCHIVOS RELACIONADOS

```
/home/ebanksnigel/la-tanda-web/
├── session-start-check.sh                    # Script del checklist
├── ADMIN-PANEL-FINAL-STATUS.md              # Estado admin panel
├── BACKEND-ANALYSIS-COMPLETE.md             # Estado APIs/backend
├── SESSION-START-CHECKLIST-*.md             # Reportes históricos
└── WORKFLOW-MANUAL-INICIO-SESION.md         # Este documento
```

---

## 🎓 BENEFICIOS

### **Con este workflow:**

✅ **Siempre empiezas con contexto completo**
- Sabes qué funciona
- Sabes qué está roto
- Sabes en qué estabas trabajando

✅ **Evitas errores por desactualización**
- No asumes estado
- No rompes lo que funciona
- No duplicas trabajo

✅ **Ahorras tiempo**
- 45 segundos de checklist
- vs. horas debuggeando problemas

✅ **Documentación automática**
- Cada sesión genera reporte
- Historial de cambios
- Troubleshooting más fácil

---

## 🚨 QUÉ PASA SI NO LO HACES

### **Sin "session-start":**

❌ Claude empieza SIN contexto
❌ No sabe qué APIs están corriendo
❌ No sabe si PostgreSQL está conectado
❌ No sabe qué problemas hay
❌ Puede romper cosas que funcionaban

### **Resultado:**
- ⏱️ Pierdes tiempo debuggeando
- 😤 Frustración por problemas recurrentes
- 🔄 Trabajo duplicado
- 💥 Rompes producción sin darte cuenta

---

## ✅ CHECKLIST DE VERIFICACIÓN

Al final de ESTA sesión, verifica que:

- [ ] Entiendes el workflow
- [ ] Sabes que escribir "session-start" al inicio
- [ ] Tienes este documento guardado
- [ ] Script `session-start-check.sh` existe y funciona
- [ ] Probamos el workflow al menos una vez

---

## 🎯 PRÓXIMA SESIÓN

**Literalmente lo primero que escribas debe ser:**

```
session-start
```

**Yo responderé con el reporte completo y continuaremos desde ahí.**

---

**Versión:** 1.0
**Última actualización:** 2025-10-21
**Status:** ✅ Activo
**Próxima revisión:** Después de 5 sesiones de uso
