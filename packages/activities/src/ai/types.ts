import type {
  FocusQuestionsContextInput,
  ProjectDto,
  ProjectOutlineContext,
} from '@formiq/shared';
import type { MilestoneDto } from '@formiq/shared';
import type { z } from 'zod';
import {
  focusQuestionsInputSchema,
  focusQuestionsOutputSchema,
  projectOutlineContextSchema,
  projectOutlineOutputSchema,
  milestoneTasksOutputSchema,
  taskGenerationContextSchema,
} from './schemas.js';

export type GenerateFocusQuestionsInput = FocusQuestionsContextInput;
export type FocusQuestionsOutput = z.infer<typeof focusQuestionsOutputSchema>;

export type GenerateProjectOutlineInput = ProjectOutlineContext;
export type ProjectOutlineOutput = z.infer<typeof projectOutlineOutputSchema>;

export type GenerateTasksForMilestoneInput = {
  project: ProjectDto;
  milestone: MilestoneDto;
};
export type MilestoneTasksOutput = z.infer<typeof milestoneTasksOutputSchema>;

export const parseGenerateFocusQuestionsInput = (
  input: unknown,
): GenerateFocusQuestionsInput => focusQuestionsInputSchema.parse(input);

export const parseFocusQuestionsOutput = (
  value: unknown,
): FocusQuestionsOutput => focusQuestionsOutputSchema.parse(value);

export const parseGenerateProjectOutlineInput = (
  input: unknown,
): GenerateProjectOutlineInput =>
  projectOutlineContextSchema.parse(input) as GenerateProjectOutlineInput;

export const parseProjectOutlineOutput = (
  value: unknown,
): ProjectOutlineOutput => projectOutlineOutputSchema.parse(value);

export const parseGenerateTasksForMilestoneInput = (
  input: unknown,
): GenerateTasksForMilestoneInput => taskGenerationContextSchema.parse(input);

export const parseMilestoneTasksOutput = (
  value: unknown,
): MilestoneTasksOutput => milestoneTasksOutputSchema.parse(value);
