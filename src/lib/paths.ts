// Synchronous path join. Tauri's path.join() is async (it bridges to Rust);
// since the paths here all derive from an already-resolved appDataDir, a local
// joiner keeps the call sites synchronous. The Tauri fs plugin normalizes
// forward slashes on Windows, so "/" is safe to emit on every platform.
export function joinPath(...segments: string[]): string {
  return segments
    .map((segment, index) =>
      index === 0
        ? segment.replace(/[\\/]+$/, "")
        : segment.replace(/^[\\/]+|[\\/]+$/g, ""),
    )
    .filter((segment) => segment.length > 0)
    .join("/");
}
