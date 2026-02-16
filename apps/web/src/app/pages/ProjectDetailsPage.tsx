import { useCallback, useEffect, useMemo, useState, type JSX } from 'react';
import { Link, useParams } from 'react-router-dom';
import type {
  FocusItemDto,
  ProjectContextProjectDto,
  SubmitFocusResponseInput,
} from '@formiq/shared';
import {
  type FocusQuestion,
  FocusQuestionsForm,
} from '../components/FocusQuestionsForm';
import styles from '../app.module.css';
import { API_BASE } from '../config';

type ProjectStep = 'loading' | 'generating' | 'focus_form' | 'details';

function deriveProjectStep(
  project: ProjectContextProjectDto | null,
): ProjectStep {
  if (!project) {
    return 'loading';
  }

  if (project.status === 'draft') {
    const hasCompletedContext = project.promptExecutions.some(
      (pe) => pe.stage === 'project_context' && pe.status === 'success',
    );

    if (!hasCompletedContext && !project.focusForm) {
      return 'generating';
    }

    if (project.focusForm) {
      const hasUnanswered = project.focusForm.items.some(
        (item) => item.answer === null,
      );
      if (hasUnanswered) {
        return 'focus_form';
      }
    }
  }

  return 'details';
}

function mapFocusItemsToQuestions(items: FocusItemDto[]): FocusQuestion[] {
  return items.map((item) => ({
    id: item.id,
    prompt: item.question,
    questionType: item.questionType,
    options: item.options.map((opt) => ({ value: opt, label: opt })),
    position: item.position,
    required: true,
  }));
}

function buildInitialResponses(
  items: FocusItemDto[],
): Record<string, string[]> {
  const responses: Record<string, string[]> = {};
  for (const item of items) {
    if (item.answer !== null) {
      responses[item.id] = [item.answer];
    } else if (item.questionType === 'single_select' && item.options[0]) {
      responses[item.id] = [item.options[0]];
    } else {
      responses[item.id] = [];
    }
  }
  return responses;
}

export function ProjectDetailsPage(): JSX.Element {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<ProjectContextProjectDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [focusResponses, setFocusResponses] = useState<
    Record<string, string[]>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadProject = useCallback(async (): Promise<void> => {
    if (!projectId) {
      setError('Missing project id.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}`);
      if (res.status === 404) {
        setError('Project not found.');
        setProject(null);
        return;
      }
      if (!res.ok) {
        throw new Error(`Failed to load project: ${res.status}`);
      }
      const data = (await res.json()) as {
        project: ProjectContextProjectDto;
      };
      setProject(data.project);
      if (data.project.focusForm) {
        setFocusResponses(buildInitialResponses(data.project.focusForm.items));
      }
    } catch {
      setError('Unable to load project details. Please try again.');
      setProject(null);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadProject();
  }, [loadProject]);

  const step = useMemo(() => deriveProjectStep(project), [project]);

  const focusQuestions = useMemo<FocusQuestion[]>(() => {
    if (!project?.focusForm) {
      return [];
    }
    return mapFocusItemsToQuestions(project.focusForm.items);
  }, [project]);

  const handleFocusSubmit = async (): Promise<void> => {
    if (!projectId || !project?.focusForm) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const responses: SubmitFocusResponseInput[] = project.focusForm.items.map(
      (item) => {
        const values = focusResponses[item.id] ?? [];
        return {
          focusItemId: item.id,
          answer:
            item.questionType === 'multi_select'
              ? JSON.stringify(values)
              : (values[0] ?? ''),
        };
      },
    );

    try {
      const res = await fetch(
        `${API_BASE}/projects/${projectId}/focus-responses`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ responses }),
        },
      );

      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || 'Failed to submit focus responses');
      }

      const data = (await res.json()) as {
        project: ProjectContextProjectDto;
      };
      setProject(data.project);
      if (data.project.focusForm) {
        setFocusResponses(buildInitialResponses(data.project.focusForm.items));
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Failed to submit responses. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles['home']}>
        <div className={styles['homeCard']}>
          <p className={styles['lead']}>Loading project…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles['home']}>
        <div className={styles['homeCard']}>
          <p className={styles['lead']}>{error}</p>
          <div className={styles['homeActions']}>
            <Link to="/" className={styles['primaryLink']}>
              Back to projects
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles['home']}>
      <div className={styles['homeCard']}>
        <p className={styles['eyebrow']}>Project detail</p>
        <h1 className={styles['homeTitle']}>
          {project ? project.title : `Project ${projectId ?? ''}`}
        </h1>

        {step === 'generating' && (
          <p className={styles['lead']}>Generating focus questions…</p>
        )}

        {step === 'focus_form' && focusQuestions.length > 0 && (
          <section className={styles['panel']}>
            <header className={styles['header']}>
              <p className={styles['eyebrow']}>Focus Questions</p>
              <h2 className={styles['title']}>Clarify your project</h2>
              <p className={styles['lead']}>
                Answer these to refine your plan.
              </p>
            </header>
            <FocusQuestionsForm
              questions={focusQuestions}
              responses={focusResponses}
              onChange={(questionId, values) =>
                setFocusResponses((prev) => ({
                  ...prev,
                  [questionId]: values,
                }))
              }
            />
            <button
              type="button"
              className={styles['submit']}
              disabled={submitting}
              onClick={() => void handleFocusSubmit()}
            >
              {submitting ? 'Submitting…' : 'Submit responses'}
            </button>
            {submitError && <p className={styles['status']}>{submitError}</p>}
          </section>
        )}

        {step === 'details' && project && (
          <>
            <p className={styles['lead']}>Status: {project.status}</p>
            {project.milestones.length > 0 && (
              <div className={styles['projectDetailsSection']}>
                <h2>Milestones</h2>
                <ul className={styles['detailList']}>
                  {project.milestones.map((milestone) => (
                    <li key={milestone.id}>
                      <strong>{milestone.title}</strong>
                      <div>{milestone.summary}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {project.milestones.length === 0 && (
              <p className={styles['lead']}>
                Focus responses submitted. Your project roadmap will be
                generated soon.
              </p>
            )}
          </>
        )}

        <div className={styles['homeActions']}>
          <Link to="/" className={styles['primaryLink']}>
            Back to projects
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ProjectDetailsPage;
