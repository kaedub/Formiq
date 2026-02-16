import { z } from 'zod';

const questionTypeSchema = z.enum([
  'free_text',
  'single_select',
  'multi_select',
]);

export const focusQuestionSchema = z
  .object({
    id: z.string().min(1),
    prompt: z.string().min(1),
    questionType: questionTypeSchema,
    options: z.array(z.string()),
    position: z.number().int().nonnegative(),
  })
  .strict();

export const focusQuestionsFormSchema = z
  .object({
    questions: z.array(focusQuestionSchema),
  })
  .strict();

export const projectContextSchema = z
  .object({
    project: z
      .object({
        title: z.string().min(1),
        commitment: z.string().min(1),
        familiarity: z.string().min(1),
        workStyle: z.string().min(1),
        focusItems: z.array(
          z
            .object({
              question: z.string().min(1),
              answers: z.array(z.string()),
            })
            .strict(),
        ),
      })
      .strict(),
  })
  .strict();

export const projectOutlineMilestoneSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().min(1),
  })
  .strict();

export const projectOutlineSchema = z
  .object({
    milestones: z.array(projectOutlineMilestoneSchema),
  })
  .strict();

export const taskSchema = z
  .object({
    day: z.number().int().positive(),
    title: z.string().min(1),
    objective: z.string().min(1),
    body: z.string().min(1),
    estimatedMinutes: z.number().positive(),
  })
  .strict();

export const milestoneTasksSchema = z
  .object({
    tasks: z.array(taskSchema),
  })
  .strict();

export const milestoneContextSchema = z
  .object({
    title: z.string().min(1),
    summary: z.string().min(1),
  })
  .strict();

export const milestoneTaskContextSchema = z
  .object({
    projectContext: projectContextSchema,
    milestone: milestoneContextSchema,
  })
  .strict();
