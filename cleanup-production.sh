#!/bin/bash

# 🧹 CLEANUP PRODUCTION ENVIRONMENT - La Tanda Web System
# This script creates backups and removes obsolete files

echo "🧹 INICIANDO LIMPIEZA DEL ENTORNO DE PRODUCCIÓN..."
echo "=================================================="

# Create backup directory with timestamp
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📦 Creando backup en: $BACKUP_DIR"

# 1. CREAR BACKUP DE ARCHIVOS IMPORTANTES
echo "💾 Creando backup de archivos principales..."

# Sistema principal
cp la-tanda-complete.html "$BACKUP_DIR/" 2>/dev/null
cp home-dashboard.html "$BACKUP_DIR/" 2>/dev/null  
cp auth-enhanced.html "$BACKUP_DIR/" 2>/dev/null

# Assets principales
cp "Darkfield 2 new latanda logo.jpg" "$BACKUP_DIR/" 2>/dev/null
cp manifest.json "$BACKUP_DIR/" 2>/dev/null

# Documentación
cp README.md "$BACKUP_DIR/" 2>/dev/null
cp PHASE-1-IMPLEMENTATION-SUMMARY.md "$BACKUP_DIR/" 2>/dev/null
cp CLEANUP-ANALYSIS.md "$BACKUP_DIR/" 2>/dev/null

# APIs y Backend
cp api-adapter.js "$BACKUP_DIR/" 2>/dev/null
cp api-endpoints-config.js "$BACKUP_DIR/" 2>/dev/null
cp api-integration-manager.js "$BACKUP_DIR/" 2>/dev/null
cp payment-integration.js "$BACKUP_DIR/" 2>/dev/null
cp section-api-connector.js "$BACKUP_DIR/" 2>/dev/null

# Sistemas especializados
cp tanda-wallet.* "$BACKUP_DIR/" 2>/dev/null
cp kyc-registration.* "$BACKUP_DIR/" 2>/dev/null
cp groups-advanced-system.* "$BACKUP_DIR/" 2>/dev/null
cp commission-system.* "$BACKUP_DIR/" 2>/dev/null
cp marketplace-social.* "$BACKUP_DIR/" 2>/dev/null
cp ltd-token-economics.* "$BACKUP_DIR/" 2>/dev/null
cp web3-dashboard.* "$BACKUP_DIR/" 2>/dev/null
cp group-security-advisor.* "$BACKUP_DIR/" 2>/dev/null
cp mutual-confirmation-system.js "$BACKUP_DIR/" 2>/dev/null

echo "✅ Backup completado en $BACKUP_DIR"

# 2. ELIMINAR ARCHIVOS OBSOLETOS
echo ""
echo "🗑️ Eliminando archivos obsoletos..."

# Versiones antiguas de auth
echo "Eliminando versiones antiguas de auth..."
rm -f auth.html auth.js auth-styles.css
rm -f auth-modern.html auth-modern.css auth-modern.js
rm -f auth-modernized.html

# Backups antiguos
echo "Eliminando backups antiguos..."
rm -f home-dashboard-backup.html
rm -f la-tanda-complete-backup.html

# Versiones obsoletas de index
echo "Eliminando versiones obsoletas de index..."
rm -f index.html index-original.html index-backup-1909.html
rm -f index-broken-with-endpoints.html index-cyan-colors.html

# Dashboards obsoletos
echo "Eliminando dashboards obsoletos..."
rm -f dashboard.html complete-app.html la-tanda-ecosystem.html
rm -f la-tanda-unified.html la-tanda-unified.js

# Landings obsoletas
echo "Eliminando landings obsoletas..."
rm -f landing.html landing-premium.html downloaded-live-interface.html

# Apps antiguas
echo "Eliminando apps y sistemas antiguos..."
rm -f app.js styles.css tandas-manager.js tandas-styles.css

# Assets obsoletos
echo "Eliminando assets obsoletos..."
rm -f "Icon La Tanda.png" icon-la-tanda.png "darckfield 2 latanda.png"
rm -f "logo la tanda.png" logo-la-tanda-cyan.png logo-la-tanda-final.jpg
rm -f "new logo latanda final.jpg"

# Debug files
echo "Eliminando archivos de debug..."
rm -f debug-console.js debug-dropdown.html debug-login-july31.html
rm -f simple-test.html server.log

# Tests específicos (manteniendo solo los útiles)
echo "Eliminando tests específicos obsoletos..."
rm -f test-auth-behavior.html test-auth-flow.html test-button-visibility.html
rm -f test-dropdown-behavior.html test-dropdown-functionality.html
rm -f test-final-hamburger.html test-fixed-login.html test-hamburger-menu.html
rm -f test-implementation.html test-login-centered.html test-login-clean.html
rm -f test-login-debug.html test-positioning-fix.html
rm -f test-user-menu-fix.html test-user-menu-functionality.html
rm -f test-user-menu.html test-visibility-fix.html test-z-index-fix.html

# Demos específicos
echo "Eliminando demos específicos..."
rm -f group-security-demo.html

echo "✅ Limpieza de archivos completada"

# 3. MOSTRAR RESUMEN
echo ""
echo "📊 RESUMEN DE LIMPIEZA"
echo "======================"
echo "📦 Backup creado en: $BACKUP_DIR"
echo "🗑️ Archivos eliminados: ~45 archivos obsoletos"
echo "✅ Archivos principales mantenidos: ~25 archivos"

# 4. LISTAR ARCHIVOS RESTANTES
echo ""
echo "📁 ARCHIVOS RESTANTES EN PRODUCCIÓN:"
echo "====================================="
ls -la | grep -E "\.(html|css|js|json|md|jpg|png|sh)$" | wc -l | xargs echo "Total de archivos:"
echo ""
echo "🎯 ARCHIVOS PRINCIPALES:"
ls -la | grep -E "(la-tanda-complete|home-dashboard|auth-enhanced|tanda-wallet|kyc-registration)" | head -10

echo ""
echo "🎉 LIMPIEZA COMPLETADA EXITOSAMENTE"
echo "✅ El entorno está listo para la Fase 2"
echo "📋 Revisa CLEANUP-ANALYSIS.md para detalles completos"