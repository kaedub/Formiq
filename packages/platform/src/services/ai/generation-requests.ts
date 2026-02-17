import {
  MilestoneContext,
  MilestoneTaskContext,
  ProjectContext,
} from './contexts.js';
import {
  DEFAULT_MODEL,
  PROJECT_PLAN_PROMPT,
  FOCUS_FORM_PROMPT,
  TASK_GENERATION_PROMPT,
} from './constants.js';
import {
  focusQuestionsFormSchema,
  projectContextSchema,
  projectOutlineSchema,
  milestoneTaskContextSchema,
  milestoneTasksSchema,
} from './schemas.js';
import type z from 'zod';
import type OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod.js';
import type {
  FocusQuestionsDefinition,
  MilestoneTasks,
  ProjectOutline,
} from './types.js';
import type {
  FocusQuestionsContextInput,
  MilestoneDto,
  ProjectCommitment,
  ProjectDto,
  ProjectFamiliarity,
  ProjectOutlineContext,
  ProjectWorkStyle,
} from '@formiq/shared';

type FocusQuestionsUserContext = FocusQuestionsContextInput;
type FocusQuestionsPromptContext = {
  goal: string;
  time_per_week: number;
  effort_level: 'explore' | 'build' | 'master';
  commitment_choice: ProjectCommitment;
  familiarity_choice: ProjectFamiliarity;
  work_style: string;
};

const commitmentHoursMap: Record<ProjectCommitment, number> = {
  light: 2,
  moderate: 8,
  heavy: 20,
  dedicated: 40,
};

const commitmentEffortLevelMap: Record<
  ProjectCommitment,
  'explore' | 'build' | 'master'
> = {
  light: 'explore',
  moderate: 'build',
  heavy: 'master',
  dedicated: 'master',
};

const workStyleLabelMap: Record<ProjectWorkStyle, string> = {
  short_daily_sessions: 'Short daily sessions',
  focused_sessions_per_week: 'A few focused sessions per week',
  flexible_or_varies: 'Flexible or varies',
};

interface GenerationRequest<
  Context,
  InputSchema extends z.ZodTypeAny | null,
  Output,
  OutputSchema extends z.ZodType<Output>,
> {
  name: string;
  model: string;
  systemPrompt: string;
  description: string;
  context: Context;
  inputSchema: InputSchema;
  outputSchema: OutputSchema;
  buildUserPrompt(): string;
  execute(): Promise<Output>;
}

abstract class BaseGenerationRequest<
  Context,
  InputSchema extends z.ZodTypeAny | null,
  Output,
  OutputSchema extends z.ZodType<Output>,
> implements GenerationRequest<Context, InputSchema, Output, OutputSchema> {
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

  async execute(): Promise<Output> {
    const response = await this.client.responses.parse({
      model: this.model,
      input: [
        { role: 'system', content: this.systemPrompt },
        { role: 'user', content: this.buildUserPrompt() },
      ],
      text: { format: zodTextFormat(this.outputSchema, this.name) },
    });
    return this.outputSchema.parse(response.output_parsed);
  }
}

export class FocusQuestionsRequest extends BaseGenerationRequest<
  FocusQuestionsUserContext,
  null,
  FocusQuestionsDefinition,
  typeof focusQuestionsFormSchema
> {
  name = 'focus_questions';
  model = DEFAULT_MODEL;
  systemPrompt = FOCUS_FORM_PROMPT;
  description = 'FormIQ focus questions payload';
  inputSchema = null;
  outputSchema = focusQuestionsFormSchema;
  context: FocusQuestionsUserContext;

  constructor(client: OpenAI, context: FocusQuestionsUserContext) {
    super(client);
    this.context = context;
  }

  private buildUserContextPayload(): FocusQuestionsPromptContext {
    const { commitment, familiarity, workStyle, goal } = this.context;

    return {
      goal,
      time_per_week: commitmentHoursMap[commitment],
      effort_level: commitmentEffortLevelMap[commitment],
      commitment_choice: commitment,
      familiarity_choice: familiarity,
      work_style: workStyleLabelMap[workStyle],
    };
  }

  buildUserPrompt(): string {
    const userContext = this.buildUserContextPayload();

    return [
      'USER_CONTEXT_JSON:',
      JSON.stringify(userContext, null, 2),
      'Generate a focus questions JSON payload.',
    ].join('\n');
  }
}

export class ProjectOutlineGenerationRequest extends BaseGenerationRequest<
  ProjectContext,
  typeof projectContextSchema,
  ProjectOutline,
  typeof projectOutlineSchema
> {
  name = 'project_outline';
  model = DEFAULT_MODEL;
  systemPrompt = PROJECT_PLAN_PROMPT;
  description = 'FormIQ project outline payload';
  inputSchema = projectContextSchema;
  outputSchema = projectOutlineSchema;
  context: ProjectContext;

  constructor(client: OpenAI, context: ProjectOutlineContext) {
    super(client);
    this.context = new ProjectContext(context);
  }

  buildUserPrompt(): string {
    const projectContextPayload = this.context.toJSON();
    return [
      `PROJECT_CONTEXT_JSON_SCHEMA: ${JSON.stringify(this.inputSchema, null, 2)}`,
      `PROJECT_PLAN_JSON_SCHEMA: ${JSON.stringify(this.outputSchema, null, 2)}`,
      'PROJECT_CONTEXT_JSON:',
      JSON.stringify(projectContextPayload, null, 2),
    ].join('\n');
  }
}

export class TaskGenerationRequest extends BaseGenerationRequest<
  MilestoneTaskContext,
  typeof milestoneTaskContextSchema,
  MilestoneTasks,
  typeof milestoneTasksSchema
> {
  name = 'task_schedule';
  model = DEFAULT_MODEL;
  systemPrompt = TASK_GENERATION_PROMPT;
  description = 'FormIQ milestone task schedule payload';
  inputSchema = milestoneTaskContextSchema;
  outputSchema = milestoneTasksSchema;
  context: MilestoneTaskContext;

  constructor(client: OpenAI, project: ProjectDto, milestone: MilestoneDto) {
    super(client);
    const projectContext = new ProjectContext(project);
    const milestoneContext = new MilestoneContext(milestone);
    this.context = new MilestoneTaskContext(projectContext, milestoneContext);
  }

  buildUserPrompt(): string {
    const milestoneTaskContextPayload = this.context.toJSON();

    return [
      `MILESTONE_TASK_CONTEXT_JSON_SCHEMA: ${JSON.stringify(this.inputSchema, null, 2)}`,
      `TASK_SCHEDULE_JSON_SCHEMA: ${JSON.stringify(this.outputSchema, null, 2)}`,
      'MILESTONE_TASK_CONTEXT_JSON:',
      JSON.stringify(milestoneTaskContextPayload, null, 2),
    ].join('\n');
  }
}
