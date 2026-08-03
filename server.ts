import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { analyzeCodeLocally } from "./src/utils/localAuditEngine";

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "10mb" }));

  // 1. Health check route
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // 2. Fetch url source code proxy route
  app.post("/api/fetch-url", async (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      let targetUrl = url.trim();
      if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = "https://" + targetUrl;
      }

      const fetchOptions = {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        redirect: "follow" as const,
        signal: AbortSignal.timeout(10000), // 10-second timeout
      };

      let response = await fetch(targetUrl, fetchOptions);

      // If 404 and URL had a subpath, try falling back to base domain or toggling trailing slash
      if (response.status === 404) {
        try {
          const parsed = new URL(targetUrl);
          if (parsed.pathname && parsed.pathname !== "/") {
            const baseUrl = parsed.origin;
            console.log(`[fetch-url] Initial URL returned 404, trying base origin fallback: ${baseUrl}`);
            const baseResponse = await fetch(baseUrl, fetchOptions);
            if (baseResponse.ok) {
              response = baseResponse;
            }
          } else if (targetUrl.endsWith("/")) {
            const noSlash = targetUrl.slice(0, -1);
            const altResponse = await fetch(noSlash, fetchOptions);
            if (altResponse.ok) {
              response = altResponse;
            }
          }
        } catch {
          // ignore fallback attempt errors
        }
      }

      if (!response.ok) {
        let hint = "";
        if (response.status === 404) {
          hint = "The website address returned 404 Not Found. Check for typos or paste/upload your project code directly into the sandbox below.";
        } else if (response.status === 403 || response.status === 401) {
          hint = "The website is protected or blocking automated requests (403/401). Paste your code directly into the sandbox below.";
        } else {
          hint = `Server returned status ${response.status} ${response.statusText}. You can paste your source code or upload a ZIP file directly below.`;
        }

        return res.status(400).json({
          error: hint,
          status: response.status,
        });
      }

      const htmlContent = await response.text();
      const cleanHtml = htmlContent.slice(0, 150000); // 150k limit

      return res.json({
        html: cleanHtml,
        length: htmlContent.length,
        truncated: htmlContent.length > 150000,
      });
    } catch (error: any) {
      console.error("Fetch URL error:", error);
      return res.status(400).json({
        error: error.message || "Unable to reach the web server. Check the URL or use the Local Code Loader below to upload/paste source code.",
      });
    }
  });

  // 3. UI/UX Audit Route (Deterministic Local Engine - No API key required)
  app.post("/api/audit", async (req, res) => {
    const { url, pastedCode, completionStage } = req.body;

    if (!pastedCode && !url) {
      return res.status(400).json({ error: "Please enter a URL or paste code to analyze" });
    }

    const stage = Number(completionStage) || 5;

    try {
      const auditData = analyzeCodeLocally(pastedCode || "", url || "", stage);
      return res.json(auditData);
    } catch (error: any) {
      console.error("Audit Error:", error);
      return res.status(500).json({
        error: error.message || "An unexpected error occurred during the aesthetic audit.",
      });
    }
  });

  // Serve Vite client app in development, or compiled static files in production
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
    console.log(`[Server] running on http://0.0.0.0:${PORT} under ${process.env.NODE_ENV || "development"} mode`);
  });
}

startServer();
