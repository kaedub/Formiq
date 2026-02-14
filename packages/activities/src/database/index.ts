import { createDatabaseService, getPrismaClient } from '@formiq/platform';
import type { FormRecordDto } from '@formiq/shared';
import {
  parseCreateFormRecordInput,
  parseCreateMilestoneTasksInput,
  parseCreateProjectMilestonesInput,
  parseFormRecord,
  parseGetFocusFormByNameInput,
} from './types.js';

const databaseService = createDatabaseService({ db: getPrismaClient() });

export const getFocusFormByName = async (
  input: unknown,
): Promise<FormRecordDto | null> => {
  const { name } = parseGetFocusFormByNameInput(input);
  const formRecord = await databaseService.getFocusFormByName(name);

  return formRecord ? parseFormRecord(formRecord) : null;
};

export const createFocusForm = async (
  input: unknown,
): Promise<FormRecordDto> => {
  const parsedInput = parseCreateFormRecordInput(input);
  const formRecord = await databaseService.createFocusForm(parsedInput);

  return parseFormRecord(formRecord);
};

export const createProjectMilestones = async (
  input: unknown,
): Promise<void> => {
  const parsedInput = parseCreateProjectMilestonesInput(input);
  await databaseService.createProjectMilestones(parsedInput);
};

export const createMilestoneTasks = async (input: unknown): Promise<void> => {
  const parsedInput = parseCreateMilestoneTasksInput(input);
  await databaseService.createMilestoneTasks(parsedInput);
};
