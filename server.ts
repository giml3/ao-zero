import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Proxy for Ollama to handle CORS and local networking in Docker
  app.post("/api/ollama", async (req, res) => {
    const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
    try {
      const response = await fetch(`${ollamaUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });
      
      if (!response.ok) {
        throw new Error(`Ollama error: ${response.statusText}`);
      }

      // Stream the response back to the client
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      res.setHeader("Content-Type", "application/x-ndjson");
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    } catch (error) {
      console.error("Ollama Proxy Error:", error);
      res.status(500).json({ error: "Failed to communicate with Ollama" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
