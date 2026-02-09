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
  SYSTEM_PROMPT,
  TASK_GENERATION_PROMPT,
} from './constants.js';
import {
  CHAPTER_OUTLINE_JSON_SCHEMA,
  FORM_DEFINITION_JSON_SCHEMA,
  STORY_CONTEXT_JSON_SCHEMA,
  TASK_SCHEDULE_JSON_SCHEMA,
} from './schemas.js';
import { requestStructuredJson } from './structured-output.js';
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

class OpenAIService implements AIService {
  constructor(private readonly client: OpenAI) {}

  async generateForm(): Promise<IntakeQuestionDto[]> {
    return requestStructuredJson({
      client: this.client,
      model: DEFAULT_MODEL,
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: 'Generate an intake form JSON payload.',
      schemaName: 'intake_form',
      schema: FORM_DEFINITION_JSON_SCHEMA,
      description: 'FormIQ intake form definition payload',
      validator: (content) => parseFormDefinition(content),
    });
  }

  async generateChapterOutline(story: StoryDto): Promise<ChapterOutline> {
    const storyContextPayload = buildStoryContextPayload(story);

    const userPrompt = [
      `STORY_CONTEXT_JSON_SCHEMA: ${JSON.stringify(STORY_CONTEXT_JSON_SCHEMA, null, 2)}`,
      `CHAPTER_OUTLINE_JSON_SCHEMA: ${JSON.stringify(CHAPTER_OUTLINE_JSON_SCHEMA, null, 2)}`,
      'STORY_CONTEXT_JSON:',
      JSON.stringify(storyContextPayload, null, 2),
    ].join('\n');
    console.log('Generating chapter outline with story context:', storyContextPayload);
    console.log('Using system prompt:', CHAPTER_OUTLINE_PROMPT);
    console.log("Using model:", DEFAULT_MODEL);
    console.log("Using user prompt", userPrompt);
    return requestStructuredJson({
      client: this.client,
      model: DEFAULT_MODEL,
      systemPrompt: CHAPTER_OUTLINE_PROMPT,
      userPrompt,
      schemaName: 'chapter_outline',
      schema: CHAPTER_OUTLINE_JSON_SCHEMA,
      description: 'FormIQ roadmap chapter outline with milestones',
      validator: (content) => parseChapterOutline(content),
    });
  }

  async generateTasksForChapter(input: TaskGenerationContext): Promise<TaskSchedule> {
    const storyContextPayload = buildStoryContextPayload(input.story);
    const chapterContextPayload = buildChapterContext(input.chapter);

    return requestStructuredJson({
      client: this.client,
      model: DEFAULT_MODEL,
      systemPrompt: TASK_GENERATION_PROMPT,
      userPrompt: [
        `STORY_CONTEXT_JSON_SCHEMA: ${JSON.stringify(STORY_CONTEXT_JSON_SCHEMA, null, 2)}`,
        `TASK_SCHEDULE_JSON_SCHEMA: ${JSON.stringify(TASK_SCHEDULE_JSON_SCHEMA, null, 2)}`,
        'STORY_CONTEXT_JSON:',
        JSON.stringify(storyContextPayload, null, 2),
        'CHAPTER_CONTEXT_JSON:',
        JSON.stringify(chapterContextPayload, null, 2),
      ].join('\n'),
      schemaName: 'task_schedule',
      schema: TASK_SCHEDULE_JSON_SCHEMA,
      description: 'FormIQ daily task schedule payload',
      validator: (content) => parseTaskSchedule(content),
    });
  }
}

export const createAIService = ({
  client,
}: AIServiceDependencies): AIService => {
  return new OpenAIService(client);
};
