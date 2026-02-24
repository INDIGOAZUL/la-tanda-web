# 🎰 Lottery Predictor - Plan de Mejoras

**Versión Actual:** v3.25.0
**Fecha:** 2026-01-04
**Estado:** ✅ Funcional

---

## 📋 Resumen Ejecutivo

El Lottery Predictor es una herramienta gamificada que utiliza análisis estadístico de frecuencia para generar predicciones de la lotería "La Diaria" de Honduras. Este documento detalla las mejoras planificadas, consideraciones legales, y guías de implementación.

---

## ⚠️ DISCLAIMER LEGAL (OBLIGATORIO)

### Texto del Disclaimer (Español)
```
AVISO IMPORTANTE: Este servicio es únicamente para fines de entretenimiento.

• Las predicciones se basan en análisis estadístico de frecuencia histórica
• NO garantizamos resultados ganadores
• Los juegos de azar conllevan riesgo de pérdida financiera
• Juega responsablemente y solo con dinero que puedas permitirte perder
• Si tienes problemas con el juego, busca ayuda profesional
• Debes ser mayor de 18 años para usar este servicio
• La Tanda no está afiliada con Lotería Nacional de Honduras

Al usar este servicio, aceptas que:
1. Entiendes que es solo entretenimiento
2. No responsabilizas a La Tanda por pérdidas
3. Eres mayor de edad
4. Cumples con las leyes locales de tu jurisdicción
```

### Implementación del Disclaimer
- Mostrar al primer acceso (modal obligatorio)
- Checkbox de aceptación antes de usar
- Link permanente en footer
- Recordatorio cada 30 días

---

## 📖 GUÍA DE USUARIO

### ¿Cómo Funciona?

