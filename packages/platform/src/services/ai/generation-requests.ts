import type {
  CoarseTaskScheduleContextJson,
  ProjectContextJson,
} from './contexts.js';
import { CoarseTaskScheduleContext, ProjectContext } from './contexts.js';
import {
  DEFAULT_MODEL,
  COARSE_TASK_SCHEDULE_PROMPT,
  PROJECT_PLAN_PROMPT,
  INTAKE_FORM_PROMPT,
} from './constants.js';
import {
  intakeFormSchema,
  projectContextSchema,
  projectPlanSchema,
  coarseTaskScheduleContextSchema,
  taskScheduleSchema,
} from './schemas.js';
import type z from 'zod';
import type OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod.js';

interface GenerationRequest<
  Context,
  InputSchema extends z.ZodTypeAny | null,
  OutputSchema extends z.ZodTypeAny,
> {
  name: string;
  model: string;
  systemPrompt: string;
  description: string;
  context: Context;
  inputSchema: InputSchema;
  outputSchema: OutputSchema;
  buildUserPrompt(): string;
  execute(): Promise<z.infer<OutputSchema>>;
}

abstract class BaseGenerationRequest<
  Context,
  InputSchema extends z.ZodTypeAny | null,
  OutputSchema extends z.ZodTypeAny,
> implements GenerationRequest<Context, InputSchema, OutputSchema> {
  abstract name: string;
  abstract model: string;
  abstract systemPrompt: string;
  abstract description: string;
  abstract context: Context;
  abstract inputSchema: InputSchema;
  abstract outputSchema: OutputSchema;
  protected client: OpenAI;

  constructor(client: OpenAI) {
    this.client = client;
  }

  abstract buildUserPrompt(): string;

  async execute(): Promise<z.infer<OutputSchema>> {
    const response = await this.client.responses.parse({
      model: this.model,
      input: [
        { role: 'system', content: this.systemPrompt },
        { role: 'user', content: this.buildUserPrompt() },
      ],
      text: { format: zodTextFormat(this.outputSchema, this.name) },
    });
    return response.output_parsed as z.infer<OutputSchema>;
  }
}

export class IntakeFormDefinitionRequest extends BaseGenerationRequest<
  null,
  null,
  typeof intakeFormSchema
> {
  name = 'intake_form';
  model = DEFAULT_MODEL;
  systemPrompt = INTAKE_FORM_PROMPT;
  description = 'FormIQ intake form definition payload';
  inputSchema = null;
  outputSchema = intakeFormSchema;
  context = null;

  buildUserPrompt(): string {
    return 'Generate an intake form JSON payload.';
  }
}

export class ProjectOutlineGenerationRequest extends BaseGenerationRequest<
  ProjectContext,
  typeof projectContextSchema,
  typeof projectPlanSchema
> {
  name = 'project_outline';
  model = DEFAULT_MODEL;
  systemPrompt = PROJECT_PLAN_PROMPT;
  description = 'FormIQ project outline payload';
  inputSchema = projectContextSchema;
  outputSchema = projectPlanSchema;
  context: ProjectContext;

  constructor(client: OpenAI, projectContext: ProjectContext) {
    super(client);
    this.context = projectContext;
  }

  toJSON(): ProjectContextJson {
    return this.context.toJSON();
  }

  buildUserPrompt(): string {
    const projectContextPayload = this.toJSON();
    return [
      `PROJECT_CONTEXT_JSON_SCHEMA: ${JSON.stringify(this.inputSchema, null, 2)}`,
      `PROJECT_PLAN_JSON_SCHEMA: ${JSON.stringify(this.outputSchema, null, 2)}`,
      'PROJECT_CONTEXT_JSON:',
      JSON.stringify(projectContextPayload, null, 2),
    ].join('\n');
  }
}

export class CoarseTaskScheduleGenerationRequest extends BaseGenerationRequest<
  CoarseTaskScheduleContext,
  typeof coarseTaskScheduleContextSchema,
  typeof taskScheduleSchema
> {
  name = 'coarse_task_schedule';
  model = DEFAULT_MODEL;
  systemPrompt = COARSE_TASK_SCHEDULE_PROMPT;
  description = 'FormIQ coarse task schedule payload';
  inputSchema = coarseTaskScheduleContextSchema;
  outputSchema = taskScheduleSchema;
  context: CoarseTaskScheduleContext;

  constructor(client: OpenAI, context: CoarseTaskScheduleContext) {
    super(client);
    this.context = context;
  }

  toJSON(): CoarseTaskScheduleContextJson {
    return this.context.toJSON();
  }

  buildUserPrompt(): string {
    const coarseContextPayload = this.toJSON();
    return [
      `COARSE_TASK_SCHEDULE_CONTEXT_JSON_SCHEMA: ${JSON.stringify(this.inputSchema, null, 2)}`,
      `TASK_SCHEDULE_JSON_SCHEMA: ${JSON.stringify(this.outputSchema, null, 2)}`,
      'COARSE_TASK_SCHEDULE_CONTEXT_JSON:',
      JSON.stringify(coarseContextPayload, null, 2),
    ].join('\n');
  }
}
