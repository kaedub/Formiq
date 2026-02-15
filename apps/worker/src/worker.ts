import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import {
  createFocusForm,
  createMilestoneTasks,
  createProjectMilestones,
  generateFocusQuestions,
  generateProjectOutline,
  generateTasksForMilestone,
  getProjectFocusForm,
} from '@formiq/activities';
import { NativeConnection, Worker } from '@temporalio/worker';

const TEMPORAL_ADDRESS = process.env['TEMPORAL_ADDRESS'] ?? 'localhost:7233';
const TEMPORAL_NAMESPACE = process.env['TEMPORAL_NAMESPACE'] ?? 'default';

const run = async (): Promise<void> => {
  const connection = await NativeConnection.connect({
    address: TEMPORAL_ADDRESS,
  });
  console.log('Temporal connection:', connection);

  const namespace = TEMPORAL_NAMESPACE;

  const workflowWorker = await Worker.create({
    connection,
    namespace,
    taskQueue: 'workflow',
    workflowsPath: fileURLToPath(import.meta.resolve('@formiq/workflows')),
    activities: {},
  });

  const generateWorker = await Worker.create({
    connection,
    namespace,
    taskQueue: 'generate',
    activities: {
      generateFocusQuestions,
      generateProjectOutline,
      generateTasksForMilestone,
    },
  });

  const databaseWorker = await Worker.create({
    connection,
    namespace,
    taskQueue: 'database',
    activities: {
      getProjectFocusForm,
      createFocusForm,
      createProjectMilestones,
      createMilestoneTasks,
    },
  });

  console.log('Workers created for task queues: workflow, generate, database');
  await Promise.all([
    workflowWorker.run(),
    generateWorker.run(),
    databaseWorker.run(),
  ]);
};

run().catch((err: unknown) => {
  console.error('Worker failed:', err);
  process.exitCode = 1;
});
