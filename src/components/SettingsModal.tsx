import { useState } from "react";
import { DEFAULT_MODELS, type LLMConfig } from "../llm/client";
import { useSettingsStore } from "../store/settings";

interface SettingsModalProps {
  onClose: () => void;
}

type Provider = LLMConfig["provider"];

const PROVIDERS: { value: Provider; label: string }[] = [
  { value: "anthropic", label: "Anthropic" },
  { value: "openai", label: "OpenAI" },
  { value: "gemini", label: "Gemini" },
  { value: "openrouter", label: "OpenRouter" },
  { value: "ollama", label: "Ollama (local)" },
];

export function SettingsModal({ onClose }: SettingsModalProps) {
  const config = useSettingsStore((s) => s.config);
  const setConfig = useSettingsStore((s) => s.setConfig);

  const [provider, setProvider] = useState<Provider>(
    config?.provider ?? "anthropic",
  );
  const [model, setModel] = useState(
    config?.model ?? DEFAULT_MODELS[config?.provider ?? "anthropic"],
  );
  const [apiKey, setApiKey] = useState(config?.apiKey ?? "");
  const [baseUrl, setBaseUrl] = useState(config?.baseUrl ?? "");

  const needsKey = provider !== "ollama";

  function onProviderChange(next: Provider) {
    setProvider(next);
    // Reset the model to the provider default unless the user already typed one
    // that differs from the previous provider's default.
    setModel((current) =>
      current === DEFAULT_MODELS[provider] || current === ""
        ? DEFAULT_MODELS[next]
        : current,
    );
  }

  function save() {
    const next: LLMConfig = {
      provider,
      apiKey: apiKey.trim(),
      model: model.trim() || DEFAULT_MODELS[provider],
    };
    if (baseUrl.trim()) next.baseUrl = baseUrl.trim();
    setConfig(next);
    onClose();
  }

  const canSave = (model.trim() || DEFAULT_MODELS[provider]) && (!needsKey || apiKey.trim());

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
          <label className="field">
            <span>Provider</span>
            <select
              value={provider}
              onChange={(e) => onProviderChange(e.target.value as Provider)}
            >
              {PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Model</span>
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={DEFAULT_MODELS[provider]}
            />
          </label>

          {needsKey && (
            <label className="field">
              <span>API key</span>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-…"
              />
            </label>
          )}

          <label className="field">
            <span>
              Base URL <span className="muted">(optional)</span>
            </span>
            <input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder={
                provider === "ollama" ? "http://localhost:11434" : ""
              }
            />
          </label>

          <div className="settings-actions">
            <button onClick={onClose}>Cancel</button>
            <button
              className="primary"
              onClick={save}
              disabled={!canSave}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
