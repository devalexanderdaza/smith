import fs from 'fs';
import { parse as parseJSONC } from 'jsonc-parser';
import { logger } from './logger';

export const readJSONC = (filePath: string): any => {
	try {
		if (!fs.existsSync(filePath)) {
			throw new Error(`File not found: ${filePath}`);
		}
		const content = fs.readFileSync(filePath, 'utf-8');
		const parsed = parseJSONC(content);

		if (parsed === undefined) {
			throw new Error(`Failed to parse JSONC file: ${filePath}`);
		}

		return parsed;
	} catch (error) {
		logger.error(`Error reading JSONC file: ${filePath}`, {}, error as Error);
		throw error;
	}
};
