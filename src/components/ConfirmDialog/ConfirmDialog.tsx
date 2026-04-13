import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <div className={styles.dialog}>
        <p id="dialog-title" className={styles.title}>{title}</p>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <button className={styles.btnCancel} onClick={onCancel}>
            Cancelar
          </button>
          <button className={styles.btnConfirm} onClick={onConfirm}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
