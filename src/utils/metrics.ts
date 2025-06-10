import fs from 'fs';
import path from 'path';
import { logger } from './logger';

export interface TaskMetrics {
	taskId: string;
	agentId: string;
	providerName: string;
	startTime: Date;
	endTime?: Date;
	duration?: number; // in milliseconds
	success: boolean;
	promptTokens?: number;
	responseTokens?: number;
	responseLength: number;
	errorMessage?: string;
	sourceFile: string;
	outputFile: string;
}

export interface SystemMetrics {
	totalTasks: number;
	successfulTasks: number;
	failedTasks: number;
	averageDuration: number;
	totalTokensUsed: number;
	providerUsage: Record<string, number>;
	agentUsage: Record<string, number>;
	lastUpdated: Date;
}

export class MetricsCollector {
	private static instance: MetricsCollector;
	private metricsDir: string = 'logs/metrics';
	private currentTask?: TaskMetrics;

	private constructor() {
		if (!fs.existsSync(this.metricsDir)) {
			fs.mkdirSync(this.metricsDir, { recursive: true });
		}
	}

	static getInstance(): MetricsCollector {
		if (!MetricsCollector.instance) {
			MetricsCollector.instance = new MetricsCollector();
		}
		return MetricsCollector.instance;
	}

	/**
	 * Start tracking a new task
	 */
	startTask(
		taskId: string,
		agentId: string,
		providerName: string,
		sourceFile: string,
		outputFile: string,
	): void {
		this.currentTask = {
			taskId,
			agentId,
			providerName,
			startTime: new Date(),
			success: false,
			responseLength: 0,
			sourceFile,
			outputFile,
		};

		logger.debug('Started tracking task', { taskId, agentId, providerName });
	}

	/**
	 * Complete the current task tracking
	 */
	completeTask(success: boolean, responseLength: number, errorMessage?: string): void {
		if (!this.currentTask) {
			logger.warn('No active task to complete');
			return;
		}

		this.currentTask.endTime = new Date();
		this.currentTask.duration =
			this.currentTask.endTime.getTime() - this.currentTask.startTime.getTime();
		this.currentTask.success = success;
		this.currentTask.responseLength = responseLength;
		this.currentTask.errorMessage = errorMessage;

		this.saveTaskMetrics(this.currentTask);
		this.updateSystemMetrics(this.currentTask);

		logger.info('Task completed', {
			taskId: this.currentTask.taskId,
			success,
			duration: this.currentTask.duration,
		});

		this.currentTask = undefined;
	}

	/**
	 * Update token usage for current task
	 */
	updateTokenUsage(promptTokens: number, responseTokens: number): void {
		if (this.currentTask) {
			this.currentTask.promptTokens = promptTokens;
			this.currentTask.responseTokens = responseTokens;
		}
	}

	private saveTaskMetrics(metrics: TaskMetrics): void {
		const date = new Date().toISOString().split('T')[0];
		const filename = `tasks-${date}.json`;
		const filepath = path.join(this.metricsDir, filename);

		let tasks: TaskMetrics[] = [];
		if (fs.existsSync(filepath)) {
			try {
				const content = fs.readFileSync(filepath, 'utf-8');
				tasks = JSON.parse(content);
			} catch (error) {
				logger.warn('Failed to read existing task metrics', { error: (error as Error).message });
			}
		}

		tasks.push(metrics);
		fs.writeFileSync(filepath, JSON.stringify(tasks, null, 2));
	}

