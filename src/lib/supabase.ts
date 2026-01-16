import 'react-native-url-polyfill/auto';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY ?? '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Missing Supabase environment variables.');
}

type StorageAdapter = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

const createMemoryStorage = (): StorageAdapter => {
  const storage = new Map<string, string>();
  return {
    getItem: async (key) => storage.get(key) ?? null,
    setItem: async (key, value) => {
      storage.set(key, value);
    },
    removeItem: async (key) => {
      storage.delete(key);
    },
  };
};

const isReactNative =
  typeof navigator !== 'undefined' && navigator.product === 'ReactNative';

const resolveStorage = (): StorageAdapter | undefined => {
  if (!isReactNative) {
    return undefined;
  }

  // Lazy import to avoid referencing window during server-side/CLI execution.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const asyncStorageModule = require('@react-native-async-storage/async-storage');
  return asyncStorageModule.default ?? asyncStorageModule;
};

const storage = resolveStorage();
const authConfig: {
  storage?: StorageAdapter;
  persistSession?: boolean;
  autoRefreshToken?: boolean;
  detectSessionInUrl: boolean;
} = {
  detectSessionInUrl: false,
};

if (storage) {
  authConfig.storage = storage;
  authConfig.persistSession = true;
  authConfig.autoRefreshToken = true;
} else if (typeof window === 'undefined') {
  authConfig.storage = createMemoryStorage();
  authConfig.persistSession = false;
  authConfig.autoRefreshToken = false;
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: authConfig,
});
