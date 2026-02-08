export const STORY_CONTEXT_JSON_SCHEMA = {
  type: 'object',
  required: ['story'],
  properties: {
    story: {
      type: 'object',
      required: ['title', 'responses'],
      properties: {
        title: { type: 'string' },
        responses: {
          type: 'array',
          items: {
            type: 'object',
            required: ['question', 'answers'],
            properties: {
              question: { type: 'string' },
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
  required: ['chapters'],
  properties: {
    chapters: {
      type: 'array',
      items: {
        type: 'object',
        required: ['title', 'summary', 'position', 'milestones'],
        properties: {
          title: { type: 'string' },
          summary: { type: 'string' },
          position: { type: 'number' },
          milestones: {
            type: 'array',
            items: {
              type: 'object',
              required: ['title', 'description'],
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                successCriteria: { type: 'array', items: { type: 'string' } },
                estimatedDurationDays: { type: 'number' },
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
  required: ['tasks'],
  properties: {
    tasks: {
      type: 'array',
      items: {
        type: 'object',
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
          title: { type: 'string' },
          objective: { type: 'string' },
          description: { type: 'string' },
          body: { type: 'string' },
          estimatedMinutes: { type: 'number', minimum: 1 },
          optionalChallenge: { type: 'string' },
          reflectionPrompt: { type: 'string' },
        },
      },
    },
  },
} as const;
