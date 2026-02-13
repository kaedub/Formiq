import type { PrismaClient } from '@prisma/client';
import type {
  CreateProjectInput,
  IntakeFormDto,
  IntakeFormQuestions,
  MilestoneDto,
  ProjectContextDto,
  ProjectDto,
  ProjectSummaryDto,
} from '@formiq/shared';

export type DatabaseServiceDependencies = {
  db: PrismaClient;
};

export interface DatabaseService {
  getProjectById(projectId: string, userId: string): Promise<ProjectDto | null>;
  getProjectContext(
    projectId: string,
    userId: string,
  ): Promise<ProjectContextDto>;
  getProjectsByUserId(userId: string): Promise<ProjectSummaryDto[]>;
  getIntakeFormByName(name: string): Promise<IntakeFormDto | null>;
  createIntakeForm(intakeForm: IntakeFormQuestions): Promise<IntakeFormDto>;
  createProject(input: CreateProjectInput): Promise<ProjectDto>;
  createProjectMilestones(
    projectId: string,
    userId: string,
    milestones: MilestoneDto[],
  ): Promise<void>;
}
