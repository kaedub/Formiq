import { z } from 'zod';
import {
  PROJECT_COMMITMENT_VALUES,
  PROJECT_FAMILIARITY_VALUES,
  PROJECT_WORK_STYLE_VALUES,
  QUESTION_TYPE_VALUES,
  PROJECT_STATUS_VALUES,
  MILESTONE_STATUS_VALUES,
} from '@formiq/shared';

const nonEmptyString = z.string().min(1);

export const focusQuestionsInputSchema = z.object({
  goal: nonEmptyString,
  commitment: z.enum(PROJECT_COMMITMENT_VALUES),
  familiarity: z.enum(PROJECT_FAMILIARITY_VALUES),
  workStyle: z.enum(PROJECT_WORK_STYLE_VALUES),
});

export const focusQuestionSchema = z
  .object({
    id: nonEmptyString,
    prompt: nonEmptyString,
    questionType: z.enum(QUESTION_TYPE_VALUES),
    options: z.array(nonEmptyString),
    position: z.number().int().nonnegative(),
  })
  .strict();

export const focusQuestionsOutputSchema = z
  .object({
    questions: z.array(focusQuestionSchema),
  })
  .strict();

const projectResponseSchema = z
  .object({
    question: z
      .object({
        id: nonEmptyString,
        prompt: nonEmptyString,
        questionType: z.enum(QUESTION_TYPE_VALUES),
        options: z.array(z.string()),
      })
      .strict(),
    answer: z
      .object({
        questionId: nonEmptyString,
        values: z.array(nonEmptyString),
      })
      .strict(),
  })
  .strict();

export const projectSchema = z
  .object({
    id: nonEmptyString,
    userId: nonEmptyString,
    title: nonEmptyString,
    commitment: z.enum(PROJECT_COMMITMENT_VALUES),
    familiarity: z.enum(PROJECT_FAMILIARITY_VALUES),
    workStyle: z.enum(PROJECT_WORK_STYLE_VALUES),
    status: z.enum(PROJECT_STATUS_VALUES),
    generatedAt: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    responses: z.array(projectResponseSchema),
  })
  .strict();

export const projectOutlineOutputSchema = z
  .object({
    milestones: z.array(
      z
        .object({
          title: nonEmptyString,
          description: nonEmptyString,
        })
        .strict(),
    ),
  })
  .strict();

export const milestoneSchema = z
  .object({
    id: nonEmptyString,
    projectId: nonEmptyString,
    title: nonEmptyString,
    summary: nonEmptyString,
    position: z.number().int().nonnegative(),
    status: z.enum(MILESTONE_STATUS_VALUES),
    generatedAt: z.string(),
  })
  .strict();

export const milestoneTasksOutputSchema = z
  .object({
    tasks: z.array(
      z
        .object({
          day: z.number().int().positive(),
          title: nonEmptyString,
          objective: nonEmptyString,
          body: nonEmptyString,
          estimatedMinutes: z.number().positive(),
        })
        .strict(),
    ),
  })
  .strict();

export const taskGenerationContextSchema = z
  .object({
    project: projectSchema,
    milestone: milestoneSchema,
  })
  .strict();
