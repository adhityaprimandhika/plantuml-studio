const express = require("express");
const axios = require("axios");
const plantumlEncoder = require("plantuml-encoder");

const router = express.Router();

const PLANTUML_SERVER_URL = process.env.PLANTUML_SERVER_URL || "http://localhost:8080";

// POST /api/render/encode  { code } -> { encoded }
// Lets the frontend build an image URL without duplicating the encoder logic.
router.post("/encode", (req, res) => {
  const { code } = req.body || {};
  if (typeof code !== "string" || !code.trim()) {
    return res.status(400).json({ error: "Missing 'code' string in request body." });
  }
  try {
    const encoded = plantumlEncoder.encode(code);
    res.json({ encoded });
  } catch (err) {
    res.status(500).json({ error: `Failed to encode PlantUML: ${err.message}` });
  }
});

// GET /api/render/:format/:encoded -> proxies the rendered image bytes
// format: 'svg' | 'png'
router.get("/:format/:encoded", async (req, res) => {
  const { format, encoded } = req.params;
  if (!["svg", "png"].includes(format)) {
    return res.status(400).json({ error: "format must be 'svg' or 'png'" });
  }
  try {
    const upstream = await axios.get(`${PLANTUML_SERVER_URL}/${format}/${encoded}`, {
      responseType: "arraybuffer",
      validateStatus: () => true,
    });
    if (upstream.status !== 200) {
      return res.status(502).json({ error: `PlantUML server returned status ${upstream.status}` });
    }
    res.set("Content-Type", format === "svg" ? "image/svg+xml" : "image/png");
    res.set("Cache-Control", "no-store");
    res.send(upstream.data);
  } catch (err) {
    res.status(502).json({ error: `Could not reach PlantUML server: ${err.message}` });
  }
});

module.exports = router;
