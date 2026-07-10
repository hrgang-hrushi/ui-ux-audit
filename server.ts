import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const PORT = 3000;

// Helper to safely get the Google GenAI client
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not defined. Please configure it in the Secrets panel in AI Studio.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

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

      const response = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        },
        signal: AbortSignal.timeout(8000), // 8-second timeout
      });

      if (!response.ok) {
        return res.status(response.status).json({
          error: `Failed to fetch website. Server returned status: ${response.status} ${response.statusText}`,
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
      return res.status(500).json({
        error: error.message || "Unable to reach the server. Make sure the URL is public and spelled correctly.",
      });
    }
  });

  // 3. UI/UX Audit Route
  app.post("/api/audit", async (req, res) => {
    const { url, pastedCode, completionStage } = req.body;

    if (!pastedCode && !url) {
      return res.status(400).json({ error: "Please enter a URL or paste code to analyze" });
    }

    const stage = Number(completionStage) || 5;
    let stageDescription = "";
    if (stage <= 3) {
      stageDescription = `Early Concept/Skeleton (Score ${stage}/10). Focus on general page layout, content structure, grid setup, and flow. Don't worry about tiny animations or advanced shadows yet. Focus on building solid foundations.`;
    } else if (stage <= 7) {
      stageDescription = `Functional Prototype (Score ${stage}/10). Focus on spacing consistency (margins/paddings), typography pairings, color palette harmony, contrast, and alignment. Check for common AI visual clichés.`;
    } else {
      stageDescription = `Polished Release (Score ${stage}/10). Focus on micro-interactions, subtle borders, fine typography details (letter-spacing, line-heights, tracking), advanced hover/active states, custom shadows, and elegant enter transitions. Help polish this to perfection.`;
    }

    try {
      const ai = getGenAI();

      const analysisPrompt = `
        You are a world-class UI/UX Auditor and Aesthetic Specialist, known for crafting pristine, high-end Swiss minimalist, editorial, and sophisticated digital products. 
        Your mission is to audit the provided website code/HTML and remove any signs of "AI Slop" or generic AI-generated templates.
        
        What is "AI Slop" in web design?
        - Overuse of identical bright purple-to-blue linear gradients (\`bg-gradient-to-r from-purple-500 to-blue-500\`) for every button, header, and card glow.
        - Cluttered page margins, unnecessary network status labels ("● ACTIVE", "● ONLINE") in corners, container port indicators, system telemetry text, or fake terminal log feeds that try to look high-tech but add zero functional value.
        - Overly rounded cards with deep, harsh drop shadows on every single block (\`rounded-2xl shadow-2xl bg-white\`).
        - Bad spacing ratios where everything is padded identically (robotic \`p-4\` or \`p-6\` everywhere with no structural rhythm).
        - Default unadjusted fonts without customized letter-spacing (tracking) or line-heights.
        - Meaningless emoji-cluttered dashboard layouts that lack visual restraint.
        - Unrequested visual options like theme switchers or presets that clutter a simple utility.

        Input Details:
        - Website Source/HTML to Audit: 
        --- START SOURCE CODE ---
        ${(pastedCode || "").slice(0, 80000)}
        --- END SOURCE CODE ---
        - Target Website URL (if any): ${url || "Not provided"}
        - User's Self-Reported Project Completion Stage: ${stage}/10
        - Stage-Specific Instructions: ${stageDescription}

        Perform a rigorous, objective UI/UX audit. Provide constructive, highly professional, concrete design critiques. Tailor the tone of suggestions to the completion stage.
        Format the output strictly as a JSON object matching the defined schema.

        CRITICAL DIRECTION FOR THE 'aiPrompt' FIELD:
        The generated prompt must be a masterclass in AI instruction writing. It must NOT contain generic placeholder phrases like "implement the suggestions". It must be a bespoke instruction sheet referencing actual classes, markup, and components from the audited source code.
        Ensure it details:
        1. Exact visual replacements (e.g., "Change the class list on your primary login form card from 'rounded-3xl shadow-2xl p-6 bg-gradient-to-r...' to 'rounded-xl border border-[#2A2A2D] bg-[#141416] p-8 text-[#E0E0E0]'").
        2. Exact Typography rules: Font stack (e.g., Inter), specific line heights (leading-relaxed, leading-normal), and letter spacing tracking (tracking-tight or tracking-wide).
        3. Strict layout reflow rules: Specify how the flex/grid containers should be spaced using a strict 8px/12px/16px baseline.
        4. Absolute Code Integrity Rule: Order the target AI to preserve every single React hook (useState, useEffect), prop signature, click handler (onClick), and form submit function exactly as they are, modifying ONLY the styling and layout properties.
      `;

      // Define response schema
      const auditResponseSchema = {
        type: Type.OBJECT,
        properties: {
          projectName: { type: Type.STRING, description: "Extracted or inferred project name" },
          overallScore: { type: Type.INTEGER, description: "A calculated UX/UI score out of 100 based on aesthetic qualities" },
          completionStageLabel: { type: Type.STRING, description: "Readable name of the completion stage based on the 1-10 scale" },
          categories: {
            type: Type.OBJECT,
            properties: {
              typography: {
                type: Type.OBJECT,
                properties: {
                  score: { type: Type.INTEGER },
                  issues: { type: Type.ARRAY, items: { type: Type.STRING } },
                  recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["score", "issues", "recommendations"]
              },
              spacing: {
                type: Type.OBJECT,
                properties: {
                  score: { type: Type.INTEGER },
                  issues: { type: Type.ARRAY, items: { type: Type.STRING } },
                  recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["score", "issues", "recommendations"]
              },
              hierarchy: {
                type: Type.OBJECT,
                properties: {
                  score: { type: Type.INTEGER },
                  issues: { type: Type.ARRAY, items: { type: Type.STRING } },
                  recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["score", "issues", "recommendations"]
              },
              colorHarmony: {
                type: Type.OBJECT,
                properties: {
                  score: { type: Type.INTEGER },
                  issues: { type: Type.ARRAY, items: { type: Type.STRING } },
                  recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["score", "issues", "recommendations"]
              },
              interactions: {
                type: Type.OBJECT,
                properties: {
                  score: { type: Type.INTEGER },
                  issues: { type: Type.ARRAY, items: { type: Type.STRING } },
                  recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["score", "issues", "recommendations"]
              }
            },
            required: ["typography", "spacing", "hierarchy", "colorHarmony", "interactions"]
          },
          aiSlopAlerts: {
            type: Type.ARRAY,
            description: "List of specific generic AI design clichés found",
            items: {
              type: Type.OBJECT,
              properties: {
                issue: { type: Type.STRING },
                severity: { type: Type.STRING },
                description: { type: Type.STRING },
                fix: { type: Type.STRING }
              },
              required: ["issue", "severity", "description", "fix"]
            }
          },
          microFeedback: {
            type: Type.ARRAY,
            description: "Specific minor details that require tweaking with before and after style suggestions",
            items: {
              type: Type.OBJECT,
              properties: {
                element: { type: Type.STRING },
                finding: { type: Type.STRING },
                beforeCode: { type: Type.STRING },
                afterCode: { type: Type.STRING },
                rationale: { type: Type.STRING }
              },
              required: ["element", "finding", "beforeCode", "afterCode", "rationale"]
            }
          },
          aiPrompt: {
            type: Type.STRING,
            description: "A comprehensive developer prompt that the user can copy-paste back to their coding AI to implement all suggestions and make it a 100/100 masterpiece. Avoid generic placeholder prompts; make it highly custom and precise, referencing their specific file tags, classes, and colors."
          }
        },
        required: ["projectName", "overallScore", "completionStageLabel", "categories", "aiSlopAlerts", "microFeedback", "aiPrompt"]
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: analysisPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: auditResponseSchema,
          temperature: 0.2,
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error("No response received from Gemini API");
      }

      const auditData = JSON.parse(text);
      return res.json(auditData);

    } catch (error: any) {
      console.error("Gemini Audit Error:", error);
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
