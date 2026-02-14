import {
  createAIService,
  createDatabaseService,
  getOpenAIClient,
  getPrismaClient,
} from '@formiq/platform';
import type { CreateProjectInput, CreateMilestoneInput } from '@formiq/shared';
import { TEST_USER_ID } from '@formiq/shared';
import type { PrismaClient } from '@prisma/client';

const ensureTestUser = async (prisma: PrismaClient): Promise<void> => {
  await prisma.user.upsert({
    where: { id: TEST_USER_ID },
    update: {},
    create: {
      id: TEST_USER_ID,
      email: 'test-user@example.com',
      password: 'password',
    },
  });
};

const run = async (): Promise<void> => {
  console.log('Starting service client...');
  const prisma = getPrismaClient();
  const databaseService = createDatabaseService({ db: prisma });
  const aiService = createAIService({ client: getOpenAIClient() });

  await ensureTestUser(prisma);

  const projectInput: CreateProjectInput = {
    userId: TEST_USER_ID,
    title: 'Test Project',
    responses: [],
  };

  projectInput.responses.push(
    {
      questionId: 'goal_main_win',
      values: [
        'I want to learn how to produce electronic music well enough to release a small 3-4 track EP within the next 6 months.',
      ],
    },
    {
      questionId: 'existing_resources',
      values: [
        'I have a laptop, decent headphones, a small MIDI keyboard, a quiet room to work in, and a basic understanding of music theory and rhythm.',
      ],
    },
    {
      questionId: 'time_commitment',
      values: [
        'I can commit 5-7 hours per week, mostly on weekday evenings and a longer session on the weekend.',
      ],
    },
    {
      questionId: 'constraints',
      values: [
        'I live in an apartment so I need to keep noise reasonable (mostly headphones), I am on a tight budget and prefer free or low-cost software, and I use a Mac so tools should be macOS-compatible.',
      ],
    },
    {
      questionId: 'success_signals',
      values: [
        'I can produce and mix a complete electronic track on my own without following a tutorial step-by-step, I release an EP on a streaming platform, and a handful of friends say they genuinely enjoy listening to it.',
      ],
    },
  );

  console.log('\nCreating project with responses...');

  const project = await databaseService.createProject(projectInput);
  console.log('Created project:', {
    id: project.id,
    title: project.title,
    userId: project.userId,
  });

  console.log('\nGenerating project outline via AI service...');
  const outline = await aiService.generateProjectOutline({ project });

  console.log('\nGenerated milestones:');
  outline.milestones.forEach((milestone) => {
    console.log(milestone);
  });

  const milestones: CreateMilestoneInput[] = outline.milestones.map(
    (milestone, index) => ({
      title: milestone.title,
      summary: milestone.description,
      position: index,
    }),
  );

  await databaseService.createProjectMilestones({
    projectId: project.id,
    userId: TEST_USER_ID,
    milestones,
  });

  let { project: projectDetails } = await databaseService.getProjectDetails({
    userId: TEST_USER_ID,
    projectId: project.id,
  });

  console.log('Project Details', projectDetails);

  let milestone = projectDetails.milestones[0]!;

  const { tasks } = await aiService.generateTasksForMilestone({
    project,
    milestone,
  });

  console.log('\n');
  console.log(projectDetails);

  console.log('\nGenerated tasks for ', milestone.title, '...');
  for (const task of tasks) {
    console.log(task);
  }

  const tasksInput = tasks.map((task, index) => {
    const description = JSON.stringify({
      body: task.body,
      objective: task.objective,
      estimatedMinutes: task.estimatedMinutes,
    });
    return {
      title: task.title,
      position: index + 1,
      description,
    };
  });
  await databaseService.createMilestoneTasks({
    userId: TEST_USER_ID,
    milestoneId: milestone.id,
    projectId: project.id,
    tasks: tasksInput,
  });

  const finalState = await databaseService.getProjectDetails({
    userId: TEST_USER_ID,
    projectId: project.id,
  });
};

run().catch((error: unknown) => {
  console.error('Service client failed:', error);
  process.exitCode = 1;
});
