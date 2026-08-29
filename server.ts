import express from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Top-Level Request Deserialization (Ordering Guarantee)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Lazy Google GenAI Client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not defined in environment variables. AI calls may fail.');
    }
    aiClient = new GoogleGenAI({ apiKey: apiKey || '' });
  }
  return aiClient;
}

// Resilient Model Fallback Ladder
const MODEL_FALLBACK_LADDER = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
];

interface FallbackResult {
  text: string;
  modelUsed: string;
}

/**
 * Standard Helper Implementation:
 * Sequentially attempts content generation across the model fallback ladder
 * on recoverable status codes or transient errors.
 */
async function generateContentWithFallback(
  prompt: string,
  systemInstruction?: string,
  history?: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>
): Promise<FallbackResult> {
  const ai = getAIClient();
  let lastError: any = null;

  for (const model of MODEL_FALLBACK_LADDER) {
    try {
      console.log(`[Gemini Gateway] Attempting generation with model: ${model}`);
      
      const contents: any[] = [];
      if (history && Array.isArray(history)) {
        for (const msg of history) {
          if (msg.role && msg.parts && Array.isArray(msg.parts)) {
            contents.push({
              role: msg.role,
              parts: msg.parts.map(p => ({ text: String(p.text || '') })),
            });
          }
        }
      }
      contents.push({
        role: 'user',
        parts: [{ text: prompt }],
      });

      const response = await ai.models.generateContent({
        model,
        contents,
        config: systemInstruction ? { systemInstruction } : undefined,
      });

      const replyText = response.text || '';
      if (replyText) {
        console.log(`[Gemini Gateway] Successfully generated with ${model}`);
        return {
          text: replyText,
          modelUsed: model,
        };
      }
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.statusCode || err?.code;
      console.warn(`[Gemini Gateway] Model ${model} encountered error (status ${status}): ${err?.message || err}. Escalating to next fallback...`);
      // Continue to next model in ladder
    }
  }

  throw new Error(`All Gemini models in fallback ladder failed. Last error: ${lastError?.message || 'Unknown error'}`);
}

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    primaryModel: MODEL_FALLBACK_LADDER[0],
    modelsAvailable: MODEL_FALLBACK_LADDER,
  });
});

// Multi-Turn Reflection & Brainstorming API Endpoint
app.post('/api/gemini/reflect', async (req, res) => {
  try {
    // Defensive Payload Ingestion (Null-Safe Destructuring)
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    const mode = typeof body.mode === 'string' ? body.mode : 'reflection';
    const contextContent = typeof body.contextContent === 'string' ? body.contextContent : '';
    const entryTitle = typeof body.entryTitle === 'string' ? body.entryTitle : 'Untitled Reflection';
    const history = Array.isArray(body.history) ? body.history : [];

    if (!prompt && !contextContent) {
      return res.status(400).json({ error: 'Prompt or reflection content is required.' });
    }

    let systemInstruction = `You are a thoughtful, empathetic, and highly insightful reflection companion and personal thinking partner. 
Your goal is to help the user unpack their thoughts, explore underlying assumptions, identify patterns, and find clarity or creative solutions.

Guidelines:
- Tone: Warm, grounded, intelligent, non-judgmental, and encouraging.
- Structure: Use clear formatting with subtle bullet points, bold key concepts, and actionable insights.
- Do not repeat boilerplate greetings. Be direct, deeply resonant, and genuinely helpful.
- Respect the user's emotional state and provide constructive, supportive reflections.`;

    if (mode === 'brainstorm') {
      systemInstruction += `\nMode Focus: BRAINSTORMING. Provide 4-6 diverse, innovative, and creative perspectives, angles, or solutions. Organize into distinct categories (e.g. Quick Wins, Non-obvious Angles, Long-term Bets).`;
    } else if (mode === 'summary') {
      systemInstruction += `\nMode Focus: EXECUTIVE SUMMARY. Synthesize the reflection into:
1. Core Theme & Emotion
2. Key Realizations & Breakthroughs
3. Recommended Next Steps or Affirmations`;
    } else if (mode === 'coaching') {
      systemInstruction += `\nMode Focus: SOCRATIC COACHING. Challenge assumptions gently, ask 2-3 powerful self-inquiry questions, and provide a framework for self-discovery.`;
    } else {
      systemInstruction += `\nMode Focus: DEEP REFLECTION. Unpack the emotional nuances, highlight strengths, identify latent patterns, and offer a validating, clarifying reflection.`;
    }

    let userPromptWithContext = prompt;
    if (contextContent && contextContent.trim()) {
      userPromptWithContext = `[Journal Context: "${entryTitle}"]\n${contextContent}\n\n[User's Direct Note / Question]:\n${prompt || 'Please provide a reflection and insight on my entry above.'}`;
    }

    const result = await generateContentWithFallback(userPromptWithContext, systemInstruction, history);

    res.json({
      reply: result.text,
      modelUsed: result.modelUsed,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/reflect:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate reflection response.',
    });
  }
});

// Quick Executive Summary & Key Insights Endpoint
app.post('/api/gemini/summarize', async (req, res) => {
  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    const title = typeof body.title === 'string' ? body.title : 'Reflection';

    if (!content) {
      return res.status(400).json({ error: 'Content is required to generate a summary.' });
    }

    const systemInstruction = `You are an expert cognitive synthesizer. Summarize personal reflections cleanly.
Return a structured JSON with:
{
  "summary": "2-3 sentence concise executive synthesis capturing the essence",
  "keyInsights": ["Insight 1", "Insight 2", "Insight 3"],
  "suggestedTitle": "A catchy, poetic or clear 3-5 word title"
}
Output valid JSON only.`;

    const prompt = `Synthesize this reflection titled "${title}":\n\n${content}`;
    const result = await generateContentWithFallback(prompt, systemInstruction);

    let parsed: any = {};
    try {
      const cleanJson = result.text.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleanJson);
    } catch {
      parsed = {
        summary: result.text.slice(0, 200),
        keyInsights: ['Gained clarity on personal goals', 'Identified active thought patterns'],
        suggestedTitle: title,
      };
    }

    res.json({
      summary: parsed.summary || result.text,
      keyInsights: parsed.keyInsights || [],
      suggestedTitle: parsed.suggestedTitle || title,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/summarize:', error);
    res.status(500).json({
      error: error.message || 'Failed to synthesize summary.',
    });
  }
});

// Start Server with Vite Middleware in Dev or Static File Serving in Prod
async function startServer() {
  const distPath = path.resolve(process.cwd(), 'dist');
  const distIndexHtml = path.resolve(distPath, 'index.html');
  const hasDist = fs.existsSync(distIndexHtml);
  const isProduction = process.env.NODE_ENV === 'production' || hasDist;

  if (!isProduction) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      console.log('[Server] Vite middleware active for development');
    } catch (viteErr) {
      console.warn('[Server] Could not start Vite dev middleware, falling back to static files:', viteErr);
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(distIndexHtml);
      });
    }
  } else {
    console.log(`[Server] Serving production static assets from: ${distPath}`);
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (fs.existsSync(distIndexHtml)) {
        res.sendFile(distIndexHtml);
      } else {
        res.status(404).send('Application build not found. Please run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Reflections & Journal backend running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
