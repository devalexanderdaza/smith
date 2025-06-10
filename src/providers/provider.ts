export interface LLMProviderConfig {
	name: string;
	apiKey: string;
	model: string;
	endpoint?: string;
}

export interface LLMProvider {
	generateResponse(prompt: string): Promise<string>;
}
