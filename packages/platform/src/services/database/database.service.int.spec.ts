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

  it('creates a focus questions form without items and fetches it by name', async () => {
    const formName = `intake-${randomUUID()}`;
    const user = await createTestUser(prisma);
    const project = await service.createProject(buildProjectInput(user.id));

    const created = await service.createFocusForm({
      name: formName,
      projectId: project.id,
      kind: 'focus_questions',
    });

    expect(created.name).toBe(formName);
    expect(created.projectId).toBe(project.id);

    const fetched = await service.getFocusFormByName(formName);
    expect(fetched?.id).toBe(created.id);
    expect(fetched?.projectId).toBe(project.id);
  });

  it('returns null when fetching missing focus questions', async () => {
    const result = await service.getFocusFormByName('missing_intake_form');

    expect(result).toBeNull();
  });

  it('returns the static project intake form', async () => {
    const form = await service.getProjectIntakeForm();

    expect(form.questions).toHaveLength(4);
    expect(form.questions[0]?.id).toBe('goal');
    expect(form.questions[0]?.questionType).toBe('free_text');
  });
});
