import type { JSX } from 'react';
import styles from '../app.module.css';

export interface FocusQuestionOption {
  value: string;
  label: string;
}

export interface FocusQuestion {
  id: string;
  prompt: string;
  questionType: 'free_text' | 'single_select' | 'multi_select';
  options: FocusQuestionOption[];
  position: number;
  required: boolean;
}

interface FocusQuestionsFormProps {
  questions: FocusQuestion[];
  responses: Record<string, string[]>;
  onChange(this: void, questionId: string, values: string[]): void;
}

export const FocusQuestionsForm = ({
  questions,
  responses,
  onChange,
}: FocusQuestionsFormProps): JSX.Element => {
  return (
    <form
      className={styles['form']}
      onSubmit={(event) => event.preventDefault()}
    >
      <ol className={styles['questions']}>
        {questions.map((question) => {
          const currentResponse = responses[question.id];
          const textValue =
            currentResponse && currentResponse.length > 0
              ? currentResponse[0]
              : '';

          return (
            <li key={question.id} className={styles['questionCard']}>
              <p className={styles['questionText']}>{question.prompt}</p>
              {question.questionType === 'free_text' && (
                <textarea
                  rows={3}
                  value={textValue}
                  onChange={(event) =>
                    onChange(question.id, [event.target.value])
                  }
                  placeholder="Share a quick note or clarifying detail"
                  required={question.required}
                />
              )}
              {question.questionType === 'single_select' && (
                <div className={styles['options']}>
                  {question.options.map((option) => (
                    <label key={option.value} className={styles['option']}>
                      <input
                        type="radio"
                        name={question.id}
                        value={option.value}
                        checked={
                          Array.isArray(currentResponse) &&
                          currentResponse[0] === option.value
                        }
                        onChange={(event) =>
                          onChange(question.id, [event.target.value])
                        }
                        required={question.required}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              )}
              {question.questionType === 'multi_select' && (
                <div className={styles['options']}>
                  {question.options.map((option) => {
                    const isSelected =
                      Array.isArray(currentResponse) &&
                      currentResponse.includes(option.value);
                    return (
                      <label key={option.value} className={styles['option']}>
                        <input
                          type="checkbox"
                          value={option.value}
                          checked={isSelected}
                          onChange={() => {
                            const nextValues = isSelected
                              ? currentResponse.filter(
                                  (value) => value !== option.value,
                                )
                              : [...(currentResponse ?? []), option.value];
                            onChange(question.id, nextValues);
                          }}
                        />
                        <span>{option.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </form>
  );
};

export default FocusQuestionsForm;
