require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const chatRoutes = require("./routes/chat");
const searchRoutes = require("./routes/search");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/chat", chatRoutes);
app.use("/search", searchRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", engine: "Clawbot+Ollama", timestamp: new Date().toISOString() });
});

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🤖 AI Engine running on http://localhost:${PORT}`);
  });
}

module.exports = app;
