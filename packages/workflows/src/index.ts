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
  const outline = await ai.generateProjectOutline(input);

  await db.createProjectMilestones({
    userId: input.userId,
    projectId: input.projectId,
    milestones: outline.milestones.map((m, index) => ({
      title: m.title,
      summary: m.description,
      position: index,
    })),
  });

  const projectContext = await db.getProjectDetails({
    projectId: input.projectId,
    userId: input.userId,
  });

  for (const milestone of projectContext.project.milestones) {
    const result = await ai.generateTasksForMilestone({
      project: projectContext.project,
      milestone,
    });

    await db.createMilestoneTasks({
      projectId: input.projectId,
      userId: input.userId,
      milestoneId: milestone.id,
      tasks: result.tasks.map((t, index) => ({
        title: t.title,
        description: [t.objective, t.body].filter(Boolean).join('\n\n'),
        position: index + 1,
      })),
    });
  }
}
