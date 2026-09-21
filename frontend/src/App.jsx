import { useEffect, useRef, useState } from "react";
import Editor from "./components/Editor.jsx";
import Preview from "./components/Preview.jsx";
import SummaryPanel from "./components/SummaryPanel.jsx";
import ColorSummary from "./components/ColorSummary.jsx";
import { api } from "./api.js";
import "./App.css";

const SAMPLE = `@startuml
actor User #LightBlue
participant "Web App" as App #LightBlue
participant "Auth Service" as Auth #Orange
database "Users DB" as DB #Orange

User -> App : submit login
App -> Auth : verify credentials
Auth -> DB : lookup user
DB --> Auth : user record
alt credentials valid
  Auth --> App : token
  App --> User : redirect to dashboard
else invalid
  Auth --> App : 401 error
  App --> User : show error #FF0000
end
@enduml`;

export default function App() {
  const [code, setCode] = useState(SAMPLE);
  const [imgUrl, setImgUrl] = useState(null);
  const [renderStatus, setRenderStatus] = useState("idle");
  const [renderError, setRenderError] = useState(null);
  const [activeTab, setActiveTab] = useState("summary");

  const [summaryState, setSummaryState] = useState({
    loading: false,
    text: null,
    error: null,
  });
  const [colorState, setColorState] = useState({
    loading: false,
    items: null,
    error: null,
  });

  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => renderDiagram(code), 500);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  async function renderDiagram(source) {
    if (!source.trim()) {
      setImgUrl(null);
      setRenderStatus("idle");
      return;
    }
    setRenderStatus("loading");
    setRenderError(null);
    try {
      const blobUrl = await api.renderImageBlobUrl("svg", source);
      setImgUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return blobUrl;
      });
      setRenderStatus("ready");
    } catch (err) {
      setImgUrl(null);
      setRenderError(err.message);
      setRenderStatus("error");
    }
  }

  async function runSummary() {
    setSummaryState({ loading: true, text: null, error: null });
    try {
      const { summary } = await api.summarize(code);
      setSummaryState({ loading: false, text: summary, error: null });
    } catch (err) {
      setSummaryState({ loading: false, text: null, error: err.message });
    }
  }

  async function runColorSummary() {
    setColorState({ loading: true, items: null, error: null });
    try {
      const { colors } = await api.summarizeColors(code);
      setColorState({ loading: false, items: colors, error: null });
    } catch (err) {
      setColorState({ loading: false, items: null, error: err.message });
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-title">
          PlantUML Studio<span className="paper-dim">.</span>
        </div>
        <div className="app-subtitle paper-dim">
          diagram · logic summary · boilerplate — via local Ollama
        </div>
      </header>

      <main className="workspace">
        <Editor code={code} onChange={setCode} />
        <Preview imgUrl={imgUrl} status={renderStatus} error={renderError} />

        <div className="panel analysis-panel">
          <div className="tabs">
            {[
              ["summary", "Logic"],
              ["colors", "By color"],
            ].map(([key, label]) => (
              <button
                key={key}
                className={`tab ${activeTab === key ? "tab-active" : ""}`}
                onClick={() => setActiveTab(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {activeTab === "summary" && (
            <SummaryPanel state={summaryState} onRun={runSummary} />
          )}
          {activeTab === "colors" && (
            <ColorSummary state={colorState} onRun={runColorSummary} />
          )}
        </div>
      </main>
    </div>
  );
}
