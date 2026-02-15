export const QUESTION_TYPE_VALUES = [
  'multi_select',
  'single_select',
  'free_text',
] as const satisfies readonly [string, ...string[]];
export type QuestionType = (typeof QUESTION_TYPE_VALUES)[number];

export const TEST_USER_ID = 'test-user-id' as const;

export const PROJECT_COMMITMENT_VALUES = [
  'light',
  'moderate',
  'heavy',
  'dedicated',
] as const satisfies readonly [string, ...string[]];
export type ProjectCommitment = (typeof PROJECT_COMMITMENT_VALUES)[number];

export const PROJECT_FAMILIARITY_VALUES = [
  'completely_new',
  'some_experience',
  'experienced_refining',
] as const satisfies readonly [string, ...string[]];
export type ProjectFamiliarity = (typeof PROJECT_FAMILIARITY_VALUES)[number];

export const PROJECT_WORK_STYLE_VALUES = [
  'short_daily_sessions',
  'focused_sessions_per_week',
  'flexible_or_varies',
] as const satisfies readonly [string, ...string[]];
export type ProjectWorkStyle = (typeof PROJECT_WORK_STYLE_VALUES)[number];

// TODO: These options can be cleaned up or maybe become database level
export const PROJECT_COMMITMENT_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'heavy', label: 'Heavy' },
  { value: 'dedicated', label: 'Dedicated' },
] as const satisfies ReadonlyArray<{
  value: ProjectCommitment;
  label: string;
}>;

export const PROJECT_FAMILIARITY_OPTIONS = [
  { value: 'completely_new', label: 'Completely new' },
  { value: 'some_experience', label: 'Some experience' },
  { value: 'experienced_refining', label: 'Experienced / refining' },
] as const satisfies ReadonlyArray<{
  value: ProjectFamiliarity;
  label: string;
}>;

export const PROJECT_WORK_STYLE_OPTIONS = [
  { value: 'short_daily_sessions', label: 'Short daily sessions' },
  {
    value: 'focused_sessions_per_week',
    label: 'A few focused sessions per week',
  },
  { value: 'flexible_or_varies', label: 'Flexible / varies' },
] as const satisfies ReadonlyArray<{
  value: ProjectWorkStyle;
  label: string;
}>;

export interface FormOption<Value extends string = string> {
  value: Value;
  label: string;
}

export interface FormQuestion<Value extends string = string> {
  id: string;
  prompt: string;
  questionType: Extract<QuestionType, 'free_text' | 'single_select'>;
  options: ReadonlyArray<FormOption<Value>>;
  position: number;
  required: boolean;
}

export interface FormDefinition<QuestionValue extends string = string> {
  questions: ReadonlyArray<FormQuestion<QuestionValue>>;
}

export interface ProjectIntakeAnswers {
  goal: string;
  commitment: ProjectCommitment;
  familiarity: ProjectFamiliarity;
  workStyle: ProjectWorkStyle;
}

export const INTAKE_QUESTION_ID_GOAL = 'goal' as const;
export const INTAKE_QUESTION_ID_COMMITMENT = 'time_commitment' as const;
export const INTAKE_QUESTION_ID_FAMILIARITY = 'familiarity' as const;
export const INTAKE_QUESTION_ID_WORK_STYLE = 'work_style' as const;

export const PROJECT_INTAKE_FORM: FormDefinition = {
  questions: [
    {
      id: INTAKE_QUESTION_ID_GOAL,
      prompt: 'What do you want to accomplish?',
      questionType: 'free_text',
      options: [],
      position: 1,
      required: true,
    },
    {
      id: INTAKE_QUESTION_ID_COMMITMENT,
      prompt: 'How much time can you realistically commit per week?',
      questionType: 'single_select',
      options: PROJECT_COMMITMENT_OPTIONS,
      position: 2,
      required: true,
    },
    {
      id: INTAKE_QUESTION_ID_FAMILIARITY,
      prompt: 'How familiar are you with this area?',
      questionType: 'single_select',
      options: PROJECT_FAMILIARITY_OPTIONS,
      position: 3,
      required: true,
    },
    {
      id: INTAKE_QUESTION_ID_WORK_STYLE,
      prompt: 'How do you prefer to work?',
      questionType: 'single_select',
      options: PROJECT_WORK_STYLE_OPTIONS,
      position: 4,
      required: true,
    },
  ],
};

