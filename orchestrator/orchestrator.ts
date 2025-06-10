import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import fs from 'fs';
import { parse as parseJSONC } from 'jsonc-parser';
import path from 'path';

const CONFIG_PATH = 'config/agent.config.jsonc';
const SCHEMA_PATH = 'schemas/task.schema.json';
const TASK_PATH = 'tasks/task-001.jsonc';

// Obtener argumentos desde CLI
const args = process.argv.slice(2);
const projectRootArg = args.find(arg => arg.startsWith('--project-root='));
if (!projectRootArg) {
	console.error('❌ Debes especificar --project-root=<ruta> para ubicar el archivo fuente.');
	process.exit(1);
}
const projectRoot = projectRootArg.split('=')[1];

function readJSONC(filePath: string): any {
	const content = fs.readFileSync(filePath, 'utf-8');
	return parseJSONC(content);
}

function validateSchema(data: any, schemaPath: string): void {
	const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
	const ajv = new Ajv({ allErrors: true, strict: false });
	addFormats(ajv);
	const validate = ajv.compile(schema);

	if (!validate(data)) {
		console.error('❌ Tarea inválida según schema:');
		console.error(validate.errors);
		process.exit(1);
	}
}

function main() {
	console.log('🚀 Cargando configuración y tarea...');

	const config = readJSONC(CONFIG_PATH);
	const task = readJSONC(TASK_PATH);

	validateSchema(task, SCHEMA_PATH);

	const agentId = task.agent;
	const agentConfig = config.agents[agentId];

	if (!agentConfig?.enabled) {
		console.error(`❌ Agente "${agentId}" no está habilitado en agent.config.jsonc`);
		process.exit(1);
	}

	const promptPath = agentConfig.promptFile;
	if (!fs.existsSync(promptPath)) {
		console.error(`❌ Prompt no encontrado: ${promptPath}`);
		process.exit(1);
	}

	const sourceFilePath = path.resolve(projectRoot, task.sourceFile);
	if (!fs.existsSync(sourceFilePath)) {
		console.error(`❌ Archivo fuente no existe: ${sourceFilePath}`);
		process.exit(1);
	}

	const promptTemplate = fs.readFileSync(promptPath, 'utf-8');
	const sourceCode = fs.readFileSync(sourceFilePath, 'utf-8');

	const finalPrompt = `=== CONTEXTO DEL PROYECTO ===
${task.context || '(sin contexto adicional)'}

=== INSTRUCCIONES PARA EL AGENTE "${agentId}" ===
${promptTemplate}

=== CÓDIGO FUENTE ===
\`\`\`ts
${sourceCode}
\`\`\`
`;

	// Mostrar el prompt generado
	console.log('🧠 Prompt generado correctamente:');
	console.log(finalPrompt);
}

main();
