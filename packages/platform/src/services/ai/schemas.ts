export const FORM_DEFINITION_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['questions'],
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'prompt', 'questionType', 'options', 'position'],
        properties: {
          id: { type: 'string', minLength: 1 },
          prompt: { type: 'string', minLength: 1 },
          questionType: { type: 'string', enum: ['free_text', 'single_select', 'multi_select'] },
          options: { type: 'array', items: { type: 'string' } },
          position: { type: 'integer', minimum: 0 },
        },
      },
    },
  },
} as const;

export const STORY_CONTEXT_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['story'],
  properties: {
    story: {
      type: 'object',
      additionalProperties: false,
      required: ['title', 'responses'],
      properties: {
        title: { type: 'string', minLength: 1 },
        responses: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['question', 'answers'],
            properties: {
              question: { type: 'string', minLength: 1 },
              answers: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
    },
  },
} as const;

export const CHAPTER_OUTLINE_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['chapters'],
  properties: {
    chapters: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'summary', 'position', 'milestones'],
        properties: {
          title: { type: 'string', minLength: 1 },
          summary: { type: 'string', minLength: 1 },
          position: { type: 'integer', minimum: 0 },
          milestones: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['title', 'description'],
              properties: {
                title: { type: 'string', minLength: 1 },
                description: { type: 'string', minLength: 1 },
                successCriteria: { type: 'array', items: { type: 'string' } },
                estimatedDurationDays: { type: 'number', minimum: 0 },
              },
            },
          },
        },
      },
    },
  },
} as const;

export const TASK_SCHEDULE_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['tasks'],
  properties: {
    tasks: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'day',
          'title',
          'objective',
          'description',
          'body',
          'estimatedMinutes',
        ],
        properties: {
          day: { type: 'integer', minimum: 1 },
          title: { type: 'string', minLength: 1 },
          objective: { type: 'string', minLength: 1 },
          description: { type: 'string', minLength: 1 },
          body: { type: 'string', minLength: 1 },
          estimatedMinutes: { type: 'number', minimum: 1 },
          optionalChallenge: { type: 'string', minLength: 1 },
          reflectionPrompt: { type: 'string', minLength: 1 },
        },
      },
    },
  },
} as const;
