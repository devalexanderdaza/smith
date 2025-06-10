import fs from 'fs';
import { logger } from './logger';

export interface ValidationResult {
	isValid: boolean;
	errors: string[];
	warnings: string[];
}

export class ConfigValidator {
	/**
	 * Validates agent configuration
	 */
	static validateAgentConfig(config: any): ValidationResult {
		const result: ValidationResult = {
			isValid: true,
			errors: [],
			warnings: [],
		};

		// Check required top-level properties
		const requiredProps = ['defaultEngine', 'providers', 'agents'];
		for (const prop of requiredProps) {
			if (!config[prop]) {
				result.errors.push(`Missing required property: ${prop}`);
				result.isValid = false;
			}
		}

		// Validate providers
		if (config.providers) {
			for (const [providerName, providerConfig] of Object.entries(config.providers)) {
				const providerResult = this.validateProviderConfig(providerName, providerConfig as any);
				result.errors.push(...providerResult.errors);
				result.warnings.push(...providerResult.warnings);
				if (!providerResult.isValid) {
					result.isValid = false;
				}
			}
		}

		// Validate agents
		if (config.agents) {
			for (const [agentName, agentConfig] of Object.entries(config.agents)) {
				const agentResult = this.validateAgentDefinition(agentName, agentConfig as any);
				result.errors.push(...agentResult.errors);
				result.warnings.push(...agentResult.warnings);
				if (!agentResult.isValid) {
					result.isValid = false;
				}
			}
		}

		// Validate default engine exists in providers
		if (config.defaultEngine && config.providers) {
			if (!config.providers[config.defaultEngine]) {
				result.errors.push(`Default engine "${config.defaultEngine}" not found in providers`);
				result.isValid = false;
			}
		}

		return result;
	}

	private static validateProviderConfig(name: string, config: any): ValidationResult {
		const result: ValidationResult = {
			isValid: true,
			errors: [],
			warnings: [],
		};

		const requiredProps = ['apiKeyEnv', 'model', 'endpoint'];
		for (const prop of requiredProps) {
			if (!config[prop]) {
				result.errors.push(`Provider "${name}": Missing required property "${prop}"`);
				result.isValid = false;
			}
		}

		// Check if API key environment variable exists
		if (config.apiKeyEnv && !process.env[config.apiKeyEnv]) {
			result.warnings.push(
				`Provider "${name}": Environment variable "${config.apiKeyEnv}" not set`,
			);
		}

		// Validate endpoint URL format
		if (config.endpoint && !this.isValidUrl(config.endpoint)) {
			result.errors.push(`Provider "${name}": Invalid endpoint URL format`);
			result.isValid = false;
		}

		return result;
	}

	private static validateAgentDefinition(name: string, config: any): ValidationResult {
		const result: ValidationResult = {
			isValid: true,
			errors: [],
			warnings: [],
		};

		// Check if prompt file exists
		if (config.promptFile) {
			if (!fs.existsSync(config.promptFile)) {
				result.errors.push(`Agent "${name}": Prompt file not found: ${config.promptFile}`);
				result.isValid = false;
			}
		} else {
			result.errors.push(`Agent "${name}": Missing promptFile property`);
			result.isValid = false;
		}

		// Warn if agent is disabled
		if (config.enabled === false) {
			result.warnings.push(`Agent "${name}": Currently disabled`);
		}

		return result;
	}

	private static isValidUrl(url: string): boolean {
		try {
			new URL(url);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Validates environment variables required by the application
	 */
	static validateEnvironment(): ValidationResult {
		const result: ValidationResult = {
			isValid: true,
			errors: [],
			warnings: [],
		};

		// Check Node.js version
		const nodeVersion = process.version;
		const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
		if (majorVersion < 20) {
			result.errors.push(
				`Node.js version ${nodeVersion} is not supported. Minimum required: 20.14.0`,
			);
			result.isValid = false;
		}

		// Check required directories
		const requiredDirs = ['config', 'agents', 'tasks', 'schemas'];
		for (const dir of requiredDirs) {
			if (!fs.existsSync(dir)) {
				result.errors.push(`Required directory not found: ${dir}`);
				result.isValid = false;
			}
		}

		return result;
	}
}

/**
 * Validates configuration and environment before running the application
 */
export function validateSetup(config: any): boolean {
	logger.info('Validating configuration and environment...');

	const envResult = ConfigValidator.validateEnvironment();
	const configResult = ConfigValidator.validateAgentConfig(config);

	// Log errors
	for (const error of [...envResult.errors, ...configResult.errors]) {
		logger.error(error);
	}

	// Log warnings
	for (const warning of [...envResult.warnings, ...configResult.warnings]) {
		logger.warn(warning);
	}

	const isValid = envResult.isValid && configResult.isValid;

	if (isValid) {
		logger.info('✅ Configuration validation passed');
	} else {
		logger.error('❌ Configuration validation failed');
	}

	return isValid;
}
