import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { settingsService } from '../services/settings.service';
import { DEFAULT_REACTIONS, QUICK_REACTION_KEY } from '../constants/chat';

export function useChatPreferences(userId?: string, favoriteReactions: string[] = [...DEFAULT_REACTIONS]) {
  const [quickReactionEmoji, setQuickReactionEmoji] = useState<string>(DEFAULT_REACTIONS[0]);
  const [allowSeenHaptics, setAllowSeenHaptics] = useState(true);
  const [preferStrongVibration, setPreferStrongVibration] = useState(false);

  useEffect(() => {
    if (!userId) {
      setAllowSeenHaptics(true);
      setPreferStrongVibration(false);
      return;
    }

    settingsService.getUserSettings(userId)
      .then((settings) => {
        setAllowSeenHaptics(settings.hapticFeedback !== false);
        setPreferStrongVibration(!!settings.strongVibration);
      })
      .catch(() => {
        setAllowSeenHaptics(true);
        setPreferStrongVibration(false);
      });
  }, [userId]);

  useEffect(() => {
    AsyncStorage.getItem(QUICK_REACTION_KEY)
      .then((saved) => {
        if (saved && favoriteReactions.includes(saved)) {
          setQuickReactionEmoji(saved);
          return;
        }
        if (!favoriteReactions.includes(quickReactionEmoji)) {
          setQuickReactionEmoji(favoriteReactions[0] || DEFAULT_REACTIONS[0]);
        }
      })
      .catch(() => {
        if (!favoriteReactions.includes(quickReactionEmoji)) {
          setQuickReactionEmoji(favoriteReactions[0] || DEFAULT_REACTIONS[0]);
        }
      });
  }, [favoriteReactions, quickReactionEmoji]);

  return {
    quickReactionEmoji,
    setQuickReactionEmoji,
    allowSeenHaptics,
    preferStrongVibration,
  };
}
