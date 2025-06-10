import { GeminiProvider } from './gemini';
import { JulesProvider } from './jules';
import { OpenAIProvider } from './openai';
import { LLMProvider } from './provider';

/**
 * Configuration for LLM providers
 */
export interface ProviderConfig {
	apiKeyEnv: string;
	model: string;
	endpoint: string;
}

/**
 * Registry of available LLM providers with their factory functions
 */
const providersMap: Record<string, (config: ProviderConfig) => LLMProvider> = {
	openai: (config: ProviderConfig) => new OpenAIProvider(config),
	gemini: (config: ProviderConfig) => new GeminiProvider(config),
	jules: (config: ProviderConfig) => new JulesProvider(config),
};

/**
 * Gets an instance of the specified LLM provider
 * @param name - The name of the provider (case-insensitive)
 * @param config - Configuration for the provider
 * @returns LLMProvider instance
 * @throws Error if provider is not found or name is invalid
 */
export function getLLMProvider(name: string, config: ProviderConfig): LLMProvider {
	// Input validation
	if (!name || typeof name !== 'string') {
		throw new Error('Provider name must be a non-empty string');
	}

	if (!config || typeof config !== 'object') {
		throw new Error('Provider config must be a valid object');
	}

	// Validate required config properties
	const requiredProps = ['apiKeyEnv', 'model', 'endpoint'];
	for (const prop of requiredProps) {
		if (!config[prop as keyof ProviderConfig]) {
			throw new Error(`Missing required config property: ${prop}`);
		}
	}

	const normalizedName = name.toLowerCase().trim();
	const factory = providersMap[normalizedName];

	if (!factory) {
		const availableProviders = Object.keys(providersMap).join(', ');
		throw new Error(`Unknown LLM provider: "${name}". Available providers: ${availableProviders}`);
	}

	try {
		return factory(config);
	} catch (error) {
		throw new Error(
			`Failed to initialize LLM provider "${name}": ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

/**
 * Gets the list of available provider names
 * @returns Array of provider names
 */
export function getAvailableProviders(): string[] {
	return Object.keys(providersMap);
}

/**
 * Checks if a provider is available
 * @param name - The provider name to check
 * @returns true if provider exists, false otherwise
 */
export function isProviderAvailable(name: string): boolean {
	if (!name || typeof name !== 'string') return false;
	return Object.hasOwnProperty.call(providersMap, name.toLowerCase().trim());
}
