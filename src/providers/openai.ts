import axios from 'axios';
import dotenv from 'dotenv';
import { LLMProvider } from './provider';

dotenv.config();

export class OpenAIProvider implements LLMProvider {
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
		try {
			const response = await axios.post(
				this.endpoint,
				{
					model: this.model,
					messages: [{ role: 'user', content: prompt }],
					temperature: 0.5,
				},
				{
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${this.apiKey}`,
					},
				},
			);

			return response.data.choices?.[0]?.message?.content || '(No response)';
		} catch (error: any) {
			console.error('❌ Error contacting OpenAI API:', error.message);
			return '(Error generating response)';
		}
	}
}
