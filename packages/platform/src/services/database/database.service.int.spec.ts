import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { type PrismaClient } from '@prisma/client';
import { createDatabaseService } from './service.js';
import type { DatabaseService } from './types.js';
import {
  buildProjectInput,
  createTestUser,
  resetDatabase,
} from '../../test/fixtures.js';
import { getPrismaClient } from '../../clients/prisma.js';

describe('PrismaDatabaseService integration', () => {
  let prisma: PrismaClient;
  let service: DatabaseService;

  beforeAll(() => {
    prisma = getPrismaClient();
    service = createDatabaseService({ db: prisma });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
  });

  it('creates a project', async () => {
    const user = await createTestUser(prisma);
    const input = buildProjectInput(user.id);

    const result = await service.createProject(input);

    expect(result.title).toBe(input.title);
    expect(result.userId).toBe(user.id);
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

  it('creates a focus form with items and retrieves it via getProjectFocusForm', async () => {
    const formName = `intake-${randomUUID()}`;
    const user = await createTestUser(prisma);
    const project = await service.createProject(buildProjectInput(user.id));

    const created = await service.createFocusForm({
      name: formName,
      projectId: project.id,
      userId: user.id,
      kind: 'focus_questions',
      items: [
        {
          question: 'What is your goal?',
          questionType: 'free_text',
          options: [],
          position: 0,
        },
        {
          question: 'Pick a focus area',
          questionType: 'single_select',
          options: ['frontend', 'backend'],
          position: 1,
        },
      ],
    });

    expect(created.name).toBe(formName);
    expect(created.projectId).toBe(project.id);

    const fetched = await service.getProjectFocusForm({
      projectId: project.id,
      userId: user.id,
    });
    expect(fetched).not.toBeNull();
    expect(fetched?.id).toBe(created.id);
    expect(fetched?.projectId).toBe(project.id);
    expect(fetched?.kind).toBe('focus_questions');
    expect(fetched?.items).toHaveLength(2);
    expect(fetched?.items[0]?.question).toBe('What is your goal?');
    expect(fetched?.items[0]?.answer).toBeNull();
    expect(fetched?.items[0]?.answeredAt).toBeNull();
    expect(fetched?.items[1]?.question).toBe('Pick a focus area');
    expect(fetched?.items[1]?.options).toEqual(['frontend', 'backend']);
  });

  it('creates a focus form with an empty items array', async () => {
    const formName = `empty-${randomUUID()}`;
    const user = await createTestUser(prisma);
    const project = await service.createProject(buildProjectInput(user.id));

    const created = await service.createFocusForm({
      name: formName,
      projectId: project.id,
      userId: user.id,
      kind: 'focus_questions',
      items: [],
    });

    expect(created.name).toBe(formName);

    const items = await prisma.focusItem.findMany({
      where: { formId: created.id },
    });
    expect(items).toHaveLength(0);
  });

  it('replaces focus form items with new ones', async () => {
    const formName = `replace-${randomUUID()}`;
    const user = await createTestUser(prisma);
    const project = await service.createProject(buildProjectInput(user.id));

    const form = await service.createFocusForm({
      name: formName,
      projectId: project.id,
      userId: user.id,
      kind: 'focus_questions',
      items: [
        {
          question: 'Original question',
          questionType: 'free_text',
          options: [],
          position: 0,
        },
      ],
    });

    await service.replaceFocusFormItems({
      formId: form.id,
      userId: user.id,
      items: [
        {
          question: 'Replaced question 1',
          questionType: 'single_select',
          options: ['a', 'b'],
          position: 0,
        },
        {
          question: 'Replaced question 2',
          questionType: 'free_text',
          options: [],
          position: 1,
        },
      ],
    });

    const items = await prisma.focusItem.findMany({
      where: { formId: form.id },
      orderBy: { position: 'asc' },
    });
    expect(items).toHaveLength(2);
    expect(items[0]?.question).toBe('Replaced question 1');
    expect(items[0]?.options).toEqual(['a', 'b']);
    expect(items[0]?.answer).toBeNull();
    expect(items[1]?.question).toBe('Replaced question 2');
  });

  it('returns null when project has no focus form', async () => {
    const user = await createTestUser(prisma);
    const project = await service.createProject(buildProjectInput(user.id));

    const result = await service.getProjectFocusForm({
      projectId: project.id,
      userId: user.id,
    });

    expect(result).toBeNull();
  });

  it('returns null when userId does not own the project', async () => {
    const owner = await createTestUser(prisma);
    const intruder = await createTestUser(prisma);
    const project = await service.createProject(buildProjectInput(owner.id));

    await service.createFocusForm({
      name: `form-${randomUUID()}`,
      projectId: project.id,
      userId: owner.id,
      kind: 'focus_questions',
      items: [
        {
          question: 'Test question',
          questionType: 'free_text',
          options: [],
          position: 0,
        },
      ],
    });

    const result = await service.getProjectFocusForm({
      projectId: project.id,
      userId: intruder.id,
    });

    expect(result).toBeNull();
  });
});
