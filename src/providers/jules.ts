import { LLMProvider } from './provider';

export class JulesProvider implements LLMProvider {
	private readonly apiKey: string;
	private readonly endpoint: string;
	private readonly model: string;

	constructor(config: { apiKeyEnv: string; model: string; endpoint: string }) {
		const key = process.env[config.apiKeyEnv];
		if (!key) {
			throw new Error(`API key missing in environment variable: ${config.apiKeyEnv}`);
		}
		this.apiKey = key;
		this.model = config.model;
		this.endpoint = config.endpoint;
	}

	async generateResponse(prompt: string): Promise<string> {
		if (process.env.NODE_ENV !== 'development') {
			console.debug(`ApiKey: ${this.apiKey}`);
			console.debug(`Model: ${this.model}`);
			console.debug(`Endpoint: ${this.endpoint}`);
		}
		// Jules API integration is not implemented yet.
		console.debug('JulesProvider: generateResponse called with prompt:', prompt);
		throw new Error('Jules provider not implemented yet.');
	}
}
