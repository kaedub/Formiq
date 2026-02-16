import 'dotenv/config';
import { Client, Connection } from '@temporalio/client';
import type { GenerateProjectRoadmapInput } from '@formiq/shared';
import { TEST_USER_ID } from '@formiq/shared';

const TEMPORAL_ADDRESS = process.env['TEMPORAL_ADDRESS'] ?? 'localhost:7233';
const TEMPORAL_NAMESPACE = process.env['TEMPORAL_NAMESPACE'] ?? 'default';

const input: GenerateProjectRoadmapInput = {
  projectId: 'test-project-1',
  userId: TEST_USER_ID,
  title: 'Learn TypeScript',
  commitment: 'moderate',
  familiarity: 'some_experience',
  workStyle: 'short_daily_sessions',
  focusItems: [
    {
      id: 'goal',
      question: 'What do you want to accomplish?',
      questionType: 'free_text',
      options: [],
      position: 1,
      answer: 'Build a full-stack web app',
      answeredAt: new Date().toISOString(),
    },
  ],
};

async function main(): Promise<void> {
  const connection = await Connection.connect({
    address: TEMPORAL_ADDRESS,
  });

  const client = new Client({ connection, namespace: TEMPORAL_NAMESPACE });

  const handle = await client.workflow.start('GenerateProjectRoadmap', {
    taskQueue: 'workflow',
    workflowId: `generate-roadmap-${input.projectId}`,
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