export const isProjectCommitment = (
  value: unknown,
): value is ProjectCommitment =>
  typeof value === 'string' &&
  PROJECT_COMMITMENT_VALUES.includes(value as ProjectCommitment);

export const isProjectFamiliarity = (
  value: unknown,
): value is ProjectFamiliarity =>
  typeof value === 'string' &&
  PROJECT_FAMILIARITY_VALUES.includes(value as ProjectFamiliarity);

export const isProjectWorkStyle = (value: unknown): value is ProjectWorkStyle =>
  typeof value === 'string' &&
  PROJECT_WORK_STYLE_VALUES.includes(value as ProjectWorkStyle);

export type FocusQuestionsContextInput = ProjectIntakeAnswers;
export type FocusQuestionsDefinition = FormDefinition;

type UserProjectInput = {
  userId: string;
  projectId: string;
};

export interface QuestionResponseInput {
  questionId: string;
  values: string[];
}

export type GetProjectInput = UserProjectInput;

export interface CreateProjectInput {
  userId: string;
  title: string;
  commitment: ProjectCommitment;
  familiarity: ProjectFamiliarity;
  workStyle: ProjectWorkStyle;
  responses: QuestionResponseInput[];
}

export interface CreateMilestoneInput {
  title: string;
  summary: string;
  position: number;
}

export type CreateProjectMilestonesInput = UserProjectInput & {
  milestones: CreateMilestoneInput[];
};

type CreateTaskInput = {
  title: string;
  description: string;
  position: number;
};

export type CreateMilestoneTasksInput = UserProjectInput & {
  milestoneId: string;
  tasks: CreateTaskInput[];
};

export const PROJECT_STATUS_VALUES = [
  'draft',
  'generating',
  'ready',
] as const satisfies readonly [string, ...string[]];
export type ProjectStatus = (typeof PROJECT_STATUS_VALUES)[number];

export const MILESTONE_STATUS_VALUES = [
  'locked',
  'unlocked',
  'completed',
] as const satisfies readonly [string, ...string[]];
export type MilestoneStatus = (typeof MILESTONE_STATUS_VALUES)[number];

export const TASK_STATUS_VALUES = [
  'locked',
  'unlocked',
  'completed',
] as const satisfies readonly [string, ...string[]];
export type TaskStatus = (typeof TASK_STATUS_VALUES)[number];

export interface FormRecordDto {
  id: string;
  name: string;
  projectId: string;
  kind: 'project_intake' | 'focus_questions';
}

export const FORM_RECORD_KIND_VALUES = [
  'project_intake',
  'focus_questions',
] as const satisfies readonly [string, ...string[]];

export interface CreateFocusItemInput {
  question: string;
  questionType: QuestionType;
  options: string[];
  position: number;
}

export interface CreateFormRecordInput {
  name: string;
  projectId: string;
  userId: string;
  kind: FormRecordDto['kind'];
  items: CreateFocusItemInput[];
}

export interface ReplaceFocusFormItemsInput {
  formId: string;
  userId: string;
  items: CreateFocusItemInput[];
}

export interface FocusItemDto {
  id: string;
  question: string;
  questionType: QuestionType;
  options: string[];
  position: number;
  answer: string | null;
  answeredAt: string | null;
}

export interface FocusFormDto {
  id: string;
  name: string;
  projectId: string;
  kind: 'focus_questions';
  items: FocusItemDto[];
}

export interface MilestoneDto {
  id: string;
  projectId: string;
  title: string;
  summary: string;
  position: number;
  status: MilestoneStatus;
  generatedAt: string;
}

export interface TaskDto {
  id: string;
  milestoneId: string;
  title: string;
  description: string;
  position: number;
  status: TaskStatus;
  generatedAt: string;
  completedAt: string | null;
}

export interface ProjectQuestionDto {
  id: string;
  prompt: string;
  questionType: QuestionType;
  options: string[];
}

