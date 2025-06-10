#!/usr/bin/env node

import { program } from 'commander';
import fs from 'fs';
import path from 'path';
import { validateSetup } from '../utils/config-validator';
import { readJSONC } from '../utils/files';
import { logger, LogLevel } from '../utils/logger';
import { metricsCollector } from '../utils/metrics';

program
	.name('smith')
	.description('AI Agent Framework for Code Architecture and Development')
	.version('1.0.0');

program
	.command('run')
	.description('Execute a task with specified project root')
	.requiredOption('-p, --project-root <path>', 'Project root directory')
	.option('-t, --task <file>', 'Task file to execute', 'tasks/task-001.jsonc')
	.option('-v, --verbose', 'Enable verbose logging')
	.option('-d, --debug', 'Enable debug logging')
	.action(async options => {
		// Set logging level
		if (options.debug) {
			logger.setLevel(LogLevel.DEBUG);
		} else if (options.verbose) {
			logger.setLevel(LogLevel.INFO);
		}

		// Validate project root
		if (!fs.existsSync(options.projectRoot)) {
			logger.error(`Project root directory not found: ${options.projectRoot}`);
			process.exit(1);
		}

		// Set task path environment variable
		process.env.SMITH_TASK_PATH = options.task;

		// Import and run orchestrator
		try {
			const { Smith } = await import('../orchestrator/orchestrator');
			process.argv = ['node', 'orchestrator', `--project-root=${options.projectRoot}`];
			await Smith();
		} catch (error) {
			logger.error('Failed to execute task', {}, error as Error);
			process.exit(1);
		}
	});

program
	.command('metrics')
	.description('Display metrics and analytics')
	.option('-r, --report', 'Generate detailed report')
	.option('-d, --date <date>', 'Show metrics for specific date (YYYY-MM-DD)')
	.action(options => {
		if (options.report) {
			const report = metricsCollector.generateReport();
			console.log(report);
		} else if (options.date) {
			const tasks = metricsCollector.getTaskMetrics(options.date);
			console.log(`Tasks executed on ${options.date}:`);
			console.table(
				tasks.map(task => ({
					ID: task.taskId,
					Agent: task.agentId,
					Provider: task.providerName,
					Success: task.success ? '✅' : '❌',
					Duration: task.duration ? `${(task.duration / 1000).toFixed(2)}s` : 'N/A',
					'Response Length': task.responseLength,
				})),
			);
		} else {
			const systemMetrics = metricsCollector.getSystemMetrics();
			if (systemMetrics) {
				console.log('📊 Smith Framework Metrics:');
				console.log(`Total Tasks: ${systemMetrics.totalTasks}`);
				console.log(
					`Success Rate: ${((systemMetrics.successfulTasks / systemMetrics.totalTasks) * 100).toFixed(2)}%`,
				);
				console.log(`Average Duration: ${(systemMetrics.averageDuration / 1000).toFixed(2)}s`);
				console.log(`Total Tokens: ${systemMetrics.totalTokensUsed}`);
			} else {
				console.log('No metrics available');
			}
		}
	});

program
	.command('validate')
	.description('Validate configuration and environment')
	.option('-c, --config <file>', 'Configuration file to validate', 'src/config/agent.config.jsonc')
	.action(async options => {
		try {
			const config = readJSONC(options.config);

			const isValid = validateSetup(config);
			process.exit(isValid ? 0 : 1);
		} catch (error) {
			logger.error('Validation failed', {}, error as Error);
			process.exit(1);
		}
	});

program
	.command('init')
	.description('Initialize a new Smith project')
	.option('-d, --directory <path>', 'Target directory', '.')
	.action(options => {
		const targetDir = path.resolve(options.directory);

		logger.info(`Initializing Smith project in: ${targetDir}`);

		// Create directory structure
		const dirs = [
			'src/agents/code-architect',
			'src/agents/scraper-engineer',
			'src/agents/auto-updater',
			'src/config',
			'src/tasks',
			'src/schemas',
			'logs',
			'outputs',
		];

		for (const dir of dirs) {
			const fullPath = path.join(targetDir, dir);
			if (!fs.existsSync(fullPath)) {
				fs.mkdirSync(fullPath, { recursive: true });
				logger.info(`Created directory: ${dir}`);
			}
		}

		// Copy template files if they don't exist
		const templates = [
			{ src: 'src/config/agent.config.jsonc', desc: 'Agent configuration' },
			{ src: 'src/schemas/task.schema.json', desc: 'Task schema' },
			{ src: 'src/tasks/task-example.jsonc', desc: 'Example task' },
		];

		for (const template of templates) {
			const targetPath = path.join(targetDir, template.src);
			if (!fs.existsSync(targetPath)) {
				// Create basic template content
				let content = '';
				switch (template.src) {
					case 'src/config/agent.config.jsonc':
						content = JSON.stringify(
							{
								defaultEngine: 'openai',
								providers: {
									openai: {
										apiKeyEnv: 'OPENAI_API_KEY',
										model: 'gpt-4o',
										endpoint: 'https://api.openai.com/v1/chat/completions',
									},
								},
								agents: {
									codeArchitect: {
										enabled: true,
										promptFile: 'src/agents/code-architect/prompt.md',
									},
								},
							},
							null,
							2,
						);
						break;
					case 'src/tasks/task-example.jsonc':
						content = JSON.stringify(
							{
								agent: 'codeArchitect',
								objective: 'Example task objective',
								sourceFile: 'src/example.ts',
								outputFile: 'src/example.improved.ts',
								constraints: ['Maintain functionality'],
								context: 'Example context',
							},
							null,
							2,
						);
						break;
				}

				if (content) {
					fs.writeFileSync(targetPath, content);
					logger.info(`Created ${template.desc}: ${template.src}`);
				}
			}
		}

		logger.info('✅ Smith project initialized successfully!');
		logger.info('Next steps:');
		logger.info('1. Configure your API keys in environment variables');
		logger.info('2. Create agent prompt files in agents/ directories');
		logger.info('3. Define your tasks in tasks/ directory');
		logger.info('4. Run: smith run -p /path/to/your/project');
	});

program.parse();
