import type {
  FocusForm as FocusFormModel,
  Milestone as MilestoneModel,
  Project as ProjectModel,
  Task as TaskModel,
} from '@prisma/client';
import type {
  FormRecordDto,
  MilestoneDto,
  ProjectDto,
  TaskDto,
} from '@formiq/shared';

export type ProjectWithResponses = ProjectModel;

export const mapProjectDto = (project: ProjectWithResponses): ProjectDto => {
  const dto: ProjectDto = {
    id: project.id,
    userId: project.userId,
    title: project.title,
    status: project.status,
    generatedAt: project.generatedAt ? project.generatedAt.toISOString() : null,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    responses: [],
  };
  return dto;
};

export const mapMilestoneDto = (milestone: MilestoneModel): MilestoneDto => {
  const generatedAt = milestone.generatedAt;
  const dto: MilestoneDto = {
    id: milestone.id,
    projectId: milestone.projectId,
    title: milestone.title,
    summary: milestone.summary,
    position: milestone.position,
    status: milestone.status,
    generatedAt: generatedAt.toISOString(),
  };
  return dto;
};

export const mapTaskDto = (task: TaskModel): TaskDto => {
  const generatedAt = task.generatedAt;
  const dto: TaskDto = {
    id: task.id,
    milestoneId: task.milestoneId,
    title: task.title,
    description: task.description,
    position: task.position,
    status: task.status,
    generatedAt: generatedAt.toISOString(),
    completedAt: task.completedAt ? task.completedAt.toISOString() : null,
  };
  return dto;
};

export const mapFormRecordDto = (form: FocusFormModel): FormRecordDto => ({
  id: form.id,
  name: form.name,
  projectId: form.projectId,
  kind: 'focus_questions',
});
