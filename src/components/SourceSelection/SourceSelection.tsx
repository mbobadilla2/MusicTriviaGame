import { useState } from 'react';
import type { TriviaSource } from '../../types';
import type { Translations } from '../../i18n/translations';
import { SearchBar } from '../SearchBar/SearchBar';
import { PlaylistSelector } from '../PlaylistSelector/PlaylistSelector';
import { ConfirmDialog } from '../ConfirmDialog/ConfirmDialog';
import styles from './SourceSelection.module.css';

interface SourceSelectionProps {
  onSourceSelected: (source: TriviaSource) => void;
  insufficientTracks?: boolean;
  t: Translations;
}

export function SourceSelection({ onSourceSelected, insufficientTracks = false, t }: SourceSelectionProps) {
  const [pendingSource, setPendingSource] = useState<TriviaSource | null>(null);

  function handleSourcePicked(source: TriviaSource) {
    setPendingSource(source);
  }

  function handleConfirm() {
    if (pendingSource) {
      onSourceSelected(pendingSource);
      setPendingSource(null);
    }
  }

  function handleCancel() {
    setPendingSource(null);
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>{t.appTitle}</h1>
      <p className={styles.subtitle}>{t.appSubtitle}</p>

      {insufficientTracks && (
        <p className={styles.warning}>⚠️ {t.insufficientTracks}</p>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t.searchArtist}</h2>
        <SearchBar onSelectArtist={handleSourcePicked} t={t} />
      </section>

      <div className={styles.divider}>
        <span>o</span>
      </div>

      <section className={styles.section}>
        <PlaylistSelector onSelectPlaylist={handleSourcePicked} t={t} />
      </section>

      <ConfirmDialog
        isOpen={pendingSource !== null}
        title={t.confirmTitle}
        message={`${t.confirmMessage} "${pendingSource?.name ?? ''}"?`}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      <footer className={styles.footer}>
        <span>{t.madeBy}</span>
        <span className={styles.poweredBy}>{t.poweredBy}</span>
      </footer>
    </div>
  );
}
