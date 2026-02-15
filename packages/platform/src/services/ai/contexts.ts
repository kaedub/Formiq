import type { MilestoneDto, ProjectDto } from '@formiq/shared';
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

export class ProjectContext implements PromptContext<ProjectContextJson> {
  constructor(private readonly project: ProjectDto) {}

  toJSON(): ProjectContextJson {
    return {
      project: {
        title: this.project.title,
        responses: this.project.responses.map((entry) => ({
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
        })),
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