	private updateSystemMetrics(taskMetrics: TaskMetrics): void {
		const filepath = path.join(this.metricsDir, 'system-metrics.json');

		let systemMetrics: SystemMetrics = {
			totalTasks: 0,
			successfulTasks: 0,
			failedTasks: 0,
			averageDuration: 0,
			totalTokensUsed: 0,
			providerUsage: {},
			agentUsage: {},
			lastUpdated: new Date(),
		};

		// Load existing metrics
		if (fs.existsSync(filepath)) {
			try {
				const content = fs.readFileSync(filepath, 'utf-8');
				systemMetrics = { ...systemMetrics, ...JSON.parse(content) };
			} catch (error) {
				logger.warn('Failed to read system metrics', { error: (error as Error).message });
			}
		}

		// Update metrics
		systemMetrics.totalTasks++;
		if (taskMetrics.success) {
			systemMetrics.successfulTasks++;
		} else {
			systemMetrics.failedTasks++;
		}

		// Update average duration
		if (taskMetrics.duration) {
			const currentAvg = systemMetrics.averageDuration;
			const totalTasks = systemMetrics.totalTasks;
			systemMetrics.averageDuration =
				(currentAvg * (totalTasks - 1) + taskMetrics.duration) / totalTasks;
		}

		// Update token usage
		if (taskMetrics.promptTokens && taskMetrics.responseTokens) {
			systemMetrics.totalTokensUsed += taskMetrics.promptTokens + taskMetrics.responseTokens;
		}

		// Update provider usage
		systemMetrics.providerUsage[taskMetrics.providerName] =
			(systemMetrics.providerUsage[taskMetrics.providerName] || 0) + 1;

		// Update agent usage
		systemMetrics.agentUsage[taskMetrics.agentId] =
			(systemMetrics.agentUsage[taskMetrics.agentId] || 0) + 1;

		systemMetrics.lastUpdated = new Date();

		fs.writeFileSync(filepath, JSON.stringify(systemMetrics, null, 2));
	}

	/**
	 * Get system metrics summary
	 */
	getSystemMetrics(): SystemMetrics | null {
		const filepath = path.join(this.metricsDir, 'system-metrics.json');

		if (!fs.existsSync(filepath)) {
			return null;
		}

		try {
			const content = fs.readFileSync(filepath, 'utf-8');
			return JSON.parse(content);
		} catch (error) {
			logger.error('Failed to read system metrics', {}, error as Error);
			return null;
		}
	}

	/**
	 * Get task metrics for a specific date
	 */
	getTaskMetrics(date: string): TaskMetrics[] {
		const filename = `tasks-${date}.json`;
		const filepath = path.join(this.metricsDir, filename);

		if (!fs.existsSync(filepath)) {
			return [];
		}

		try {
			const content = fs.readFileSync(filepath, 'utf-8');
			return JSON.parse(content);
		} catch (error) {
			logger.error('Failed to read task metrics', { date }, error as Error);
			return [];
		}
	}

	/**
	 * Generate a metrics report
	 */
	generateReport(): string {
		const systemMetrics = this.getSystemMetrics();

		if (!systemMetrics) {
			return 'No metrics available';
		}

		const successRate =
			systemMetrics.totalTasks > 0
				? ((systemMetrics.successfulTasks / systemMetrics.totalTasks) * 100).toFixed(2)
				: '0';

		const avgDurationSec = (systemMetrics.averageDuration / 1000).toFixed(2);

		const topProvider =
			Object.entries(systemMetrics.providerUsage).sort(([, a], [, b]) => b - a)[0]?.[0] || 'None';

		const topAgent =
			Object.entries(systemMetrics.agentUsage).sort(([, a], [, b]) => b - a)[0]?.[0] || 'None';

		return `
Smith Framework Metrics Report
==============================

Total Tasks: ${systemMetrics.totalTasks}
Successful: ${systemMetrics.successfulTasks}
Failed: ${systemMetrics.failedTasks}
Success Rate: ${successRate}%

Average Duration: ${avgDurationSec}s
Total Tokens Used: ${systemMetrics.totalTokensUsed}

Most Used Provider: ${topProvider}
Most Used Agent: ${topAgent}

Last Updated: ${systemMetrics.lastUpdated}
`;
	}
}

// Export singleton instance
export const metricsCollector = MetricsCollector.getInstance();
