# 🛠️ La Tanda Web - Guía de Desarrollo Local

## 🚀 Inicio Rápido

### Opción 1: VS Code + Live Server (Recomendado)
```bash
# 1. Abrir VS Code en el proyecto
code .

# 2. Instalar extensión Live Server
# 3. Click derecho en index.html → "Open with Live Server"
# 4. ¡Los cambios se ven automáticamente!
```

### Opción 2: Servidor Python Simple
```bash
# Iniciar servidor local
./start-local-server.sh

# Abrir en navegador
# http://localhost:8000
```

## 🔄 Workflow de Desarrollo

### Ver Cambios Antes de Commitear
```bash
# Ver estado y diferencias
./git-workflow.sh preview

# Ver cambios específicos
./git-workflow.sh diff
```

### Hacer Commits Seguros
```bash
# 1. Ver cambios
./git-workflow.sh preview

# 2. Añadir al staging
./git-workflow.sh stage

# 3. Hacer commit
./git-workflow.sh commit "Descripción del cambio"

# 4. Subir a GitHub (después de verificar local)
./git-workflow.sh push
```

## 🌿 Trabajar con Ramas

### Crear Rama de Desarrollo
```bash
# Crear nueva rama para features
./git-workflow.sh branch feature/nueva-funcionalidad

# Trabajar en la rama...
# Hacer commits...

# Volver a main
git checkout main

# Merge cuando esté listo
git merge feature/nueva-funcionalidad
```

## 📱 Desarrollo Responsive

### Probar en Diferentes Dispositivos
```bash
# Después de iniciar el servidor local:
# http://localhost:8000

# Usar DevTools del navegador:
# F12 → Toggle device toolbar
# Probar: iPhone, iPad, Desktop
```

### URLs de Prueba Local
- **Desktop**: http://localhost:8000
- **Network**: http://[TU-IP]:8000 (para probar en móvil)
- **Live Server**: http://127.0.0.1:5500 (con VS Code)

## 🎯 Flujo Recomendado

1. **Desarrollo**:
   ```bash
   code .                    # Abrir VS Code
   # Click derecho → Live Server
   # Hacer cambios y ver en tiempo real
   ```

2. **Antes de Commit**:
   ```bash
   ./git-workflow.sh preview # Ver qué cambiará
   ```

3. **Commit y Deploy**:
   ```bash
   ./git-workflow.sh stage   # Añadir cambios
   ./git-workflow.sh commit "Mi cambio"
   ./git-workflow.sh push    # Solo si estás seguro
   ```

## 🚨 Mejores Prácticas

### ✅ DO (Hacer)
- Siempre probar localmente antes de commitear
- Usar ramas para features grandes
- Commits pequeños y descriptivos
- Probar en desktop y móvil

### ❌ DON'T (No Hacer)  
- Commitear sin probar local
- Hacer commits gigantes
- Pushear directo a main sin revisar
- Olvidar responsive design

## 🔧 Herramientas Incluidas

| Script | Función |
|--------|---------|
| `start-local-server.sh` | Servidor Python local |
| `dev-setup.sh` | Configurar VS Code |
| `git-workflow.sh` | Manejo seguro de Git |

## 🐛 Troubleshooting

### Puerto 8000 ocupado:
```bash
# Usar puerto diferente
python3 -m http.server 8080
```

### VS Code no encuentra Live Server:
```bash
# Instalar extensión
code --install-extension ritwickdey.liveserver
```

### Git staging issues:
```bash
# Reset staging
git reset HEAD
```

---

**🎉 ¡Ahora puedes desarrollar localmente y ver cambios antes de commitear!**