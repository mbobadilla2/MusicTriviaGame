import type { TriviaSource } from '../../types';
import styles from './PlaylistSelector.module.css';

interface PlaylistItem {
  id: string;
  name: string;
  imageUrl: string;
}

const PRESET_PLAYLISTS: PlaylistItem[] = [
  { id: '3155776842', name: 'Top Worldwide', imageUrl: '🌍' },
  { id: '1306931615', name: 'Rock Essentials', imageUrl: '🎸' },
  { id: '1677006641', name: 'Hip Hop Hits', imageUrl: '🎤' },
  { id: '1964085082', name: 'Feel Good Pop', imageUrl: '🎵' },
  { id: '867825522',  name: '80s Hits', imageUrl: '🕺' },
  { id: '878989033',  name: '90s Hits', imageUrl: '🎉' },
  { id: '789123393',  name: 'Reggaeton Classics', imageUrl: '🔥' },
  { id: '1615514485', name: 'Jazz Essentials', imageUrl: '🎷' },
  { id: '1902101402', name: 'Electronic Hits', imageUrl: '⚡' },
  { id: '5104249748', name: 'Latin Classics', imageUrl: '🌶️' },
];

import type { Translations } from '../../i18n/translations';

interface PlaylistSelectorProps {
  onSelectPlaylist: (source: TriviaSource) => void;
  t: Translations;
}

export function PlaylistSelector({ onSelectPlaylist, t }: PlaylistSelectorProps) {
  function handleSelect(playlist: PlaylistItem) {
    const source: TriviaSource = {
      type: 'playlist',
      id: playlist.id,
      name: playlist.name,
      imageUrl: playlist.imageUrl,
    };
    onSelectPlaylist(source);
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>{t.popularPlaylists}</h3>
      <ul className={styles.list}>
        {PRESET_PLAYLISTS.map((playlist) => (
          <li key={playlist.id}>
            <button
              className={styles.card}
              onClick={() => handleSelect(playlist)}
              aria-label={`Seleccionar playlist ${playlist.name}`}
            >
              <span className={styles.icon}>{playlist.imageUrl}</span>
              <span className={styles.name}>{playlist.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
