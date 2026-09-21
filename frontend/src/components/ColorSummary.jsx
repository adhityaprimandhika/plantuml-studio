import ReactMarkdown from "react-markdown";

export default function ColorSummary({ state, onRun }) {
  const { loading, items, error } = state;
  return (
    <div className="tab-content">
      <div className="tab-actions">
        <button className="btn btn-primary" onClick={onRun} disabled={loading}>
          {loading ? "Analyzing…" : "Summarize by color"}
        </button>
      </div>
      {error && <div className="callout callout-error">{error}</div>}
      {!error && !loading && items && items.length === 0 && (
        <div className="empty-state">No color annotations (e.g. #FF0000, #LightBlue) were found in the diagram.</div>
      )}
      {!error && !items && !loading && (
        <div className="empty-state">
          Groups elements that share a color (e.g. <code>#Orange</code>) and explains what each group represents.
        </div>
      )}
      {items && items.length > 0 && (
        <div className="color-groups">
          {items.map((group) => (
            <div className="color-group" key={group.color}>
              <div className="color-group-header">
                <span className="swatch" style={{ background: swatchColor(group.color) }} />
                <span className="mono">{group.color}</span>
                <span className="paper-dim"> · {group.lines.length} line{group.lines.length === 1 ? "" : "s"}</span>
              </div>
              <div className="markdown">
                <ReactMarkdown>{group.summary}</ReactMarkdown>
              </div>
              <details>
                <summary>Show matched lines</summary>
                <pre className="mono matched-lines">{group.lines.join("\n")}</pre>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Best-effort mapping so the swatch renders something reasonable for both
// hex colors (#FF0000) and PlantUML/CSS named colors (#LightBlue).
function swatchColor(token) {
  return token;
}
