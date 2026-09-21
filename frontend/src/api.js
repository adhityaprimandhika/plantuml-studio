const BASE = "/api";

async function postJSON(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request to ${path} failed (${res.status})`);
  }
  return data;
}

// Fetches the rendered image directly (rather than just pointing an <img> at
// the URL) so a failure surfaces a real error message instead of a broken
// image icon with no explanation.
async function fetchImageBlobUrl(format, encoded) {
  const res = await fetch(`${BASE}/render/${format}/${encoded}`, { cache: "no-store" });
  if (!res.ok) {
    let message = `PlantUML render failed (${res.status})`;
    try {
      const data = await res.json();
      if (data.error) message = data.error;
    } catch {
      /* response wasn't JSON, keep default message */
    }
    throw new Error(message);
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export const api = {
  encode: (code) => postJSON("/render/encode", { code }),
  summarize: (code) => postJSON("/analyze/summary", { code }),
  summarizeColors: (code) => postJSON("/analyze/colors", { code }),
  renderUrl: (format, encoded) => `${BASE}/render/${format}/${encoded}`,
  fetchImageBlobUrl,
};
