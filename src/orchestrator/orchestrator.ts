import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { getLLMProvider } from '../providers/llm-dispatcher';
import { validateSetup } from '../utils/config-validator';
import { readJSONC } from '../utils/files';
import { logger } from '../utils/logger';
import { metricsCollector } from '../utils/metrics';

dotenv.config();

const CONFIG_PATH = 'src/config/agent.config.jsonc';
const SCHEMA_PATH = 'src/schemas/task.schema.json';
const DEFAULT_TASK_PATH = 'src/tasks/task-001.jsonc';
const TASK_PATH = process.env.SMITH_TASK_PATH || DEFAULT_TASK_PATH;

const args = process.argv.slice(2);
const projectRootArg = args.find(arg => arg.startsWith('--project-root='));
if (!projectRootArg) {
	logger.error('Missing required argument: --project-root=<path>');
	process.exit(1);
}
const projectRoot = projectRootArg.split('=')[1];

if (!projectRoot || !fs.existsSync(projectRoot)) {
	logger.error('Invalid project root path', { projectRoot });
	process.exit(1);
}

function validateSchema(data: any, schemaPath: string): void {
	try {
		const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
		const ajv = new Ajv({ allErrors: true, strict: false });
		addFormats(ajv);
		const validate = ajv.compile(schema);

		if (!validate(data)) {
			const errorMessages =
				validate.errors?.map(err => `${err.instancePath || 'root'}: ${err.message}`).join(', ') ||
				'Unknown validation error';

			logger.error('Task validation failed', {
				errors: validate.errors,
				errorMessages,
			});
			throw new Error(`Task validation failed: ${errorMessages}`);
		}

		logger.info('Task schema validation passed');
	} catch (error) {
		logger.error('Schema validation error', {}, error as Error);
		throw error;
	}
}

async function main() {
	try {
		logger.info('🚀 Starting Smith orchestrator...');

		// Load configuration and task
		const config = readJSONC(CONFIG_PATH);
		const task = readJSONC(TASK_PATH);

		// Validate configuration
		if (!validateSetup(config)) {
			process.exit(1);
		}

		// Validate task schema
		validateSchema(task, SCHEMA_PATH);

		const agentId = task.agent;
		const agentConfig = config.agents[agentId];

		if (!agentConfig?.enabled) {
			logger.error(`Agent "${agentId}" is not enabled in configuration`);
			process.exit(1);
		}

		// Validate prompt file
		const promptPath = agentConfig.promptFile;
		if (!fs.existsSync(promptPath)) {
			logger.error(`Prompt file not found: ${promptPath}`);
			process.exit(1);
		}

		// Validate source file
		const sourceFilePath = path.resolve(projectRoot, task.sourceFile);
		if (!fs.existsSync(sourceFilePath)) {
			logger.error(`Source file not found: ${sourceFilePath}`);
			process.exit(1);
		}

		// Determine LLM provider
		let providerName = agentConfig.engine || config.defaultEngine || 'openai';
		providerName = providerName.toLowerCase();
		logger.info(`Using LLM provider: ${providerName}`);

		// Start metrics tracking
		const taskId = `${agentId}-${Date.now()}`;
		metricsCollector.startTask(
			taskId,
			agentId,
			providerName,
			sourceFilePath,
			path.resolve(projectRoot, task.outputFile),
		);

		logger.info('Loading prompt and source code...', {
			agentId,
			promptPath,
			sourceFilePath,
		});

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

		// Initialize and execute provider
		const providerConfig = config.providers[providerName];
		if (!providerConfig) {
			logger.error(`Provider configuration not found: ${providerName}`);
			process.exit(1);
		}

		const provider = getLLMProvider(providerName, providerConfig);

		logger.info('Generating LLM response...');
		const llmResponse = await provider.generateResponse(finalPrompt);

		// Write output file
		const outputFilePath = path.resolve(projectRoot, task.outputFile);
		fs.mkdirSync(path.dirname(outputFilePath), { recursive: true });
		fs.writeFileSync(outputFilePath, llmResponse, { encoding: 'utf-8' });

		// Complete metrics tracking
		metricsCollector.completeTask(true, llmResponse.length);

		logger.info(`✅ Task completed successfully`, {
			outputFile: outputFilePath,
			responseLength: llmResponse.length,
		});
	} catch (error) {
		// Complete metrics tracking with error
		metricsCollector.completeTask(false, 0, (error as Error).message);

		logger.error('Orchestrator execution failed', {}, error as Error);
		process.exit(1);
	}
}

// main().catch(err => {
// 	logger.error('Fatal error in orchestrator', {}, err);
// 	process.exit(1);
// });
async function Smith() {
	try {
		await main();
	} catch (error) {
		logger.error('Fatal error in orchestrator', {}, error as Error);
		process.exit(1);
	}
}

export { Smith };
