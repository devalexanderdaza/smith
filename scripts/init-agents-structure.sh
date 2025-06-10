#!/bin/bash

echo "🔄 Actualizando proyecto con la nueva configuración profesional..."

# Modo no interactivo (p.ej., para ejecución automatizada) si se pasa argumento --yes / -y / --force
non_interactive=false
if [[ "$1" == "-y" || "$1" == "--yes" || "$1" == "--force" ]]; then
    non_interactive=true
    echo "ℹ️ Modo no interactivo activado: se aplicarán cambios automáticamente sin solicitar confirmaciones."
fi

# Detectar gestor de paquetes disponible (prioridad: pnpm > npm > yarn)
pm=""
pm_name=""
if command -v pnpm &>/dev/null; then
    pm="pnpm"
    pm_name="pnpm"
elif command -v npm &>/dev/null; then
    pm="npm"
    pm_name="npm"
elif command -v yarn &>/dev/null; then
    pm="yarn"
    pm_name="yarn"
fi

if [ -z "$pm" ]; then
    echo "❌ No se encontró npm, pnpm ni yarn. Por favor instala Node.js y un gestor de paquetes antes de continuar."
    exit 1
fi

# Si hay más de un gestor disponible y no es modo no-interactivo, preguntar preferencia
if [ "$non_interactive" = false ]; then
    if command -v pnpm &>/dev/null && command -v npm &>/dev/null; then
        # Ambos pnpm y npm disponibles
        echo "⚙️ Detectamos múltiples gestores de paquetes. Selecciona uno para usar:"
        echo "1) pnpm (recomendado)"
        echo "2) npm"
        read -p "Elige [1-2] (por defecto 1): " choice
        case "$choice" in
        2)
            pm="npm"
            pm_name="npm"
            ;;
        *)
            pm="pnpm"
            pm_name="pnpm"
            ;;
        esac
    elif command -v pnpm &>/dev/null && command -v yarn &>/dev/null && ! command -v npm &>/dev/null; then
        # pnpm y yarn disponibles (npm no encontrado)
        echo "⚙️ Detectamos pnpm y yarn. Selecciona uno para usar:"
        echo "1) pnpm (recomendado)"
        echo "2) yarn"
        read -p "Elige [1-2] (por defecto 1): " choice
        case "$choice" in
        2)
            pm="yarn"
            pm_name="yarn"
            ;;
        *)
            pm="pnpm"
            pm_name="pnpm"
            ;;
        esac
    elif command -v npm &>/dev/null && command -v yarn &>/dev/null && ! command -v pnpm &>/dev/null; then
        # npm y yarn disponibles (pnpm no encontrado)
        echo "⚙️ Detectamos npm y yarn. Selecciona uno para usar:"
        echo "1) npm"
        echo "2) yarn"
        read -p "Elige [1-2] (por defecto 1): " choice
        case "$choice" in
        2)
            pm="yarn"
            pm_name="yarn"
            ;;
        *)
            pm="npm"
            pm_name="npm"
            ;;
        esac
    fi
else
    if command -v pnpm &>/dev/null && command -v npm &>/dev/null; then
        # Múltiples detectados, usar pm ya seleccionado por prioridad en modo no interactivo
        echo "ℹ️ Múltiples gestores detectados. En modo no interactivo se utilizará '$pm_name' por defecto."
    fi
fi

echo "📦 Gestor de paquetes seleccionado: $pm_name"

# Crear estructura de directorios base (si no existe)
echo "📁 Verificando estructura de directorios..."
mkdir -p agents/code-architect
mkdir -p agents/scraper-engineer
mkdir -p agents/auto-updater
mkdir -p orchestrator
mkdir -p tasks
mkdir -p outputs
mkdir -p logs
mkdir -p schemas
mkdir -p config

# Crear archivos base si no existen (no sobrescribir si ya existen)
if [ ! -f agents/code-architect/prompt.md ]; then touch agents/code-architect/prompt.md; fi
if [ ! -f agents/scraper-engineer/prompt.md ]; then touch agents/scraper-engineer/prompt.md; fi
if [ ! -f agents/auto-updater/prompt.md ]; then touch agents/auto-updater/prompt.md; fi
if [ ! -f orchestrator/orchestrator.ts ]; then touch orchestrator/orchestrator.ts; fi
if [ ! -f config/agent.config.jsonc ]; then touch config/agent.config.jsonc; fi
if [ ! -f schemas/task.schema.json ]; then touch schemas/task.schema.json; fi
if [ ! -f tasks/task-example.jsonc ]; then touch tasks/task-example.jsonc; fi
if [ ! -f README.md ]; then touch README.md; fi

