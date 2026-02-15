import type { JSX } from 'react';
import type {
  FormDefinition,
  ProjectCommitment,
  ProjectFamiliarity,
  ProjectWorkStyle,
} from '@formiq/shared';
import styles from '../app.module.css';

interface IntakeFormProps {
  intakeForm: FormDefinition | null;
  goal: string;
  commitment: ProjectCommitment | '';
  familiarity: ProjectFamiliarity | '';
  workStyle: ProjectWorkStyle | '';
  loading: boolean;
  isReadyToSubmit: boolean;
  status: string | null;
  fetchError: string | null;
  onGoalChange(this: void, value: string): void;
  onCommitmentChange(this: void, value: ProjectCommitment): void;
  onFamiliarityChange(this: void, value: ProjectFamiliarity): void;
  onWorkStyleChange(this: void, value: ProjectWorkStyle): void;
  onSubmit(this: void, event: React.FormEvent<HTMLFormElement>): void;
}

export const IntakeForm = ({
  intakeForm,
  goal,
  commitment,
  familiarity,
  workStyle,
  loading,
  isReadyToSubmit,
  status,
  fetchError,
  onGoalChange,
  onCommitmentChange,
  onFamiliarityChange,
  onWorkStyleChange,
  onSubmit,
}: IntakeFormProps): JSX.Element => {
  if (fetchError) {
    return <p className={styles['status']}>{fetchError}</p>;
  }

  return (
    <form className={styles['form']} onSubmit={onSubmit}>
      <label className={styles['field']}>
        <span>Goal</span>
        <input
          type="text"
          value={goal}
          onChange={(event) => onGoalChange(event.target.value)}
          placeholder="Ship a roadmap generator MVP"
          required
        />
      </label>

      <label className={styles['field']}>
        <span>Time commitment</span>
        <select
          value={commitment}
          onChange={(event) =>
            onCommitmentChange(event.target.value as ProjectCommitment)
          }
          required
        >
          {intakeForm?.questions
            .find((q) => q.id === 'time_commitment')
            ?.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
        </select>
      </label>

      <label className={styles['field']}>
        <span>Familiarity</span>
        <select
          value={familiarity}
          onChange={(event) =>
            onFamiliarityChange(event.target.value as ProjectFamiliarity)
          }
          required
        >
          {intakeForm?.questions
            .find((q) => q.id === 'familiarity')
            ?.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
        </select>
      </label>

      <label className={styles['field']}>
        <span>Work style</span>
        <select
          value={workStyle}
          onChange={(event) =>
            onWorkStyleChange(event.target.value as ProjectWorkStyle)
          }
          required
        >
          {intakeForm?.questions
            .find((q) => q.id === 'work_style')
            ?.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
        </select>
      </label>

      <button
        type="submit"
        className={styles['submit']}
        disabled={loading || !isReadyToSubmit}
      >
        {loading ? 'Building your context…' : 'Start project'}
      </button>
      {status && <p className={styles['status']}>{status}</p>}
    </form>
  );
};

export default IntakeForm;
