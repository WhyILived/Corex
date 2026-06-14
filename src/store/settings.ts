import { create } from "zustand";
import type { LLMConfig } from "../llm/client";
import type { ProviderCredential } from "../llm/autoselect";
import type { SearchConfig } from "../search/webSearch";

const STORAGE_KEY = "corex.llm";

// Web search is opt-in and starts fully disabled.
export const DEFAULT_SEARCH_CONFIG: SearchConfig = {
  enabled: false,
  provider: "tavily",
  searchDepth: "surface",
};

// Persisted shape. `autoSelect` flips between:
//   - manual: use exactly `manual` (a single provider+model the user picked)
//   - auto:   rank across every model reachable by `credentials` per task
export interface PersistedSettings {
  autoSelect: boolean;
  credentials: ProviderCredential[];
  manual: LLMConfig | null;
  search: SearchConfig;
}

const EMPTY: PersistedSettings = {
  autoSelect: false,
  credentials: [],
  manual: null,
  search: { ...DEFAULT_SEARCH_CONFIG },
};

function normalizeSearch(value: unknown): SearchConfig {
  if (!value || typeof value !== "object") return { ...DEFAULT_SEARCH_CONFIG };
  const v = value as Partial<SearchConfig>;
  return {
    enabled: Boolean(v.enabled),
    provider:
      v.provider === "brave" || v.provider === "searxng" ? v.provider : "tavily",
    searchDepth: v.searchDepth === "deep" ? "deep" : "surface",
    ...(typeof v.apiKey === "string" ? { apiKey: v.apiKey } : {}),
    ...(typeof v.searxngBaseUrl === "string"
      ? { searxngBaseUrl: v.searxngBaseUrl }
      : {}),
  };
}

function isNewShape(value: unknown): value is PersistedSettings {
  return (
    !!value &&
    typeof value === "object" &&
    "autoSelect" in value &&
    Array.isArray((value as PersistedSettings).credentials)
  );
}

function isLegacyConfig(value: unknown): value is LLMConfig {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as Partial<LLMConfig>).provider === "string" &&
    typeof (value as Partial<LLMConfig>).model === "string"
  );
}

// Loads settings, migrating the old single-LLMConfig shape into the new
// multi-provider shape (manual mode preserved, the one key seeded as a
// credential so the user can flip on auto without re-entering it).
function load(): PersistedSettings {
  if (typeof localStorage === "undefined") return { ...EMPTY };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY };
    const parsed: unknown = JSON.parse(raw);

    if (isNewShape(parsed)) {
      return {
        autoSelect: Boolean(parsed.autoSelect),
        credentials: parsed.credentials.filter(
          (c) => c && typeof c.provider === "string",
        ),
        manual: isLegacyConfig(parsed.manual) ? parsed.manual : null,
        search: normalizeSearch((parsed as PersistedSettings).search),
      };
    }

    if (isLegacyConfig(parsed)) {
      return {
        autoSelect: false,
        manual: parsed,
        credentials: [
          {
            provider: parsed.provider,
            apiKey: parsed.apiKey,
            ...(parsed.baseUrl ? { baseUrl: parsed.baseUrl } : {}),
          },
        ],
        search: { ...DEFAULT_SEARCH_CONFIG },
      };
    }
  } catch {
    // Ignore malformed stored config.
  }
  return { ...EMPTY };
}

interface SettingsState extends PersistedSettings {
  setAutoSelect: (autoSelect: boolean) => void;
  setCredentials: (credentials: ProviderCredential[]) => void;
  setManual: (manual: LLMConfig | null) => void;
  setSearch: (search: SearchConfig) => void;
  clearAll: () => void;
}

function persist(state: PersistedSettings): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        autoSelect: state.autoSelect,
        credentials: state.credentials,
        manual: state.manual,
        search: state.search,
      } satisfies PersistedSettings),
    );
  } catch {
    // Ignore persistence failures (e.g. private mode).
  }
}

export const useSettingsStore = create<SettingsState>((set, get) => {
  const save = () => {
    const { autoSelect, credentials, manual, search } = get();
    persist({ autoSelect, credentials, manual, search });
  };

  return {
    ...load(),

    setAutoSelect: (autoSelect) => {
      set({ autoSelect });
      save();
    },

    setCredentials: (credentials) => {
      set({ credentials });
      save();
    },

    setManual: (manual) => {
      set({ manual });
      save();
    },

    setSearch: (search) => {
      set({ search });
      save();
    },

    clearAll: () => {
      set({ ...EMPTY });
      save();
    },
  };
});
