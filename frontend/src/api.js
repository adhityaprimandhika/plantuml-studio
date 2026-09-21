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
async function renderImageBlobUrl(format, code) {
  const res = await fetch(`${BASE}/render/${format}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
    cache: "no-store",
  });
  if (!res.ok) {
    let message = `PlantUML render failed (${res.status})`;
    try {
      const data = await res.json();
      if (data.error) message = data.error;
    } catch {
      /* keep default */
    }
    throw new Error(message);
  }
  return URL.createObjectURL(await res.blob());
}

export const api = {
  summarize: (code) => postJSON("/analyze/summary", { code }),
  summarizeColors: (code) => postJSON("/analyze/colors", { code }),
  renderImageBlobUrl,
};
