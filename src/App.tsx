import { useState } from "react";
import { useThemeStore } from "./store/theme";
import { useNotebooksStore } from "./store/notebooks";
import { TabBar } from "./components/TabBar";
import { NotebookPage } from "./components/NotebookPage";
import { SessionPicker } from "./components/SessionPicker";
import { SettingsModal } from "./components/SettingsModal";
import { GenerateModal } from "./components/GenerateModal";
import { GenerationIndicator } from "./components/GenerationIndicator";

export function App() {
  const resolved = useThemeStore((state) => state.resolved);
  const toggle = useThemeStore((state) => state.toggle);

  const tabs = useNotebooksStore((state) => state.tabs);
  const activeSessionId = useNotebooksStore((state) => state.activeSessionId);
  const activeTab = tabs.find((tab) => tab.sessionId === activeSessionId);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <span className="app-brand">Corex</span>
        <TabBar onNewTab={() => setPickerOpen(true)} />
        <button className="topbar-new" onClick={() => setGenerateOpen(true)}>
          New
        </button>
        <button
          onClick={() => setSettingsOpen(true)}
          aria-label="Settings"
          className="theme-btn"
        >
          {"\u2699"}
        </button>
        <button onClick={toggle} aria-label="Toggle theme" className="theme-btn">
          {resolved === "dark" ? "\u2600" : "\u263e"}
        </button>
      </header>

      <main className="app-body">
        {activeTab ? (
          <NotebookPage tab={activeTab} />
        ) : (
          <div className="empty-state">
            <h1>Corex</h1>
            <p className="muted">
              Generate a study guide from your course materials, or open an
              existing notebook.
            </p>
            <div className="empty-actions">
              <button className="primary" onClick={() => setGenerateOpen(true)}>
                New notebook
              </button>
              <button onClick={() => setPickerOpen(true)}>
                Open existing
              </button>
            </div>
          </div>
        )}
      </main>

      {pickerOpen && <SessionPicker onClose={() => setPickerOpen(false)} />}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
      {generateOpen && (
        <GenerateModal onClose={() => setGenerateOpen(false)} />
      )}

      <GenerationIndicator />
    </div>
  );
}
