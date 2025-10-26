# 🧪 Instrucciones de Testing - Tarjetas Tandas V2

## 🚀 Inicio Rápido

### 1. Acceder al Sistema de Testing
```bash
# El servidor está corriendo en:
http://localhost:8081

# Archivos de testing disponibles:
http://localhost:8081/test-tandas-v2.html        # Suite completa de testing
http://localhost:8081/groups-advanced-system-v3.html  # Sistema principal
```

### 2. Navegación para Testing

1. **Abrir el navegador** y ir a `http://localhost:8081/groups-advanced-system-v3.html`
2. **Hacer clic en la pestaña "Tandas"** para acceder a la nueva interfaz V2
3. **Abrir DevTools** (F12) para monitorear logs de debugging

## 📋 Lista de Verificación Manual

### ✅ **Funcionalidad Básica**
- [ ] Las tarjetas V2 se renderizan correctamente
- [ ] Se muestran 5 tandas con diferentes estados (active/completed/upcoming)
- [ ] Los indicadores de estado circulares aparecen en la esquina superior derecha
- [ ] Los montos se muestran con formato de moneda hondureña (L.)

### ✅ **Interacciones**
- [ ] **Expandir detalles**: Clic en "Ver más detalles" expande la sección
- [ ] **Menú dropdown**: Clic en los tres puntos (⋮) abre el menú contextual
- [ ] **Botón primario**: Los botones cambian según el estado de la tanda:
  - Tanda activa con pagos pendientes → "Gestionar Pagos" (amarillo pulsante)
  - Tanda activa sin pagos → "Registrar Pago" (verde)
  - Tanda próxima → "Iniciar Tanda" (cyan)
  - Tanda completada → "Ver Resumen" (azul)
- [ ] **Cerrar menú**: Clic fuera del dropdown cierra el menú

### ✅ **Diseño Visual**
- [ ] **Glassmorphism**: Fondo borroso con transparencia
- [ ] **Bordes animados**: Borde superior con colores según estado
- [ ] **Progreso visual**: Barra con steps individuales y puntos indicadores
- [ ] **Hover effects**: Las tarjetas se elevan al pasar el cursor
- [ ] **Status indicators**: Íconos circulares con colores apropiados

### ✅ **Responsive Design**
- [ ] **Desktop** (>768px): Grid de múltiples columnas
- [ ] **Mobile** (<768px): Una columna con márgenes apropiados
- [ ] **Touch devices**: Botones más grandes (52px mínimo)
- [ ] **Swipe indicator**: Texto "← Desliza →" en dispositivos táctiles

## 🔧 Testing Automático

### Ejecutar Suite de Testing Completa
1. Ir a `http://localhost:8081/test-tandas-v2.html`
2. Hacer clic en **"Ejecutar Tests Básicos"**
3. Revisar el **Debug Panel** en la esquina superior derecha
4. Ejecutar tests adicionales:
   - **Test Interacciones**: Verifica clics y expansiones
   - **Test Responsive**: Simula diferentes tamaños de pantalla
   - **Simular Móvil**: Cambia a vista de móvil

### Verificación por Consola
```javascript
// En DevTools Console, ejecutar:
const tester = new TandasV2Tester();
await tester.runAllTests();

// Ver resultados detallados:
console.log(window.testResults);
```

## 📱 Testing Móvil

### Simulación en Navegador
1. **Abrir DevTools** (F12)
2. **Activar Device Toolbar** (Ctrl+Shift+M)
3. **Seleccionar dispositivo**: iPhone SE, Pixel 5, etc.
4. **Recargar página** y navegar a sección Tandas
5. **Verificar**:
   - Layout de una columna
   - Botones más grandes
   - Menús centrados
   - Indicador de swipe

### Testing en Dispositivo Real
1. **Conectar móvil** a la misma red
2. **Encontrar IP local**: `ipconfig` (Windows) o `ifconfig` (Linux/Mac)
3. **Acceder desde móvil**: `http://[TU_IP]:8081/groups-advanced-system-v3.html`
4. **Probar gestos**:
   - Swipe derecho → Acción primaria
   - Swipe izquierdo → Menú contextual
   - Tap en detalles → Expandir/contraer

## 🐛 Debugging y Logs

### Console Logs Disponibles
```
📊 Cargando contenido de tandas V2
🎨 Using new tanda-card-v2 design system  
🃏 Rendering card 1: Tanda Enero 2025
✅ Post-render verification: 5 V2 cards found
📱 Adding mobile touch support to 5 cards
```

### Elementos de Debug en HTML
- **data-tanda-id**: Identificador único de cada tarjeta
- **data-expanded**: Estado de expansión de detalles
- **Classes de estado**: `.active`, `.completed`, `.upcoming`

## ⚠️ Problemas Comunes y Soluciones

### 1. "No se muestran las tarjetas"
- Verificar que la pestaña "Tandas" esté activa
- Revisar console por errores JavaScript
- Refrescar página (Ctrl+F5)

### 2. "CSS no se aplica correctamente"
- Verificar que el archivo CSS se carga sin errores
- Comprobar Network tab en DevTools
- Limpiar caché del navegador

### 3. "Interacciones no funcionan"
- Verificar console por errores JavaScript
- Comprobar que `advancedGroupsSystem` está inicializado
- Esperar a que termine la carga inicial

### 4. "Layout móvil no se activa"
- Asegurar viewport está configurado correctamente
- Verificar media queries en DevTools
- Probar en dispositivo real

## 📊 Métricas de Éxito

### Tests que Deben Pasar (Objetivo: 100%)
- ✅ Sistema inicializado
- ✅ Tarjetas renderizadas (5 esperadas)
- ✅ CSS Glassmorphism aplicado
- ✅ Estructura V2 completa
- ✅ Expansión de detalles funcional
- ✅ Menús dropdown operativos
- ✅ Acciones primarias configuradas
- ✅ Layout responsivo
- ✅ Soporte táctil (en dispositivos compatibles)
- ✅ Accesibilidad >80%

## 🎯 Siguientes Pasos

Una vez verificado todo:
1. **Documentar issues encontrados**
2. **Continuar con sistema de notificaciones**
3. **Implementar mejoras de navegación móvil**
4. **Desarrollar sección de matching inteligente**

---

**¿Listo para probar?** 🚀 
Abre `http://localhost:8081/groups-advanced-system-v3.html` y ve a la pestaña "Tandas"!