echo "✅ Estructura de archivos y directorios verificada."

# Crear package.json si no existe, o preguntar si se debe actualizar el existente
update_package=true
if [ -f package.json ]; then
    if [ "$non_interactive" = false ]; then
        echo "⚠️ Se encontró un package.json existente."
        read -p "¿Deseas actualizarlo con configuraciones y dependencias nuevas? [Y/n]: " confirm_pkg
        if [[ "$confirm_pkg" =~ ^[Nn]$ ]]; then
            update_package=false
            echo "ℹ️ Saltando modificaciones a package.json por solicitud del usuario."
        fi
    else
        echo "ℹ️ package.json existe. En modo no interactivo se actualizará automáticamente."
    fi
else
    echo "📦 No se encontró package.json, creando uno nuevo..."
    $pm init -y
    echo "✅ package.json creado."
fi

if [ "$update_package" = true ]; then
    # Instalar dependencias de desarrollo necesarias
    echo "⚙️ Instalando dependencias de desarrollo (TypeScript, ESLint, Prettier, etc.)..."
    if [ "$pm_name" = "npm" ]; then
        npm install --save-dev typescript ts-node nodemon eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin prettier eslint-config-prettier eslint-plugin-prettier
    elif [ "$pm_name" = "pnpm" ]; then
        pnpm add -D typescript ts-node nodemon eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin prettier eslint-config-prettier eslint-plugin-prettier
    elif [ "$pm_name" = "yarn" ]; then
        yarn add --dev typescript ts-node nodemon eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin prettier eslint-config-prettier eslint-plugin-prettier
    fi
    echo "✅ Dependencias de desarrollo instaladas."

    # Añadir/actualizar scripts útiles en package.json usando Node.js
    node - <<'NODE'
const fs = require('fs');
const filePath = 'package.json';
let pkg = JSON.parse(fs.readFileSync(filePath, 'utf8'));
pkg.scripts = pkg.scripts || {};
// No sobrescribir si ya existen para no pisar personalizaciones del usuario
if (!pkg.scripts.start) pkg.scripts.start = "ts-node orchestrator/orchestrator.ts";
if (!pkg.scripts.dev) pkg.scripts.dev = "nodemon --watch 'agents/**/*.ts' --watch 'orchestrator/**/*.ts' --watch 'tasks/**/*.ts' -e ts,json --exec ts-node orchestrator/orchestrator.ts";
if (!pkg.scripts.build) pkg.scripts.build = "tsc";
if (!pkg.scripts.lint) pkg.scripts.lint = "eslint . --ext .ts";
if (!pkg.scripts.format) pkg.scripts.format = "prettier --write .";
if (!pkg.scripts.test) {
    pkg.scripts.test = "echo \"Error: no test specified\" && exit 1";
}
fs.writeFileSync(filePath, JSON.stringify(pkg, null, 2));
NODE
    echo "✅ Scripts agregados/actualizados en package.json."
fi

# Crear/actualizar archivo tsconfig.json
if [ -f tsconfig.json ]; then
    if [ "$non_interactive" = false ]; then
        read -p "⚠️ tsconfig.json ya existe. ¿Sobrescribir con configuración estándar recomendada? [y/N]: " confirm_ts
    fi
    if [ "$non_interactive" = true ] || [[ "$confirm_ts" =~ ^[Yy]$ ]]; then
        cp tsconfig.json tsconfig.backup.json
        cat >tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "rootDir": ".",
    "outDir": "dist",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true
  },
  "include": [
    "orchestrator/**/*",
    "agents/**/*",
    "tasks/**/*",
    "schemas/**/*"
  ]
}
EOF
        echo "✅ tsconfig.json actualizado (respaldo guardado en tsconfig.backup.json)."
    else
        echo "ℹ️ Se conservó tsconfig.json existente."
    fi
else
    cat >tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "rootDir": ".",
    "outDir": "dist",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true
  },
  "include": [
    "orchestrator/**/*",
    "agents/**/*",
    "tasks/**/*",
    "schemas/**/*"
  ]
}
EOF
    echo "✅ tsconfig.json creado."
fi

# Crear/actualizar archivo .eslintrc.js
if [ -f .eslintrc.js ]; then
    if [ "$non_interactive" = false ]; then
        read -p "⚠️ .eslintrc.js ya existe. ¿Sobrescribir con nueva configuración ESLint + Prettier? [y/N]: " confirm_eslint
    fi
    if [ "$non_interactive" = true ] || [[ "$confirm_eslint" =~ ^[Yy]$ ]]; then
        cp .eslintrc.js .eslintrc.backup.js
        cat >.eslintrc.js <<'EOF'
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'eslint:recommended',
    'prettier'
  ],
  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-var': 'error'
  },
  env: {
    node: true,
    es6: true
  },
  ignorePatterns: ['dist/', 'node_modules/', '*.js', 'examples/', 'tests/', 'scripts/', 'outputs/', 'logs/']
};
EOF
        echo "✅ .eslintrc.js actualizado (respaldo en .eslintrc.backup.js)."
    else
        echo "ℹ️ Se conservó configuración ESLint existente."
    fi
