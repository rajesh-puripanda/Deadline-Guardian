import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

// Lazy-loaded Gemini AI client helper
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in the environment. Please add it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
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
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Scanner endpoint: Reads Gmail and Google Calendar events and extracts deadlines via Gemini
  app.post("/api/scan-deadlines", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Missing or invalid Authorization header" });
        return;
      }
      const accessToken = authHeader.split(" ")[1];
      const todayStr = req.body.today || new Date().toISOString().split("T")[0];

      // 1. Fetch Gmail messages
      let emails: any[] = [];
      try {
        const gmailListRes = await fetch(
          "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=8",
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        if (gmailListRes.ok) {
          const listData = await gmailListRes.json();
          if (listData.messages && listData.messages.length > 0) {
            const fetchPromises = listData.messages.map(async (msg: any) => {
              const msgRes = await fetch(
                `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=minimal`,
                {
                  headers: { Authorization: `Bearer ${accessToken}` },
                }
              );
              if (msgRes.ok) {
                return await msgRes.json();
              }
              return null;
            });
            const fetched = await Promise.all(fetchPromises);
            emails = fetched.filter(Boolean).map((e: any) => ({
              id: e.id,
              snippet: e.snippet,
              // Try to find Subject or Date headers
              subject: e.payload?.headers?.find((h: any) => h.name === "Subject")?.value || "No Subject",
              from: e.payload?.headers?.find((h: any) => h.name === "From")?.value || "Unknown",
            }));
          }
        } else {
          console.warn("Gmail API list call failed:", await gmailListRes.text());
        }
      } catch (err) {
        console.error("Error fetching Gmail messages:", err);
      }

      // 2. Fetch Calendar events
      let events: any[] = [];
      try {
        const timeMin = new Date().toISOString();
        const calRes = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
            timeMin
          )}&maxResults=8&orderBy=startTime&singleEvents=true`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        if (calRes.ok) {
          const calData = await calRes.json();
          if (calData.items) {
            events = calData.items.map((ev: any) => ({
              id: ev.id,
              summary: ev.summary || "No Title",
              description: ev.description || "",
              start: ev.start?.dateTime || ev.start?.date || "",
              end: ev.end?.dateTime || ev.end?.date || "",
            }));
          }
        } else {
          console.warn("Calendar API call failed:", await calRes.text());
        }
      } catch (err) {
        console.error("Error fetching Calendar events:", err);
      }

      // If both lists are empty, return early
      if (emails.length === 0 && events.length === 0) {
        res.json({ deadlines: [] });
        return;
      }

      // 3. Process with Gemini to extract deadlines
      const ai = getGeminiClient();
      const dataPayload = {
        referenceDate: todayStr,
        emails,
        calendarEvents: events,
      };

      const prompt = `You are the core of Deadline Guardian, an elite AI productivity assistant.
Your task is to analyze the user's recent email snippets and Google Calendar events, and extract any upcoming actionable deadlines, commitments, project milestones, invoices, assignments, or critical dues.

Reference date (Today is): ${todayStr}

Data from user's account:
${JSON.stringify(dataPayload, null, 2)}

Instructions:
1. Identify deadlines or tasks that have a clear or implicit due date.
2. For emails: scan snippets for dates, timelines (e.g. "by Friday", "due in two weeks", "deadline: June 30").
3. For calendar events: any event that represents a deadline, assignment, or milestone. Ignore regular recurring social events unless they have "due", "deadline", "milestone", "exam", "deliverable" or similar in their titles.
4. Calculate the precise due date in "YYYY-MM-DD" format relative to the reference date: ${todayStr}.
5. Assign a confidence score ('high', 'medium', 'low') and explain the source (e.g., "From email subject: ...").
6. Provide a concise description of the commitment.

