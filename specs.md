# AI Generation Flow

## Overview

- The pipeline runs in ordered stages to keep outputs grounded, structured, and auditable.
- Schema validation is always enforced locally; contextual validation is optional and can be toggled per stage.

## Stages

1. Project Context
   - Build enriched project context JSON from intake answers (summaries, constraints, priorities).
   - Output: `project_context` JSON (validated against a local schema), logged as a prompt execution.
   - Data needed:
     - Goal/win: the outcome you want and the main win (e.g., certification, launch, portfolio).
     - Resources: what you already have (gear, budget, access, skills).
     - Time/effort: how much you can commit and on what cadence; any deadlines.
     - Constraints/no-gos: tools/tech/policies to respect, budget caps, forbidden content/approaches, location limits.
     - Success signals: how you’ll know it’s a success (one or two signals).
     - Risks/assumptions: things that might block you or need to be true.

2. Project Outline
   - Input: `project_context` JSON.
   - Prompt the model for a project outline using the structured `project_plan` JSON format.
   - Output: `project_plan` JSON (milestones with descriptions, success criteria, durations).
   - Data needed:
     - Condensed project context (goal/win, resources, time/cadence, constraints/no-gos, success signals)
     - Target outcome and major deliverables
     - Ordering constraints; critical path items; effort/time budget aligned to cadence
     - Tool/tech constraints; quality bars (definition of done per milestone); checkpoints/review gates
     - Dependency hints; risk mitigation requirements

3. Milestone Validation (required)
   - Local Zod validation of `project_plan` output.

4. Milestone Repair (if needed)
   - If schema validation fails, run a repair/regeneration step to produce valid `project_plan` JSON, then re-validate.

5. Milestone Contextual Validation (optional)
   - LLM sanity check that the milestone plan aligns with `project_context` (no hallucinations/off-topic items).
   - Optionally repair and re-validate schema if changes are made.
   - Data needed:
     - Original `project_context`; generated `project_plan`
     - Consistency checklist (must-cover goals, forbidden items, scope boundaries, constraints, deadlines)

6. Coarse Task Generation
   - Purpose: generate a global, coarse `task_schedule` across all milestones to get cross-milestone sequencing, dependencies, and time allocation right.
   - Input: `project_context` + full milestone list (titles, summaries, dependencies, durations, constraints, sequencing rules).
   - Output: coarse `task_schedule` JSON (tasks or epics with day ranges or buckets) covering the entire project timeline.
   - Data needed:
     - Milestone metadata (title, summary, position, dependencies, durations, constraints)
     - Project context (goal/win, resources, constraints/no-gos, success signals); available time per day or sprint cadence
     - Tools/resources to use; required formats/deliverables; risk hotspots to stage across milestones
     - Global sequencing rules (e.g., research before build, validation after build); cross-milestone dependencies and ordering constraints

7. Fine Task Generation
   - Purpose: refine a specific milestone or time window into a detailed `task_schedule` slice while respecting the global coarse schedule.
   - Input: `project_context` + specific milestone details + the relevant portion of the coarse global schedule (used as a constraint, not something to overwrite).
   - Output: detailed `task_schedule` JSON for the focused milestone/time slice (tasks with day, objective, description, body, etc.).
   - Data needed:
     - Milestone details (title, summary, position, dependencies, definition of done, constraints)
     - Project context (goal/win, resources, constraints/no-gos, success signals); available time per day or sprint cadence
     - Tools/resources to use; required formats/deliverables; risk hotspots to address within this milestone
     - Local sequencing rules (within the milestone) and alignment with the global coarse schedule

8. Task Validation (required)
   - Local Zod validation of `task_schedule` output.

9. Task Repair (if needed)
   - If schema validation fails, run a repair/regeneration step to produce valid `task_schedule` JSON, then re-validate.

10. Task Contextual Validation (optional)

- LLM sanity check that tasks align with the milestone and broader `project_context`.
- Optionally repair and re-validate schema if changes are made.
- Data needed:
  - Milestone definition; project context; generated `task_schedule`
  - Consistency checklist (covers all milestone acceptance criteria, respects constraints/deadlines/tools, avoids out-of-scope tasks)

## Logging

- Each model call is recorded as a `PromptExecution` with a `PromptExecutionStage` indicating the pipeline step.
- Use logs for traceability, debugging, replay, and metrics.

## Intake Form

General Intake V1

1. What do you want to achieve, and what’s the main win you’re after (e.g., certification, launch, portfolio)?
2. What resources do you already have (gear, budget, access, skills)?
3. How much time/effort can you commit, and on what cadence?
4. What constraints or no-gos should we respect (tools/tech, policies, budget caps, forbidden content)?
5. How will you know it’s a success (one or two signals)?

## Design Notes: AI Request / Plan Classes

### Core classes

