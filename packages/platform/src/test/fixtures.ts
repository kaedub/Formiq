import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import type { CreateStoryInput, QuestionType } from '@formiq/shared';

export const QUESTION_FIXTURES: Array<{
  id: string;
  prompt: string;
  questionType: QuestionType;
  options: string[];
  position: number;
}> = [
  {
    id: 'question_goal',
    prompt: 'What goal do you want to achieve?',
    questionType: 'free_text',
    options: [],
    position: 0,
  },
  {
    id: 'question_constraints',
    prompt: 'Are there deadlines or constraints?',
    questionType: 'free_text',
    options: [],
    position: 1,
  },
  {
    id: 'question_success',
    prompt: 'How will you measure success?',
    questionType: 'free_text',
    options: [],
    position: 2,
  },
  {
    id: 'question_resources',
    prompt: 'Preferred resources/tools?',
    questionType: 'multi_select',
    options: ['AI', 'Design', 'Code', 'Automation'],
    position: 3,
  },
];

export const DEFAULT_INTAKE_FORM_NAME = 'default_intake_form';

export const resetDatabase = async (prisma: PrismaClient): Promise<void> => {
  await prisma.questionAnswer.deleteMany();
  await prisma.task.deleteMany();
  await prisma.chapter.deleteMany();
  await prisma.promptExecution.deleteMany();
  await prisma.storyEvent.deleteMany();
  await prisma.story.deleteMany();
  await prisma.user.deleteMany();
  await prisma.intakeQuestion.deleteMany();
  await prisma.intakeForm.deleteMany();
  await seedIntakeQuestions(prisma);
};

export const seedIntakeQuestions = async (
  prisma: PrismaClient,
): Promise<void> => {
  await prisma.intakeForm.create({
    data: {
      name: DEFAULT_INTAKE_FORM_NAME,
      questions: {
        create: QUESTION_FIXTURES.map((question) => ({
          id: question.id,
          prompt: question.prompt,
          options: question.options,
          questionType: question.questionType,
          position: question.position,
        })),
      },
    },
  });
};

export const createTestUser = async (
  prisma: PrismaClient,
  overrides: Partial<{ email: string; password: string }> = {},
) => {
  return prisma.user.create({
    data: {
      email: overrides.email ?? `user-${randomUUID()}@example.com`,
      password: overrides.password ?? 'password',
    },
  });
};

export const buildStoryInput = (userId: string): CreateStoryInput => ({
  userId,
  title: 'Test story',
  responses: QUESTION_FIXTURES.map((question, index) => ({
    questionId: question.id,
    values:
      question.questionType === 'multi_select'
        ? question.options.slice(0, 1)
        : [`Answer ${index + 1}`],
  })),
});
