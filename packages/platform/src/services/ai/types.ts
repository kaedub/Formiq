import type OpenAI from 'openai';
import { z } from 'zod';
import type { MilestoneDto, ProjectDto } from '@formiq/shared';
import {
  intakeFormSchema,
  projectMilestoneSchema,
  projectPlanSchema,
  milestoneTasksSchema,
  taskSchema,
} from './schemas.js';
import type { Project } from '@prisma/client';

export type AIServiceDependencies = {
  client: OpenAI;
};

export type IntakeFormDefintion = z.infer<typeof intakeFormSchema>;

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

export interface AIService {
  generateForm(): Promise<IntakeFormDefintion>;
  generateProjectOutline(
    args: GenerateProjectOutlineArgs,
  ): Promise<ProjectOutline>;
  generateTasksForMilestone(
    args: GenerateTasksForMilestoneArgs,
  ): Promise<MilestoneTasks>;
}
