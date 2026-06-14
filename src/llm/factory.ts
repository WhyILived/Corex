// Bridges the settings/models stores to the LLMClient. A "plan" is a snapshot
// of the user's effective model configuration captured at the moment work is
// requested (so a queued generation keeps using the settings it was started
// with). Clients are then built per-task from that plan.

import { useSettingsStore } from "../store/settings";
import { useModelsStore } from "../store/models";
import { LLMClient, type LLMConfig } from "./client";
import { buildAvailable, type AvailableModel, type LLMTask } from "./autoselect";

export type LLMPlan =
  | { mode: "manual"; config: LLMConfig }
  | { mode: "auto"; available: AvailableModel[] };

// Snapshot current settings into a plan, or null if nothing usable is
// configured (no manual model, or auto mode with zero discovered models).
export function buildPlan(): LLMPlan | null {
  const { autoSelect, credentials, manual } = useSettingsStore.getState();

  if (autoSelect) {
    const discovered = useModelsStore.getState().discoveredMap();
    const available = buildAvailable(credentials, discovered);
    return available.length > 0 ? { mode: "auto", available } : null;
  }

  return manual ? { mode: "manual", config: manual } : null;
}

// Build a client for a task from a captured plan.
export function clientFor(
  plan: LLMPlan,
  task: LLMTask = "general",
  signal?: AbortSignal,
): LLMClient {
  return plan.mode === "auto"
    ? LLMClient.auto(plan.available, task, signal)
    : new LLMClient(plan.config, signal);
}

// One-shot client for immediate (non-pipeline) use, e.g. chat. Null when no
// model is configured.
export function clientForTask(task: LLMTask, signal?: AbortSignal): LLMClient | null {
  const plan = buildPlan();
  return plan ? clientFor(plan, task, signal) : null;
}

// Reactive readiness for UI gating: subscribes to both stores so it re-renders
// when keys are added or models are discovered.
export function useLLMReady(): boolean {
  const autoSelect = useSettingsStore((s) => s.autoSelect);
  const credentials = useSettingsStore((s) => s.credentials);
  const manual = useSettingsStore((s) => s.manual);
  const byProvider = useModelsStore((s) => s.byProvider);

  if (autoSelect) {
    const discovered: Record<string, string[]> = {};
    for (const [provider, entry] of Object.entries(byProvider)) {
      if (entry) discovered[provider] = entry.ids;
    }
    return buildAvailable(credentials, discovered).length > 0;
  }
  return manual !== null;
}
