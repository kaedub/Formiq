import type {
  Chapter as ChapterModel,
  IntakeForm as IntakeFormModel,
  IntakeQuestion as IntakeQuestionModel,
  PromptExecution as PromptExecutionModel,
  QuestionAnswer as QuestionAnswerModel,
  StoryEvent as StoryEventModel,
  Story as StoryModel,
  Task as TaskModel,
} from '@prisma/client';
import type {
  ChapterDto,
  IntakeQuestionDto,
  IntakeFormDto,
  PromptExecutionDto,
  QuestionAnswerDto,
  QuestionResponseDto,
  StoryDto,
  StoryEventDto,
  TaskDto,
} from '@formiq/shared';

export type QuestionAnswerWithQuestion = QuestionAnswerModel & {
  question: IntakeQuestionModel;
};

export type StoryWithResponses = StoryModel & {
  questionAnswers: QuestionAnswerWithQuestion[];
};

export type StoryWithContext = StoryWithResponses & {
  chapters: (ChapterModel & { tasks: TaskModel[] })[];
  promptExecutions: PromptExecutionModel[];
  events: StoryEventModel[];
};

export type IntakeFormWithQuestions = IntakeFormModel & {
  questions: IntakeQuestionModel[];
};

export const mapIntakeQuestionDto = (
  question: IntakeQuestionModel,
): IntakeQuestionDto => ({
  id: question.id,
  prompt: question.prompt,
  options: question.options,
  questionType: question.questionType,
  position: question.position,
});

export const mapQuestionAnswerDto = (
  answer: QuestionAnswerModel,
): QuestionAnswerDto => ({
  questionId: answer.questionId,
  storyId: answer.storyId,
  values: answer.values,
  answeredAt: answer.answeredAt.toISOString(),
});

export const mapQuestionResponseDto = (
  entry: QuestionAnswerWithQuestion,
): QuestionResponseDto => ({
  question: mapIntakeQuestionDto(entry.question),
  answer: mapQuestionAnswerDto(entry),
});

export const mapStoryDto = (story: StoryWithResponses): StoryDto => {
  const dto: StoryDto = {
    id: story.id,
    userId: story.userId,
    title: story.title,
    status: story.status,
    createdAt: story.createdAt.toISOString(),
    updatedAt: story.updatedAt.toISOString(),
    responses: story.questionAnswers.map(mapQuestionResponseDto),
  };
  if (story.generatedAt) {
    dto.generatedAt = story.generatedAt.toISOString();
  }
  return dto;
};

export const mapChapterDto = (chapter: ChapterModel): ChapterDto => {
  const dto: ChapterDto = {
    id: chapter.id,
    storyId: chapter.storyId,
    title: chapter.title,
    summary: chapter.summary,
    context: chapter.context ?? undefined,
    position: chapter.position,
    status: chapter.status,
    metadata: chapter.metadata ?? undefined,
  };
  if (chapter.generatedAt) {
    dto.generatedAt = chapter.generatedAt.toISOString();
  }
  return dto;
};

export const mapTaskDto = (task: TaskModel): TaskDto => {
  const dto: TaskDto = {
    id: task.id,
    chapterId: task.chapterId,
    title: task.title,
    description: task.description,
    position: task.position,
    status: task.status,
    metadata: task.metadata ?? undefined,
  };
  if (task.generatedAt) {
    dto.generatedAt = task.generatedAt.toISOString();
  }
  if (task.completedAt) {
    dto.completedAt = task.completedAt.toISOString();
  }
  return dto;
};

export const mapPromptExecutionDto = (
  exec: PromptExecutionModel,
): PromptExecutionDto => {
  const dto: PromptExecutionDto = {
    id: exec.id,
    storyId: exec.storyId,
    stage: exec.stage,
    status: exec.status,
    input: exec.input,
    createdAt: exec.createdAt.toISOString(),
  };

  if (exec.chapterId) {
    dto.chapterId = exec.chapterId;
  }
  if (exec.taskId) {
    dto.taskId = exec.taskId;
  }
  if (exec.templateId) {
    dto.templateId = exec.templateId;
  }
  if (exec.output !== null) {
    dto.output = exec.output;
  }
  if (exec.model) {
    dto.model = exec.model;
  }
  if (exec.metadata != null) {
    dto.metadata = exec.metadata;
  }

  return dto;
};

export const mapStoryEventDto = (event: StoryEventModel): StoryEventDto => ({
  id: event.id,
  storyId: event.storyId,
  eventType: event.eventType,
  payload: event.payload ?? undefined,
  createdAt: event.createdAt.toISOString(),
});

export const mapIntakeFormDto = (
  form: IntakeFormWithQuestions,
): IntakeFormDto => ({
  id: form.id,
  name: form.name,
  questions: form.questions.map(mapIntakeQuestionDto),
});
