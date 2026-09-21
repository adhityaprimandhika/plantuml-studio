const express = require("express");
const axios = require("axios");

const router = express.Router();

// Must point at the port your PlantUML container is published on.
// Your curl tests worked against 8090, so that is the default here.
const PLANTUML_SERVER_URL =
  process.env.PLANTUML_SERVER_URL || "http://localhost:8090";

// POST /api/render/:format  { code } -> image bytes
// The diagram source travels in the request body, so there is no URL length
// limit and no encoding step.
router.post("/:format", async (req, res) => {
  const { format } = req.params;
  const { code } = req.body || {};

  if (!["svg", "png"].includes(format)) {
    return res.status(400).json({ error: "format must be 'svg' or 'png'" });
  }
  if (typeof code !== "string" || !code.trim()) {
    return res
      .status(400)
      .json({ error: "Missing 'code' string in request body." });
  }

  // The PlantUML server's POST endpoint uses the body as-is (GET auto-wraps),
  // so add @startuml/@enduml when the user left them out.
  const source = /^\s*@start/m.test(code)
    ? code
    : `@startuml\n${code}\n@enduml`;

  try {
    const upstream = await axios.post(
      `${PLANTUML_SERVER_URL}/${format}`,
      source,
      {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
        responseType: "arraybuffer",
        validateStatus: () => true,
      },
    );
    if (upstream.status !== 200) {
      return res
        .status(502)
        .json({ error: `PlantUML server returned status ${upstream.status}` });
    }
    res.set("Content-Type", format === "svg" ? "image/svg+xml" : "image/png");
    res.set("Cache-Control", "no-store");
    res.send(upstream.data);
  } catch (err) {
    res
      .status(502)
      .json({ error: `Could not reach PlantUML server: ${err.message}` });
  }
});

module.exports = router;
