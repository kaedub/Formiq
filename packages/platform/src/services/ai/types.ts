import type OpenAI from 'openai';
import { z } from 'zod';
import type { MilestoneDto, ProjectDto } from '@formiq/shared';
import {
  formDefinitionSchema,
  projectMilestoneSchema,
  projectPlanSchema,
  milestoneTasksSchema,
  taskSchema,
} from './schemas.js';
import type { FocusQuestionsContextInput } from '@formiq/shared';

export type AIServiceDependencies = {
  client: OpenAI;
};

export type FocusQuestionsDefinition = z.infer<typeof formDefinitionSchema>;

export type ProjectOutlineMilestone = z.infer<typeof projectMilestoneSchema>;

export type ProjectOutline = z.infer<typeof projectPlanSchema>;

export type GeneratedTask = z.infer<typeof taskSchema>;

export type MilestoneTasks = z.infer<typeof milestoneTasksSchema>;

export interface TaskGenerationContext {
  project: ProjectDto;
  milestone: MilestoneDto;
}

export interface GenerateProjectOutlineArgs {
  project: ProjectDto;
}

export interface GenerateTasksForMilestoneArgs {
  project: ProjectDto;
  milestone: MilestoneDto;
}

export type GenerateFocusQuestionsArgs = FocusQuestionsContextInput;

export interface AIService {
  generateFocusQuestions(
    args: GenerateFocusQuestionsArgs,
  ): Promise<FocusQuestionsDefinition>;
  generateProjectOutline(
    args: GenerateProjectOutlineArgs,
  ): Promise<ProjectOutline>;
  generateTasksForMilestone(
    args: GenerateTasksForMilestoneArgs,
  ): Promise<MilestoneTasks>;
}
