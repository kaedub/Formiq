import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const DEFAULT_MODEL = 'gpt-5-mini';

export const FOCUS_FORM_PROMPT = fs.readFileSync(
  path.join(__dirname, 'prompts', 'focus-form.txt'),
  'utf8',
);
export const PROJECT_PLAN_PROMPT = fs.readFileSync(
  path.join(__dirname, 'prompts', 'project-outline.txt'),
  'utf8',
);
export const TASK_GENERATION_PROMPT = fs.readFileSync(
  path.join(__dirname, 'prompts', 'tasks.txt'),
  'utf8',
);
