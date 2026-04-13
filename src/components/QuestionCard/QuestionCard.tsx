import type { Question } from '../../types';
import styles from './QuestionCard.module.css';

export type FeedbackState = 'none' | 'correct' | 'wrong' | 'timeout';

interface QuestionCardProps {
  question: Question;
  onAnswer: (selectedIndex: number) => void;
  feedbackState: FeedbackState;
  selectedIndex: number | null;
  disabled: boolean;
}

function getOptionClass(
  index: number,
  feedbackState: FeedbackState,
  selectedIndex: number | null,
  correctIndex: number,
): string {
  const base = styles.option;

  if (feedbackState === 'none') return base;

  if (feedbackState === 'correct') {
    if (index === selectedIndex) return `${base} ${styles.optionCorrect} ${styles.bounce}`;
    return base;
  }

  if (feedbackState === 'wrong') {
    if (index === selectedIndex) return `${base} ${styles.optionWrong} ${styles.shake}`;
    if (index === correctIndex) return `${base} ${styles.optionCorrect}`;
    return base;
  }

  if (feedbackState === 'timeout') {
    if (index === correctIndex) return `${base} ${styles.optionCorrect}`;
    return base;
  }

  return base;
}

export function QuestionCard({
  question,
  onAnswer,
  feedbackState,
  selectedIndex,
  disabled,
}: QuestionCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.options}>
        {question.options.map((optionName, index) => (
          <button
            key={index}
            className={getOptionClass(index, feedbackState, selectedIndex, question.correctIndex)}
            onClick={() => {
              if (!disabled) onAnswer(index);
            }}
            disabled={disabled}
            aria-pressed={selectedIndex === index}
          >
            <span className={styles.optionLabel}>{String.fromCharCode(65 + index)}</span>
            <span className={styles.optionText}>{optionName}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
