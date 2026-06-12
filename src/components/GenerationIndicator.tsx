import {
  PHASE_LABELS,
  useGenerationStore,
  type GenerationJob,
} from "../store/generation";

// Floating, app-wide view of background generation jobs. Lets a run started in
// the New-notebook modal stay visible (and cancellable) after the modal closes.
export function GenerationIndicator() {
  const jobs = useGenerationStore((s) => s.jobs);
  const cancel = useGenerationStore((s) => s.cancel);
  const dismiss = useGenerationStore((s) => s.dismiss);

  // 'done' jobs already opened a notebook tab; no toast needed for them.
  const visible = jobs.filter((job) => job.status !== "done");
  if (visible.length === 0) return null;

  return (
    <div className="gen-indicator" aria-label="Background generations">
      {visible.map((job) => (
        <JobChip
          key={job.id}
          job={job}
          onCancel={() => cancel(job.id)}
          onDismiss={() => dismiss(job.id)}
        />
      ))}
    </div>
  );
}

function statusLine(job: GenerationJob): string {
  switch (job.status) {
    case "queued":
      return "Queued";
    case "cancelling":
      return "Cancelling…";
    case "cancelled":
      return "Cancelled";
    case "error":
      return job.error ?? "Failed";
    default:
      return job.progress ? PHASE_LABELS[job.progress.phase] : "Starting…";
  }
}

function JobChip({
  job,
  onCancel,
  onDismiss,
}: {
  job: GenerationJob;
  onCancel: () => void;
  onDismiss: () => void;
}) {
  const active =
    job.status === "queued" ||
    job.status === "running" ||
    job.status === "cancelling";
  const finished = job.status === "error" || job.status === "cancelled";

  return (
    <div className={`gen-chip gen-chip-${job.status}`}>
      <div className="gen-chip-head">
        <span className="gen-chip-title" title={job.title}>
          {job.title}
        </span>
        {active ? (
          <button
            className="gen-chip-x"
            aria-label="Cancel generation"
            title="Cancel"
            onClick={onCancel}
            disabled={job.status === "cancelling"}
          >
            {"×"}
          </button>
        ) : (
          <button
            className="gen-chip-x"
            aria-label="Dismiss"
            title="Dismiss"
            onClick={onDismiss}
          >
            {"×"}
          </button>
        )}
      </div>
      {job.status === "running" && (
        <div className="progress-bar gen-chip-bar">
          <div className="progress-fill" style={{ width: `${job.percent}%` }} />
        </div>
      )}
      <div className="gen-chip-status" title={statusLine(job)}>
        {job.status === "running" && <span className="gen-chip-pct">{job.percent}%</span>}{" "}
        <span className={finished ? "muted" : ""}>{statusLine(job)}</span>
      </div>
    </div>
  );
}
