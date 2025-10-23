#!/bin/bash

# Script de configuración de desarrollo para La Tanda Web
echo "🔧 Configurando entorno de desarrollo La Tanda..."

# Crear configuración de VS Code si no existe
if [ ! -d ".vscode" ]; then
    mkdir .vscode
    echo "📁 Creado directorio .vscode"
fi

# Configuración de VS Code para desarrollo web
cat > .vscode/settings.json << 'EOF'
{
    "liveServer.settings.port": 5500,
    "liveServer.settings.CustomBrowser": "chrome",
    "liveServer.settings.donotShowInfoMsg": true,
    "liveServer.settings.donotVerifyTags": true,
    "emmet.includeLanguages": {
        "javascript": "javascriptreact"
    },
    "files.autoSave": "afterDelay",
    "files.autoSaveDelay": 1000,
    "editor.formatOnSave": true,
    "editor.tabSize": 4,
    "editor.insertSpaces": true,
    "html.format.indentInnerHtml": true,
    "css.validate": true,
    "javascript.validate.enable": true
}
EOF

# Configuración de extensiones recomendadas
cat > .vscode/extensions.json << 'EOF'
{
    "recommendations": [
        "ritwickdey.liveserver",
        "bradlc.vscode-tailwindcss",
        "esbenp.prettier-vscode",
        "formulahendry.auto-rename-tag",
        "ms-vscode.vscode-javascript"
    ]
}
EOF

# Crear archivo de tareas para VS Code
cat > .vscode/tasks.json << 'EOF'
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "Start Local Server",
            "type": "shell",
            "command": "python3",
            "args": ["-m", "http.server", "8000"],
            "group": "build",
            "presentation": {
                "echo": true,
                "reveal": "always",
                "focus": false,
                "panel": "new"
            },
            "problemMatcher": []
        },
        {
            "label": "Open in Browser",
            "type": "shell",
            "command": "open",
            "args": ["http://localhost:8000"],
            "group": "build",
            "dependsOn": "Start Local Server"
        }
    ]
}
EOF

echo "✅ Configuración de VS Code creada"
echo ""
echo "🎯 Para usar VS Code con Live Server:"
echo "1. code . (abrir VS Code en este directorio)"
echo "2. Instalar extensión 'Live Server' si no está instalada"
echo "3. Click derecho en index.html → 'Open with Live Server'"
echo "4. ¡Los cambios se verán automáticamente!"
echo ""
echo "🐍 Para usar servidor Python:"
echo "1. ./start-local-server.sh"
echo "2. Abrir http://localhost:8000 en el navegador"
echo "3. Recargar manualmente después de cambios"