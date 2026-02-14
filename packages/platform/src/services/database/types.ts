import type { PrismaClient } from '@prisma/client';
import type {
  CreateMilestoneTasksInput,
  CreateProjectInput,
  CreateProjectMilestonesInput,
  IntakeFormDto,
  CreateIntakeFormInput,
  MilestoneDto,
  ProjectContextDto,
  ProjectDto,
  ProjectSummaryDto,
  GetProjectInput,
} from '@formiq/shared';
import type { string } from 'zod/v4';

export type DatabaseServiceDependencies = {
  db: PrismaClient;
};

export interface DatabaseService {
  getProject(input: GetProjectInput): Promise<ProjectDto | null>;
  getProjectDetails(input: GetProjectInput): Promise<ProjectContextDto>;
  getProjectsByUserId(userId: string): Promise<ProjectSummaryDto[]>;
  getIntakeFormByName(name: string): Promise<IntakeFormDto | null>;
  createIntakeForm(input: CreateIntakeFormInput): Promise<IntakeFormDto>;
  createProject(input: CreateProjectInput): Promise<ProjectDto>;
  createProjectMilestones(input: CreateProjectMilestonesInput): Promise<void>;
  createMilestoneTasks(input: CreateMilestoneTasksInput): Promise<void>;
}
