import type OpenAI from 'openai';
import type { Response, ResponseOutputMessage, ResponseOutputText } from 'openai/resources/responses/responses.js';
import { ZodError } from 'zod';

type StructuredResponseOptions<T> = {
  client: OpenAI;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  schemaName: string;
  schema: Record<string, unknown>;
  validator: (content: string) => T;
  description: string;
};

type ValidationResult<T> =
  | { success: true; value: T }
  | { success: false; message: string };

const isResponseOutputMessage = (
  item: Response['output'][number],
): item is ResponseOutputMessage => item.type === 'message';

const isResponseOutputText = (
  content: ResponseOutputMessage['content'][number],
): content is ResponseOutputText => content.type === 'output_text';

const extractTextOutput = (response: Response): string => {
  const normalizedOutput = response.output_text.trim();
  if (normalizedOutput) {
    return normalizedOutput;
  }

  for (const item of response.output) {
    if (isResponseOutputMessage(item)) {
      const textContent = item.content.find((entry) => isResponseOutputText(entry));
      const normalizedText = textContent?.text.trim();
      if (normalizedText) {
        return normalizedText;
      }
    }
  }

  throw new Error('OpenAI returned an empty response body');
};

const formatZodIssues = (error: ZodError): string => {
  return error.issues
    .map((issue) => {
      const path = issue.path.join('.') || '<root>';
      return `${path}: ${issue.message}`;
    })
    .join('; ');
};

const formatValidationError = (error: unknown): string => {
  if (error instanceof ZodError) {
    return formatZodIssues(error);
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown validation error';
};

const validateOutput = <T>(
  validator: StructuredResponseOptions<T>['validator'],
  raw: string,
): ValidationResult<T> => {
  try {
    return { success: true, value: validator(raw) };
  } catch (error) {
    return {
      success: false,
      message: formatValidationError(error),
    };
  }
};

const createResponse = async <T>(
  options: StructuredResponseOptions<T>,
  promptOverride?: string,
) => {
  const response = await options.client.responses.create({
    model: options.model,
    instructions: options.systemPrompt,
    input: [
      {
        role: 'user',
        content: promptOverride ?? options.userPrompt,
      },
    ],
    store: false,
    text: {
      format: {
        type: 'json_schema',
        name: options.schemaName,
        description: options.description,
        schema: options.schema,
        strict: true,
      },
    },
  });

  return {
    response,
    rawText: extractTextOutput(response),
  };
};

export const requestStructuredJson = async <T>(
  options: StructuredResponseOptions<T>,
): Promise<T> => {
  const primary = await createResponse(options);
  const primaryValidation = validateOutput(options.validator, primary.rawText);

  if (primaryValidation.success) {
    return primaryValidation.value;
  }

  const repairPrompt = [
    options.userPrompt,
    '',
    `The last response failed schema validation: ${primaryValidation.message}.`,
    `Return only JSON that matches the ${options.schemaName} schema.`,
  ].join('\n');

  const retry = await createResponse(options, repairPrompt);
  const retryValidation = validateOutput(options.validator, retry.rawText);

  if (retryValidation.success) {
    return retryValidation.value;
  }

  throw new Error(`Structured output invalid after retry: ${retryValidation.message}`);
};
