import type OpenAI from 'openai';
import {
  FocusQuestionsRequest,
  ProjectOutlineGenerationRequest,
  TaskGenerationRequest,
} from './generation-requests.js';
import type {
  AIService,
  AIServiceDependencies,
  FocusQuestionsDefinition,
  ProjectOutline,
  MilestoneTasks,
  GenerateTasksForMilestoneArgs,
  GenerateProjectOutlineArgs,
  GenerateFocusQuestionsArgs,
} from './types.js';

class OpenAIService implements AIService {
  constructor(private readonly client: OpenAI) {}

  async generateFocusQuestions({
    goal,
    commitment,
    familiarity,
    workStyle,
  }: GenerateFocusQuestionsArgs): Promise<FocusQuestionsDefinition> {
    const request = new FocusQuestionsRequest(this.client, {
      goal,
      commitment,
      familiarity,
      workStyle,
    });
    const response = await request.execute();
    return response;
  }

  async generateProjectOutline(
    context: GenerateProjectOutlineArgs,
  ): Promise<ProjectOutline> {
    const request = new ProjectOutlineGenerationRequest(this.client, context);
    const projectOutline = await request.execute();
    return projectOutline;
  }

  async generateTasksForMilestone({
    project,
    milestone,
  }: GenerateTasksForMilestoneArgs): Promise<MilestoneTasks> {
    const request = new TaskGenerationRequest(this.client, project, milestone);
    const taskSchedule = await request.execute();
    return taskSchedule;
  }
}

export const createAIService = ({
  client,
}: AIServiceDependencies): AIService => {
  return new OpenAIService(client);
};
