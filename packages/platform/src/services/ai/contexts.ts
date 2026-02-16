import type {
  MilestoneDto,
  ProjectDto,
  ProjectOutlineContext,
} from '@formiq/shared';
import { z } from 'zod';
import {
  milestoneContextSchema,
  milestoneTaskContextSchema,
  projectContextSchema,
  projectOutlineSchema,
} from './schemas.js';

export interface PromptContext<ContextJson> {
  toJSON(): ContextJson;
}

export type ProjectContextJson = z.infer<typeof projectContextSchema>;

export type ProjectOutlineJson = z.infer<typeof projectOutlineSchema>;

export type MilestoneContextJson = z.infer<typeof milestoneContextSchema>;

export type MilestoneTaskContextJson = z.infer<
  typeof milestoneTaskContextSchema
>;

function isProjectOutlineContext(
  ctx: ProjectDto | ProjectOutlineContext,
): ctx is ProjectOutlineContext {
  return 'focusItems' in ctx && Array.isArray(ctx.focusItems);
}

export class ProjectContext implements PromptContext<ProjectContextJson> {
  constructor(private readonly context: ProjectDto | ProjectOutlineContext) {}

  toJSON(): ProjectContextJson {
    if (isProjectOutlineContext(this.context)) {
      const focusItems = this.context.focusItems
        .filter(
          (item): item is typeof item & { answer: string } =>
            item.answer !== null,
        )
        .map((item) => ({
          question: [
            item.question,
            item.options.length > 0
              ? `Options: ${item.options.join(', ')}`
              : null,
          ]
            .filter((part): part is string => Boolean(part))
            .join(' '),
          answers: [item.answer],
        }));
      return {
        project: {
          title: this.context.title,
          commitment: this.context.commitment,
          familiarity: this.context.familiarity,
          workStyle: this.context.workStyle,
          focusItems,
        },
      };
    }

    const project = this.context;
    const focusItems = project.responses.map((entry) => ({
      question: [
        entry.question.prompt,
        entry.question.questionType !== 'free_text' &&
        entry.question.options.length > 0
          ? `Options: ${entry.question.options.join(', ')}`
          : null,
      ]
        .filter((part): part is string => Boolean(part))
        .join(' '),
      answers: entry.answer.values,
    }));
    return {
      project: {
        title: project.title,
        commitment: project.commitment,
        familiarity: project.familiarity,
        workStyle: project.workStyle,
        focusItems,
      },
    };
  }
}

export class MilestoneContext implements PromptContext<MilestoneContextJson> {
  constructor(private readonly milestone: MilestoneDto) {}

  toJSON(): MilestoneContextJson {
    return {
      title: this.milestone.title,
      summary: this.milestone.summary,
    };
  }
}

export class MilestoneTaskContext implements PromptContext<MilestoneTaskContextJson> {
  constructor(
    private readonly projectContext: ProjectContext,
    private readonly milestoneContext: MilestoneContext,
  ) {}

  toJSON(): MilestoneTaskContextJson {
    return {
      projectContext: this.projectContext.toJSON(),
      milestone: this.milestoneContext.toJSON(),
    };
  }
}
