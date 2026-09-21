import { useCallback, useRef, useState } from "react";

const MIN_SCALE = 0.25;
const MAX_SCALE = 4;
const STEP = 0.25;

export default function Preview({ imgUrl, status, error }) {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragState = useRef(null);

  const clamp = (s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));

  const zoomIn = () => setScale((s) => clamp(+(s + STEP).toFixed(2)));
  const zoomOut = () => setScale((s) => clamp(+(s - STEP).toFixed(2)));
  const resetView = () => {
    setScale(1);
    setPos({ x: 0, y: 0 });
  };

  // Ctrl/Cmd + scroll to zoom. Plain scroll still scrolls the panel normally.
  const onWheel = useCallback((e) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -STEP : STEP;
    setScale((s) => clamp(+(s + delta).toFixed(2)));
  }, []);

  const onMouseDown = (e) => {
    if (scale <= 1) return; // nothing to pan when the image already fits
    dragState.current = { startX: e.clientX, startY: e.clientY, origin: pos };
    e.currentTarget.classList.add("grabbing");
  };

  const onMouseMove = (e) => {
    if (!dragState.current) return;
    const { startX, startY, origin } = dragState.current;
    setPos({ x: origin.x + (e.clientX - startX), y: origin.y + (e.clientY - startY) });
  };

  const endDrag = (e) => {
    dragState.current = null;
    e.currentTarget.classList.remove("grabbing");
  };

  return (
    <div className="panel preview-panel">
      <div className="panel-title">
        Preview
        {status === "loading" && <span className="status-pill status-loading">rendering…</span>}
        {status === "error" && <span className="status-pill status-error">render error</span>}
        {status === "ready" && <span className="status-pill status-ready">ready</span>}
        {imgUrl && !error && (
          <div className="zoom-controls">
            <button className="zoom-btn" onClick={zoomOut} disabled={scale <= MIN_SCALE} aria-label="Zoom out">
              −
            </button>
            <span className="zoom-level mono">{Math.round(scale * 100)}%</span>
            <button className="zoom-btn" onClick={zoomIn} disabled={scale >= MAX_SCALE} aria-label="Zoom in">
              +
            </button>
            <button className="zoom-btn zoom-reset" onClick={resetView}>
              Reset
            </button>
          </div>
        )}
      </div>
      <div
        className="preview-surface"
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        style={{ cursor: imgUrl && scale > 1 ? "grab" : "default" }}
      >
        {error ? (
          <div className="empty-state error-state">{error}</div>
        ) : imgUrl ? (
          <img
            src={imgUrl}
            alt="Rendered PlantUML diagram"
            className="diagram-image"
            draggable={false}
            style={{
              transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
            }}
          />
        ) : (
          <div className="empty-state">Start typing PlantUML on the left.</div>
        )}
      </div>
    </div>
  );
}
