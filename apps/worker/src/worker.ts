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
import {
  DefaultLogger,
  type LogEntry,
  NativeConnection,
  Runtime,
  Worker,
} from '@temporalio/worker';

const TEMPORAL_ADDRESS = process.env['TEMPORAL_ADDRESS'] ?? 'localhost:7233';
const TEMPORAL_NAMESPACE = process.env['TEMPORAL_NAMESPACE'] ?? 'default';

function safeLogFunction(entry: LogEntry): void {
  const { level, timestampNanos, message, meta } = entry;
  const date = new Date(Number(timestampNanos / 1_000_000n));
  const prefix = `${date.toISOString()} [${level}] ${message}`;
  if (meta === undefined) {
    process.stderr.write(`${prefix}\n`);
  } else {
    let metaStr: string;
    try {
      metaStr = JSON.stringify(meta);
    } catch {
      metaStr = '[meta not serializable]';
    }
    process.stderr.write(`${prefix} ${metaStr}\n`);
  }
}

const run = async (): Promise<void> => {
  Runtime.install({
    logger: new DefaultLogger('INFO', safeLogFunction),
  });

  const connection = await NativeConnection.connect({
    address: TEMPORAL_ADDRESS,
  });

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
