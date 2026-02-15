import cors from 'cors';
import express from 'express';
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
import type { QuestionResponseInput } from '@formiq/shared';

const app = express();
app.use(cors());
app.use(express.json());

const prisma = getPrismaClient();
const db = createDatabaseService({ db: prisma });

const client = getOpenAIClient();
const ai = createAIService({ client });

const normalizeResponses = (responses: unknown): QuestionResponseInput[] => {
  if (!Array.isArray(responses)) {
    throw new Error('responses must be an array');
  }

  return responses.map((response, index) => {
    if (
      typeof response !== 'object' ||
      response === null ||
      typeof (response as { questionId?: unknown }).questionId !== 'string'
    ) {
      throw new Error(`responses[${index}] is missing a questionId`);
    }

    const questionId = (response as { questionId: string }).questionId;
    const rawValues = (response as { values?: unknown }).values;

    const values =
      Array.isArray(rawValues) &&
      rawValues.every((entry) => typeof entry === 'string')
        ? rawValues
        : [];

    return { questionId, values };
  });
};

app.get('/', (_req, res) => {
  res.send('Welcome to the Project Intake API');
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/project-intake/questions', async (_req, res) => {
  try {
    const form = await db.getProjectIntakeForm();
    return res.json({ form });
  } catch (error) {
    console.error('Failed to fetch project intake questions', error);
    return res.status(500).json({
      message: 'Unable to load project intake questions',
      error: (error as Error).message,
    });
  }
});

app.get('/focus-questions/:name', async (req, res) => {
  try {
    const form = await db.getFocusFormByName(req.params['name']);
    if (!form) {
      return res.status(404).json({ message: 'Focus questions not found' });
    }
    return res.json({ focusForm: form });
  } catch (error) {
    console.error('Failed to fetch focus questions', error);
    return res.status(500).json({
      message: 'Unable to load focus questions',
      error: (error as Error).message,
    });
  }
});

app.post('/projects/start', async (req, res) => {
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

  const project = await db.createProject({
    userId: TEST_USER_ID,
    title: goal,
    responses: [],
  });

  const focusForm = await db.createFocusForm({
    name: `focus-questions-${Date.now()}`,
    projectId: project.id,
    kind: 'focus_questions',
  });

  const focusQuestions = await ai.generateFocusQuestions({
    goal,
    commitment,
    familiarity,
    workStyle,
  });

  if (focusQuestions.questions.length > 0) {
    await prisma.focusItem.createMany({
      data: focusQuestions.questions.map((question) => ({
        formId: focusForm.id,
        userId: TEST_USER_ID,
        question: question.prompt,
        options: question.options,
        questionType: question.questionType,
        position: question.position,
      })),
    });
  }

  return res.json({ goal, focusQuestions, status: 'ok' });
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
  const title = body['title'];
  const responses = body['responses'];
  const userId = TEST_USER_ID;
  if (typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ message: 'title is required' });
  }

  try {
    const normalized = normalizeResponses(responses);
    const project = await db.createProject({
      userId,
      title: title.trim(),
      responses: normalized,
    });
    return res.json(project);
  } catch (error) {
    console.error('Failed to create project', error);
    return res.status(500).json({
      message: 'Unable to save project',
      error: (error as Error).message,
    });
  }
});

const port = process.env['PORT'] || 3001;
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
