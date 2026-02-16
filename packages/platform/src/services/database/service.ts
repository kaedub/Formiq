import { MilestoneStatus, TaskStatus, type PrismaClient } from '@prisma/client';
import type { DatabaseService, DatabaseServiceDependencies } from './types.js';
import type {
  CreateMilestoneTasksInput,
  CreateProjectInput,
  CreateProjectMilestonesInput,
  ProjectContextDto,
  ProjectDto,
  ProjectSummaryDto,
  GetProjectInput,
  FormRecordDto,
  FocusFormDto,
  CreateFormRecordInput,
  ReplaceFocusFormItemsInput,
  SubmitFocusResponsesInput,
} from '@formiq/shared';
import {
  mapMilestoneDto,
  mapFormRecordDto,
  mapFocusFormDto,
  mapProjectDto,
  mapPromptExecutionDto,
  mapTaskDto,
} from './mappers.js';

class PrismaDatabaseService implements DatabaseService {
  constructor(private readonly db: PrismaClient) {}

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
        focusForm: {
          include: { items: { orderBy: { position: 'asc' } } },
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
    const focusForm = project.focusForm
      ? mapFocusFormDto(project.focusForm)
      : null;
    const promptExecutions = project.promptExecutions.map(
      mapPromptExecutionDto,
    );

    return {
      project: {
        ...projectDto,
        milestones,
        focusForm,
        promptExecutions,
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

  async getProjectFocusForm({
    projectId,
    userId,
  }: GetProjectInput): Promise<FocusFormDto | null> {
    const project = await this.db.project.findFirst({
      where: { id: projectId, userId },
      include: {
        focusForm: {
          include: { items: { orderBy: { position: 'asc' } } },
        },
      },
    });

    if (!project?.focusForm) {
      return null;
    }

    return mapFocusFormDto(project.focusForm);
  }

  async createFocusForm(input: CreateFormRecordInput): Promise<FormRecordDto> {
    const { name, projectId, userId, kind, items } = input;
    if (kind !== 'focus_questions') {
      throw new Error('Only focus_questions forms can be created');
    }

    const created = await this.db.$transaction(async (tx) => {
      const form = await tx.focusForm.create({
        data: {
          name,
          projectId,
        },
      });

      if (items.length > 0) {
        await tx.focusItem.createMany({
          data: items.map((item) => ({
            formId: form.id,
            userId,
            question: item.question,
            questionType: item.questionType,
            options: item.options,
            position: item.position,
          })),
        });
      }

      return form;
    });

    return mapFormRecordDto(created);
  }

  async replaceFocusFormItems(
    input: ReplaceFocusFormItemsInput,
  ): Promise<void> {
    const { formId, userId, items } = input;

    await this.db.$transaction(async (tx) => {
      await tx.focusItem.deleteMany({
        where: { formId },
      });

      await tx.focusItem.createMany({
        data: items.map((item) => ({
          formId,
          userId,
          question: item.question,
          questionType: item.questionType,
          options: item.options,
          position: item.position,
        })),
      });
    });
  }

  async createProject(input: CreateProjectInput): Promise<ProjectDto> {
    const project = await this.db.project.create({
      data: {
        userId: input.userId,
        title: input.title,
        commitment: input.commitment,
        familiarity: input.familiarity,
        workStyle: input.workStyle,
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

  async submitFocusResponses(
    input: SubmitFocusResponsesInput & { projectId: string; userId: string },
  ): Promise<void> {
    const { projectId, userId, responses } = input;

    const project = await this.db.project.findFirst({
      where: { id: projectId, userId },
      include: {
        focusForm: {
          include: { items: { select: { id: true } } },
        },
      },
    });

    if (!project) {
      throw new Error(`Project ${projectId} not found for user ${userId}`);
    }

    if (!project.focusForm) {
      throw new Error(`Project ${projectId} has no focus form`);
    }

    const validItemIds = new Set(
      project.focusForm.items.map((item) => item.id),
    );

    for (const response of responses) {
      if (!validItemIds.has(response.focusItemId)) {
        throw new Error(
          `Focus item ${response.focusItemId} does not belong to project ${projectId}`,
        );
      }
    }

    const now = new Date();

    await this.db.$transaction(
      responses.map((response) =>
        this.db.focusItem.update({
          where: { id: response.focusItemId },
          data: {
            answer: response.answer,
            answeredAt: now,
          },
        }),
      ),
    );
  }
}

export const createDatabaseService = ({
  db,
}: DatabaseServiceDependencies): DatabaseService => {
  return new PrismaDatabaseService(db);
};
