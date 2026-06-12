import { AbortError, isAbortError, LLMClient, type LLMConfig } from "../llm/client";
import { runScopePipeline, type ScopePipelineInput } from "../scope/pipeline";
import { runOrchestrator } from "../orchestrator/orchestrator";
import { runVisualPipeline } from "../assets/visualPipeline";
import { assembleStudyGuide } from "../assembler/assembler";

export type GenerationPhase = "scope" | "orchestrate" | "visualize" | "assemble";

export interface GenerationProgress {
  phase: GenerationPhase;
  message: string;
  done: number;
  total: number;
}

export interface GenerationResult {
  sessionId: string;
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new AbortError();
}

// End-to-end generation: ingest/extract/synthesize (scope) -> per-section
// generate/verify/fix (orchestrate) -> resolve figures (visualize) -> merge into
// the viewer document (assemble). Each stage persists to disk, so a crash
// mid-run can be resumed. A passed AbortSignal cancels the whole run: it is
// bound to the LLM client (so in-flight model calls abort immediately) and
// checked between stages.
export async function runGeneration(
  input: ScopePipelineInput,
  config: LLMConfig,
  onProgress: (progress: GenerationProgress) => void,
  signal?: AbortSignal,
): Promise<GenerationResult> {
  const llm = new LLMClient(config, signal);

  throwIfAborted(signal);
  const scope = await runScopePipeline(
    input,
    llm,
    (update) =>
      onProgress({
        phase: "scope",
        message: update.message,
        done: update.done,
        total: update.total,
      }),
    signal,
  );

  throwIfAborted(signal);
  await runOrchestrator(
    scope.sessionId,
    scope.scopeDocument,
    llm,
    (update) =>
      onProgress({
        phase: "orchestrate",
        message: `${update.sectionTitle} — ${update.status}`,
        done: update.doneSections,
        total: update.totalSections,
      }),
    signal,
  );

  // Resolve {{figure}} placeholders into images / SVG diagrams. Non-fatal: a
  // failure here should never block shipping the (text) study guide — but a
  // cancellation must still propagate.
  throwIfAborted(signal);
  try {
    await runVisualPipeline(
      scope.sessionId,
      scope.scopeDocument,
      scope.rawDocs,
      llm,
      (done, total) =>
        onProgress({ phase: "visualize", message: "Resolving figures…", done, total }),
      signal,
    );
  } catch (error) {
    if (isAbortError(error)) throw error;
    console.warn("[generation] visual pipeline failed, shipping without figures", error);
  }

  throwIfAborted(signal);
  await assembleStudyGuide(scope.sessionId, scope.scopeDocument, (done, total) =>
    onProgress({ phase: "assemble", message: "Assembling study guide…", done, total }),
  );

  return { sessionId: scope.sessionId };
}
