import { MilestoneStatus, TaskStatus, type PrismaClient } from '@prisma/client';
import type { DatabaseService, DatabaseServiceDependencies } from './types.js';
import type {
  CreateMilestoneTasksInput,
  CreateProjectInput,
  CreateProjectMilestonesInput,
  IntakeFormDto,
  CreateIntakeFormInput,
  ProjectContextDto,
  ProjectDto,
  ProjectSummaryDto,
  GetProjectInput,
} from '@formiq/shared';
import type {
  IntakeFormWithQuestions,
  ProjectWithContext,
  ProjectWithResponses,
} from './mappers.js';
import {
  mapMilestoneDto,
  mapIntakeFormDto,
  mapProjectDto,
  mapTaskDto,
} from './mappers.js';

class PrismaDatabaseService implements DatabaseService {
  constructor(private readonly db: PrismaClient) {}

  async getProject({
    projectId,
    userId,
  }: GetProjectInput): Promise<ProjectDto | null> {
    const project = (await this.db.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
      include: {
        questionAnswers: {
          include: {
            question: true,
          },
          orderBy: {
            question: {
              position: 'asc',
            },
          },
        },
      },
    })) as ProjectWithResponses | null;

    return project ? mapProjectDto(project) : null;
  }

  async getProjectDetails({
    projectId,
    userId,
  }: GetProjectInput): Promise<ProjectContextDto> {
    const project = (await this.db.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
      include: {
        questionAnswers: {
          include: {
            question: true,
          },
          orderBy: {
            question: {
              position: 'asc',
            },
          },
        },
        milestones: {
          include: {
            tasks: true,
          },
        },
        promptExecutions: true,
        events: true,
      },
    })) as ProjectWithContext | null;

    if (!project) {
      throw new Error(`Project ${projectId} not found for user ${userId}`);
    }

    const projectDto = mapProjectDto(project as ProjectWithResponses);
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

  async getIntakeFormByName(name: string): Promise<IntakeFormDto | null> {
    const form = (await this.db.intakeForm.findUnique({
      where: { name },
      include: {
        questions: {
          orderBy: {
            position: 'asc',
          },
        },
      },
    })) as IntakeFormWithQuestions | null;

    return form ? mapIntakeFormDto(form) : null;
  }

  async createIntakeForm(input: CreateIntakeFormInput): Promise<IntakeFormDto> {
    const { name, questions } = input;
    const created = (await this.db.intakeForm.create({
      data: {
        name: name,
        questions: {
          create: questions.map((question) => ({
            id: question.id,
            prompt: question.prompt,
            options: question.options,
            questionType: question.questionType,
            position: question.position,
          })),
        },
      },
      include: {
        questions: {
          orderBy: {
            position: 'asc',
          },
        },
      },
    })) as IntakeFormWithQuestions;

    return mapIntakeFormDto(created);
  }

  async createProject(input: CreateProjectInput): Promise<ProjectDto> {
    const project = (await this.db.project.create({
      data: {
        userId: input.userId,
        title: input.title,
        questionAnswers: {
          create: input.responses.map((response) => ({
            userId: input.userId,
            question: {
              connect: { id: response.questionId },
            },
            values: response.values,
          })),
        },
      },
      include: {
        questionAnswers: {
          include: {
            question: true,
          },
          orderBy: {
            question: {
              position: 'asc',
            },
          },
        },
      },
    })) as ProjectWithResponses;

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
        // context: milestone.context,
        // metadata: milestone.metadata,
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
