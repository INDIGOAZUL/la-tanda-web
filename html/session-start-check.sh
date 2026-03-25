#!/bin/bash
# La Tanda Session Start Checklist
# Ejecuta: ./session-start-check.sh

REPORT_FILE="SESSION-START-CHECKLIST-$(date +%Y%m%d-%H%M%S).md"

# Output to both terminal and file
exec > >(tee -a "$REPORT_FILE")

echo "# 🔍 LA TANDA SESSION-START CHECKLIST"
echo "**Fecha:** $(date '+%Y-%m-%d %H:%M:%S')"
echo "**Usuario:** $(whoami)"
echo "**Directorio:** $(pwd)"
echo ""
echo "---"
echo ""

# echo "📊 1. POSTGRESQL DATABASE"
# echo "---"
# PGPASSWORD='latanda123' psql -U latanda_user -d latanda_production -h localhost -c "
# SELECT
#   'users' as table_name, COUNT(*) as count FROM users
# UNION ALL SELECT 'groups', COUNT(*) FROM groups
# UNION ALL SELECT 'contributions', COUNT(*) FROM contributions
# UNION ALL SELECT 'transactions', COUNT(*) FROM transactions
# UNION ALL SELECT 'user_wallets', COUNT(*) FROM user_wallets;
# " 2>&1
# echo ""

echo "🚀 2. APIS CORRIENDO"
echo "---"
ps aux | grep -E "node.*api|node.*server" | grep -v grep || echo "⚠️ No hay APIs corriendo"
echo ""

echo "🌐 3. NGINX STATUS"
echo "---"
sudo nginx -t 2>&1 | head -5
sudo systemctl is-active nginx && echo "✅ Nginx activo" || echo "❌ Nginx inactivo"
echo ""

echo "🔗 4. NGINX PROXY CONFIGURATION"
echo "---"
sudo grep -E "proxy_pass" /etc/nginx/sites-enabled/latanda.online && echo "✅ Proxy configurado" || echo "⚠️ NO hay proxy_pass configurado"
echo ""

echo "📁 5. DATABASE.JSON FILES"
echo "---"
find / -name "database.json" -type f 2>/dev/null | while read f; do
  echo "- $f ($(stat -c%s "$f" 2>/dev/null) bytes)"
done
echo ""

echo "🔒 6. SSL/HTTPS"
echo "---"
sudo certbot certificates 2>/dev/null | grep -A 2 "latanda.online" || echo "⚠️ No se pudo verificar SSL"
echo ""

echo "---"
echo ""
echo "## ✅ CHECKLIST COMPLETO"
echo ""
echo "**Reporte guardado en:** \`$REPORT_FILE\`"
echo ""
echo "**Próximo paso:** Analiza los resultados y decide acción."
