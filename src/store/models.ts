import { create } from "zustand";
import type { ProviderCredential } from "../llm/autoselect";
import type { LLMProvider } from "../llm/catalog";
import { discoverModels } from "../llm/discovery";

const STORAGE_KEY = "corex.models";

export interface ProviderModels {
  ids: string[];
  fetchedAt: string;
  loading: boolean;
  error?: string;
}

type ProviderMap = Partial<Record<LLMProvider, ProviderModels>>;

// Persist only the discovered ids/metadata — never the API keys (those live in
// the settings store) — so a relaunch shows the last-known models instantly
// while a fresh sync runs.
function load(): ProviderMap {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ProviderMap;
    // Drop any stale "loading" flags from a previous session.
    const cleaned: ProviderMap = {};
    for (const [provider, entry] of Object.entries(parsed)) {
      if (entry && Array.isArray(entry.ids)) {
        cleaned[provider as LLMProvider] = { ...entry, loading: false };
      }
    }
    return cleaned;
  } catch {
    return {};
  }
}

interface ModelsState {
  byProvider: ProviderMap;
  // Discover (or re-discover) the models reachable with one credential.
  refresh: (cred: ProviderCredential) => Promise<void>;
  // Reconcile to a set of credentials: discover each, drop providers no longer
  // present. Call whenever the credential list changes (and on startup).
  syncTo: (credentials: ProviderCredential[]) => Promise<void>;
  // Flat { provider: ids } map for the selector.
  discoveredMap: () => Partial<Record<LLMProvider, string[]>>;
}

export const useModelsStore = create<ModelsState>((set, get) => {
  const persist = () => {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(get().byProvider));
    } catch {
      // Ignore persistence failures.
    }
  };

  const patch = (provider: LLMProvider, entry: ProviderModels) => {
    set((state) => ({ byProvider: { ...state.byProvider, [provider]: entry } }));
  };

  return {
    byProvider: load(),

    refresh: async (cred) => {
      const prev = get().byProvider[cred.provider];
      patch(cred.provider, {
        ids: prev?.ids ?? [],
        fetchedAt: prev?.fetchedAt ?? "",
        loading: true,
      });

      try {
        const ids = await discoverModels(cred);
        patch(cred.provider, {
          ids,
          fetchedAt: new Date().toISOString(),
          loading: false,
        });
      } catch (error) {
        patch(cred.provider, {
          ids: prev?.ids ?? [],
          fetchedAt: prev?.fetchedAt ?? "",
          loading: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
      persist();
    },

    syncTo: async (credentials) => {
      const keep = new Set(credentials.map((c) => c.provider));
      // Drop providers that are no longer configured.
      set((state) => {
        const next: ProviderMap = {};
        for (const provider of keep) {
          const existing = state.byProvider[provider];
          if (existing) next[provider] = existing;
        }
        return { byProvider: next };
      });
      persist();

      await Promise.all(credentials.map((cred) => get().refresh(cred)));
    },

    discoveredMap: () => {
      const out: Partial<Record<LLMProvider, string[]>> = {};
      for (const [provider, entry] of Object.entries(get().byProvider)) {
        if (entry) out[provider as LLMProvider] = entry.ids;
      }
      return out;
    },
  };
});
