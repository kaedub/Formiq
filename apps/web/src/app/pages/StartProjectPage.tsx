import { useMemo, useState, type JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import type {
  ProjectCommitment,
  ProjectDto,
  ProjectFamiliarity,
  ProjectWorkStyle,
} from '@formiq/shared';
import { PROJECT_INTAKE_FORM } from '@formiq/shared';
import { IntakeForm } from '../components/IntakeForm';
import styles from '../app.module.css';
import { API_BASE } from '../config';

const intakeForm = PROJECT_INTAKE_FORM;

const defaultCommitment =
  (intakeForm.questions.find((q) => q.id === 'time_commitment')?.options[0]
    ?.value as ProjectCommitment | undefined) ?? '';

const defaultFamiliarity =
  (intakeForm.questions.find((q) => q.id === 'familiarity')?.options[0]
    ?.value as ProjectFamiliarity | undefined) ?? '';

const defaultWorkStyle =
  (intakeForm.questions.find((q) => q.id === 'work_style')?.options[0]
    ?.value as ProjectWorkStyle | undefined) ?? '';

export function StartProjectPage(): JSX.Element {
  const navigate = useNavigate();
  const [goal, setGoal] = useState('');
  const [commitment, setCommitment] = useState<ProjectCommitment | ''>(
    defaultCommitment,
  );
  const [familiarity, setFamiliarity] = useState<ProjectFamiliarity | ''>(
    defaultFamiliarity,
  );
  const [workStyle, setWorkStyle] = useState<ProjectWorkStyle | ''>(
    defaultWorkStyle,
  );
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const isReadyToSubmit = useMemo(
    () =>
      Boolean(
        goal.trim() &&
        commitment &&
        familiarity &&
        workStyle &&
        intakeForm.questions.length,
      ),
    [goal, commitment, familiarity, workStyle],
  );

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setStatus(null);

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
      const res = await fetch(`${API_BASE}/projects`, {
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

      const payload = (await res.json()) as { project: ProjectDto };
      navigate(`/projects/${payload.project.id}`);
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
          fetchError={null}
          onGoalChange={setGoal}
          onCommitmentChange={setCommitment}
          onFamiliarityChange={setFamiliarity}
          onWorkStyleChange={setWorkStyle}
          onSubmit={submit}
        />
      </section>
    </main>
  );
}

export default StartProjectPage;
