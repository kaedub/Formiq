import type {
  CreateFormRecordInput,
  CreateMilestoneTasksInput,
  CreateProjectMilestonesInput,
  ReplaceFocusFormItemsInput,
  GetProjectInput,
  FocusFormDto,
  FormRecordDto,
} from '@formiq/shared';
import {
  createFormRecordInputSchema,
  createMilestoneTasksInputSchema,
  createProjectMilestonesInputSchema,
  replaceFocusFormItemsInputSchema,
  getProjectFocusFormInputSchema,
  focusFormDtoSchema,
  formRecordSchema,
} from './schemas.js';

export type CreateFocusFormInput = CreateFormRecordInput;
export type CreateProjectMilestonesInputValidated =
  CreateProjectMilestonesInput;
export type CreateMilestoneTasksInputValidated = CreateMilestoneTasksInput;
export type FocusFormRecord = FormRecordDto;

export const parseGetProjectFocusFormInput = (
  input: unknown,
): GetProjectInput => getProjectFocusFormInputSchema.parse(input);

export const parseFocusFormDto = (value: unknown): FocusFormDto =>
  focusFormDtoSchema.parse(value);

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

export const parseReplaceFocusFormItemsInput = (
  input: unknown,
): ReplaceFocusFormItemsInput => replaceFocusFormItemsInputSchema.parse(input);

export const parseFormRecord = (value: unknown): FocusFormRecord =>
  formRecordSchema.parse(value);
