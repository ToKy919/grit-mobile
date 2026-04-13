/**
 * GRIT — App Settings Store
 * No persist middleware (React 19 compat).
 */

import { create } from "zustand";
import type { AppSettings } from "../types/user";
import { DEFAULT_SETTINGS } from "../types/user";

interface AppSettingsState extends AppSettings {
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  resetSettings: () => void;
}

export const useAppSettingsStore = create<AppSettingsState>()((set) => ({
  ...DEFAULT_SETTINGS,

  updateSetting: (key, value) => {
    set({ [key]: value });
  },

  resetSettings: () => {
    set(DEFAULT_SETTINGS);
  },
}));
