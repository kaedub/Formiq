import type { PrismaClient } from '@prisma/client';
import type {
  CreateMilestoneTasksInput,
  CreateProjectInput,
  CreateProjectMilestonesInput,
  FormRecordDto,
  FocusFormDto,
  CreateFormRecordInput,
  ReplaceFocusFormItemsInput,
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
  getProjectFocusForm(input: GetProjectInput): Promise<FocusFormDto | null>;
  createFocusForm(input: CreateFormRecordInput): Promise<FormRecordDto>;
  replaceFocusFormItems(input: ReplaceFocusFormItemsInput): Promise<void>;
  createProject(input: CreateProjectInput): Promise<ProjectDto>;
  createProjectMilestones(input: CreateProjectMilestonesInput): Promise<void>;
  createMilestoneTasks(input: CreateMilestoneTasksInput): Promise<void>;
}
