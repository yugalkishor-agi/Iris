import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { useAuth } from './AuthContext';
import { settingsService } from '../services/settings.service';

type ThemePreference = 'dark' | 'light' | 'auto';

interface ThemeContextType {
  theme: 'dark' | 'light';
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [preference, setPreferenceState] = useState<ThemePreference>('dark');
  const [isInitialized, setIsInitialized] = useState(false);
  const [syncedUserId, setSyncedUserId] = useState<string | null>(null);
  const lastSavedRef = useRef<{ userId: string | null; pref: ThemePreference | null }>({ userId: null, pref: null });

  useEffect(() => {
    const load = async () => {
      const savedPref = await AsyncStorage.getItem('iris-theme-preference');
      const pref = (savedPref === 'light' || savedPref === 'dark' || savedPref === 'auto') ? (savedPref as ThemePreference) : 'dark';
      setPreferenceState(pref);
      const resolved = pref === 'auto' ? (Appearance.getColorScheme() === 'dark' ? 'dark' : 'light') : pref;
      setTheme(resolved);
      setIsInitialized(true);
    };
    load();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    if (!user?.userId) {
      setSyncedUserId(null);
      return;
    }

    if (syncedUserId === user.userId) return;

    const syncFromBackend = async () => {
      try {
        const settings = await settingsService.getUserSettings(user.userId);
        const remoteTheme = settings?.theme;
        if (remoteTheme === 'light' || remoteTheme === 'dark' || remoteTheme === 'auto') {
          setPreferenceState(remoteTheme);
          lastSavedRef.current = { userId: user.userId, pref: remoteTheme };
        }
      } catch {
        // Ignore and keep local preference
      } finally {
        setSyncedUserId(user.userId);
      }
    };

    syncFromBackend();
  }, [isInitialized, user?.userId, syncedUserId]);

  useEffect(() => {
    if (!isInitialized) return;

    const apply = async () => {
      await AsyncStorage.setItem('iris-theme-preference', preference);
      if (user?.userId) {
        const lastSaved = lastSavedRef.current;
        if (!(lastSaved.userId === user.userId && lastSaved.pref === preference)) {
          try {
            await settingsService.updateSettings(user.userId, { theme: preference as any });
            lastSavedRef.current = { userId: user.userId, pref: preference };
          } catch {}
        }
      }
      const resolved = preference === 'auto' ? (Appearance.getColorScheme() === 'dark' ? 'dark' : 'light') : preference;
      setTheme(resolved);
    };
    apply();
  }, [isInitialized, preference, user?.userId]);

  useEffect(() => {
    if (preference !== 'auto') return;
    const sub: any = Appearance.addChangeListener(({ colorScheme }) => {
      setTheme(colorScheme === 'dark' ? 'dark' : 'light');
    });
    return () => { try { sub?.remove?.(); } catch {} };
  }, [preference]);

  const toggleTheme = () => {
    setPreferenceState(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const setPreference = (pref: ThemePreference) => {
    setPreferenceState(pref);
  };

  return (
    <ThemeContext.Provider value={{ theme, preference, setPreference, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}


