import { createDatabaseService, getPrismaClient } from '@formiq/platform';
import type { DatabaseActivities } from '@formiq/shared';
import {
  parseCreateFormRecordInput,
  parseCreateMilestoneTasksInput,
  parseCreateProjectMilestonesInput,
  parseReplaceFocusFormItemsInput,
  parseGetProjectFocusFormInput,
  parseFocusFormDto,
  parseFormRecord,
} from './types.js';

const databaseService = createDatabaseService({ db: getPrismaClient() });

export const getProjectDetails: DatabaseActivities['getProjectDetails'] =
  async (input) => {
    const parsed = parseGetProjectFocusFormInput(input);
    return databaseService.getProjectDetails(parsed);
  };

export const getProjectFocusForm: DatabaseActivities['getProjectFocusForm'] =
  async (input) => {
    const parsed = parseGetProjectFocusFormInput(input);
    const focusForm = await databaseService.getProjectFocusForm(parsed);

    return focusForm ? parseFocusFormDto(focusForm) : null;
  };

export const createFocusForm: DatabaseActivities['createFocusForm'] = async (
  input,
) => {
  const parsedInput = parseCreateFormRecordInput(input);
  const formRecord = await databaseService.createFocusForm(parsedInput);
  return parseFormRecord(formRecord);
};

export const replaceFocusFormItems: DatabaseActivities['replaceFocusFormItems'] =
  async (input) => {
    const parsedInput = parseReplaceFocusFormItemsInput(input);
    await databaseService.replaceFocusFormItems(parsedInput);
  };

export const createProjectMilestones: DatabaseActivities['createProjectMilestones'] =
  async (input) => {
    const parsedInput = parseCreateProjectMilestonesInput(input);
    await databaseService.createProjectMilestones(parsedInput);
  };

export const createMilestoneTasks: DatabaseActivities['createMilestoneTasks'] =
  async (input) => {
    const parsedInput = parseCreateMilestoneTasksInput(input);
    await databaseService.createMilestoneTasks(parsedInput);
  };