Return a list of deadlines strictly matching the response schema.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              deadlines: {
                type: Type.ARRAY,
                description: "List of extracted deadlines.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: {
                      type: Type.STRING,
                      description: "The name or brief title of the deadline task.",
                    },
                    dueDate: {
                      type: Type.STRING,
                      description: "Due date in YYYY-MM-DD format.",
                    },
                    description: {
                      type: Type.STRING,
                      description: "Concise description of the commitment, project, or invoice.",
                    },
                    source: {
                      type: Type.STRING,
                      description: "Source identifier ('gmail' or 'calendar').",
                    },
                    originalSnippet: {
                      type: Type.STRING,
                      description: "The snippet or event context that triggered this deadline.",
                    },
                    confidence: {
                      type: Type.STRING,
                      description: "Confidence rating: 'high', 'medium', or 'low'.",
                    },
                  },
                  required: ["title", "dueDate", "description", "source", "confidence"],
                },
              },
            },
            required: ["deadlines"],
          },
        },
      });

      const resultText = response.text || "{\"deadlines\":[]}";
      res.json(JSON.parse(resultText));
    } catch (err: any) {
      console.error("Error in scan-deadlines API:", err);
      res.status(500).json({ error: err.message || "Failed to scan deadlines" });
    }
  });

  // Smart Planner endpoint: Generates 3-5 subtasks for a deadline and schedules them
  app.post("/api/smart-planner", async (req, res) => {
    try {
      const { title, description, dueDate, today } = req.body;
      if (!title || !dueDate) {
        res.status(400).json({ error: "Title and dueDate are required" });
        return;
      }

      const todayStr = today || new Date().toISOString().split("T")[0];
      const ai = getGeminiClient();

      const prompt = `You are a professional project planner.
Break down the main task: "${title}" (Description: ${description || "No description"}) which is due on ${dueDate}.
Today's date is ${todayStr}.

Create exactly 3 to 5 logical, sequential, actionable subtasks to ensure this deadline is successfully met.
For each subtask:
1. Provide a title.
2. Provide a suggested due date (must be between ${todayStr} and ${dueDate} in YYYY-MM-DD format). Make sure they are spread out chronologically.
3. Provide high-level advice/notes for this specific subtask (1-2 sentences).

Return a list of subtasks strictly matching the response schema.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subtasks: {
                type: Type.ARRAY,
                description: "Array of subtasks.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: "Title of the subtask." },
                    dueDate: { type: Type.STRING, description: "Scheduled due date in YYYY-MM-DD format." },
                    notes: { type: Type.STRING, description: "Quick advice or description for completing this subtask." },
                  },
                  required: ["title", "dueDate", "notes"],
                },
              },
            },
            required: ["subtasks"],
          },
        },
      });

      const resultText = response.text || "{\"subtasks\":[]}";
      res.json(JSON.parse(resultText));
    } catch (err: any) {
      console.error("Error in smart-planner API:", err);
      res.status(500).json({ error: err.message || "Failed to plan subtasks" });
    }
  });

  // Auto-Draft Generator endpoint: Creates starter drafts, outlines, or emails
  app.post("/api/generate-starter", async (req, res) => {
    try {
      const { taskTitle, taskDescription, subtaskTitle, type } = req.body;
      if (!taskTitle) {
        res.status(400).json({ error: "Task title is required" });
        return;
      }

      const ai = getGeminiClient();
      const formatType = type || "outline"; // outline, email, draft

      let prompt = "";
      if (formatType === "email") {
        prompt = `Write a professional email draft or response related to the following task: "${taskTitle}".
${subtaskTitle ? `Focus on this specific subtask milestone: "${subtaskTitle}".` : ""}
${taskDescription ? `Context details: ${taskDescription}` : ""}

Keep it concise, elegant, structured, and easy to copy. Place placeholders like [Name] where appropriate.`;
      } else if (formatType === "outline") {
        prompt = `Generate a comprehensive step-by-step outline or roadmap to kickstart and successfully execute this task: "${taskTitle}".
${subtaskTitle ? `Focus on this specific subtask: "${subtaskTitle}".` : ""}
${taskDescription ? `Context details: ${taskDescription}` : ""}

Keep it extremely practical, structured with bullet points, and actionable for someone facing procrastination.`;
      } else {
        prompt = `Write a first draft or creative content starter for the following task: "${taskTitle}".
${subtaskTitle ? `Focus on this specific milestone: "${subtaskTitle}".` : ""}
${taskDescription ? `Context details: ${taskDescription}` : ""}

Provide a strong introduction, key sections/arguments, and helpful draft text that the user can refine. Make it polished.`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ draft: response.text || "Failed to generate a draft." });
    } catch (err: any) {
      console.error("Error in generate-starter API:", err);
      res.status(500).json({ error: err.message || "Failed to generate starter draft" });
    }
  });

  // Voice Query Assistant endpoint: Returns spoken-style text summaries
  app.post("/api/voice-query", async (req, res) => {
    try {
      const { query, deadlines, today } = req.body;
      if (!query) {
        res.status(400).json({ error: "Query is required" });
        return;
      }

      const todayStr = today || new Date().toISOString().split("T")[0];
      const ai = getGeminiClient();

      const prompt = `You are the voice of Deadline Guardian, a supportive but extremely clear-sighted AI productivity coach.
The user speaks to you: "${query}"

Here is the user's active deadlines list:
${JSON.stringify(deadlines || [], null, 2)}

Today's date is: ${todayStr}

Instructions:
1. Keep the tone friendly, helpful, slightly urging, and highly clear.
2. Provide a brief, scannable response (no more than 3-5 sentences).
3. Directly answer what is due soon, highlighting critical ones (due in <3 days).
4. Do NOT use markdown bold/bullet syntax excessively as this text might be read aloud by speech synthesis. Keep it plain-text friendly.
5. If they ask about due tasks, summarize concisely.

Return the response in a JSON object with a 'text' property.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING, description: "The spoken response text." },
            },
            required: ["text"],
          },
        },
      });

      const resultText = response.text || "{\"text\":\"I'm here to help, but I couldn't summarize your deadlines right now.\"}";
      res.json(JSON.parse(resultText));
    } catch (err: any) {
      console.error("Error in voice-query API:", err);
      res.status(500).json({ error: err.message || "Failed to answer query" });
    }
  });

  // Vite Integration & Static Assets
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
