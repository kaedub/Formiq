# FormIQ

- AI guide that turns a user goal into a structured roadmap the user can edit and track.
- Flow: user states a goal → guided Q&A builds context → AI summarizes → AI drafts milestones/tasks → user edits and tracks progress.

## Workspace Map (Nx + Yarn workspaces)

- `apps/web` (`@formiq/web`): React/Vite UI for goal intake, questionnaire, and roadmap view/update (targets to be added).
- `apps/api` (`@formiq/api`): Express API for auth/project endpoints and Temporal kicks; serves compiled output via `nx run api:serve`.
- `packages/platform` (`@formiq/platform`): Data/integration layer (Prisma schema/client, PG adapter, env loading).
- `packages/shared` (`@formiq/shared`): Shared types/DTOs used across API, UI, and LLM payloads.
- `packages/workflows` (`@formiq/workflows`) and `packages/activities` (`@formiq/activities`): Temporal workflow orchestration and activities that call into `@formiq/platform`.

## Setup

- Ensure Node.js 18+ (repo currently using v25).
- Install deps: `yarn install`

## Build

- All packages: `nx run-many --target=build`
- Single project: `nx run <project>:build` (e.g., `api`, `platform`, `shared`, `workflows`, `activities`)

## Run

- API: `nx run api:serve` (builds then runs `apps/api/dist/index.js`)
- Other apps/packages: no runtime targets yet; run compiled outputs under each `dist` once you add an entry point.

## Database (Prisma via platform)

- Dev migration: `yarn db:migrate <name>`
- Generate client: `yarn db:generate`
- Push schema without migration: `yarn db:push`
- Inspect data: `yarn db:studio`

## Tests

- Not configured yet. Add a test target per project and run with `nx run <project>:test` or all via `nx run-many --target=test`. The root `yarn test` is a placeholder.

## Adding Dependencies (Yarn workspaces)

- Runtime dep for a project: `yarn workspace <package-name> add <package>` (example: `yarn workspace @formiq/api add zod`).
- Dev-only dep for a project: `yarn workspace <package-name> add -D <package>` (example: `yarn workspace @formiq/web add -D @types/react`).
- Repo-wide tooling: `yarn add -D -W <package>` to pin a single version at the root.
- Refer to local packages with `workspace:*` versions (e.g., `"@formiq/platform": "workspace:*"`); Yarn will wire symlinks and keep Nx project graph consistent.
