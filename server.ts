import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

// Standard ES module equivalents for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for large base64 uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Initialize Gemini client on server
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  // --- API Routes ---

  // 1. Google Search Grounding Endpoint
  app.post("/api/grounded-search", async (req, res) => {
    try {
      const { query } = req.body;
      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: query,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const searchChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const searchMetadata = response.candidates?.[0]?.groundingMetadata || {};

      res.json({
        answer: response.text,
        searchChunks,
        searchMetadata,
      });
    } catch (error: any) {
      console.error("Grounded Search Error:", error);
      res.status(500).json({ error: error.message || "Search grounding failed" });
    }
  });

  // 2. Lyria Music Generation Endpoint
  app.post("/api/generate-music", async (req, res) => {
    try {
      const { prompt, model, imageBytes, mimeType } = req.body;
      const targetModel = model || "lyria-3-clip-preview";

      let contents: any = prompt || "Generate atmospheric focus music";

      if (imageBytes) {
        contents = {
          parts: [
            { text: prompt || "Generate a soundtrack inspired by this image." },
            { inlineData: { data: imageBytes, mimeType: mimeType || "image/jpeg" } },
          ],
        };
      }

      const responseStream = await ai.models.generateContentStream({
        model: targetModel,
        contents,
      });

      let audioBase64 = "";
      let lyrics = "";
      let audioMimeType = "audio/wav";

      for await (const chunk of responseStream) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (!parts) continue;

        for (const part of parts) {
          if (part.inlineData?.data) {
            if (!audioBase64 && part.inlineData.mimeType) {
              audioMimeType = part.inlineData.mimeType;
            }
            audioBase64 += part.inlineData.data;
          }
          if (part.text && !lyrics) {
            lyrics = part.text;
          }
        }
      }

      res.json({
        audioBase64,
        lyrics,
        mimeType: audioMimeType,
      });
    } catch (error: any) {
      console.error("Music Generation Error:", error);
      res.status(500).json({ error: error.message || "Music generation failed" });
    }
  });

  // 3. Veo Video Generation (Start)
  app.post("/api/generate-video", async (req, res) => {
    try {
      const { prompt, imageBytes, mimeType, aspectRatio } = req.body;

      // Use specified veo-3.1-fast-generate-preview
      const requestConfig: any = {
        model: "veo-3.1-fast-generate-preview",
        prompt: prompt || "An elegant, cinematic drone sweep across a cybernetic cityscape",
        config: {
          numberOfVideos: 1,
          resolution: "720p",
          aspectRatio: aspectRatio === "9:16" ? "9:16" : "16:9",
        },
      };

      if (imageBytes) {
        requestConfig.image = {
          imageBytes: imageBytes,
          mimeType: mimeType || "image/png",
        };
      }

      console.log("Calling Veo with configuration:", {
        prompt: requestConfig.prompt,
        hasImage: !!imageBytes,
        aspectRatio: requestConfig.config.aspectRatio,
      });

      const operation = await ai.models.generateVideos(requestConfig);

      res.json({ operationName: operation.name });
    } catch (error: any) {
      console.error("Video Generation Start Error:", error);
      res.status(500).json({ error: error.message || "Video generation start failed" });
    }
  });

  // 4. Veo Video Status Polling
  app.post("/api/video-status", async (req, res) => {
    try {
      const { operationName } = req.body;
      if (!operationName) {
        return res.status(400).json({ error: "operationName is required" });
      }

      // Reconstruct minimal object
      const op: any = { name: operationName };
      const updated = await ai.operations.getVideosOperation({ operation: op });

      res.json({
        done: updated.done,
        error: updated.error,
        response: updated.response,
      });
    } catch (error: any) {
      console.error("Video Status Error:", error);
      res.status(500).json({ error: error.message || "Polling status failed" });
    }
  });

  // 5. Veo Video Download Proxy
  app.post("/api/video-download", async (req, res) => {
    try {
      const { operationName } = req.body;
      if (!operationName) {
        return res.status(400).json({ error: "operationName is required" });
      }

      const op: any = { name: operationName };
      const updated = await ai.operations.getVideosOperation({ operation: op });
      const uri = updated.response?.generatedVideos?.[0]?.video?.uri;

      if (!uri) {
        return res.status(404).json({ error: "Video URI not found" });
      }

      console.log("Fetching video from source URI:", uri);
      const videoRes = await fetch(uri, {
        headers: { "x-goog-api-key": process.env.GEMINI_API_KEY || "" },
      });

      if (!videoRes.ok) {
        throw new Error(`Failed to fetch video source: ${videoRes.statusText}`);
      }

      const buffer = await videoRes.arrayBuffer();

      res.setHeader("Content-Type", "video/mp4");
      res.send(Buffer.from(buffer));
    } catch (error: any) {
      console.error("Video Download Proxy Error:", error);
      res.status(500).json({ error: error.message || "Downloading video failed" });
    }
  });

  // Serve static files / Vite middleware
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
    console.log(`[Cyberspace Server] Listening at http://localhost:${PORT}`);
  });
}

startServer();