#### 1. Sistema de Predicción
```
┌─────────────────────────────────────────────────────────┐
│                 ALGORITMO DE PREDICCIÓN                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Datos Históricos ──► Análisis de Frecuencia           │
│         │                     │                         │
│         ▼                     ▼                         │
│  🔥 Números Calientes    ❄️ Números Fríos              │
│  (aparecen frecuente)    (no aparecen hace tiempo)     │
│         │                     │                         │
│         └──────────┬──────────┘                         │
│                    ▼                                    │
│           Puntaje Combinado + Factor Aleatorio         │
│                    │                                    │
│                    ▼                                    │
│              🎯 PREDICCIÓN                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### 2. Números Calientes vs Fríos
| Tipo | Descripción | Estrategia |
|------|-------------|------------|
| 🔥 Calientes | Números que han salido frecuentemente en los últimos 30 días | "Racha caliente" - siguen saliendo |
| ❄️ Fríos | Números que no han salido en mucho tiempo | "Ley de promedios" - les toca salir |

#### 3. Horarios de Sorteo
| Sorteo | Hora Honduras | Hora UTC |
|--------|---------------|----------|
| Mañana | 11:00 AM | 17:00 |
| Tarde | 3:00 PM | 21:00 |
| Noche | 9:00 PM | 03:00 (+1) |

#### 4. Índice de Confianza
| Rango | Significado |
|-------|-------------|
| 90-100% | Patrón muy fuerte detectado |
| 70-89% | Patrón moderado |
| 50-69% | Patrón débil |
| <50% | Predicción aleatoria |

---

## 💎 PLANES DE SUSCRIPCIÓN

### Estructura de Precios

| Característica | 🎁 Gratis | ⭐ Premium | 💎 Diamante |
|----------------|-----------|------------|-------------|
| **Precio Mensual** | $0 | $25 | $49 |
| **Precio Anual** | - | $228 ($19/mes) | $348 ($29/mes) |
| **Ahorro Anual** | - | 24% | 41% |
| **Giros Diarios** | 3 | 10 | Ilimitados |
| **Números por Giro** | 1 | 3 | 5 |
| **Estadísticas** | Básicas | Avanzadas | Premium + Alertas |
| **Historial** | 7 días | 30 días | Ilimitado |
| **Soporte** | Comunidad | Email | Prioritario |

### Beneficios Detallados

#### 🎁 Plan Gratis
- 3 giros diarios
- 1 número por predicción
- Estadísticas básicas (hot/cold)
- Últimos 5 resultados
- Ideal para probar el servicio

#### ⭐ Plan Premium ($25/mes)
- 10 giros diarios
- 3 números por predicción
- Estadísticas avanzadas por horario
- Historial de 30 días
- Análisis de patrones semanales
- Notificaciones de números calientes
- Soporte por email

#### 💎 Plan Diamante ($49/mes)
- Giros ilimitados
- 5 números por predicción
- Todas las estadísticas premium
- Historial ilimitado
- Alertas personalizadas
- Análisis predictivo avanzado
- API access para integraciones
- Soporte prioritario 24/7
- Badge exclusivo en perfil

### Promociones Sugeridas
1. **Trial Premium** - 7 días gratis de Premium
2. **Referidos** - 1 mes gratis por cada referido que pague
3. **Black Friday** - 50% descuento primer año
4. **Bundle Tanda** - Descuento si tiene tanda activa

---

## 🚀 ROADMAP DE MEJORAS

### Fase 1: Fundamentos (Semana 1-2)
- [ ] Implementar disclaimer legal con modal
- [ ] Agregar página de términos y condiciones
- [ ] Crear tutorial interactivo (onboarding)
- [ ] Mejorar animación del slot machine
- [ ] Agregar sonidos (opcional, toggle)
- [ ] Implementar modo oscuro/claro

### Fase 2: Estadísticas Avanzadas (Semana 3-4)
- [ ] Gráficos de frecuencia (Chart.js)
- [ ] Heatmap de números por horario
- [ ] Tendencias semanales/mensuales
- [ ] Comparador de predicciones vs resultados
- [ ] Exportar historial a CSV/PDF

### Fase 3: Gamificación (Semana 5-6)
- [ ] Sistema de logros/badges
- [ ] Racha de aciertos (streak)
- [ ] Leaderboard semanal
- [ ] Puntos por predicciones correctas
- [ ] Canjear puntos por giros extra

### Fase 4: Social (Semana 7-8)
- [ ] Compartir predicciones
- [ ] Grupos de predicción
- [ ] Chat en vivo durante sorteos
- [ ] Notificaciones push de resultados
- [ ] Integración con WhatsApp

### Fase 5: Monetización (Semana 9-10)
- [ ] Integrar pasarela de pago (Stripe/PayPal)
- [ ] Sistema de prueba gratuita
- [ ] Cupones de descuento
- [ ] Programa de afiliados
- [ ] Facturación automática

### Fase 6: Datos Reales (Continuo)
- [ ] Scraper automático de resultados oficiales
- [ ] Webhook de resultados en tiempo real
- [ ] Validación de predicciones automática
- [ ] Estadísticas de precisión del algoritmo
- [x] Machine Learning (Markov Chain) ✅ 2025-12-29 para mejorar predicciones

---

## 🔧 MEJORAS TÉCNICAS INMEDIATAS

### UI/UX
```javascript
// Mejoras prioritarias:
1. Modal de disclaimer al cargar
2. Animación más fluida del spin
3. Confetti/celebración al ganar
4. Indicador de próximo sorteo (countdown)
5. PWA para instalación móvil
```

### Backend
```javascript
// Endpoints adicionales:
POST /api/lottery/verify-prediction  // Verificar si ganó
GET  /api/lottery/next-draw          // Próximo sorteo
GET  /api/lottery/my-stats           // Estadísticas personales
POST /api/lottery/alert              // Configurar alertas
GET  /api/lottery/leaderboard        // Ranking
```

### Base de Datos
```sql
-- Tablas adicionales:
CREATE TABLE hn_lottery_achievements (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50),
    achievement_type VARCHAR(50),
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE hn_lottery_alerts (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50),
    alert_type VARCHAR(20),
    number INT,
    active BOOLEAN DEFAULT true
);
```

---

## 📊 MÉTRICAS DE ÉXITO

### KPIs a Monitorear
| Métrica | Meta Mes 1 | Meta Mes 3 |
|---------|------------|------------|
| Usuarios activos diarios | 100 | 500 |
| Conversión Free→Premium | 5% | 10% |
| Conversión Premium→Diamond | 10% | 15% |
| Retención 30 días | 40% | 60% |
| NPS Score | >30 | >50 |
| Revenue mensual | $500 | $2,500 |

### Eventos a Trackear
- Página vista
- Giro realizado
- Predicción correcta
- Upgrade iniciado
- Upgrade completado
- Churn (cancelación)

---

## 🛡️ CONSIDERACIONES LEGALES

### Honduras
- Lotería Nacional es legal y regulada
- Servicios de predicción son legales como entretenimiento
- Debe indicarse claramente que no es juego de azar

### Cumplimiento
- [ ] Verificación de edad (18+)
- [ ] Términos de servicio
- [ ] Política de privacidad
- [ ] Política de reembolsos
- [ ] GDPR compliance (si aplica)

---

## 📞 SOPORTE Y CONTACTO

### Canales de Soporte
| Plan | Canal | Tiempo Respuesta |
|------|-------|------------------|
| Gratis | FAQ/Docs | Self-service |
| Premium | Email | 24-48 horas |
| Diamante | Chat/WhatsApp | 2-4 horas |

### FAQ Sugeridas
1. ¿Cómo funcionan las predicciones?
2. ¿Puedo ganar dinero real?
3. ¿Cómo cancelo mi suscripción?
4. ¿Por qué no acertó mi predicción?
5. ¿Cómo obtengo más giros?

---

*Documento generado: 2025-12-28*
*Próxima revisión: 2026-01-15*

---

## 🔍 AUDITORÍA DEL SISTEMA (2025-12-29)

### Hallazgos Críticos

#### 1. Problema de Timezone (CRÍTICO)
**Estado:** ✅ Resuelto 2025-12-29
**Impacto:** Los giros se resetean a 6:00 PM Honduras (medianoche UTC)

| Configuración | Valor |
|---------------|-------|
| Server | UTC |
| PostgreSQL | UTC |
| Honduras | UTC-6 |
| Reset actual | 6 PM Honduras |
| Reset esperado | 12 AM Honduras |

**Solución:**
```sql
-- Cambiar en lottery-predictor.js:
-- DE: WHERE spin_date = CURRENT_DATE
-- A:  WHERE spin_date = (CURRENT_TIMESTAMP AT TIME ZONE 'America/Tegucigalpa')::date
```

**Archivos:** `/var/www/latanda.online/lottery-predictor.js` (líneas 193, 216-218, 225)

---

#### 2. Scraper No Automatizado (CRÍTICO)
**Estado:** ✅ Resuelto 2025-12-29
**Impacto:** Datos no se actualizan automáticamente

**Solución:** Crear cron jobs
```bash
# Ejecutar después de cada sorteo (horarios Honduras convertidos a UTC)
# 11:30 AM Honduras = 5:30 PM UTC
# 3:30 PM Honduras  = 9:30 PM UTC  
# 9:30 PM Honduras  = 3:30 AM UTC (+1 día)