export interface ProjectResponseAnswerDto {
  questionId: string;
  values: string[];
}

export interface ProjectResponseDto {
  question: ProjectQuestionDto;
  answer: ProjectResponseAnswerDto;
}

export interface ProjectDto {
  id: string;
  userId: string;
  title: string;
  commitment: ProjectCommitment;
  familiarity: ProjectFamiliarity;
  workStyle: ProjectWorkStyle;
  status: ProjectStatus;
  generatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  responses: ProjectResponseDto[];
}

export interface ProjectSummaryDto {
  id: string;
  title: string;
  status?: ProjectStatus;
}

export const PROMPT_EXECUTION_STAGE_VALUES = [
  'project_context',
  'milestone_outline',
  'milestone_validation',
  'task_generation',
  'task_validation',
] as const;
export type PromptExecutionStage =
  (typeof PROMPT_EXECUTION_STAGE_VALUES)[number];

export const PROMPT_EXECUTION_STATUS_VALUES = [
  'pending',
  'success',
  'failed',
] as const;
export type PromptExecutionStatus =
  (typeof PROMPT_EXECUTION_STATUS_VALUES)[number];

export interface PromptExecutionDto {
  id: string;
  projectId: string;
  milestoneId?: string;
  taskId?: string;
  templateId?: string;
  stage: PromptExecutionStage;
  status: PromptExecutionStatus;
  input: unknown;
  output?: unknown;
  model?: string;
  metadata?: unknown;
  createdAt: string;
}

export const PROJECT_EVENT_TYPE_VALUES = [
  'status_change',
  'milestone_generated',
  'task_generated',
  'task_completed',
] as const;
export type ProjectEventType = (typeof PROJECT_EVENT_TYPE_VALUES)[number];

export interface ProjectEventDto {
  id: string;
  projectId: string;
  eventType: ProjectEventType;
  payload?: unknown;
  createdAt: string;
}

export interface ProjectContextMilestoneDto extends MilestoneDto {
  tasks: TaskDto[];
}

export interface ProjectContextProjectDto extends ProjectDto {
  milestones: ProjectContextMilestoneDto[];
}

export interface ProjectContextDto {
  project: ProjectContextProjectDto;
}

// --- AI Activity Output Types ---

export interface FocusQuestionOutput {
  id: string;
  prompt: string;
  questionType: QuestionType;
  options: string[];
  position: number;
}

export interface FocusQuestionsOutput {
  questions: FocusQuestionOutput[];
}

export interface ProjectOutlineMilestone {
  title: string;
  description: string;
}

export interface ProjectOutlineOutput {
  milestones: ProjectOutlineMilestone[];
}

export interface MilestoneTaskOutput {
  day: number;
  title: string;
  objective: string;
  body: string;
  estimatedMinutes: number;
}

export interface MilestoneTasksOutput {
  tasks: MilestoneTaskOutput[];
}

// --- Activity Interfaces (used by proxyActivities in workflows) ---

export interface DatabaseActivities {
  getProjectFocusForm(input: GetProjectInput): Promise<FocusFormDto | null>;
  createFocusForm(input: CreateFormRecordInput): Promise<FormRecordDto>;
  replaceFocusFormItems(input: ReplaceFocusFormItemsInput): Promise<void>;
  createProjectMilestones(input: CreateProjectMilestonesInput): Promise<void>;
  createMilestoneTasks(input: CreateMilestoneTasksInput): Promise<void>;
}

export interface AIActivities {
  generateFocusQuestions(
    input: FocusQuestionsContextInput,
  ): Promise<FocusQuestionsOutput>;
  generateProjectOutline(input: {
    project: ProjectDto;
  }): Promise<ProjectOutlineOutput>;
  generateTasksForMilestone(input: {
    project: ProjectDto;
    milestone: MilestoneDto;
  }): Promise<MilestoneTasksOutput>;
}

// --- Workflow Input Types ---

export interface GenerateProjectRoadmapInput {
  userId: string;
  project: ProjectDto;
  intakeAnswers: ProjectIntakeAnswers;
}
