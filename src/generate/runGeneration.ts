import { AbortError, isAbortError } from "../llm/client";
import { clientFor, type LLMPlan } from "../llm/factory";
import { runScopePipeline, type ScopePipelineInput } from "../scope/pipeline";
import { runOrchestrator } from "../orchestrator/orchestrator";
import { runVisualPipeline } from "../assets/visualPipeline";
import { assembleStudyGuide } from "../assembler/assembler";
import {
  buildAllSectionContexts,
  type SearchConfig,
  type SectionSearchContext,
} from "../search/webSearch";

export type GenerationPhase =
  | "scope"
  | "search"
  | "orchestrate"
  | "visualize"
  | "assemble";

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
  plan: LLMPlan,
  onProgress: (progress: GenerationProgress) => void,
  signal?: AbortSignal,
  searchConfig?: SearchConfig,
): Promise<GenerationResult> {
  // Base client; each pipeline stage narrows it to its task via withTask(),
  // which (in auto mode) re-ranks the available models for that task.
  const llm = clientFor(plan, "general", signal);

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

  // Optional web-search enrichment: gather supplementary context per section
  // before authoring. Non-fatal — a search failure must never block generation.
  let searchContexts: Map<string, SectionSearchContext> | undefined;
  if (searchConfig?.enabled) {
    throwIfAborted(signal);
    try {
      const cache = await buildAllSectionContexts(
        scope.scopeDocument,
        searchConfig,
        scope.sessionId,
        (done, total) =>
          onProgress({
            phase: "search",
            message: "Searching the web for supplementary context…",
            done,
            total,
          }),
      );
      searchContexts = new Map(
        cache.sections.map((section) => [section.sectionId, section]),
      );
    } catch (error) {
      if (isAbortError(error)) throw error;
      console.warn("[generation] web search enrichment failed, continuing without it", error);
    }
  }

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
    searchContexts,
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
