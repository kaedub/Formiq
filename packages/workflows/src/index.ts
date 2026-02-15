import { proxyActivities } from '@temporalio/workflow';
import type {
  DatabaseActivities,
  AIActivities,
  GenerateProjectRoadmapInput,
} from '@formiq/shared';

const db = proxyActivities<DatabaseActivities>({
  taskQueue: 'database',
  startToCloseTimeout: '10 seconds',
});

const ai = proxyActivities<AIActivities>({
  taskQueue: 'generate',
  startToCloseTimeout: '2 minutes',
});

export async function GenerateProjectRoadmap(
  input: GenerateProjectRoadmapInput,
): Promise<void> {
  const { project, intakeAnswers } = input;

  const { questions } = await ai.generateFocusQuestions(intakeAnswers);

  await db.createFocusForm({
    userId: project.userId,
    name: `focus-questions-${project.id}`,
    projectId: project.id,
    kind: 'focus_questions',
    items: questions.map((question) => ({
      question: question.prompt,
      questionType: question.questionType,
      options: question.options,
      position: question.position,
    })),
  });

  // TODO: HITL to get focus form responses from user and store in database

  // Phase 2: Generate and persist milestones
  const outline = await ai.generateProjectOutline({ project });

  await db.createProjectMilestones({
    userId: project.userId,
    projectId: project.id,
    milestones: outline.milestones.map((m, index) => ({
      title: m.title,
      summary: m.description,
      position: index,
    })),
  });
}
