#!/bin/bash

echo "Creando estructura base para agentes IA..."

mkdir -p agents/code-architect
mkdir -p agents/scraper-engineer
mkdir -p agents/auto-updater
mkdir -p orchestrator
mkdir -p tasks
mkdir -p outputs
mkdir -p logs
mkdir -p schemas
mkdir -p config

touch agents/code-architect/prompt.md
touch agents/scraper-engineer/prompt.md
touch agents/auto-updater/prompt.md
touch orchestrator/orchestrator.ts
touch config/agent.config.jsonc
touch schemas/task.schema.json
touch tasks/task-example.jsonc
touch README.md

echo "✅ Estructura creada correctamente."
