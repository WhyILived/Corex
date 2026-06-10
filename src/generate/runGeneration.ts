import { LLMClient, type LLMConfig } from "../llm/client";
import {
  runScopePipeline,
  type ScopePipelineInput,
} from "../scope/pipeline";
import { runOrchestrator } from "../orchestrator/orchestrator";
import { assembleStudyGuide } from "../assembler/assembler";

export type GenerationPhase = "scope" | "orchestrate" | "assemble";

export interface GenerationProgress {
  phase: GenerationPhase;
  message: string;
  done: number;
  total: number;
}

export interface GenerationResult {
  sessionId: string;
}

// End-to-end generation: ingest/extract/synthesize (scope) -> per-section
// generate/verify/fix (orchestrate) -> merge into the viewer document
// (assemble). Each stage already persists to disk, so a crash mid-run can be
// resumed; this just chains them and forwards a unified progress signal.
export async function runGeneration(
  input: ScopePipelineInput,
  config: LLMConfig,
  onProgress: (progress: GenerationProgress) => void,
): Promise<GenerationResult> {
  const llm = new LLMClient(config);

  const scope = await runScopePipeline(input, llm, (update) =>
    onProgress({
      phase: "scope",
      message: update.message,
      done: update.done,
      total: update.total,
    }),
  );

  await runOrchestrator(scope.sessionId, scope.scopeDocument, llm, (update) =>
    onProgress({
      phase: "orchestrate",
      message: `${update.sectionTitle} — ${update.status}`,
      done: update.doneSections,
      total: update.totalSections,
    }),
  );

  await assembleStudyGuide(scope.sessionId, scope.scopeDocument, (done, total) =>
    onProgress({
      phase: "assemble",
      message: "Assembling study guide…",
      done,
      total,
    }),
  );

  return { sessionId: scope.sessionId };
}
