const express = require("express");
const ollama = require("../services/ollamaService");
const { extractColorGroups } = require("../services/colorParser");

const router = express.Router();

function requireCode(req, res) {
  const { code } = req.body || {};
  if (typeof code !== "string" || !code.trim()) {
    res.status(400).json({ error: "Missing 'code' string in request body." });
    return null;
  }
  return code;
}

// POST /api/analyze/summary  { code } -> { summary }
router.post("/summary", async (req, res) => {
  const code = requireCode(req, res);
  if (!code) return;
  try {
    const summary = await ollama.summarizeLogic(code);
    res.json({ summary });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// POST /api/analyze/colors  { code } -> { colors: [{ color, lines, summary }] }
router.post("/colors", async (req, res) => {
  const code = requireCode(req, res);
  if (!code) return;

  const groups = extractColorGroups(code);
  if (groups.length === 0) {
    return res.json({ colors: [] });
  }

  try {
    const results = await Promise.all(
      groups.map(async (g) => ({
        color: g.color,
        lines: g.lines,
        summary: await ollama.summarizeColorGroup(g.color, g.lines),
      })),
    );
    res.json({ colors: results });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

module.exports = router;
