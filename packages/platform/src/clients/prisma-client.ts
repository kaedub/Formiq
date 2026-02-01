import "dotenv/config";
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

export type PrismaClientProviderOptions = {
  connectionString?: string;
};

let prismaInstance: PrismaClient | undefined;

const connectionString = process.env['DATABASE_URL'];

if (!connectionString) {
  throw new Error('DATABASE_URL is not configured');
}

export const getPrismaClient = (): PrismaClient => {
  if (!prismaInstance) {
    const adapter = new PrismaPg({ connectionString });
    prismaInstance = new PrismaClient({ adapter });
  }

  return prismaInstance;
};
