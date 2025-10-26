#!/bin/bash
# Identifica en qué entorno estás trabajando

HOSTNAME=$(hostname)
CURRENT_IP=$(curl -s ifconfig.me 2>/dev/null)

echo "════════════════════════════════════════"
echo "🔍 IDENTIFICADOR DE ENTORNO"
echo "════════════════════════════════════════"
echo ""

if [ "$HOSTNAME" = "penguin" ]; then
    echo "🖥️  ENTORNO: DESARROLLO LOCAL"
    echo ""
    echo "Hostname: $HOSTNAME"
    echo "IP: $CURRENT_IP"
    echo "Directorio: $(pwd)"
    echo "Usuario: $(whoami)"
    echo ""
    echo "⚠️  IMPORTANTE:"
    echo "Los cambios que hagas aquí NO afectan https://latanda.online"
    echo ""
    echo "Para aplicar cambios a producción:"
    echo "  ./deploy-to-production.sh"
    echo ""
elif [ "$HOSTNAME" = "latanda" ]; then
    echo "🌐 ENTORNO: PRODUCCIÓN (https://latanda.online)"
    echo ""
    echo "Hostname: $HOSTNAME"
    echo "IP: $CURRENT_IP (168.231.67.201)"
    echo "Directorio: $(pwd)"
    echo "Usuario: $(whoami)"
    echo ""
    echo "🚨 CUIDADO:"
    echo "Los cambios que hagas aquí afectan DIRECTAMENTE a usuarios reales"
    echo "Siempre haz backup antes de modificar archivos"
    echo ""
    echo "Para backup:"
    echo "  ./backup-production.sh"
    echo ""
else
    echo "❓ ENTORNO: DESCONOCIDO"
    echo ""
    echo "Hostname: $HOSTNAME"
    echo "IP: $CURRENT_IP"
    echo ""
    echo "⚠️  No puedo determinar si esto es local o producción"
    echo ""
fi

echo "════════════════════════════════════════"