else
    cat >.eslintrc.js <<'EOF'
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'eslint:recommended',
    'prettier'
  ],
  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-var': 'error'
  },
  env: {
    node: true,
    es6: true
  },
  ignorePatterns: ['dist/', 'node_modules/', '*.js', 'examples/', 'tests/', 'scripts/', 'outputs/', 'logs/']
};
EOF
    echo "✅ Archivo .eslintrc.js creado."
fi

# Crear/actualizar archivo .prettierrc
if [ -f .prettierrc ]; then
    if [ "$non_interactive" = false ]; then
        read -p "⚠️ .prettierrc ya existe. ¿Sobrescribir con configuración estándar de Prettier? [y/N]: " confirm_prettier
    fi
    if [ "$non_interactive" = true ] || [[ "$confirm_prettier" =~ ^[Yy]$ ]]; then
        cp .prettierrc .prettierrc.backup
        cat >.prettierrc <<'EOF'
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "quoteProps": "as-needed",
  "bracketSameLine": false
}
EOF
        echo "✅ .prettierrc actualizado (respaldo en .prettierrc.backup)."
    else
        echo "ℹ️ Se conservó configuración Prettier existente."
    fi
else
    cat >.prettierrc <<'EOF'
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "quoteProps": "as-needed",
  "bracketSameLine": false
}
EOF
    echo "✅ Archivo .prettierrc creado."
fi

# Crear/actualizar archivo .gitignore
if [ -f .gitignore ]; then
    if [ "$non_interactive" = false ]; then
        read -p "⚠️ .gitignore ya existe. ¿Sobrescribirlo con nueva plantilla? [y/N]: " confirm_gitignore
    fi
    if [ "$non_interactive" = true ] || [[ "$confirm_gitignore" =~ ^[Yy]$ ]]; then
        cp .gitignore .gitignore.backup
        cat >.gitignore <<'EOF'
# Dependencias de Node
node_modules/
# Build output
dist/
# Archivos de entorno
.env
.env.local
# Archivos de sistema
.DS_Store
# Salidas y logs
outputs/
logs/
EOF
        echo "✅ .gitignore actualizado (respaldo en .gitignore.backup)."
    else
        echo "ℹ️ Se conservó .gitignore existente (verifica que ignore node_modules/, dist/, etc.)."
    fi
else
    cat >.gitignore <<'EOF'
# Dependencias de Node
node_modules/
# Build output
dist/
# Archivos de entorno
.env
.env.local
# Archivos de sistema
.DS_Store
# Salidas y logs
outputs/
logs/
EOF
    echo "✅ Archivo .gitignore creado."
fi

# Crear archivo .nvmrc para fijar versión de Node (si no existe)
if [ ! -f .nvmrc ]; then
    echo "20.14.0" >.nvmrc
    echo "✅ Archivo .nvmrc creado (Node.js 20.14.0)."
else
    echo "ℹ️ .nvmrc ya existe, no se modifica."
fi

# Verificar configuración de remoto Git
echo "🌐 Verificando configuración de repositorio Git remoto..."
if git rev-parse --is-inside-work-tree &>/dev/null; then
    remote_url=$(git remote get-url origin 2>/dev/null)
    if [ -z "$remote_url" ]; then
        if [ "$non_interactive" = false ]; then
            echo "❓ No se encontró remoto 'origin'."
            read -p "Ingresa la URL del repositorio Git remoto para añadirlo (deja vacío para omitir): " repo_url
        fi
        if [ "$non_interactive" = true ]; then
            echo "ℹ️ Remoto 'origin' no configurado. (Modo no interactivo: omitiendo configuración automática)."
        elif [ -n "$repo_url" ]; then
            git remote add origin "$repo_url"
            echo "✅ Remoto 'origin' configurado con URL: $repo_url"
        else
            echo "ℹ️ No se configuró ningún remoto."
        fi
    else
        echo "✅ Remoto 'origin' ya configurado: $remote_url"
    fi
else
    echo "❌ Este directorio no es un repositorio Git. Ejecuta 'git init' y configura el remoto manualmente si es necesario."
fi

echo "🎉 Configuración del proyecto completada correctamente."
