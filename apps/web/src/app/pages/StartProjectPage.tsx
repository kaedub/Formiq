import { useEffect, useMemo, useState, type JSX } from 'react';
import type {
  FocusQuestionsDefinition,
  FormDefinition,
  FormOption,
  ProjectCommitment,
  ProjectFamiliarity,
  ProjectWorkStyle,
} from '@formiq/shared';
import { IntakeForm } from '../components/IntakeForm';
import {
  type FocusQuestion,
  FocusQuestionsForm,
} from '../components/FocusQuestionsForm';
import { SubmittedGoal } from '../components/SubmittedGoal';
import styles from '../app.module.css';
import { API_BASE } from '../config';

export function StartProjectPage(): JSX.Element {
  const [goal, setGoal] = useState('');
  const [commitment, setCommitment] = useState<ProjectCommitment | ''>('');
  const [familiarity, setFamiliarity] = useState<ProjectFamiliarity | ''>('');
  const [workStyle, setWorkStyle] = useState<ProjectWorkStyle | ''>('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [submittedGoal, setSubmittedGoal] = useState<string | null>(null);
  const [intakeForm, setIntakeForm] = useState<FormDefinition | null>(null);
  const [focusQuestions, setFocusQuestions] =
    useState<FocusQuestionsDefinition | null>(null);
  const [focusResponses, setFocusResponses] = useState<
    Record<string, string[]>
  >({});
  const [fetchError, setFetchError] = useState<string | null>(null);

  const isReadyToSubmit = useMemo(
    () =>
      Boolean(
        goal.trim() &&
        commitment &&
        familiarity &&
        workStyle &&
        intakeForm?.questions.length,
      ),
    [goal, commitment, familiarity, workStyle, intakeForm],
  );

  useEffect(() => {
    const loadQuestions = async (): Promise<void> => {
      setFetchError(null);
      try {
        const res = await fetch(`${API_BASE}/project-intake/questions`);
        if (!res.ok) {
          throw new Error(`Failed to load intake questions: ${res.status}`);
        }
        const data = (await res.json()) as { form: FormDefinition };
        setIntakeForm(data.form);

        const commitmentQuestion = data.form.questions.find(
          (question) => question.id === 'time_commitment',
        );
        const familiarityQuestion = data.form.questions.find(
          (question) => question.id === 'familiarity',
        );
        const workStyleQuestion = data.form.questions.find(
          (question) => question.id === 'work_style',
        );

        setCommitment(
          (commitmentQuestion?.options[0]?.value as
            | ProjectCommitment
            | undefined) ?? '',
        );
        setFamiliarity(
          (familiarityQuestion?.options[0]?.value as
            | ProjectFamiliarity
            | undefined) ?? '',
        );
        setWorkStyle(
          (workStyleQuestion?.options[0]?.value as
            | ProjectWorkStyle
            | undefined) ?? '',
        );
      } catch (error) {
        setFetchError(
          error instanceof Error
            ? error.message
            : 'Unable to load intake questions.',
        );
        setIntakeForm(null);
      }
    };

    void loadQuestions();
  }, []);

  const normalizedFocusQuestions = useMemo<FocusQuestion[] | null>(() => {
    if (!focusQuestions) {
      return null;
    }

    return focusQuestions.questions.map((question) => {
      const options = (question.options as Array<FormOption | string>).map(
        (option) =>
          typeof option === 'string'
            ? { value: option, label: option }
            : option,
      );

      return {
        id: question.id,
        prompt: question.prompt,
        questionType: question.questionType,
        options,
        position: question.position,
        required: question.required,
      };
    });
  }, [focusQuestions]);

  useEffect(() => {
    if (!normalizedFocusQuestions) {
      setFocusResponses({});
      return;
    }

    const initialResponses: Record<string, string[]> = {};
    normalizedFocusQuestions.forEach((question) => {
      if (
        question.questionType === 'single_select' &&
        question.options.length > 0
      ) {
        initialResponses[question.id] = [question.options[0].value];
        return;
      }
      initialResponses[question.id] = [];
    });
    setFocusResponses(initialResponses);
  }, [normalizedFocusQuestions]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setStatus(null);
    setSubmittedGoal(null);
    setFocusQuestions(null);

    const trimmed = goal.trim();
    if (!trimmed) {
      setStatus('Please enter your goal.');
      setLoading(false);
      return;
    }
    if (!commitment || !familiarity || !workStyle) {
      setStatus('Please answer all intake questions.');
      setLoading(false);
      return;
    }

    try {
      setStatus('Building your context…');
      const res = await fetch(`${API_BASE}/projects/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: trimmed,
          commitment,
          familiarity,
          workStyle,
        }),
      });

      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || 'Failed to start project');
      }

      setSubmittedGoal(trimmed);
      setGoal('');
      const payload = (await res.json()) as {
        focusQuestions: FocusQuestionsDefinition;
      };
      setFocusQuestions(payload.focusQuestions);
      setStatus('Focus questions are ready below.');
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : 'Failed to start project; check API connection.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles['page']}>
      <section className={styles['panel']}>
        <header className={styles['header']}>
          <p className={styles['eyebrow']}>New project</p>
          <h1 className={styles['title']}>Project intake</h1>
          <p className={styles['lead']}>
            Answer these to shape your plan. We&apos;ll build focus questions
            next.
          </p>
        </header>
        <IntakeForm
          intakeForm={intakeForm}
          goal={goal}
          commitment={commitment}
          familiarity={familiarity}
          workStyle={workStyle}
          loading={loading}
          isReadyToSubmit={isReadyToSubmit}
          status={status}
          fetchError={fetchError}
          onGoalChange={setGoal}
          onCommitmentChange={setCommitment}
          onFamiliarityChange={setFamiliarity}
          onWorkStyleChange={setWorkStyle}
          onSubmit={submit}
        />
      </section>

      {submittedGoal && <SubmittedGoal goal={submittedGoal} />}

      {normalizedFocusQuestions && (
        <section className={styles['panel']}>
          <header className={styles['header']}>
            <p className={styles['eyebrow']}>Focus Questions</p>
            <h2 className={styles['title']}>Clarify your project</h2>
            <p className={styles['lead']}>
              Answer these next to refine your plan.
            </p>
          </header>
          <FocusQuestionsForm
            questions={normalizedFocusQuestions}
            responses={focusResponses}
            onChange={(questionId, values) =>
              setFocusResponses((prev) => ({ ...prev, [questionId]: values }))
            }
          />
        </section>
      )}
    </main>
  );
}

export default StartProjectPage;
