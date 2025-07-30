#!/bin/bash

# Workflow de Git para desarrollo seguro de La Tanda
echo "🔀 Git Workflow Helper para La Tanda Web"

show_help() {
    echo ""
    echo "Uso: ./git-workflow.sh [comando]"
    echo ""
    echo "Comandos disponibles:"
    echo "  preview     - Ver cambios antes de commitear"
    echo "  stage       - Añadir archivos al staging"
    echo "  commit      - Hacer commit con mensaje automático"
    echo "  push        - Hacer push a GitHub"
    echo "  status      - Ver estado actual"
    echo "  diff        - Ver diferencias de archivos"
    echo "  branch      - Crear rama de desarrollo"
    echo "  help        - Mostrar esta ayuda"
    echo ""
}

case "$1" in
    "preview"|"p")
        echo "📋 Estado actual del repositorio:"
        git status
        echo ""
        echo "📝 Cambios en archivos modificados:"
        git diff --name-only
        echo ""
        echo "🔍 Vista previa de cambios:"
        git diff --color=always | head -50
        ;;
    
    "stage"|"s")
        echo "📦 Añadiendo archivos al staging..."
        git add .
        echo "✅ Archivos añadidos al staging"
        git status
        ;;
    
    "commit"|"c")
        if [ -z "$2" ]; then
            echo "💬 Ingresa el mensaje del commit:"
            read -r commit_message
        else
            commit_message="$2"
        fi
        
        echo "💾 Haciendo commit: $commit_message"
        git commit -m "$commit_message

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
        ;;
    
    "push")
        echo "🚀 Haciendo push a GitHub..."
        git push origin main
        echo "✅ Cambios subidos a GitHub"
        echo "🌐 Disponible en: https://indigoazul.github.io/la-tanda-web/"
        ;;
    
    "status")
        git status
        ;;
    
    "diff")
        git diff --color=always
        ;;
    
    "branch")
        if [ -z "$2" ]; then
            echo "🌿 Ingresa el nombre de la nueva rama:"
            read -r branch_name
        else
            branch_name="$2"
        fi
        
        echo "🌿 Creando rama de desarrollo: $branch_name"
        git checkout -b "$branch_name"
        echo "✅ Rama creada y cambiada a: $branch_name"
        ;;
    
    "help"|"-h"|"--help"|"")
        show_help
        ;;
    
    *)
        echo "❌ Comando desconocido: $1"
        show_help
        ;;
esac