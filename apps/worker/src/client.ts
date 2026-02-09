import { createAIService, createDatabaseService, getOpenAIClient, getPrismaClient } from '@formiq/platform';
import type { IntakeFormDto } from '@formiq/shared';
import type { PrismaClient } from '@prisma/client';
import { DEFAULT_INTAKE_FORM_NAME, QUESTION_FIXTURES, buildStoryInput } from '../../../packages/platform/src/test/fixtures.js';

const USER_ID = 'test-user-id';

const ensureTestUser = async (prisma: PrismaClient): Promise<void> => {
  await prisma.user.upsert({
    where: { id: USER_ID },
    update: {},
    create: {
      id: USER_ID,
      email: 'test-user@example.com',
      password: 'password',
    },
  });
};

const ensureIntakeForm = async (
  dbService: ReturnType<typeof createDatabaseService>,
): Promise<IntakeFormDto> => {
  const existingForm = await dbService.getIntakeFormByName(DEFAULT_INTAKE_FORM_NAME);
  if (existingForm) {
    return existingForm;
  }

  return dbService.createIntakeForm({
    name: DEFAULT_INTAKE_FORM_NAME,
    questions: QUESTION_FIXTURES,
  });
};

const run = async (): Promise<void> => {
  console.log('Starting service client...');
  const prisma = getPrismaClient();
  const databaseService = createDatabaseService({ db: prisma });
  const aiService = createAIService({ client: getOpenAIClient() });

  await ensureTestUser(prisma);
  const intakeForm = await ensureIntakeForm(databaseService);

  console.log('Using intake form:', intakeForm.name);
  intakeForm.questions.forEach((question, index) => {
    console.log(`${index + 1}. [${question.questionType}] ${question.prompt}`);
    if (question.options.length > 0) {
      console.log(`   Options: ${question.options.join(', ')}`);
    }
  });

  const storyInput = buildStoryInput(USER_ID);
  console.log('\nCreating story with responses...');
  const story = await databaseService.createStory(storyInput);
  console.log('Created story:', { id: story.id, title: story.title, userId: story.userId });

  console.log('\nGenerating chapter outline via AI service...');
  const outline = await aiService.generateChapterOutline(story);

  console.log('\nGenerated chapters (not persisted):');
  outline.chapters.forEach((chapter) => {
    console.log(`- [${chapter.position}] ${chapter.title}`);
    console.log(`  Summary: ${chapter.summary}`);
    if (chapter.milestones.length > 0) {
      console.log('  Milestones:');
      chapter.milestones.forEach((milestone, index) => {
        console.log(`    ${index + 1}. ${milestone.title}`);
        console.log(`       Description: ${milestone.description}`);
        if (milestone.successCriteria.length > 0) {
          console.log(`       Success Criteria: ${milestone.successCriteria.join('; ')}`);
        }
        if (milestone.estimatedDurationDays !== undefined) {
          console.log(`       Estimated Days: ${milestone.estimatedDurationDays}`);
        }
      });
    }
  });
};

run().catch((error: unknown) => {
  console.error('Service client failed:', error);
  process.exitCode = 1;
});
