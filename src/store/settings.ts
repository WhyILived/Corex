import { create } from "zustand";
import type { LLMConfig } from "../llm/client";

const STORAGE_KEY = "corex.llm";

function load(): LLMConfig | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LLMConfig>;
    if (
      parsed &&
      typeof parsed.provider === "string" &&
      typeof parsed.model === "string"
    ) {
      return parsed as LLMConfig;
    }
  } catch {
    // Ignore malformed stored config.
  }
  return null;
}

interface SettingsState {
  config: LLMConfig | null;
  setConfig: (config: LLMConfig) => void;
  clearConfig: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  config: load(),
  setConfig: (config) => {
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      } catch {
        // Ignore persistence failures (e.g. private mode).
      }
    }
    set({ config });
  },
  clearConfig: () => {
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore.
      }
    }
    set({ config: null });
  },
}));
