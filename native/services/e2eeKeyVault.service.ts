import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'iris:e2ee';

const buildKey = (suffix: string) => `${PREFIX}:${suffix}`;

export const e2eeKeyVault = {
  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(buildKey(key), value);
  },

  async getItem(key: string): Promise<string | null> {
    return AsyncStorage.getItem(buildKey(key));
  },

  async deleteItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(buildKey(key));
  },
};
