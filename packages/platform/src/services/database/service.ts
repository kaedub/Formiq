import { MilestoneStatus, type PrismaClient } from '@prisma/client';
import type { DatabaseService, DatabaseServiceDependencies } from './types.js';
import type {
  CreateProjectInput,
  IntakeFormDto,
  IntakeFormQuestions,
  ProjectContextDto,
  ProjectDto,
  ProjectSummaryDto,
} from '@formiq/shared';
import type {
  IntakeFormWithQuestions,
  ProjectWithContext,
  ProjectWithResponses,
} from './mappers.js';
import {
  mapMilestoneDto,
  mapIntakeFormDto,
  mapPromptExecutionDto,
  mapProjectDto,
  mapProjectEventDto,
  mapTaskDto,
} from './mappers.js';

class PrismaDatabaseService implements DatabaseService {
  constructor(private readonly db: PrismaClient) {}

  async getProjectById(
    projectId: string,
    userId: string,
  ): Promise<ProjectDto | null> {
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

  async getProjectContext(
    projectId: string,
    userId: string,
  ): Promise<ProjectContextDto> {
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

    return {
      project: mapProjectDto(project as ProjectWithResponses),
      milestones: project.milestones.map(mapMilestoneDto),
      tasks: project.milestones.flatMap((milestone) =>
        milestone.tasks.map(mapTaskDto),
      ),
      promptExecutions: project.promptExecutions.map(mapPromptExecutionDto),
      events: project.events.map(mapProjectEventDto),
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

  async createIntakeForm(
    intakeForm: IntakeFormQuestions,
  ): Promise<IntakeFormDto> {
    const created = (await this.db.intakeForm.create({
      data: {
        name: intakeForm.name,
        questions: {
          create: intakeForm.questions.map((question) => ({
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
    projectId: string,
    userId: string,
    milestones: ProjectContextDto['milestones'],
  ): Promise<void> {
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
}

export const createDatabaseService = ({
  db,
}: DatabaseServiceDependencies): DatabaseService => {
  return new PrismaDatabaseService(db);
};
