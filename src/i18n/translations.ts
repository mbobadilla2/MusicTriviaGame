export type Language = 'es' | 'en';

export const translations = {
  es: {
    // Source selection
    appTitle: 'Music Trivia',
    appSubtitle: 'Elige un artista o playlist para comenzar',
    searchArtist: 'Buscar artista',
    searchPlaceholder: 'Buscar artista...',
    searchError: 'No se pudo realizar la búsqueda. Intenta de nuevo.',
    searching: 'Buscando...',
    popularPlaylists: 'Playlists populares',
    confirmTitle: 'Confirmar selección',
    confirmMessage: '¿Jugar con',
    insufficientTracks: 'La fuente seleccionada tiene menos de 7 canciones con preview disponible. Elige otra.',
    // Preload
    loadingSongs: 'Cargando canciones...',
    downloadingAudio: 'Descargando audio...',
    readyToPlay: '¡Listo para jugar!',
    play: '¡Jugar!',
    back: 'Volver',
    noPreviewError: 'No hay suficientes canciones con vista previa disponible. Se necesitan al menos 7 canciones.',
    networkError: 'Error de red al cargar los recursos',
    // Game
    question: 'Pregunta',
    of: '/',
    next: 'Siguiente →',
    // Results
    results: 'Resultados',
    points: 'puntos',
    correct: 'correctas',
    timeout: '⏱ Tiempo agotado',
    playAgain: 'Jugar de nuevo',
    backToHome: 'Volver al inicio',
    // Leaderboard
    leaderboardTitle: '🏆 Puntuaciones',
    noScores: 'Aún no hay puntuaciones registradas',
    close: 'Cerrar',
    deleteScores: 'Borrar',
    deleteConfirmTitle: 'Borrar puntuaciones',
    deleteConfirmMessage: '¿Seguro que quieres borrar todas las puntuaciones? Esta acción no se puede deshacer.',
    confirm: 'Confirmar',
    cancel: 'Cancelar',
    // Settings menu
    settings: 'Ajustes',
    darkMode: 'Modo oscuro',
    language: 'Idioma',
    resetScores: 'Reiniciar puntuaciones',
    // Streak
    streak: 'Racha',
    // Footer
    madeBy: 'Made by Miguel Fernando w/ Kiro 🤖',
  },
  en: {
    // Source selection
    appTitle: 'Music Trivia',
    appSubtitle: 'Choose an artist or playlist to start',
    searchArtist: 'Search artist',
    searchPlaceholder: 'Search artist...',
    searchError: 'Search failed. Please try again.',
    searching: 'Searching...',
    popularPlaylists: 'Popular playlists',
    confirmTitle: 'Confirm selection',
    confirmMessage: 'Play with',
    insufficientTracks: 'The selected source has fewer than 7 songs with a preview available. Choose another.',
    // Preload
    loadingSongs: 'Loading songs...',
    downloadingAudio: 'Downloading audio...',
    readyToPlay: 'Ready to play!',
    play: 'Play!',
    back: 'Back',
    noPreviewError: 'Not enough songs with a preview available. At least 7 are required.',
    networkError: 'Network error while loading resources',
    // Game
    question: 'Question',
    of: '/',
    next: 'Next →',
    // Results
    results: 'Results',
    points: 'points',
    correct: 'correct',
    timeout: '⏱ Time\'s up',
    playAgain: 'Play again',
    backToHome: 'Back to home',
    // Leaderboard
    leaderboardTitle: '🏆 High Scores',
    noScores: 'No scores recorded yet',
    close: 'Close',
    deleteScores: 'Delete',
    deleteConfirmTitle: 'Delete scores',
    deleteConfirmMessage: 'Are you sure you want to delete all scores? This action cannot be undone.',
    confirm: 'Confirm',
    cancel: 'Cancel',
    // Settings menu
    settings: 'Settings',
    darkMode: 'Dark mode',
    language: 'Language',
    resetScores: 'Reset scores',
    // Streak
    streak: 'Streak',
    // Footer
    madeBy: 'Made by Miguel Fernando w/ Kiro 🤖',
  },
} as const;

export type TranslationKey = keyof typeof translations.es;
export type Translations = typeof translations[Language];
