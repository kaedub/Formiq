import type OpenAI from 'openai';
import type { ChapterDto, IntakeQuestionDto, StoryDto } from '@formiq/shared';
import type {
  AIService,
  AIServiceDependencies,
  ChapterOutline,
  TaskGenerationContext,
  TaskSchedule,
} from './types.js';
import {
  CHAPTER_OUTLINE_PROMPT,
  DEFAULT_MODEL,
  FORMGEN_SYSTEM_PROMPT,
  TASK_GENERATION_PROMPT,
} from './constants.js';
import {
  CHAPTER_OUTLINE_JSON_SCHEMA,
  STORY_CONTEXT_JSON_SCHEMA,
  TASK_SCHEDULE_JSON_SCHEMA,
} from './schemas.js';
import { parseChapterOutline, parseFormDefinition, parseTaskSchedule } from './utils.js';

const buildStoryContextPayload = (story: StoryDto) => ({
  story: {
    title: story.title,
    responses: story.responses.map((entry) => ({
      question: [
        entry.question.prompt,
        entry.question.questionType !== 'free_text' && entry.question.options.length > 0
          ? `Options: ${entry.question.options.join(', ')}`
          : null,
      ].filter((part): part is string => Boolean(part)).join(' '),
      answers: entry.answer.values,
    })),
  },
});

const buildChapterContext = (chapter: ChapterDto) => ({
  title: chapter.title,
  summary: chapter.summary,
  position: chapter.position,
  metadata: chapter.metadata ?? undefined,
});

class AIService implements AIService {
  constructor(private readonly client: OpenAI) {}

  async generateForm(): Promise<IntakeQuestionDto[]> {
    const completion = await this.client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: FORMGEN_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: 'Generate an intake form JSON payload.',
        },
      ],
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content ?? null;

    return parseFormDefinition(content);
  }

  async generateChapterOutline(story: StoryDto): Promise<ChapterOutline> {
    const storyContextPayload = buildStoryContextPayload(story);
    const completion = await this.client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: CHAPTER_OUTLINE_PROMPT,
        },
        {
          role: 'user',
          content: [
            `STORY_CONTEXT_JSON_SCHEMA: ${JSON.stringify(STORY_CONTEXT_JSON_SCHEMA, null, 2)}`,
            `CHAPTER_OUTLINE_JSON_SCHEMA: ${JSON.stringify(CHAPTER_OUTLINE_JSON_SCHEMA, null, 2)}`,
            'STORY_CONTEXT_JSON:',
            JSON.stringify(storyContextPayload, null, 2),
          ].join('\n'),
        },
      ],
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content ?? null;

    return parseChapterOutline(content);
  }

  async generateTasksForChapter(input: TaskGenerationContext): Promise<TaskSchedule> {
    const storyContextPayload = buildStoryContextPayload(input.story);
    const chapterContextPayload = buildChapterContext(input.chapter);

    const completion = await this.client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: TASK_GENERATION_PROMPT,
        },
        {
          role: 'user',
          content: [
            `STORY_CONTEXT_JSON_SCHEMA: ${JSON.stringify(STORY_CONTEXT_JSON_SCHEMA, null, 2)}`,
            `TASK_SCHEDULE_JSON_SCHEMA: ${JSON.stringify(TASK_SCHEDULE_JSON_SCHEMA, null, 2)}`,
            'STORY_CONTEXT_JSON:',
            JSON.stringify(storyContextPayload, null, 2),
            'CHAPTER_CONTEXT_JSON:',
            JSON.stringify(chapterContextPayload, null, 2),
          ].join('\n'),
        },
      ],
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content ?? null;

    return parseTaskSchedule(content);
  }
}

export const createAIService = ({
  client,
}: AIServiceDependencies): AIService => {
  return new AIService(client);
};
