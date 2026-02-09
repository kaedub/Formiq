import {
  beforeAll,
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import { randomUUID } from 'node:crypto';
import { type PrismaClient, QuestionType } from '@prisma/client';
import { createDatabaseService } from './service.js';
import type { DatabaseService } from './types.js';
import {
  buildStoryInput,
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

  it('creates a story with ordered answers', async () => {
    const user = await createTestUser(prisma);
    const input = buildStoryInput(user.id);

    const result = await service.createStory(input);

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
        expect(response.answer.values).toEqual(firstOption ? [firstOption] : []);
      } else {
        expect(response.answer.values).toEqual([`Answer ${index + 1}`]);
      }
    });

    const storedAnswers = await prisma.questionAnswer.findMany({
      where: { storyId: result.id },
    });
    expect(storedAnswers).toHaveLength(QUESTION_FIXTURES.length);
  });

  it('fails to create a story when question id is invalid', async () => {
    const user = await createTestUser(prisma);
    const input = buildStoryInput(user.id);
    const responses = input.responses.map((response, index) =>
      index === 0 ? { ...response, questionId: 'missing' } : response,
    );
    const invalidInput = { ...input, responses };

    await expect(service.createStory(invalidInput)).rejects.toThrow();
  });

  it('fetches a story by id for the owning user', async () => {
    const user = await createTestUser(prisma);
    const created = await service.createStory(buildStoryInput(user.id));

    const fetched = await service.getStoryById(created.id, user.id);

    expect(fetched).not.toBeNull();
    expect(fetched?.id).toBe(created.id);
    expect(fetched?.responses.length).toBe(QUESTION_FIXTURES.length);
  });

  it('returns null when fetching a story owned by another user', async () => {
    const owner = await createTestUser(prisma);
    const intruder = await createTestUser(prisma);
    const created = await service.createStory(buildStoryInput(owner.id));

    const fetched = await service.getStoryById(created.id, intruder.id);

    expect(fetched).toBeNull();
  });

  it('returns story context with chapters, tasks, prompt executions, and events', async () => {
    const user = await createTestUser(prisma);
    const story = await service.createStory(buildStoryInput(user.id));

    const chapter = await prisma.chapter.create({
      data: {
        storyId: story.id,
        title: 'Chapter 1',
        summary: 'Summary',
        position: 0,
        status: 'locked',
      },
    });

    await prisma.task.create({
      data: {
        chapterId: chapter.id,
        title: 'Task 1',
        description: 'Do something',
        position: 0,
        status: 'locked',
      },
    });

    await prisma.promptExecution.create({
      data: {
        storyId: story.id,
        chapterId: chapter.id,
        stage: 'story_context',
        status: 'success',
        input: { source: 'test' },
      },
    });

    await prisma.storyEvent.create({
      data: {
        storyId: story.id,
        eventType: 'status_change',
        payload: { to: 'generating' },
      },
    });

    const context = await service.getStoryContext(story.id, user.id);

    expect(context.story.id).toBe(story.id);
    expect(context.chapters).toHaveLength(1);
    expect(context.tasks).toHaveLength(1);
    expect(context.promptExecutions).toHaveLength(1);
    expect(context.events).toHaveLength(1);
  });

  it('throws when requesting context for a missing story', async () => {
    const user = await createTestUser(prisma);

    await expect(
      service.getStoryContext('missing-story', user.id),
    ).rejects.toThrow(/not found/i);
  });

  it('lists stories for a given user', async () => {
    const owner = await createTestUser(prisma);
    const other = await createTestUser(prisma);
    await service.createStory(buildStoryInput(owner.id));
    await service.createStory(buildStoryInput(owner.id));
    await service.createStory(buildStoryInput(other.id));

    const stories = await service.getStoriesByUserId(owner.id);

    expect(stories).toHaveLength(2);
    stories.forEach((story) => {
      expect(typeof story.id).toBe('string');
      expect(typeof story.title).toBe('string');
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
