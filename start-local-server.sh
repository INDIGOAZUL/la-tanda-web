#!/bin/bash

# Script para iniciar servidor local de desarrollo La Tanda
echo "🚀 Iniciando servidor local La Tanda Web..."

# Verificar si estamos en el directorio correcto
if [ ! -f "index.html" ]; then
    echo "❌ Error: No se encuentra index.html. Asegúrate de estar en el directorio la-tanda-web"
    exit 1
fi

# Mostrar IP local
LOCAL_IP=$(hostname -I | awk '{print $1}')

echo "📍 Servidor iniciado en:"
echo "   Local:    http://localhost:8000"
echo "   Red:      http://$LOCAL_IP:8000"
echo ""
echo "💡 Presiona Ctrl+C para detener el servidor"
echo "🔄 Los cambios se verán inmediatamente al recargar la página"
echo ""

# Iniciar servidor Python
python3 -m http.server 8000