import { createAIService, getOpenAIClient } from '@formiq/platform';
import type { AIActivities } from '@formiq/shared';
import {
  parseFocusQuestionsOutput,
  parseGenerateFocusQuestionsInput,
  parseGenerateProjectOutlineInput,
  parseGenerateTasksForMilestoneInput,
  parseMilestoneTasksOutput,
  parseProjectOutlineOutput,
} from './types.js';

const aiService = createAIService({ client: getOpenAIClient() });

export const generateFocusQuestions: AIActivities['generateFocusQuestions'] =
  async (input) => {
    const parsedInput = parseGenerateFocusQuestionsInput(input);
    const result = await aiService.generateFocusQuestions(parsedInput);
    return parseFocusQuestionsOutput(result);
  };

export const generateProjectOutline: AIActivities['generateProjectOutline'] =
  async (input) => {
    const parsedInput = parseGenerateProjectOutlineInput(input);
    const result = await aiService.generateProjectOutline(parsedInput);
    return parseProjectOutlineOutput(result);
  };

export const generateTasksForMilestone: AIActivities['generateTasksForMilestone'] =
  async (input) => {
    const parsedInput = parseGenerateTasksForMilestoneInput(input);
    const result = await aiService.generateTasksForMilestone(parsedInput);
    return parseMilestoneTasksOutput(result);
  };
