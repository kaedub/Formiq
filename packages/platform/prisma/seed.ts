import { getPrismaClient } from '../src/clients/prisma.js';
import { TEST_USER_ID } from '@formiq/shared';
import type { QuestionType } from '@formiq/shared';

type IntakeQuestionSeed = {
  id: string;
  prompt: string;
  options: string[];
  questionType: QuestionType;
  position: number;
};

const prisma = getPrismaClient();

const intakeFormName = 'goal_intake_v1';
const testUser = {
  id: TEST_USER_ID,
  email: 'test-user@example.com',
  password: 'test',
};

const questions: IntakeQuestionSeed[] = [
  {
    id: 'goal_main_win',
    prompt:
      'What do you want to achieve, and what’s the main win you’re after (e.g., certification, launch, portfolio)?',
    options: [],
    questionType: 'free_text',
    position: 0,
  },
  {
    id: 'existing_resources',
    prompt:
      'What resources do you already have (gear, budget, access, skills)?',
    options: [],
    questionType: 'free_text',
    position: 1,
  },
  {
    id: 'time_commitment',
    prompt: 'How much time/effort can you commit, and on what cadence?',
    options: [],
    questionType: 'free_text',
    position: 2,
  },
  {
    id: 'constraints',
    prompt:
      'What constraints or no-gos should we respect (tools/tech, policies, budget caps, forbidden content)?',
    options: [],
    questionType: 'free_text',
    position: 3,
  },
  {
    id: 'success_signals',
    prompt: 'How will you know it’s a success (one or two signals)?',
    options: [],
    questionType: 'free_text',
    position: 4,
  },
];

const main = async (): Promise<void> => {
  console.log('Seeding test user:', testUser.email);
  await prisma.user.upsert({
    where: { email: testUser.email },
    update: {},
    create: testUser,
  });

  console.log('Seeding intake form:', intakeFormName);
  await prisma.intakeForm.upsert({
    where: { name: intakeFormName },
    create: {
      name: intakeFormName,
      questions: {
        create: questions,
      },
    },
    update: {
      questions: {
        deleteMany: {},
        create: questions,
      },
    },
  });
};

void main()
  .catch((error: unknown) => {
    console.error('Seeding intake form failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
