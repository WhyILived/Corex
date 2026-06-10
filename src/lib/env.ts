// Detect whether we're running inside the Tauri runtime (vs. a plain browser
// dev session via `npm run dev`). Disk-backed features only work under Tauri.
export function isTauriRuntime(): boolean {
  return (
    typeof window !== "undefined" &&
    ("__TAURI_INTERNALS__" in window || "__TAURI__" in window)
  );
}
