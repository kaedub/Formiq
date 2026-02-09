export { getPrismaClient } from './clients/prisma.js';
export { getOpenAIClient } from './clients/openai.js';
export { createDatabaseService } from './services/database/service.js';
export { createAIService } from './services/ai/service.js';
export type {
  DatabaseService,
  DatabaseServiceDependencies,
} from './services/database/types.js';
export type { AIService, AIServiceDependencies } from './services/ai/types.js';
