import type {
  CreateFormRecordInput,
  CreateMilestoneTasksInput,
  CreateProjectMilestonesInput,
  FormRecordDto,
} from '@formiq/shared';
import type { z } from 'zod';
import {
  createFormRecordInputSchema,
  createMilestoneTasksInputSchema,
  createProjectMilestonesInputSchema,
  formRecordSchema,
  getFocusFormByNameInputSchema,
} from './schemas.js';

export type GetFocusFormByNameInput = z.infer<
  typeof getFocusFormByNameInputSchema
>;
export type CreateFocusFormInput = CreateFormRecordInput;
export type CreateProjectMilestonesInputValidated = CreateProjectMilestonesInput;
export type CreateMilestoneTasksInputValidated = CreateMilestoneTasksInput;
export type FocusFormRecord = FormRecordDto;

export const parseGetFocusFormByNameInput = (
  input: unknown,
): GetFocusFormByNameInput => getFocusFormByNameInputSchema.parse(input);

export const parseCreateFormRecordInput = (
  input: unknown,
): CreateFocusFormInput => createFormRecordInputSchema.parse(input);

export const parseCreateProjectMilestonesInput = (
  input: unknown,
): CreateProjectMilestonesInputValidated =>
  createProjectMilestonesInputSchema.parse(input);

export const parseCreateMilestoneTasksInput = (
  input: unknown,
): CreateMilestoneTasksInputValidated =>
  createMilestoneTasksInputSchema.parse(input);

export const parseFormRecord = (value: unknown): FocusFormRecord =>
  formRecordSchema.parse(value);
