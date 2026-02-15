import 'dotenv/config';
import { Client, Connection } from '@temporalio/client';
import type { GenerateProjectRoadmapInput, ProjectDto } from '@formiq/shared';
import { TEST_USER_ID } from '@formiq/shared';

const TEMPORAL_ADDRESS = process.env['TEMPORAL_ADDRESS'] ?? 'localhost:7233';
const TEMPORAL_NAMESPACE = process.env['TEMPORAL_NAMESPACE'] ?? 'default';

const sampleProject: ProjectDto = {
  id: 'test-project-1',
  userId: TEST_USER_ID,
  title: 'Learn TypeScript',
  status: 'draft',
  generatedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  responses: [
    {
      question: {
        id: 'goal',
        prompt: 'What do you want to accomplish?',
        questionType: 'free_text',
        options: [],
      },
      answer: { questionId: 'goal', values: ['Build a full-stack web app'] },
    },
  ],
};

const input: GenerateProjectRoadmapInput = {
  userId: TEST_USER_ID,
  project: sampleProject,
  intakeAnswers: {
    goal: 'Build a full-stack web app',
    commitment: 'moderate',
    familiarity: 'intermediate',
    workStyle: 'short_daily_sessions',
  },
};

async function main(): Promise<void> {
  const connection = await Connection.connect({
    address: TEMPORAL_ADDRESS,
  });

  const client = new Client({ connection, namespace: TEMPORAL_NAMESPACE });

  const handle = await client.workflow.start('GenerateProjectRoadmap', {
    taskQueue: 'workflow',
    workflowId: `generate-roadmap-${input.project.id}`,
    args: [input],
  });

  console.log(
    `Started workflow ${handle.workflowId} (run ID: ${handle.firstExecutionRunId})`,
  );

  const result: unknown = await handle.result();
  console.log('Workflow completed:', result);
}

main().catch((err: unknown) => {
  console.error('Client failed:', err);
  process.exitCode = 1;
});
