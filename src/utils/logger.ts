import fs from 'fs';
import path from 'path';

export enum LogLevel {
	ERROR = 0,
	WARN = 1,
	INFO = 2,
	DEBUG = 3,
}

export interface LogEntry {
	timestamp: string;
	level: LogLevel;
	message: string;
	context?: Record<string, any>;
	error?: Error;
}

export class Logger {
	private static instance: Logger;
	private logLevel: LogLevel = LogLevel.INFO;
	private logDir: string = 'logs';

	private constructor() {
		// Ensure logs directory exists
		if (!fs.existsSync(this.logDir)) {
			fs.mkdirSync(this.logDir, { recursive: true });
		}
	}

	static getInstance(): Logger {
		if (!Logger.instance) {
			Logger.instance = new Logger();
		}
		return Logger.instance;
	}

	setLevel(level: LogLevel): void {
		this.logLevel = level;
	}

	setLogDirectory(dir: string): void {
		this.logDir = dir;
		if (!fs.existsSync(this.logDir)) {
			fs.mkdirSync(this.logDir, { recursive: true });
		}
	}

	private formatMessage(entry: LogEntry): string {
		const levelName = LogLevel[entry.level];
		let message = `[${entry.timestamp}] ${levelName}: ${entry.message}`;

		if (entry.context) {
			message += ` | Context: ${JSON.stringify(entry.context, null, 2)}`;
		}

		if (entry.error) {
			message += ` | Error: ${entry.error.message}\n${entry.error.stack}`;
		}

		return message;
	}

	private writeToFile(entry: LogEntry): void {
		const date = new Date().toISOString().split('T')[0];
		const filename = `smith-${date}.log`;
		const filepath = path.join(this.logDir, filename);
		const formattedMessage = this.formatMessage(entry);

		fs.appendFileSync(filepath, formattedMessage + '\n');
	}

	private log(
		level: LogLevel,
		message: string,
		context?: Record<string, any>,
		error?: Error,
	): void {
		if (level <= this.logLevel) {
			const entry: LogEntry = {
				timestamp: new Date().toISOString(),
				level,
				message,
				context,
				error,
			};

			// Write to console
			const consoleMessage = this.formatMessage(entry);
			switch (level) {
				case LogLevel.ERROR:
					console.error(`❌ ${consoleMessage}`);
					break;
				case LogLevel.WARN:
					console.warn(`⚠️  ${consoleMessage}`);
					break;
				case LogLevel.INFO:
					console.log(`ℹ️  ${consoleMessage}`);
					break;
				case LogLevel.DEBUG:
					console.debug(`🔍 ${consoleMessage}`);
					break;
			}

			// Write to file
			this.writeToFile(entry);
		}
	}

	error(message: string, context?: Record<string, any>, error?: Error): void {
		this.log(LogLevel.ERROR, message, context, error);
	}

	warn(message: string, context?: Record<string, any>): void {
		this.log(LogLevel.WARN, message, context);
	}

	info(message: string, context?: Record<string, any>): void {
		this.log(LogLevel.INFO, message, context);
	}

	debug(message: string, context?: Record<string, any>): void {
		this.log(LogLevel.DEBUG, message, context);
	}
}

// Export singleton instance
export const logger = Logger.getInstance();
