import { create } from "zustand";
import type { LLMConfig } from "../llm/client";
import { isAbortError } from "../llm/client";
import {
  runGeneration,
  type GenerationPhase,
  type GenerationProgress,
} from "../generate/runGeneration";
import { deleteSession } from "../scope/pipeline";
import { useNotebooksStore } from "./notebooks";

// Global, app-wide generation manager. Jobs live here — not in the modal — so a
// run keeps going (and stays visible) after the New-notebook modal is closed,
// and so multiple requests queue instead of racing (the "message queue for
// generations"). Jobs run one at a time; each carries its own AbortController so
// it can be cancelled, after which its partial session is cleaned up on disk.

export type JobStatus =
  | "queued"
  | "running"
  | "cancelling"
  | "done"
  | "error"
  | "cancelled";

export interface GenerationJob {
  id: string;
  sessionId: string;
  title: string;
  status: JobStatus;
  progress: GenerationProgress | null;
  percent: number;
  error?: string;
  createdAt: string;
}

// Relative cost of each phase, used to turn per-phase done/total into a single
// smooth 0-100 bar instead of the old per-phase "0/1" counter.
const PHASE_WEIGHTS: Record<GenerationPhase, number> = {
  scope: 0.25,
  orchestrate: 0.5,
  visualize: 0.15,
  assemble: 0.1,
};
const PHASE_ORDER: GenerationPhase[] = ["scope", "orchestrate", "visualize", "assemble"];

export const PHASE_LABELS: Record<GenerationPhase, string> = {
  scope: "Reading sources",
  orchestrate: "Writing & verifying sections",
  visualize: "Resolving figures",
  assemble: "Assembling",
};

function overallPercent(progress: GenerationProgress): number {
  let base = 0;
  for (const phase of PHASE_ORDER) {
    if (phase === progress.phase) break;
    base += PHASE_WEIGHTS[phase];
  }
  const frac =
    progress.total > 0 ? Math.min(1, Math.max(0, progress.done / progress.total)) : 0;
  return Math.round((base + PHASE_WEIGHTS[progress.phase] * frac) * 100);
}

interface JobInput {
  files: File[];
  prompt?: string;
  sessionId: string;
  config: LLMConfig;
}

interface GenerationState {
  jobs: GenerationJob[];
  // AbortControllers are kept outside the serializable job list.
  controllers: Map<string, AbortController>;
  processing: boolean;
  enqueue: (input: JobInput) => string;
  cancel: (jobId: string) => void;
  dismiss: (jobId: string) => void;
}

export const useGenerationStore = create<GenerationState>((set, get) => {
  function patchJob(id: string, patch: Partial<GenerationJob>): void {
    set((state) => ({
      jobs: state.jobs.map((job) => (job.id === id ? { ...job, ...patch } : job)),
    }));
  }

  // Pulls the next queued job and runs it; chains to the next when done. Only
  // one job runs at a time.
  async function processQueue(inputs: Map<string, JobInput>): Promise<void> {
    if (get().processing) return;
    set({ processing: true });

    try {
      for (;;) {
        const next = get().jobs.find((job) => job.status === "queued");
        if (!next) break;

        const input = inputs.get(next.id);
        if (!input) {
          patchJob(next.id, { status: "error", error: "Job input was lost." });
          continue;
        }

        const controller = new AbortController();
        get().controllers.set(next.id, controller);
        patchJob(next.id, { status: "running" });

        try {
          await runGeneration(
            { files: input.files, userPrompt: input.prompt, sessionId: input.sessionId },
            input.config,
            (progress) =>
              patchJob(next.id, { progress, percent: overallPercent(progress) }),
            controller.signal,
          );
          patchJob(next.id, { status: "done", percent: 100 });
          // Open the finished notebook in a tab.
          void useNotebooksStore.getState().openNotebook(next.sessionId, next.title);
        } catch (error) {
          if (isAbortError(error) || controller.signal.aborted) {
            patchJob(next.id, { status: "cancelled" });
            // Clean up the partial session so a cancelled run leaves nothing on disk.
            await deleteSession(next.sessionId).catch((cleanupError) =>
              console.warn("[generation] cleanup after cancel failed", cleanupError),
            );
          } else {
            patchJob(next.id, {
              status: "error",
              error: error instanceof Error ? error.message : String(error),
            });
          }
        } finally {
          get().controllers.delete(next.id);
          inputs.delete(next.id);
        }
      }
    } finally {
      set({ processing: false });
    }
  }

  // Inputs (Files, config) are held outside the store state to keep jobs light.
  const pendingInputs = new Map<string, JobInput>();

  return {
    jobs: [],
    controllers: new Map(),
    processing: false,

    enqueue: (input) => {
      const id = crypto.randomUUID();
      const job: GenerationJob = {
        id,
        sessionId: input.sessionId,
        title: input.files[0]?.name.replace(/\.[^.]+$/, "") ?? "New notebook",
        status: "queued",
        progress: null,
        percent: 0,
        createdAt: new Date().toISOString(),
      };
      pendingInputs.set(id, input);
      set((state) => ({ jobs: [...state.jobs, job] }));
      void processQueue(pendingInputs);
      return id;
    },

    cancel: (jobId) => {
      const job = get().jobs.find((entry) => entry.id === jobId);
      if (!job) return;

      if (job.status === "queued") {
        // Not started yet: drop it from the queue and clean any stray dir.
        pendingInputs.delete(jobId);
        patchJob(jobId, { status: "cancelled" });
        void deleteSession(job.sessionId).catch(() => undefined);
        return;
      }

      if (job.status === "running") {
        patchJob(jobId, { status: "cancelling" });
        get().controllers.get(jobId)?.abort();
      }
    },

    dismiss: (jobId) => {
      get().controllers.get(jobId)?.abort();
      get().controllers.delete(jobId);
      pendingInputs.delete(jobId);
      set((state) => ({ jobs: state.jobs.filter((job) => job.id !== jobId) }));
    },
  };
});
