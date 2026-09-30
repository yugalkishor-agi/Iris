export const QUICK_REACTION_KEY = 'chat_quick_reaction';

export const DEFAULT_REACTIONS = ['\u2764\uFE0F', '\uD83D\uDE02', '\uD83D\uDE2E', '\uD83D\uDE22', '\uD83D\uDE21', '\uD83D\uDC4D'] as const;

export const CHAT_THEME_COLORS: Record<string, string> = {
  nebula: '#a855f7',
  lagoon: '#38bdf8',
  ember: '#f59e0b',
  mint: '#34d399',
  ocean: '#0ea5e9',
  sunset: '#f43f5e',
  aurora: '#8b5cf6',
  glass: '#ffffff',
};

export const THEME_GRADIENTS: Record<string, string[]> = {
  nebula: ['#0f172a', '#1e1b4b', '#312e81'],
  lagoon: ['#0f172a', '#0c4a6e', '#075985'],
  ember: ['#0f172a', '#451a03', '#78350f'],
  mint: ['#0f172a', '#064e3b', '#065f46'],
  ocean: ['#0f172a', '#0c4a6e', '#0369a1'],
  sunset: ['#0f172a', '#4c0519', '#881337'],
  aurora: ['#0f172a', '#2e1065', '#4c1d95'],
  glass: ['#000000', '#111111', '#1a1a1a'],
};

export const getChatAccent = (themeKey?: string) => {
  return CHAT_THEME_COLORS[themeKey || ''] || '#38bdf8';
};

export const getChatGradient = (themeKey?: string): [string, string, ...string[]] => {
  const gradient = THEME_GRADIENTS[themeKey || ''] || THEME_GRADIENTS.nebula;
  if (gradient.length >= 2) {
    return [gradient[0], gradient[1], ...gradient.slice(2)];
  }
  return ['#0f172a', '#1e1b4b'];
};
