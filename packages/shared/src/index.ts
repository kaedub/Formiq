export type QuestionType = 'multi_select' | 'single_select' | 'free_text';

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
  responses: QuestionResponseInput[];
}

export type CreateProjectMilestonesInput = UserProjectInput & {
  milestones: MilestoneDto[];
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

export type ProjectStatus = 'draft' | 'generating' | 'ready';

export type MilestoneStatus = 'locked' | 'unlocked' | 'completed';

export type TaskStatus = 'locked' | 'unlocked' | 'completed';

export interface IntakeQuestionDto {
  id: string;
  prompt: string;
  options: string[];
  questionType: QuestionType;
  position: number;
}

export interface IntakeFormDto {
  id: string;
  name: string;
  questions: IntakeQuestionDto[];
}

export interface CreateIntakeFormInput {
  name: string;
  questions: IntakeQuestionDto[];
}

export interface QuestionAnswerDto {
  questionId: string;
  projectId: string;
  values: string[];
  answeredAt: string;
}

export interface QuestionResponseDto {
  question: IntakeQuestionDto;
  answer: QuestionAnswerDto;
}

export interface MilestoneDto {
  id: string;
  projectId: string;
  title: string;
  summary: string;
  position: number;
  status: MilestoneStatus;
  context?: unknown;
  generatedAt?: string;
  metadata?: unknown;
}

export interface TaskDto {
  id: string;
  milestoneId: string;
  title: string;
  description: string;
  position: number;
  status: TaskStatus;
  generatedAt?: string;
  completedAt?: string;
  metadata?: unknown;
}

export interface ProjectDto {
  id: string;
  userId: string;
  title: string;
  status: ProjectStatus;
  generatedAt?: string;
  createdAt: string;
  updatedAt: string;
  responses: QuestionResponseDto[];
}

export interface ProjectSummaryDto {
  id: string;
  title: string;
  status?: ProjectStatus;
}

export type PromptExecutionStage =
  | 'project_context'
  | 'milestone_outline'
  | 'milestone_validation'
  | 'task_generation'
  | 'task_validation';

export type PromptExecutionStatus = 'pending' | 'success' | 'failed';

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

export type ProjectEventType =
  | 'status_change'
  | 'milestone_generated'
  | 'task_generated'
  | 'task_completed';

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

export interface ProjectResponse {
  id: string;
  title: string;
  status: ProjectStatus;
  responses: QuestionResponseDto[];
}