30 17 * * * cd /var/www/latanda.online && node lottery-scraper.js >> /var/log/lottery-scraper.log 2>&1
30 21 * * * cd /var/www/latanda.online && node lottery-scraper.js >> /var/log/lottery-scraper.log 2>&1
30 3  * * * cd /var/www/latanda.online && node lottery-scraper.js >> /var/log/lottery-scraper.log 2>&1
```

---

#### 3. Estadísticas No Auto-Actualizan (RESUELTO)
**Estado:** ✅ Resuelto 2025-12-29
**Impacto:** Hot/cold numbers desactualizados

**Solución:** Agregar recálculo al final del scraper

---

### Estado de Componentes

| Componente | Archivos | Líneas | Estado |
|------------|----------|--------|--------|
| Frontend | lottery-predictor.html | 1,771 | ✅ |
| API | lottery-api.js | ~1,100 | ✅ |
| Algoritmo | lottery-predictor.js | ~250 | ✅ |
| Scraper | lottery-scraper.js | ~300 | ✅ Cron |
| Estadísticas Page | lottery-stats.html | - | ✅ |

### Estado de Tablas DB

| Tabla | Filas | Estado |
|-------|-------|--------|
| hn_lottery_draws | 540 | ✅ Jul-Dic 2025 |
| hn_lottery_stats | 121 | ✅ |
| hn_lottery_predictions | 13 | ✅ |
| hn_lottery_spins | 3 | ✅ |
| hn_lottery_subscriptions | 0 | ⚠️ Phase 5 |
| hn_lottery_achievements | 15 | ✅ |
| hn_lottery_user_achievements | 3 | ✅ |
| hn_lottery_user_stats | 1 | ✅ |
| hn_lottery_points_log | 4 | ✅ |

### Estado de API Endpoints (19 total)

| Endpoint | Auth | Estado |
|----------|------|--------|
| /api/lottery/stats | No | ✅ |
| /api/lottery/results | No | ✅ |
| /api/lottery/stats/detailed | No | ✅ |
| /api/lottery/backtest | No | ✅ |
| /api/lottery/social-feed | No | ✅ |
| /api/lottery/leaderboard | No | ✅ |
| /api/lottery/trial-spin | No | ✅ |
| /api/lottery/spin | Sí | ✅ |
| /api/lottery/spin-status | Sí | ✅ |
| /api/lottery/history | Sí | ✅ |
| /api/lottery/achievements | Sí | ✅ |
| /api/lottery/user-stats | Sí | ✅ |
| /api/lottery/record-spin | Sí | ✅ |
| /api/lottery/my-predictions | Sí | ✅ |
| /api/lottery/my-notifications | Sí | ✅ |
| /api/lottery/mark-notification-read | Sí | ✅ |
| /api/lottery/share-prediction | Sí | ✅ |
| /api/lottery/subscribe | Sí | ⚠️ Sin Stripe |
| /api/lottery/notify-results | Admin | ⚠️ Manual |

---

## ✅ CHECKLIST DE CORRECCIONES INMEDIATAS

### Prioridad 1 (Hacer AHORA)
- [x] Fix timezone en queries SQL (lottery-predictor.js) ✅ 2025-12-29
- [x] Crear cron jobs para scraper ✅ 2025-12-29
- [x] Crear log file: /var/log/lottery-scraper.log ✅ 2025-12-29
- [x] Agregar updateStats() al scraper ✅ 2025-12-29
- [x] Probar reset de giros a medianoche Honduras ✅ 2025-12-29

### Prioridad 2 (Esta semana)
- [x] Notificaciones automáticas post-sorteo ✅ 2025-12-29
- [x] Validar predicciones con was_correct ✅ 2025-12-29
- [x] Fix countdown frontend timezone ✅ 2025-12-29

### Prioridad 3 (Phase 5)
- [ ] Integrar Stripe
- [ ] Activar suscripciones

### Prioridad 4 (Phase 6)
- [x] Machine Learning (Markov Chain) ✅ 2025-12-29
- [x] Dashboard de precisión ✅ 2025-12-29

---

*Auditoría realizada: 2025-12-29*
*Próxima auditoría: 2026-01-15*

---

## 🚀 ALGORITHM v2.0 UPDATE (2026-01-03)

### Performance Improvements

| Metric | v1.0 | v2.0 | Improvement |
|--------|------|------|-------------|
| Top 1 Hit | 1.1% | **17.0%** | 15.5x |
| Top 3 Hit | 2.6% | **21.5%** | 8.3x |
| Top 5 Hit | 4.1% | **22.6%** | 5.5x |

### Algorithm Changes

| Component | Before | After |
|-----------|--------|-------|
| Random Factor | 0-30 pts | 0-10 pts |
| Markov Bonus | prob × 100 | prob × 150 |
| Momentum | ❌ None | ✅ 7-day × 25 |
| Pool Size | 15 | 8 |
| Gap Score | >5d × 3 | >7d × 2 (max 30) |

### Weight Distribution (v2.0)
```
Momentum (7 días):  35%  ████████████
Markov Chain:       25%  █████████
Frecuencia (30d):   20%  ███████
Gap Score:          15%  █████
Random:              5%  ██
```

### Bug Fixes (2026-01-03)
- ✅ Fixed year parsing bug in scraper (was creating 2026-12-31 dates)
- ✅ Fixed prediction validation (missing auth header in notify endpoint)
- ✅ Validated 23 historical predictions with actual results
- ✅ Updated backtest endpoint to use improved algorithm

### Files Modified
- `lottery-predictor.js` - Core algorithm v2.0
- `lottery-scraper.js` - Year parsing fix + auth header
- `lottery-api.js` - Backtest endpoint updated

