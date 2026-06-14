import { useMemo, useState } from "react";
import { DEFAULT_MODELS, type LLMConfig } from "../llm/client";
import type { ProviderCredential } from "../llm/autoselect";
import type { SearchConfig, SearchProvider } from "../search/webSearch";
import { useSettingsStore } from "../store/settings";
import { useModelsStore } from "../store/models";

interface SettingsModalProps {
  onClose: () => void;
}

type Provider = LLMConfig["provider"];

const SEARCH_PROVIDERS: { value: SearchProvider; label: string }[] = [
  { value: "tavily", label: "Tavily" },
  { value: "brave", label: "Brave Search" },
  { value: "searxng", label: "SearXNG (self-hosted)" },
];

const PROVIDERS: { value: Provider; label: string }[] = [
  { value: "anthropic", label: "Anthropic" },
  { value: "openai", label: "OpenAI" },
  { value: "gemini", label: "Gemini" },
  { value: "openrouter", label: "OpenRouter" },
  { value: "groq", label: "Groq" },
  { value: "ollama", label: "Ollama (local)" },
];

const PROVIDER_LABEL: Record<Provider, string> = Object.fromEntries(
  PROVIDERS.map((p) => [p.value, p.label]),
) as Record<Provider, string>;

function providerNeedsKey(provider: Provider): boolean {
  return provider !== "ollama";
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const store = useSettingsStore();
  const byProvider = useModelsStore((s) => s.byProvider);
  const refresh = useModelsStore((s) => s.refresh);
  const syncTo = useModelsStore((s) => s.syncTo);

  const [autoSelect, setAutoSelect] = useState(store.autoSelect);
  const [creds, setCreds] = useState<ProviderCredential[]>(
    store.credentials.length > 0
      ? store.credentials.map((c) => ({ ...c }))
      : [{ provider: "anthropic", apiKey: "", baseUrl: "" }],
  );
  const [manualProvider, setManualProvider] = useState<Provider>(
    store.manual?.provider ?? store.credentials[0]?.provider ?? "anthropic",
  );
  const [manualModel, setManualModel] = useState(
    store.manual?.model ?? "",
  );
  const [search, setSearch] = useState<SearchConfig>({ ...store.search });

  const updateSearch = (patch: Partial<SearchConfig>) =>
    setSearch((current) => ({ ...current, ...patch }));

  const updateCred = (index: number, patch: Partial<ProviderCredential>) => {
    setCreds((current) =>
      current.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    );
  };

  const addCred = () => {
    const used = new Set(creds.map((c) => c.provider));
    const next = PROVIDERS.find((p) => !used.has(p.value))?.value ?? "openai";
    setCreds((current) => [...current, { provider: next, apiKey: "", baseUrl: "" }]);
  };

  const removeCred = (index: number) => {
    setCreds((current) => current.filter((_, i) => i !== index));
  };

  // Credentials that are actually usable (have a key, or are keyless like
  // Ollama). These are what we persist and discover against.
  const usableCreds = useMemo(
    () =>
      creds
        .filter((c) => !providerNeedsKey(c.provider) || c.apiKey.trim())
        .map((c) => ({
          provider: c.provider,
          apiKey: c.apiKey.trim(),
          ...(c.baseUrl?.trim() ? { baseUrl: c.baseUrl.trim() } : {}),
        })),
    [creds],
  );

  const manualModels = byProvider[manualProvider]?.ids ?? [];

  // Web search can only be enabled once its provider has credentials.
  const searchCredsOk =
    !search.enabled ||
    (search.provider === "searxng"
      ? Boolean(search.searxngBaseUrl?.trim())
      : Boolean(search.apiKey?.trim()));

  const canSave =
    searchCredsOk &&
    (autoSelect
      ? usableCreds.length > 0
      : usableCreds.some((c) => c.provider === manualProvider) &&
        Boolean(manualModel.trim() || DEFAULT_MODELS[manualProvider]));

  function save() {
    store.setAutoSelect(autoSelect);
    store.setCredentials(usableCreds);

    if (autoSelect) {
      // Manual config is irrelevant in auto mode, but keep it for when the user
      // toggles back off.
    } else {
      const cred = usableCreds.find((c) => c.provider === manualProvider);
      const manual: LLMConfig = {
        provider: manualProvider,
        apiKey: cred?.apiKey ?? "",
        model: manualModel.trim() || DEFAULT_MODELS[manualProvider],
        ...(cred?.baseUrl ? { baseUrl: cred.baseUrl } : {}),
      };
      store.setManual(manual);
    }

    // Normalize search config before persisting: trim creds, and never persist
    // enabled=true without the required credential.
    const cleanedSearch: SearchConfig = {
      enabled: search.enabled && searchCredsOk,
      provider: search.provider,
      searchDepth: search.searchDepth,
      ...(search.apiKey?.trim() ? { apiKey: search.apiKey.trim() } : {}),
      ...(search.searxngBaseUrl?.trim()
        ? { searxngBaseUrl: search.searxngBaseUrl.trim() }
        : {}),
    };
    store.setSearch(cleanedSearch);

    // Refresh the model lists for the new credential set (fire-and-forget).
    void syncTo(usableCreds);
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-label="Settings"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2>LLM settings</h2>
          <button aria-label="Close" onClick={onClose}>
            {"\u00d7"}
          </button>
        </div>

        <div className="settings-form">
          <label className="field-row">
            <input
              type="checkbox"
              checked={autoSelect}
              onChange={(e) => setAutoSelect(e.target.checked)}
            />
            <span>
              <strong>Automatic model selection</strong>
              <br />
              <span className="muted">
                Pick the best available model for each task across all your
                providers, and fail over when one runs out of quota.
              </span>
            </span>
          </label>

          <div className="settings-section">
            <div className="settings-section-head">
              <span>Providers &amp; API keys</span>
              <button type="button" className="link-btn" onClick={addCred}>
                + Add provider
              </button>
            </div>

            {creds.map((cred, index) => {
              const status = byProvider[cred.provider];
              const needsKey = providerNeedsKey(cred.provider);
              const discoverable =
                !needsKey || cred.apiKey.trim().length > 0;
              return (
                <div className="provider-card" key={index}>
                  <div className="provider-card-row">
                    <select
                      value={cred.provider}
                      onChange={(e) =>
                        updateCred(index, { provider: e.target.value as Provider })
                      }
                    >
                      {PROVIDERS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      aria-label="Remove provider"
                      className="icon-btn"
                      onClick={() => removeCred(index)}
                    >
                      {"\u00d7"}
                    </button>
                  </div>

                  {needsKey && (
                    <input
                      type="password"
                      value={cred.apiKey}
                      onChange={(e) => updateCred(index, { apiKey: e.target.value })}
                      placeholder="API key (sk-…)"
                    />
                  )}

                  <input
                    value={cred.baseUrl ?? ""}
                    onChange={(e) => updateCred(index, { baseUrl: e.target.value })}
                    placeholder={
                      cred.provider === "ollama"
                        ? "http://localhost:11434"
                        : "Base URL (optional)"
                    }
                  />

                  <div className="provider-status">
                    {status?.loading ? (
                      <span className="muted">Checking models…</span>
                    ) : status?.error ? (
                      <span className="status-error" title={status.error}>
                        Couldn’t fetch models
                      </span>
                    ) : status ? (
                      <span className="muted">
                        {status.ids.length} model
                        {status.ids.length === 1 ? "" : "s"} available
                      </span>
                    ) : (
                      <span className="muted">Not checked yet</span>
                    )}
                    <button
                      type="button"
                      className="link-btn"
                      disabled={!discoverable}
                      onClick={() =>
                        void refresh({
                          provider: cred.provider,
                          apiKey: cred.apiKey.trim(),
                          ...(cred.baseUrl?.trim()
                            ? { baseUrl: cred.baseUrl.trim() }
                            : {}),
                        })
                      }
                    >
                      Refresh
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {!autoSelect && (
            <div className="settings-section">
              <div className="settings-section-head">
                <span>Active model</span>
              </div>
              <label className="field">
                <span>Provider</span>
                <select
                  value={manualProvider}
                  onChange={(e) => setManualProvider(e.target.value as Provider)}
                >
                  {usableCreds.length === 0 ? (
                    <option value={manualProvider}>
                      {PROVIDER_LABEL[manualProvider]}
                    </option>
                  ) : (
                    usableCreds.map((c) => (
                      <option key={c.provider} value={c.provider}>
                        {PROVIDER_LABEL[c.provider]}
                      </option>
                    ))
                  )}
                </select>
              </label>
              <label className="field">
                <span>Model</span>
                <input
                  list="manual-model-options"
                  value={manualModel}
                  onChange={(e) => setManualModel(e.target.value)}
                  placeholder={DEFAULT_MODELS[manualProvider]}
                />
                <datalist id="manual-model-options">
                  {manualModels.map((id) => (
                    <option key={id} value={id} />
                  ))}
                </datalist>
              </label>
            </div>
          )}

          <div className="settings-section">
            <div className="settings-section-head">
              <span>Web search</span>
            </div>

            <label className="field-row">
              <input
                type="checkbox"
                checked={search.enabled}
                onChange={(e) => updateSearch({ enabled: e.target.checked })}
              />
              <span>
                <strong>Enable web search</strong>
                <br />
                <span className="muted">
                  Supplement generation and let chat look things up when the
                  study guide doesn’t have the answer. Uploaded materials always
                  take priority.
                </span>
              </span>
            </label>

            {search.enabled && (
              <>
                <label className="field">
                  <span>Search provider</span>
                  <select
                    value={search.provider}
                    onChange={(e) =>
                      updateSearch({ provider: e.target.value as SearchProvider })
                    }
                  >
                    {SEARCH_PROVIDERS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </label>

                {search.provider === "searxng" ? (
                  <label className="field">
                    <span>SearXNG base URL</span>
                    <input
                      value={search.searxngBaseUrl ?? ""}
                      onChange={(e) =>
                        updateSearch({ searxngBaseUrl: e.target.value })
                      }
                      placeholder="http://localhost:8080"
                    />
                  </label>
                ) : (
                  <label className="field">
                    <span>API key</span>
                    <input
                      type="password"
                      value={search.apiKey ?? ""}
                      onChange={(e) => updateSearch({ apiKey: e.target.value })}
                      placeholder={
                        search.provider === "tavily" ? "tvly-…" : "BSA…"
                      }
                    />
                  </label>
                )}

                <label className="field">
                  <span>Search depth</span>
                  <select
                    value={search.searchDepth}
                    onChange={(e) =>
                      updateSearch({
                        searchDepth: e.target.value as SearchConfig["searchDepth"],
                      })
                    }
                  >
                    <option value="surface">Surface (2 queries per section)</option>
                    <option value="deep">Deep (5 queries per section)</option>
                  </select>
                </label>

                {!searchCredsOk && (
                  <span className="status-error">
                    {search.provider === "searxng"
                      ? "Enter a SearXNG base URL to enable search."
                      : "Enter an API key to enable search."}
                  </span>
                )}
              </>
            )}
          </div>

          <div className="settings-actions">
            <button onClick={onClose}>Cancel</button>
            <button className="primary" onClick={save} disabled={!canSave}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