- `FocusQuestionsRequest`
  - Purpose: generate the intake form (`intake_form` JSON).
  - Domain input: none for now (later: configuration/variant).
  - Output: `intake_form` JSON validated locally (e.g., `intakeFormSchema`).
  - Responsibilities:
    - Build any minimal config JSON for the model (if needed).
    - Construct the user prompt for intake form generation.

- `ProjectContext`
  - Purpose: deterministic builder that maps `ProjectDto` (intake answers) to enriched `project_context` JSON.
  - Output type: `ProjectContextJson` (validated locally if needed).
  - Responsibilities:
    - Produce the canonical `project_context` JSON (`toJSON()`).
    - Keep all context enrichment (summaries, constraints, priorities) in one place.
    - Optionally expose a local validation helper using Zod.

- `ProjectOutlineGenerationRequest`
  - Purpose: Stage 2 – generate `project_plan` JSON from `project_context`.
  - Domain input: `ProjectContext` (or its JSON).
  - Input: `project_context` JSON.
  - Output: `project_plan` JSON validated locally (e.g., `projectOutlineSchema`).
  - Responsibilities:
    - Build the JSON payload handed to the model (usually the `project_context`).
    - Construct the user prompt including:
      - Instructions for milestone outline generation.
      - The concrete `project_context` JSON and any lightweight description of the expected `project_plan` structure.

- `CoarseTaskScheduleGenerationRequest`
  - Purpose: Stage 6 – generate a global, coarse `task_schedule` JSON across all milestones.
  - Domain input: `ProjectContext` and the full milestone list (plan-derived type).
  - Input: `project_context` JSON and milestone list JSON.
  - Output: coarse `task_schedule` JSON (coarse variant) validated locally (e.g., a `taskScheduleSchema`).
  - Responsibilities:
    - Build the JSON payload combining:
      - Project context (goal/win, resources, cadence, constraints, success signals).
      - Milestone metadata (titles, summaries, positions, dependencies, durations, constraints).
    - Construct the user prompt including:
      - Embedded context, plan, and schedule schemas.
      - Project context JSON and milestone list JSON.

- `FineTaskScheduleGenerationRequest`
  - Purpose: Stage 7 – generate a detailed `task_schedule` JSON slice for a specific milestone or time window, respecting the coarse global schedule.
  - Domain input: `ProjectContext`, a milestone (DTO or plan-derived type), and the relevant portion of the coarse schedule.
  - Input: `project_context` JSON, milestone JSON, and a coarse `task_schedule` slice.
  - Output: detailed `task_schedule` JSON (focused slice) validated locally.
  - Responsibilities:
    - Build the JSON payload combining:
      - Project context (goal/win, resources, cadence, constraints, success signals).
      - Milestone details (title, summary, position, dependencies, definition of done, constraints).
      - The relevant coarse schedule segment used as a constraint.
    - Construct the user prompt including:
      - Embedded context and schedule schemas.
      - Project context JSON, milestone JSON, and the coarse schedule slice.

### Repair and contextual validation classes (optional but recommended)

- `ProjectOutlineRepairRequest`
  - Purpose: Stage 4 – repair an invalid `project_plan` to satisfy the schema.
  - Domain input: `ProjectContext`, invalid `project_plan` JSON, and validation errors.
  - Output: corrected `project_plan` JSON that passes local validation.
  - Responsibilities:
    - Build a payload with `{ projectContext, attemptedPlan, validationErrors }`.
    - Prompt the model to return a corrected `project_plan` that validates locally.

- `ProjectOutlineContextValidationRequest`
  - Purpose: Stage 5 – contextual validation/repair of `project_plan` against `project_context`.
  - Domain input: `ProjectContext` and valid `project_plan`.
  - Output: either a dedicated `plan_review` JSON schema or a repaired `project_plan` (same schema).
  - Responsibilities:
    - Build a payload with `{ projectContext, projectPlan }`.
    - Apply a consistency checklist (must-cover goals, respect constraints/deadlines, avoid forbidden content).

- `TaskScheduleRepairRequest`
  - Purpose: Stage 9 – repair invalid `task_schedule` outputs.
  - Domain input: `ProjectContext`, milestone, invalid schedule JSON, and validation errors.
  - Output: corrected `task_schedule` JSON that passes local validation.
  - Responsibilities:
    - Build a payload with `{ projectContext, milestone, attemptedSchedule, validationErrors }`.
    - Prompt the model to return a corrected `task_schedule` that validates locally.

- `TaskScheduleContextValidationRequest`
  - Purpose: Stage 10 – contextual validation/repair of `task_schedule` against the milestone and `project_context`.
  - Domain input: `ProjectContext`, milestone definition, and valid `task_schedule`.
  - Output: either a `task_schedule_review` JSON schema or a repaired `task_schedule`.
  - Responsibilities:
    - Build a payload with `{ projectContext, milestone, taskSchedule }`.
    - Apply a consistency checklist (covers milestone acceptance criteria, respects constraints/deadlines/tools, avoids out-of-scope tasks).
