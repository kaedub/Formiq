import cors from 'cors';
import express from 'express';
import { createDatabaseService, getPrismaClient } from '@formiq/platform';
import { TEST_USER_ID } from '@formiq/shared';
import type { QuestionResponseInput } from '@formiq/shared';

const app = express();
app.use(cors());
app.use(express.json());

const prisma = getPrismaClient();
const db = createDatabaseService({ db: prisma });

const DEFAULT_FORM_NAME = 'goal_intake_v1';

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

app.get('/intake-forms/:name', async (req, res) => {
  try {
    const form = await db.getIntakeFormByName(req.params['name']);
    if (!form) {
      return res.status(404).json({ message: 'Intake form not found' });
    }
    return res.json({ form });
  } catch (error) {
    console.error('Failed to fetch intake form', error);
    return res.status(500).json({
      message: 'Unable to load intake form',
      error: (error as Error).message,
    });
  }
});

app.get('/questions', async (_req, res) => {
  try {
    const form = await db.getIntakeFormByName(DEFAULT_FORM_NAME);
    if (!form) {
      return res.status(404).json({ message: 'Default intake form not found' });
    }
    return res.json({ questions: form.questions });
  } catch (error) {
    console.error('Failed to fetch questions', error);
    return res.status(500).json({
      message: 'Unable to load questions',
      error: (error as Error).message,
    });
  }
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
  const { title, responses } = req.body ?? {};
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
