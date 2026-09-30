type KlipyMedia = {
  id: string;
  url: string;
  previewUrl?: string;
  width?: number;
  height?: number;
};

type KlipySearchOptions = {
  query?: string;
  limit?: number;
  pos?: string;
  type?: 'gif' | 'sticker';
};

const KLIPY_BASE_URL = 'https://api.klipy.com/v2';
const KLIPY_API_KEY = process.env.EXPO_PUBLIC_KLIPY_API_KEY || 'IcGhlAAfIOBMWstcpeaYeGnw3C0isut1SlyM2F3Sr2nVJCvL1VKD4qUwcyYY0JB1';
const KLIPY_CLIENT_KEY = process.env.EXPO_PUBLIC_KLIPY_CLIENT_KEY || 'sticker-and-gif-api-key-7676-krlode';

const pickMediaFormat = (mediaFormats: Record<string, any> | undefined): KlipyMedia | null => {
  if (!mediaFormats) return null;

  const preferred = ['gif', 'mediumgif', 'tinygif', 'nanogif'];
  for (const key of preferred) {
    const format = mediaFormats[key];
    if (format?.url) {
      return {
        id: '',
        url: format.url,
        previewUrl: mediaFormats.tinygif?.url || format.url,
        width: format.dims?.[0],
        height: format.dims?.[1],
      };
    }
  }

  return null;
};

const requestKlipy = async (path: string, params: Record<string, string | number | undefined>) => {
  const url = new URL(`${KLIPY_BASE_URL}/${path}`);
  url.searchParams.set('key', KLIPY_API_KEY);
  url.searchParams.set('client_key', KLIPY_CLIENT_KEY);

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    url.searchParams.set(key, String(value));
  });

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Klipy request failed: ${response.status}`);
  }
  return response.json();
};

const normalizeResults = (results: any[]): KlipyMedia[] => {
  return (results || [])
    .map((item) => {
      const media = pickMediaFormat(item.media_formats);
      if (!media) return null;
      return {
        ...media,
        id: item.id || item.itemurl || '',
        url: media.url,
        previewUrl: media.previewUrl,
      } as KlipyMedia;
    })
    .filter(Boolean) as KlipyMedia[];
};

export const klipyService = {
  async search(options: KlipySearchOptions) {
    const payload = await requestKlipy('search', {
      q: options.query,
      limit: options.limit ?? 24,
      pos: options.pos,
      media_filter: 'gif,tinygif',
      contentfilter: 'medium',
      searchfilter: options.type === 'sticker' ? 'sticker' : undefined,
    });

    return {
      items: normalizeResults(payload?.results || []),
      nextPos: payload?.next || '',
    };
  },

  async featured(options: KlipySearchOptions) {
    const payload = await requestKlipy('featured', {
      limit: options.limit ?? 24,
      pos: options.pos,
      media_filter: 'gif,tinygif',
      contentfilter: 'medium',
      searchfilter: options.type === 'sticker' ? 'sticker' : undefined,
    });

    return {
      items: normalizeResults(payload?.results || []),
      nextPos: payload?.next || '',
    };
  },
};
