import type { PrismaClient } from '@prisma/client';
import type {
  CreateMilestoneTasksInput,
  CreateProjectInput,
  CreateProjectMilestonesInput,
  FormRecordDto,
  CreateFormRecordInput,
  FormDefinition,
  ProjectContextDto,
  ProjectDto,
  ProjectSummaryDto,
  GetProjectInput,
} from '@formiq/shared';

export type DatabaseServiceDependencies = {
  db: PrismaClient;
};

export interface DatabaseService {
  getProject(input: GetProjectInput): Promise<ProjectDto | null>;
  getProjectDetails(input: GetProjectInput): Promise<ProjectContextDto>;
  getProjectsByUserId(userId: string): Promise<ProjectSummaryDto[]>;
  getProjectIntakeForm(): Promise<FormDefinition>;
  getFocusFormByName(name: string): Promise<FormRecordDto | null>;
  createFocusForm(input: CreateFormRecordInput): Promise<FormRecordDto>;
  createProject(input: CreateProjectInput): Promise<ProjectDto>;
  createProjectMilestones(input: CreateProjectMilestonesInput): Promise<void>;
  createMilestoneTasks(input: CreateMilestoneTasksInput): Promise<void>;
}
