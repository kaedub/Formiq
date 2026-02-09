import { getPrismaClient } from '../src/clients/prisma.js';
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
  id: 'test-user-id',
  email: 'test@test',
  password: 'test',
};

const questions: IntakeQuestionSeed[] = [
  {
    id: 'goal_statement',
    prompt: 'What is the primary goal you want to achieve in the next 4-6 weeks?',
    options: [],
    questionType: 'free_text',
    position: 0,
  },
  {
    id: 'success_criteria',
    prompt: 'What outcomes or milestones would make you consider this a success?',
    options: [],
    questionType: 'free_text',
    position: 1,
  },
  {
    id: 'timeline',
    prompt: 'When do you need an initial roadmap or deliverables?',
    options: ['This week', 'Within 2 weeks', 'Within a month', 'Flexible'],
    questionType: 'single_select',
    position: 2,
  },
  {
    id: 'goal_domain',
    prompt: 'Which area best describes your goal?',
    options: ['Product/Startup', 'Engineering', 'Design/UX', 'Marketing/Growth', 'Operations'],
    questionType: 'single_select',
    position: 3,
  },
  {
    id: 'available_resources',
    prompt: 'Which resources can you leverage?',
    options: ['Dedicated time', 'Budget', 'Team members', 'Tools/Software', 'Subject matter expert'],
    questionType: 'multi_select',
    position: 4,
  },
  {
    id: 'risks_and_blockers',
    prompt: 'What risks or blockers do you anticipate?',
    options: ['Unclear requirements', 'Stakeholder alignment', 'Technical debt', 'Data/Access gaps', 'Tight timeline'],
    questionType: 'multi_select',
    position: 5,
  },
  {
    id: 'update_preference',
    prompt: 'How frequently do you want progress updates?',
    options: ['Daily summary', 'Twice weekly', 'Weekly', 'Milestone-based'],
    questionType: 'single_select',
    position: 6,
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
