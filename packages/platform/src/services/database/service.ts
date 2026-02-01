import type { Story } from '@prisma/client';
import type { DatabaseService, DatabaseServiceDependencies } from './types.js';

class PrismaDatabaseService implements DatabaseService {
  constructor(private readonly deps: DatabaseServiceDependencies) {
    // Future database operations will use deps.prisma
  }

  async getStoriesByUserId(userId: string): Promise<Story[]> {
    // Example implementation - replace with actual Prisma query
    return this.deps.prisma.story.findMany({
      where: { userId },
    });
  }
}

export const createDatabaseService = (deps: DatabaseServiceDependencies): DatabaseService => {
  return new PrismaDatabaseService(deps);
};
