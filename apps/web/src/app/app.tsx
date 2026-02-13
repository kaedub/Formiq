import { type JSX, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useParams } from 'react-router-dom';
import styles from './app.module.css';
import type {
  IntakeQuestionDto,
  ProjectDto,
  ProjectSummaryDto,
  QuestionResponseInput,
} from '@formiq/shared';

const API_BASE = 'http://localhost:3001';
const INTAKE_FORM_NAME = 'goal_intake_v1';

type AnswerState = Record<string, string | string[]>;

function HomePage(): JSX.Element {
  const [projects, setProjects] = useState<ProjectSummaryDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/projects`);
      if (!res.ok) {
        throw new Error(`Failed to load projects: ${res.status}`);
      }
      const data = (await res.json()) as { projects: ProjectSummaryDto[] };
      setProjects(data.projects);
    } catch (err) {
      console.warn('Could not load projects', err);
      setProjects([]);
      setError('Unable to load projects right now. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  return (
    <div className={styles['home']}>
      <div className={styles['homeCard']}>
        <p className={styles['eyebrow']}>Project hub</p>
        <h1 className={styles['homeTitle']}>Your projects</h1>
        <p className={styles['lead']}>
          Start a new project to capture a goal and its context. Your saved work
          will appear here.
        </p>
        <div className={styles['homeActions']}>
          <Link to="/intake" className={styles['primaryLink']}>
            Start New Project
          </Link>
        </div>
        <div className={styles['projectList']}>
          {loading ? (
            <div className={styles['homePlaceholder']}>
              <p>Loading projects…</p>
            </div>
          ) : error ? (
            <div className={styles['homePlaceholder']}>
              <p>{error}</p>
            </div>
          ) : projects.length === 0 ? (
            <div className={styles['homePlaceholder']}>
              <p>No projects yet. Create one to see it here.</p>
            </div>
          ) : (
            projects.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className={styles['projectCardLink']}
              >
                <article className={styles['projectCard']}>
                  <div className={styles['projectCardTop']}>
                    <p className={styles['projectStatus']}>
                      {project.status ?? 'unknown'}
                    </p>
                    <span className={styles['projectBadge']}>Project</span>
                  </div>
                  <h2 className={styles['projectTitleHome']}>
                    {project.title}
                  </h2>
                </article>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function IntakePage(): JSX.Element {
  const [questions, setQuestions] = useState<IntakeQuestionDto[]>([]);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [project, setProject] = useState<ProjectDto | null>(null);

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const res = await fetch(`${API_BASE}/intake-forms/${INTAKE_FORM_NAME}`);
        if (!res.ok) throw new Error('Failed to load questions');
        const data = (await res.json()) as {
          form: { questions: IntakeQuestionDto[] };
        };
        setQuestions(data.form.questions);
      } catch (error) {
        console.warn('Falling back to static questions', error);
        setStatus('Using fallback questions; API not reachable yet.');
      }
    };

    void loadQuestions();
  }, []);

  const responsePayload: QuestionResponseInput[] = useMemo(() => {
    return questions.map((question) => {
      const value = answers[question.id];
      if (question.questionType === 'multi_select') {
        const list = Array.isArray(value) ? (value as string[]) : [];
        return {
          questionId: question.id,
          values: list.filter((value): value is string => Boolean(value)),
        };
      }

      return {
        questionId: question.id,
        values: value ? [value as string] : [''],
      };
    });
  }, [answers, questions]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setStatus(null);
    setProject(null);

    if (!title.trim()) {
      setStatus('Goal title is required.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          responses: responsePayload,
        }),
      });

      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || 'Failed to save project');
      }

      const saved = (await res.json()) as ProjectDto;
      setProject(saved);
      setStatus('Saved project and answers.');
      setAnswers({});
      setTitle('');
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : 'Failed to save project; check API connection.',
      );
    } finally {
      setLoading(false);
    }
  };

  const updateAnswer = (questionId: string, value: string | string[]): void => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  return (
    <main className={styles['page']}>
      <section className={styles['panel']}>
        <header className={styles['header']}>
          <p className={styles['eyebrow']}>Goal intake</p>
          <h1 className={styles['title']}>Capture a goal and the context</h1>
          <p className={styles['lead']}>
            Share what you want to achieve and answer a few prompts. We&apos;ll
            save it and draft a roadmap next.
          </p>
        </header>

        <form className={styles['form']} onSubmit={submit}>
          <label className={styles['field']}>
            <span>Goal title</span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Launch an AI guide for user goals"
              required
            />
          </label>

          <div className={styles['questions']}>
            {questions.map((question) => (
              <div key={question.id} className={styles['questionCard']}>
                <p className={styles['questionText']}>{question.prompt}</p>
                {question.questionType === 'multi_select' ? (
                  <div className={styles['options']}>
                    {question.options.map((option) => {
                      const selected = Array.isArray(answers[question.id])
                        ? (answers[question.id] as string[]).includes(option)
                        : false;
                      return (
                        <label key={option} className={styles['option']}>
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={(event) => {
                              const current = Array.isArray(
                                answers[question.id],
                              )
                                ? (answers[question.id] as string[])
                                : [];
                              const next = event.target.checked
                                ? [...current, option]
                                : current.filter((item) => item !== option);
                              updateAnswer(question.id, next);
                            }}
                          />
                          {option}
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <textarea
                    value={answers[question.id] as string}
                    onChange={(event) =>
                      updateAnswer(question.id, event.target.value)
                    }
                    placeholder="Type your answer"
                    rows={3}
                  />
                )}
              </div>
            ))}
          </div>

          <button type="submit" className={styles['submit']} disabled={loading}>
            {loading ? 'Saving…' : 'Save goal and answers'}
          </button>
          {status && <p className={styles['status']}>{status}</p>}
        </form>
      </section>

      {project && (
        <section className={styles['result']}>
          <h2>Saved project</h2>
          <p className={styles['projectTitle']}>{project.title}</p>
          <p className={styles['projectMeta']}>
            Status: {project.status} · Responses captured:{' '}
            {project.responses.length}
          </p>
          <ul className={styles['detailList']}>
            {project.responses.map((response) => (
              <li key={response.answer.questionId}>
                <strong>{response.question.prompt}</strong>
                <div>
                  {response.answer.values.length > 0
                    ? response.answer.values.join(', ')
                    : 'No answer yet'}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

function StoryDetailsPage(): JSX.Element {
  const { projectId } = useParams<{ projectId: string }>();
  return (
    <div className={styles['home']}>
      <div className={styles['homeCard']}>
        <p className={styles['eyebrow']}>Project detail</p>
        <h1 className={styles['homeTitle']}>Project {projectId}</h1>
        <p className={styles['lead']}>
          Detailed view coming soon. Use the intake form to add more stories.
        </p>
        <div className={styles['homeActions']}>
          <Link to="/" className={styles['primaryLink']}>
            Back to projects
          </Link>
        </div>
      </div>
    </div>
  );
}

export function App(): JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/intake" element={<IntakePage />} />
      <Route path="/projects/:projectId" element={<StoryDetailsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
