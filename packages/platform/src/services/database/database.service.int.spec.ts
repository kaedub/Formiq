import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { type PrismaClient, QuestionType } from '@prisma/client';
import { createDatabaseService } from './service.js';
import type { DatabaseService } from './types.js';
import {
  buildProjectInput,
  createTestUser,
  QUESTION_FIXTURES,
  resetDatabase,
  seedIntakeQuestions,
} from '../../test/fixtures.js';
import { getPrismaClient } from '../../clients/prisma.js';

describe('PrismaDatabaseService integration', () => {
  let prisma: PrismaClient;
  let service: DatabaseService;

  beforeAll(async () => {
    prisma = getPrismaClient();
    service = createDatabaseService({ db: prisma });
    await seedIntakeQuestions(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
  });

  it('creates a project with ordered answers', async () => {
    const user = await createTestUser(prisma);
    const input = buildProjectInput(user.id);

    const result = await service.createProject(input);

    expect(result.title).toBe(input.title);
    expect(result.responses).toHaveLength(QUESTION_FIXTURES.length);
    result.responses.forEach((response, index) => {
      const fixture = QUESTION_FIXTURES[index];
      if (!fixture) {
        throw new Error(`Missing question fixture at index ${index}`);
      }

      expect(response.question.id).toBe(fixture.id);
      if (fixture.questionType === 'multi_select') {
        const [firstOption] = fixture.options;
        expect(firstOption).toBeDefined();
        expect(response.answer.values).toEqual(
          firstOption ? [firstOption] : [],
        );
      } else {
        expect(response.answer.values).toEqual([`Answer ${index + 1}`]);
      }
    });

    const storedAnswers = await prisma.questionAnswer.findMany({
      where: { projectId: result.id },
    });
    expect(storedAnswers).toHaveLength(QUESTION_FIXTURES.length);
  });

  it('fails to create a project when question id is invalid', async () => {
    const user = await createTestUser(prisma);
    const input = buildProjectInput(user.id);
    const responses = input.responses.map((response, index) =>
      index === 0 ? { ...response, questionId: 'missing' } : response,
    );
    const invalidInput = { ...input, responses };

    await expect(service.createProject(invalidInput)).rejects.toThrow();
  });

  it('fetches a project by id for the owning user', async () => {
    const user = await createTestUser(prisma);
    const created = await service.createProject(buildProjectInput(user.id));

    const fetched = await service.getProject({
      projectId: created.id,
      userId: user.id,
    });

    expect(fetched).not.toBeNull();
    expect(fetched?.id).toBe(created.id);
    expect(fetched?.responses.length).toBe(QUESTION_FIXTURES.length);
  });

  it('returns null when fetching a project owned by another user', async () => {
    const owner = await createTestUser(prisma);
    const intruder = await createTestUser(prisma);
    const created = await service.createProject(buildProjectInput(owner.id));

    const fetched = await service.getProject({
      projectId: created.id,
      userId: intruder.id,
    });

    expect(fetched).toBeNull();
  });

  it('returns full project details with milestones and tasks', async () => {
    const user = await createTestUser(prisma);
    const project = await service.createProject(buildProjectInput(user.id));

    const milestone = await prisma.milestone.create({
      data: {
        projectId: project.id,
        title: 'Milestone 1',
        summary: 'Summary',
        position: 0,
        status: 'locked',
      },
    });

    await prisma.task.create({
      data: {
        milestoneId: milestone.id,
        title: 'Task 1',
        description: 'Do something',
        position: 0,
        status: 'locked',
      },
    });

    await prisma.promptExecution.create({
      data: {
        projectId: project.id,
        milestoneId: milestone.id,
        stage: 'project_context',
        status: 'success',
        input: { source: 'test' },
      },
    });

    await prisma.projectEvent.create({
      data: {
        projectId: project.id,
        eventType: 'status_change',
        payload: { to: 'generating' },
      },
    });

    const context = await service.getProjectDetails({
      projectId: project.id,
      userId: user.id,
    });

    expect(context.project.id).toBe(project.id);
    expect(context.project.milestones).toHaveLength(1);
    expect(context.project.milestones[0]?.tasks).toHaveLength(1);
  });

  it('throws when requesting details for a missing project', async () => {
    const user = await createTestUser(prisma);

    await expect(
      service.getProjectDetails({
        projectId: 'missing-project',
        userId: user.id,
      }),
    ).rejects.toThrow(/not found/i);
  });

  it('lists projects for a given user', async () => {
    const owner = await createTestUser(prisma);
    const other = await createTestUser(prisma);
    await service.createProject(buildProjectInput(owner.id));
    await service.createProject(buildProjectInput(owner.id));
    await service.createProject(buildProjectInput(other.id));

    const projects = await service.getProjectsByUserId(owner.id);

    expect(projects).toHaveLength(2);
    projects.forEach((project) => {
      expect(typeof project.id).toBe('string');
      expect(typeof project.title).toBe('string');
    });
  });

  it('creates an intake form with ordered questions and fetches it by name', async () => {
    const formName = `intake-${randomUUID()}`;
    const intakeForm = {
      name: formName,
      questions: [
        {
          id: 'intake_question_secondary',
          prompt: 'How soon do you need results?',
          options: ['ASAP', '1-2 weeks', 'Flexible'],
          questionType: QuestionType.single_select,
          position: 1,
        },
        {
          id: 'intake_question_primary',
          prompt: 'What problem are you solving?',
          options: [],
          questionType: QuestionType.free_text,
          position: 0,
        },
      ],
    };

    const created = await service.createIntakeForm(intakeForm);

    expect(created.name).toBe(formName);
    expect(created.questions.map((question) => question.position)).toEqual([
      0, 1,
    ]);
    expect(created.questions.map((question) => question.id)).toEqual([
      'intake_question_primary',
      'intake_question_secondary',
    ]);

    const fetched = await service.getIntakeFormByName(formName);
    expect(fetched?.id).toBe(created.id);
    expect(fetched?.questions.map((question) => question.id)).toEqual([
      'intake_question_primary',
      'intake_question_secondary',
    ]);
  });

  it('returns null when fetching a missing intake form', async () => {
    const result = await service.getIntakeFormByName('missing_intake_form');

    expect(result).toBeNull();
  });
});
