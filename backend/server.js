require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const renderRoutes = require("./routes/render");
const analyzeRoutes = require("./routes/analyze");

const app = express();
const PORT = process.env.PORT || 6000;

app.use(cors());
app.use(morgan("dev"));
app.use(express.json({ limit: "5mb" }));

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/render", renderRoutes);
app.use("/api/analyze", analyzeRoutes);

// Serve the built frontend (production single-container deployment)
const frontendDist = path.join(__dirname, "public");
app.use(express.static(frontendDist));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(frontendDist, "index.html"), (err) => {
    if (err) next();
  });
});

app.listen(PORT, () => {
  console.log(`PlantUML Studio backend listening on port ${PORT}`);
});
