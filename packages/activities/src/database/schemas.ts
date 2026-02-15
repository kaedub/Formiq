import { z } from 'zod';
import { FORM_RECORD_KIND_VALUES, QUESTION_TYPE_VALUES } from '@formiq/shared';

export const idSchema = z.string().min(1, 'id is required');
export const userIdSchema = z.string().min(1, 'userId is required');
export const projectIdSchema = z.string().min(1, 'projectId is required');
export const milestoneIdSchema = z.string().min(1, 'milestoneId is required');

export const formRecordKindSchema = z.enum(FORM_RECORD_KIND_VALUES);

export const focusItemInputSchema = z.object({
  question: z.string().min(1, 'question is required'),
  questionType: z.enum(QUESTION_TYPE_VALUES),
  options: z.array(z.string()),
  position: z.number().int().nonnegative(),
});

export const formRecordSchema = z.object({
  id: idSchema,
  name: z.string().min(1, 'name is required'),
  projectId: projectIdSchema,
  kind: formRecordKindSchema,
});

export const getProjectFocusFormInputSchema = z.object({
  userId: userIdSchema,
  projectId: projectIdSchema,
});

export const focusItemDtoSchema = z.object({
  id: idSchema,
  question: z.string().min(1),
  questionType: z.enum(QUESTION_TYPE_VALUES),
  options: z.array(z.string()),
  position: z.number().int().nonnegative(),
  answer: z.string().nullable(),
  answeredAt: z.string().nullable(),
});

export const focusFormDtoSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  projectId: projectIdSchema,
  kind: z.literal('focus_questions'),
  items: z.array(focusItemDtoSchema),
});

export const createFormRecordInputSchema = z
  .object({
    name: z.string().min(1, 'name is required'),
    projectId: projectIdSchema,
    userId: userIdSchema,
    kind: formRecordKindSchema,
    items: z.array(focusItemInputSchema),
  })
  .refine(
    (input) => input.kind === 'focus_questions',
    'Only focus_questions forms can be created via this activity',
  );

export const replaceFocusFormItemsInputSchema = z.object({
  formId: idSchema,
  userId: userIdSchema,
  items: z.array(focusItemInputSchema).min(1, 'at least one item'),
});

export const createProjectMilestonesInputSchema = z.object({
  userId: userIdSchema,
  projectId: projectIdSchema,
  milestones: z
    .array(
      z.object({
        title: z.string().min(1, 'title is required'),
        summary: z.string().min(1, 'summary is required'),
        position: z.number().int().nonnegative(),
      }),
    )
    .min(1, 'at least one milestone'),
});

export const createMilestoneTasksInputSchema = z.object({
  userId: userIdSchema,
  projectId: projectIdSchema,
  milestoneId: milestoneIdSchema,
  tasks: z
    .array(
      z.object({
        title: z.string().min(1, 'title is required'),
        description: z.string().min(1, 'description is required'),
        position: z.number().int().positive(),
      }),
    )
    .min(1, 'at least one task'),
});
