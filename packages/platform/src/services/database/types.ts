import type { PrismaClient, Story } from '@prisma/client';

export type RequestContext = {
  userId?: string;
  storyId?: string;
  correlationId?: string;
};

export type DatabaseServiceDependencies = {
  prisma: PrismaClient;
};

export interface DatabaseService {
  // TODO: add database operation signatures (stories, chapters, tasks, etc.)
  getStoriesByUserId(userId: string): Promise<Story[]>;
}
