/**
 * PreloadScreen — Music Trivia Game
 * Requisitos: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
 */

import { useEffect, useState } from 'react';
import type { TriviaSource, Question } from '../../types';
import { getArtistTracks, getPlaylistTracks } from '../../api/apiClient';
import { preloadAudio } from '../../audio/audioPlayer';
import { selectTracks } from '../../engine/randomizer';
import { buildQuestions } from '../../engine/gameEngine';
import { hasEnoughTracks, filterTracksWithPreview } from '../../utils/validators';
import styles from './PreloadScreen.module.css';

const MIN_TRACKS = 7;

interface PreloadScreenProps {
  source: TriviaSource;
  onReady: (questions: Question[]) => void;
  onError: () => void;
}

type LoadState = 'loading' | 'ready' | 'error';

function SourceImage({ imageUrl, name }: { imageUrl: string; name: string }) {
  const isUrl = imageUrl.startsWith('http');
  if (isUrl) {
    return <img src={imageUrl} alt={name} className={styles.sourceImage} />;
  }
  if (imageUrl) {
    return <span className={styles.sourceEmoji}>{imageUrl}</span>;
  }
  return null;
}

export function PreloadScreen({ source, onReady, onError }: PreloadScreenProps) {
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Cargando canciones...');
  const [errorMessage, setErrorMessage] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setStatusText('Cargando canciones...');

        // 1. Obtener tracks según el tipo de fuente
        let allTracks;
        if (source.type === 'artist') {
          allTracks = await getArtistTracks(source.id);
        } else {
          const result = await getPlaylistTracks(source.id);
          allTracks = result.tracks;
        }

        if (cancelled) return;

        // 2. Filtrar tracks con preview válido y verificar cantidad mínima
        const tracksWithPreview = filterTracksWithPreview(allTracks);
        if (!hasEnoughTracks(tracksWithPreview, MIN_TRACKS)) {
          setErrorMessage(
            `No hay suficientes canciones con vista previa disponible. Se necesitan al menos ${MIN_TRACKS} canciones.`
          );
          setLoadState('error');
          return;
        }

        // 3. Seleccionar aleatoriamente 7 tracks
        const selectedTracks = selectTracks(tracksWithPreview, MIN_TRACKS);

        // 4. Obtener todos los nombres para opciones incorrectas
        const allTrackNames = allTracks.map((t) => t.name);

        // 5. Construir preguntas
        const builtQuestions = buildQuestions(selectedTracks, allTrackNames);

        if (cancelled) return;

        // 6. Precargar audio con progreso
        setStatusText('Descargando audio...');
        await preloadAudio(builtQuestions, (loaded, total) => {
          if (!cancelled) {
            const pct = Math.round((loaded / total) * 100);
            setProgress(pct);
          }
        });

        if (cancelled) return;

        setQuestions(builtQuestions);
        setProgress(100);
        setStatusText('¡Listo para jugar!');
        setLoadState('ready');
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Error desconocido';
        setErrorMessage(`Error de red al cargar los recursos: ${msg}`);
        setLoadState('error');
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [source]);

  function handlePlay() {
    onReady(questions);
  }

  if (loadState === 'error') {
    return (
      <div className={styles.container}>
        <div className={styles.sourceInfo}>
          <SourceImage imageUrl={source.imageUrl} name={source.name} />
          <h2 className={styles.sourceName}>{source.name}</h2>
        </div>
        <p className={styles.errorMessage}>{errorMessage}</p>
        <button className={styles.backButton} onClick={onError}>
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.sourceInfo}>
        <SourceImage imageUrl={source.imageUrl} name={source.name} />
        <h2 className={styles.sourceName}>{source.name}</h2>
      </div>

      <div className={styles.progressSection}>
        <div className={styles.progressBar} role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
        <span className={styles.progressLabel}>{progress}%</span>
      </div>

      <p className={styles.statusText}>{statusText}</p>

      <button
        className={styles.playButton}
        onClick={handlePlay}
        disabled={loadState !== 'ready'}
      >
        ¡Jugar!
      </button>
    </div>
  );
}
