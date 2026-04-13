import { useState } from 'react';
import type { TriviaSource } from '../../types';
import { SearchBar } from '../SearchBar/SearchBar';
import { PlaylistSelector } from '../PlaylistSelector/PlaylistSelector';
import { ConfirmDialog } from '../ConfirmDialog/ConfirmDialog';
import styles from './SourceSelection.module.css';

interface SourceSelectionProps {
  onSourceSelected: (source: TriviaSource) => void;
  insufficientTracks?: boolean;
}

export function SourceSelection({ onSourceSelected, insufficientTracks = false }: SourceSelectionProps) {
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
      <h1 className={styles.heading}>Music Trivia</h1>
      <p className={styles.subtitle}>Elige un artista o playlist para comenzar</p>

      {insufficientTracks && (
        <p className={styles.warning}>
          ⚠️ La fuente seleccionada tiene menos de 7 canciones con preview disponible. Elige otra.
        </p>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Buscar artista</h2>
        <SearchBar onSelectArtist={handleSourcePicked} />
      </section>

      <div className={styles.divider}>
        <span>o</span>
      </div>

      <section className={styles.section}>
        <PlaylistSelector onSelectPlaylist={handleSourcePicked} />
      </section>

      <ConfirmDialog
        isOpen={pendingSource !== null}
        title="Confirmar selección"
        message={`¿Jugar con "${pendingSource?.name ?? ''}"?`}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      <footer className={styles.footer}>
        Made by Miguel Fernando w/ Kiro 🤖
      </footer>
    </div>
  );
}
