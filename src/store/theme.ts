import { create } from "zustand";

export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

interface ThemeState {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
  toggle: () => void;
}

const STORAGE_KEY = "corex.theme";

function systemTheme(): ResolvedTheme {
  if (typeof window === "undefined" || !window.matchMedia) {
    return "dark";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolve(preference: ThemePreference): ResolvedTheme {
  return preference === "system" ? systemTheme() : preference;
}

function apply(resolved: ResolvedTheme): void {
  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = resolved;
  }
}

function loadPreference(): ThemePreference {
  if (typeof localStorage === "undefined") {
    return "system";
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "system"
    ? stored
    : "dark";
}

const initialPreference = loadPreference();
const initialResolved = resolve(initialPreference);
apply(initialResolved);

export const useThemeStore = create<ThemeState>((set, get) => {
  // Keep "system" preference reactive to OS changes.
  if (typeof window !== "undefined" && window.matchMedia) {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", () => {
        if (get().preference === "system") {
          const resolved = systemTheme();
          apply(resolved);
          set({ resolved });
        }
      });
  }

  return {
    preference: initialPreference,
    resolved: initialResolved,
    setPreference: (preference) => {
      const resolved = resolve(preference);
      apply(resolved);
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(STORAGE_KEY, preference);
      }
      set({ preference, resolved });
    },
    toggle: () => {
      const next: ResolvedTheme = get().resolved === "dark" ? "light" : "dark";
      get().setPreference(next);
    },
  };
});
