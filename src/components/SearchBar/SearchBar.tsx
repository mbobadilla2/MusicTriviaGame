import { useState, useEffect, useRef } from 'react';
import type { TriviaSource } from '../../types';
import { searchArtists } from '../../api/apiClient';
import type { ArtistResult } from '../../api/apiClient';
import styles from './SearchBar.module.css';

import type { Translations } from '../../i18n/translations';

interface SearchBarProps {
  onSelectArtist: (source: TriviaSource) => void;
  t: Translations;
}

export function SearchBar({ onSelectArtist, t }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ArtistResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const artists = await searchArtists(query);
        setResults(artists.slice(0, 8));
      } catch {
        setError(t.searchError);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function handleSelect(artist: ArtistResult) {
    const source: TriviaSource = {
      type: 'artist',
      id: artist.id,
      name: artist.name,
      imageUrl: artist.imageUrl,
    };
    onSelectArtist(source);
  }

  return (
    <div className={styles.container}>
      <input
        className={styles.input}
        type="text"
        placeholder={t.searchPlaceholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label={t.searchPlaceholder}
      />
      {isLoading && <p className={styles.loading}>{t.searching}</p>}
      {error && <p className={styles.error}>{error}</p>}
      {results.length > 0 && (
        <ul className={styles.list} role="listbox" aria-label="Resultados de búsqueda">
          {results.map((artist) => (
            <li key={artist.id} className={styles.item} role="option" aria-selected={false}>
              <button className={styles.itemButton} onClick={() => handleSelect(artist)}>
                {artist.imageUrl ? (
                  <img
                    className={styles.avatar}
                    src={artist.imageUrl}
                    alt={artist.name}
                    width={40}
                    height={40}
                  />
                ) : (
                  <span className={styles.avatarPlaceholder}>🎵</span>
                )}
                <span className={styles.artistName}>{artist.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
