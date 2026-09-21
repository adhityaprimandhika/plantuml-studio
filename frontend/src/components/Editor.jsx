export default function Editor({ code, onChange }) {
  const lineCount = code.split("\n").length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1).join("\n");

  return (
    <div className="panel editor-panel">
      <div className="panel-title">Source</div>
      <div className="editor-wrap">
        <pre className="line-numbers mono" aria-hidden="true">
          {lineNumbers}
        </pre>
        <textarea
          className="code-editor mono"
          value={code}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          wrap="off"
        />
      </div>
    </div>
  );
}
