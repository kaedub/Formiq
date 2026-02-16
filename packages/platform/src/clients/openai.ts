import 'dotenv/config';
import OpenAI from 'openai';

export type OpenAIClientProviderOptions = {
  apiKey?: string;
};

let openAIInstance: OpenAI | undefined;

const resolveApiKey = (options: OpenAIClientProviderOptions): string => {
  const apiKey = options.apiKey ?? process.env['OPENAI_API_KEY'];

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  return apiKey;
};

export const getOpenAIClient = (
  options: OpenAIClientProviderOptions = {},
): OpenAI => {
  console.log('Getting OpenAI client...');
  if (!openAIInstance) {
    const apiKey = resolveApiKey(options);
    openAIInstance = new OpenAI({ apiKey });
  }

  return openAIInstance;
};
