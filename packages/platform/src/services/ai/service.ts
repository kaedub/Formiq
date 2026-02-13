import type OpenAI from 'openai';
import {
  IntakeFormDefinitionRequest,
  ProjectOutlineGenerationRequest,
  TaskGenerationRequest,
} from './generation-requests.js';
import type {
  AIService,
  AIServiceDependencies,
  IntakeFormDefintion,
  ProjectOutline,
  MilestoneTasks,
  GenerateTasksForMilestoneArgs,
  GenerateProjectOutlineArgs,
} from './types.js';

class OpenAIService implements AIService {
  constructor(private readonly client: OpenAI) {}

  async generateForm(): Promise<IntakeFormDefintion> {
    const request = new IntakeFormDefinitionRequest(this.client);
    const response = await request.execute();
    return response;
  }

  async generateProjectOutline({
    project,
  }: GenerateProjectOutlineArgs): Promise<ProjectOutline> {
    const request = new ProjectOutlineGenerationRequest(this.client, project);
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
