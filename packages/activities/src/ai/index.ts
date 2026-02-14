import { createAIService, getOpenAIClient } from '@formiq/platform';
import {
  parseFocusQuestionsOutput,
  parseGenerateFocusQuestionsInput,
  parseGenerateProjectOutlineInput,
  parseGenerateTasksForMilestoneInput,
  parseMilestoneTasksOutput,
  parseProjectOutlineOutput,
} from './types.js';
import type {
  FocusQuestionsOutput,
  GenerateFocusQuestionsInput,
  GenerateProjectOutlineInput,
  GenerateTasksForMilestoneInput,
  MilestoneTasksOutput,
  ProjectOutlineOutput,
} from './types.js';

const aiService = createAIService({ client: getOpenAIClient() });

export const generateFocusQuestions = async (
  input: unknown,
): Promise<FocusQuestionsOutput> => {
  const parsedInput: GenerateFocusQuestionsInput =
    parseGenerateFocusQuestionsInput(input);
  const result = await aiService.generateFocusQuestions(parsedInput);
  return parseFocusQuestionsOutput(result);
};

export const generateProjectOutline = async (
  input: unknown,
): Promise<ProjectOutlineOutput> => {
  const parsedInput: GenerateProjectOutlineInput =
    parseGenerateProjectOutlineInput(input);
  const result = await aiService.generateProjectOutline(parsedInput);
  return parseProjectOutlineOutput(result);
};

export const generateTasksForMilestone = async (
  input: unknown,
): Promise<MilestoneTasksOutput> => {
  const parsedInput: GenerateTasksForMilestoneInput =
    parseGenerateTasksForMilestoneInput(input);
  const result = await aiService.generateTasksForMilestone(parsedInput);
  return parseMilestoneTasksOutput(result);
};
