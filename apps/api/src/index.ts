import cors from 'cors';
import express from 'express';
import { Client, Connection } from '@temporalio/client';
import {
  createAIService,
  createDatabaseService,
  getOpenAIClient,
  getPrismaClient,
} from '@formiq/platform';
import {
  TEST_USER_ID,
  isProjectCommitment,
  isProjectFamiliarity,
  isProjectWorkStyle,
} from '@formiq/shared';
import type {
  GenerateProjectRoadmapInput,
  SubmitFocusResponsesInput,
} from '@formiq/shared';

const TEMPORAL_ADDRESS = process.env['TEMPORAL_ADDRESS'] ?? 'localhost:7233';
const TEMPORAL_NAMESPACE = process.env['TEMPORAL_NAMESPACE'] ?? 'default';

const app = express();
app.use(cors());
app.use(express.json());

const prisma = getPrismaClient();
const db = createDatabaseService({ db: prisma });

const openaiClient = getOpenAIClient();
const ai = createAIService({ client: openaiClient });

let temporalClient: Client | null = null;

async function getTemporalClient(): Promise<Client> {
  if (!temporalClient) {
    const connection = await Connection.connect({
      address: TEMPORAL_ADDRESS,
    });
    temporalClient = new Client({
      connection,
      namespace: TEMPORAL_NAMESPACE,
    });
  }
  return temporalClient;
}

app.get('/', (_req, res) => {
  res.send('Welcome to the Project Intake API');
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/projects', async (_req, res) => {
  const userId = TEST_USER_ID;
  try {
    const projects = await db.getProjectsByUserId(userId);
    return res.json({ projects });
  } catch (error) {
    console.error('Failed to fetch projects', error);
    return res.status(500).json({ message: 'Unable to fetch projects' });
  }
});

app.get('/projects/:projectId', async (req, res) => {
  const userId = TEST_USER_ID;
  const projectId = req.params['projectId'];

  if (!projectId) {
    return res.status(400).json({ message: 'projectId is required' });
  }

  try {
    const context = await db.getProjectDetails({ userId, projectId });
    return res.json(context);
  } catch (error) {
    console.error('Failed to fetch project details', error);
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes('not found')
    ) {
      return res.status(404).json({ message: 'Project not found' });
    }
    return res.status(500).json({ message: 'Unable to fetch project details' });
  }
});

app.post('/projects', async (req, res) => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const goalRaw = body['goal'];
  const commitment = body['commitment'];
  const familiarity = body['familiarity'];
  const workStyle = body['workStyle'];
  if (typeof goalRaw !== 'string' || goalRaw.trim().length === 0) {
    return res.status(400).json({ message: 'goal is required' });
  }
  if (!isProjectCommitment(commitment)) {
    return res.status(400).json({ message: 'commitment is invalid' });
  }
  if (!isProjectFamiliarity(familiarity)) {
    return res.status(400).json({ message: 'familiarity is invalid' });
  }
  if (!isProjectWorkStyle(workStyle)) {
    return res.status(400).json({ message: 'workStyle is invalid' });
  }
  const goal = goalRaw.trim();
  console.info('Received new project intake', {
    goal,
    commitment,
    familiarity,
    workStyle,
  });

  try {
    const project = await db.createProject({
      userId: TEST_USER_ID,
      title: goal,
      commitment,
      familiarity,
      workStyle,
      responses: [],
    });

    const focusQuestions = await ai.generateFocusQuestions({
      goal,
      commitment,
      familiarity,
      workStyle,
    });

    await db.createFocusForm({
      name: `focus-questions-${Date.now()}`,
      projectId: project.id,
      userId: TEST_USER_ID,
      kind: 'focus_questions',
      items: focusQuestions.questions.map((question) => ({
        question: question.prompt,
        questionType: question.questionType,
        options: question.options,
        position: question.position,
      })),
    });

    return res.status(201).json({ project });
  } catch (error) {
    console.error('Failed to create project', error);
    return res.status(500).json({
      message: 'Unable to create project',
      error: (error as Error).message,
    });
  }
});

app.put('/projects/:projectId/focus-responses', async (req, res) => {
  const userId = TEST_USER_ID;
  const projectId = req.params['projectId'];

  if (!projectId) {
    return res.status(400).json({ message: 'projectId is required' });
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const responses = body['responses'];

  if (!Array.isArray(responses) || responses.length === 0) {
    return res
      .status(400)
      .json({ message: 'responses must be a non-empty array' });
  }

  for (const response of responses) {
    if (
      typeof response !== 'object' ||
      response === null ||
      typeof (response as Record<string, unknown>)['focusItemId'] !==
        'string' ||
      typeof (response as Record<string, unknown>)['answer'] !== 'string'
    ) {
      return res.status(400).json({
        message:
          'Each response must have a focusItemId (string) and answer (string)',
      });
    }
  }

  try {
    await db.submitFocusResponses({
      projectId,
      userId,
      responses: responses as SubmitFocusResponsesInput['responses'],
    });

    const { project } = await db.getProjectDetails({ userId, projectId });

    if (!project.focusForm) {
      console.error('Focus form not found for project', projectId);
      return res
        .status(500)
        .json({ message: 'Unable to submit focus responses' });
    }

    const focusItems = project.focusForm.items.filter(
      (item): item is typeof item & { answer: string } => item.answer !== null,
    );

    const workflowInput: GenerateProjectRoadmapInput = {
      projectId: project.id,
      userId: project.userId,
      title: project.title,
      commitment: project.commitment,
      familiarity: project.familiarity,
      workStyle: project.workStyle,
      focusItems,
    };

    const temporal = await getTemporalClient();
    await temporal.workflow.start('GenerateProjectRoadmap', {
      taskQueue: 'workflow',
      workflowId: `generate-roadmap-${projectId}`,
      args: [workflowInput],
    });

    console.info(
      `Started GenerateProjectRoadmap workflow for project ${projectId}`,
    );

    return res.json({ project });
  } catch (error) {
    console.error('Failed to submit focus responses', error);
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes('not found')
    ) {
      return res.status(404).json({ message: error.message });
    }
    return res
      .status(500)
      .json({ message: 'Unable to submit focus responses' });
  }
});

const port = process.env['PORT'] || 3001;
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
