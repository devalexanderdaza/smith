#!/bin/bash

set -e

echo "🔄 Sincronizando archivos de definición del sistema de agentes IA..."

# Crear respaldo si existe el archivo
backup_if_exists() {
  local file="$1"
  if [ -f "$file" ]; then
    cp "$file" "${file}.bak"
    echo "🗂️  Respaldo creado: ${file}.bak"
  fi
}

# Configuración de rutas
SCHEMA_PATH="schemas/task.schema.json"
CONFIG_PATH="config/agent.config.jsonc"
PROMPT_PATH="agents/code-architect/prompt.md"
TASK_EXAMPLE_PATH="tasks/task-example.jsonc"

# Verificar existencia de carpetas base
mkdir -p schemas config agents/code-architect tasks

# === 1. Esquema ===
backup_if_exists "$SCHEMA_PATH"
cat <<EOF > "$SCHEMA_PATH"
{
  "\$schema": "http://json-schema.org/draft-07/schema#",
  "title": "IA Task Schema",
  "type": "object",
  "required": ["agent", "objective", "sourceFile", "outputFile"],
  "properties": {
    "agent": {
      "type": "string",
      "enum": ["codeArchitect", "scraperEngineer", "autoUpdater"]
    },
    "objective": {
      "type": "string",
      "description": "Descripción clara del propósito de la tarea."
    },
    "sourceFile": {
      "type": "string",
      "description": "Ruta al archivo fuente que debe ser leído o modificado."
    },
    "outputFile": {
      "type": "string",
      "description": "Ruta del archivo que el agente debe generar."
    },
    "constraints": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Restricciones que el agente debe cumplir."
    },
    "context": {
      "type": "string",
      "description": "Contexto adicional que ayude a interpretar el objetivo."
    }
  },
  "additionalProperties": false
}
EOF
echo "✅ task.schema.json actualizado"

# === 2. Configuración de agentes ===
backup_if_exists "$CONFIG_PATH"
cat <<EOF > "$CONFIG_PATH"
{
  // Configuración global para el sistema de agentes IA
  "defaultEngine": "chatgpt-3.5",
  "defaultBranch": "main",
  "agents": {
    "codeArchitect": {
      "enabled": true,
      "promptFile": "agents/code-architect/prompt.md"
    },
    "scraperEngineer": {
      "enabled": true,
      "promptFile": "agents/scraper-engineer/prompt.md"
    },
    "autoUpdater": {
      "enabled": true,
      "promptFile": "agents/auto-updater/prompt.md"
    }
  },
  "taskInputPath": "tasks/",
  "taskOutputPath": "outputs/",
  "logPath": "logs/"
}
EOF
echo "✅ agent.config.jsonc actualizado"

# === 3. Prompt para codeArchitect ===
backup_if_exists "$PROMPT_PATH"
cat <<'EOF' > "$PROMPT_PATH"
# Rol del Agente

Eres un arquitecto de software experto en diseño de sistemas escalables, mantenibles y modulares en Node.js y TypeScript.

Tu tarea consiste en mejorar un scraper existente implementando:

- Separación por capas (engine, config, scraper)
- Patrones de diseño: adaptador, plugin, inyección de dependencias
- Modularidad y reutilización de componentes
- Soporte para múltiples motores de scraping

# Instrucciones

1. Lee el archivo fuente del scraper ubicado en la ruta indicada en la tarea.
2. Identifica problemas estructurales: acoplamientos innecesarios, código repetido, lógica embebida.
3. Sugiere una estructura ideal de carpetas y módulos.
4. Refactoriza el código directamente o genera un archivo nuevo con la mejora.
5. Escribe siempre en inglés, usando tipado estricto y JSDoc en el código.
6. Incluye un resumen de los cambios y el motivo de cada decisión técnica.

# Input

Recibirás un JSON con la siguiente estructura:

```json
{
  "sourceFile": "src/scrapers/govco.ts",
  "objective": "Convert this tightly coupled scraper into a modular, reusable component using design patterns.",
  "constraints": [
    "Do not break existing scraper logic",
    "Use TypeScript strictly",
    "Keep compatibility with orchestrator"
  ]
}
```
EOF
echo "✅ Prompt del codeArchitect actualizado"

# === 4. Task de ejemplo ===
backup_if_exists "$TASK_EXAMPLE_PATH"
cat <<EOF > "$TASK_EXAMPLE_PATH"
{
  // Agente encargado de ejecutar la tarea
  "agent": "codeArchitect",

  // Descripción general de lo que debe lograrse
  "objective": "Refactor the govco scraper to follow modular principles and use adapter + plugin pattern",

  // Archivo que contiene el código fuente actual
  "sourceFile": "src/scrapers/govco.ts",

  // Archivo donde el agente debe escribir la mejora
  "outputFile": "refactored/govco.modular.ts",

  // Reglas que debe cumplir el resultado
  "constraints": [
    "Maintain functionality as-is",
    "Use only TypeScript (strict mode)",
    "Split logic by responsibility",
    "Implement Adapter pattern for engine selection"
  ],

  // Contexto adicional sobre el objetivo
  "context": "The current scraper is tightly coupled to Playwright. We want to support other engines and improve maintainability."
}
EOF
echo "✅ Tarea de ejemplo actualizada"

echo "🎉 Archivos clave actualizados con éxito. Ya puedes ejecutar el orquestador para esta tarea."
