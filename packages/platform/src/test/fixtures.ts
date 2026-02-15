import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import type { CreateProjectInput } from '@formiq/shared';

export const resetDatabase = async (prisma: PrismaClient): Promise<void> => {
  await prisma.focusItem.deleteMany();
  await prisma.focusForm.deleteMany();
  await prisma.task.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.promptExecution.deleteMany();
  await prisma.projectEvent.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
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

export const buildProjectInput = (userId: string): CreateProjectInput => ({
  userId,
  title: 'Test project',
  commitment: 'moderate',
  familiarity: 'some_experience',
  workStyle: 'flexible_or_varies',
  responses: [],
});
