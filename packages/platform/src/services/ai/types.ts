import type OpenAI from 'openai';
import type { ChapterDto, IntakeQuestionDto, StoryDto } from '@formiq/shared';

export type AIServiceDependencies = {
  client: OpenAI;
};

export interface ChapterOutlineMilestone {
  title: string;
  description: string;
  successCriteria: string[];
  estimatedDurationDays?: number;
}

export interface ChapterOutlineItem {
  title: string;
  summary: string;
  position: number;
  milestones: ChapterOutlineMilestone[];
}

export interface ChapterOutline {
  chapters: ChapterOutlineItem[];
}

export interface GeneratedTask {
  day: number;
  title: string;
  objective: string;
  description: string;
  body: string;
  estimatedMinutes: number;
  optionalChallenge?: string;
  reflectionPrompt?: string;
}

export interface TaskSchedule {
  tasks: GeneratedTask[];
}

export interface TaskGenerationContext {
  story: StoryDto;
  chapter: ChapterDto;
}

export interface AIService {
  generateForm(): Promise<IntakeQuestionDto[]>;
  generateChapterOutline(story: StoryDto): Promise<ChapterOutline>;
  generateTasksForChapter(input: TaskGenerationContext): Promise<TaskSchedule>;
}
