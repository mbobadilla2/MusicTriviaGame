import type { TriviaSource } from '../../types';
import styles from './PlaylistSelector.module.css';
import type { Translations } from '../../i18n/translations';

interface PlaylistItem {
  id: string;
  name: string;
  emoji: string;
}

const PRESET_PLAYLISTS: PlaylistItem[] = [
  { id: '3155776842', name: 'Top Worldwide',      emoji: '🌍' },
  { id: '1306931615', name: 'Rock Essentials',    emoji: '🎸' },
  { id: '1677006641', name: 'Hip Hop Hits',       emoji: '🎤' },
  { id: '1964085082', name: 'Feel Good Pop',      emoji: '🎵' },
  { id: '867825522',  name: '80s Hits',           emoji: '🕺' },
  { id: '878989033',  name: '90s Hits',           emoji: '🎉' },
  { id: '789123393',  name: 'Reggaeton Classics', emoji: '🔥' },
  { id: '1615514485', name: 'Jazz Essentials',    emoji: '🎷' },
  { id: '1902101402', name: 'Electronic Hits',    emoji: '⚡' },
  { id: '5104249748', name: 'Latin Classics',     emoji: '🌶️' },
];

interface PlaylistSelectorProps {
  onSelectPlaylist: (source: TriviaSource) => void;
  t: Translations;
  playlistImages: Record<string, string>;
}

export function PlaylistSelector({ onSelectPlaylist, t, playlistImages }: PlaylistSelectorProps) {
  function handleSelect(playlist: PlaylistItem) {
    const source: TriviaSource = {
      type: 'playlist',
      id: playlist.id,
      name: playlist.name,
      imageUrl: playlistImages[playlist.id] ?? playlist.emoji,
    };
    onSelectPlaylist(source);
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>{t.popularPlaylists}</h3>
      <ul className={styles.list}>
        {PRESET_PLAYLISTS.map((playlist) => {
          const img = playlistImages[playlist.id];
          return (
            <li key={playlist.id}>
              <button
                className={styles.card}
                onClick={() => handleSelect(playlist)}
                aria-label={`Seleccionar playlist ${playlist.name}`}
              >
                {img ? (
                  <img
                    src={img}
                    alt={playlist.name}
                    className={styles.image}
                    draggable={false}
                  />
                ) : (
                  <span className={styles.icon}>{playlist.emoji}</span>
                )}
                <span className={styles.name}>{playlist.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
