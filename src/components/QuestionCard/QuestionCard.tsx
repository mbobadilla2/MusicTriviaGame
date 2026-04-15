import type { Question } from '../../types';
import styles from './QuestionCard.module.css';

export type FeedbackState = 'none' | 'correct' | 'wrong' | 'timeout';

interface QuestionCardProps {
  question: Question;
  onAnswer: (selectedIndex: number) => void;
  feedbackState: FeedbackState;
  selectedIndex: number | null;
  disabled: boolean;
  timeoutLabel: string;
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
  timeoutLabel,
}: QuestionCardProps) {
  return (
    <div className={styles.card}>
      {feedbackState === 'timeout' && (
        <div className={styles.timeoutBanner}>
          <span className={styles.timeoutText}>{timeoutLabel}</span>
        </div>
      )}
      <div className={styles.options}>
        {question.options.map((optionName, index) => {
          const albumImg = question.optionTracks?.[index]?.albumImageUrl;
          return (
            <button
              key={index}
              className={getOptionClass(index, feedbackState, selectedIndex, question.correctIndex)}
              onClick={(e) => {
                if (!disabled) {
                  (e.currentTarget as HTMLButtonElement).blur();
                  onAnswer(index);
                }
              }}
              disabled={disabled}
              tabIndex={disabled ? -1 : 0}
              aria-pressed={selectedIndex === index}
            >
              {albumImg ? (
                <img
                  src={albumImg}
                  alt=""
                  className={styles.albumThumb}
                  draggable={false}
                />
              ) : (
                <span className={styles.optionLabel}>🎵</span>
              )}
              <span className={styles.optionText}>{optionName}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
