import ReactMarkdown from "react-markdown";

export default function SummaryPanel({ state, onRun }) {
  const { loading, text, error } = state;
  return (
    <div className="tab-content">
      <div className="tab-actions">
        <button className="btn btn-primary" onClick={onRun} disabled={loading}>
          {loading ? "Summarizing…" : "Summarize logic"}
        </button>
      </div>
      {error && <div className="callout callout-error">{error}</div>}
      {!error && !text && !loading && (
        <div className="empty-state">Run this to get a plain-language explanation of the diagram's flow.</div>
      )}
      {text && (
        <div className="markdown">
          <ReactMarkdown>{text}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
