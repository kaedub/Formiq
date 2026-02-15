import { MilestoneStatus, TaskStatus, type PrismaClient } from '@prisma/client';
import type { DatabaseService, DatabaseServiceDependencies } from './types.js';
import { PROJECT_INTAKE_FORM } from '@formiq/shared';
import type {
  CreateMilestoneTasksInput,
  CreateProjectInput,
  CreateProjectMilestonesInput,
  ProjectContextDto,
  ProjectDto,
  ProjectSummaryDto,
  GetProjectInput,
  FormRecordDto,
  CreateFormRecordInput,
  FormDefinition,
} from '@formiq/shared';
import {
  mapMilestoneDto,
  mapFormRecordDto,
  mapProjectDto,
  mapTaskDto,
} from './mappers.js';

class PrismaDatabaseService implements DatabaseService {
  constructor(private readonly db: PrismaClient) {}

  getProjectIntakeForm(): Promise<FormDefinition> {
    return Promise.resolve(PROJECT_INTAKE_FORM);
  }

  async getProject({
    projectId,
    userId,
  }: GetProjectInput): Promise<ProjectDto | null> {
    const project = await this.db.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
    });

    return project ? mapProjectDto(project) : null;
  }

  async getProjectDetails({
    projectId,
    userId,
  }: GetProjectInput): Promise<ProjectContextDto> {
    const project = await this.db.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
      include: {
        milestones: {
          include: {
            tasks: true,
          },
        },
        promptExecutions: true,
        events: true,
      },
    });

    if (!project) {
      throw new Error(`Project ${projectId} not found for user ${userId}`);
    }

    const projectDto = mapProjectDto(project);
    const milestones = project.milestones.map((milestone) => ({
      ...mapMilestoneDto(milestone),
      tasks: milestone.tasks.map(mapTaskDto),
    }));

    return {
      project: {
        ...projectDto,
        milestones,
      },
    };
  }

  async getProjectsByUserId(userId: string): Promise<ProjectSummaryDto[]> {
    const projects = await this.db.project.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        status: true,
      },
    });

    if (projects.length === 0) {
      throw new Error(`No projects found for user ${userId}`);
    }

    return projects.map((project) => ({
      id: project.id,
      title: project.title,
      status: project.status,
    }));
  }

  async getFocusFormByName(name: string): Promise<FormRecordDto | null> {
    const form = await this.db.focusForm.findUnique({
      where: { name },
    });

    return form ? mapFormRecordDto(form) : null;
  }

  async createFocusForm(input: CreateFormRecordInput): Promise<FormRecordDto> {
    const { name, projectId, kind } = input;
    if (kind !== 'focus_questions') {
      throw new Error('Only focus_questions forms can be created');
    }
    const created = await this.db.focusForm.create({
      data: {
        name,
        projectId,
      },
    });

    return mapFormRecordDto(created);
  }

  async createProject(input: CreateProjectInput): Promise<ProjectDto> {
    const project = await this.db.project.create({
      data: {
        userId: input.userId,
        title: input.title,
      },
    });

    return mapProjectDto(project);
  }

  async createProjectMilestones(
    input: CreateProjectMilestonesInput,
  ): Promise<void> {
    const { projectId, userId, milestones } = input;
    const project = await this.db.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
      select: {
        id: true,
        milestones: {
          select: {
            id: true,
            tasks: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      throw new Error(`Project ${projectId} not found for user ${userId}`);
    }

    if (project.milestones.length > 0) {
      throw new Error(`Project ${projectId} already has milestones`);
    }

    await this.db.milestone.createMany({
      data: milestones.map((milestone) => ({
        projectId,
        title: milestone.title,
        summary: milestone.summary,
        position: milestone.position,
        status: MilestoneStatus.locked,
      })),
    });
  }

  async createMilestoneTasks(input: CreateMilestoneTasksInput): Promise<void> {
    const { projectId, userId, milestoneId, tasks } = input;

    const project = await this.db.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
      select: {
        id: true,
        milestones: {
          where: {
            id: milestoneId,
          },
          select: {
            id: true,
            tasks: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      throw new Error(`Project ${projectId} not found for user ${userId}`);
    }

    const [milestone] = project.milestones;

    if (!milestone) {
      throw new Error(
        `Milestone ${milestoneId} not found for project ${projectId}`,
      );
    }

    if (milestone.tasks.length > 0) {
      throw new Error(`Milestone ${milestoneId} already has tasks`);
    }

    await this.db.task.createMany({
      data: tasks.map((task) => ({
        milestoneId,
        title: task.title,
        description: task.description,
        position: task.position,
        status: TaskStatus.locked,
      })),
    });
  }
}

export const createDatabaseService = ({
  db,
}: DatabaseServiceDependencies): DatabaseService => {
  return new PrismaDatabaseService(db);
};
