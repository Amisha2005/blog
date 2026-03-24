
const express = require("express");
const { Groq } = require("groq-sdk");
const app = express();
const PORT = 5000;
const connectDb = require("./utils/db");
require("dotenv").config();
const cors = require("cors");
const authRoute = require("./Router/auth-router");
// In-memory store (restart server → loses history → ok for dev)
const corsOptions = {
  origin: ["http://localhost:3000","https://nova-tech-rose.vercel.app"],
  methods: "GET,POST,PUT,DELETE,PATCH,HEAD",
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use("/api/auth", authRoute);

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});





const conversationHistory = new Map(); 

setInterval(() => {
  for (const [id, hist] of conversationHistory.entries()) {
    if (hist.length > 100 || Date.now() - (hist[0]?.timestamp || 0) > 60 * 60 * 1000) { // 1 hour old or too long
      conversationHistory.delete(id);
    }
  }
}, 30 * 60 * 1000);

app.post("/api/chat", async (req, res) => {
  const { chat: userMessageRaw, topic, difficulty, sessionId,resumeText="", } = req.body;

  if (!sessionId) return res.status(400).json({ reply: "Missing sessionId" });
  if (!topic?.trim()) return res.json({ reply: "Error: No interview topic selected." });

  const userMessage = (userMessageRaw || "").trim();
  if (!userMessage) return res.status(400).json({ reply: "Please type a message." });

  let history = conversationHistory.get(sessionId) || [];

  // Special "start" handling only once
  let effectiveUserMessage = userMessage;
  if (userMessage.toLowerCase() === "start" && history.length === 0) {
    effectiveUserMessage = "Start the interview now. Ask the first question appropriate for the difficulty.";
  }

  history.push({ role: "user", content: effectiveUserMessage });
  let resumeSection = "";
  if (resumeText?.trim().length > 100) {
    const safeResume = resumeText.trim().substring(0, 9000);
    resumeSection = `
Candidate's actual experience from uploaded resume:
--------------------------------------------------------------------------------
${safeResume}
--------------------------------------------------------------------------------

CRITICAL INSTRUCTIONS:
• You MUST personalize almost every question using information from the resume when possible.
• Refer to specific projects, companies, technologies, durations, roles mentioned in the resume.
• Example: if resume says "Developed e-commerce platform using Next.js and Stripe", ask about SSR vs CSR trade-offs, payment webhook handling, etc.
• If resume mentions no relevant experience for this topic → fall back to standard questions.
• Keep using resume context for the ENTIRE interview — do NOT forget it after the first few questions.
`.trim();
  }

  const messages = [
    {
      role: "system",
      content: `
You are Nova, a strict, professional, and adaptive technical interviewer.

Topic: "${topic}"
You MUST ONLY ask questions about "${topic}". Never go off-topic.

Difficulty: ${difficulty || "Medium"} — follow strictly!

${resumeSection}

Easy: basic definitions, simple concepts (e.g. "What is useState?")
Medium: intermediate + practical (e.g. "Explain useEffect cleanup?")
Hard: senior-level, design, internals, trade-offs (e.g. "Design concurrent mode scheduler")

Rules (must obey):
- Ask **ONE** clear question at a time.
- After answer → wait for "continue", "next", or "skip" to ask next.
- "skip" → move to next without comment.
- "continue"/"next" → ask next logical question (progress easy → hard).
- NEVER explain, hint, praise, criticize during interview — stay 100% neutral.
- ONLY when user says "stop" or "done" → reply exactly: "INTERVIEW_COMPLETE" followed by a short neutral message.
- Keep replies **very short**: just the question (or end message).
- Vary / shuffle questions — no fixed list or repeats.
- Ask different questions every time. Don't repeat the questions.
- No chit-chat, greetings, or extra text.
`.trim(),
    },
    ...history,
  ];

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,          // slightly higher → more varied questions
      max_tokens: 300,           // questions don't need 500 tokens
    });

    let botReply = chatCompletion.choices[0]?.message?.content?.trim() || "No response.";

    // Add AI reply to history
    history.push({ role: "assistant", content: botReply });

    // Save updated history
    conversationHistory.set(sessionId, history);

    // Detect end (for frontend to know)
    const isComplete = botReply.includes("INTERVIEW_COMPLETE") || userMessage.toLowerCase() === "stop";

    if (isComplete) {
      botReply = botReply.replace("INTERVIEW_COMPLETE", "Interview complete. Thank you!");
      // Frontend can now call /api/evaluate
    }

    res.json({ reply: botReply, isComplete });
  } catch (error) {
    console.error("Groq Error:", error.message);
    res.status(500).json({ reply: "Server error. Try again later." });
  }
});

// ── Evaluation Endpoint ────────────────────────────────────────
app.post("/api/evaluate", async (req, res) => {
  const { sessionId, topic, difficulty } = req.body;

  if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });

  const history = conversationHistory.get(sessionId) || [];
  if (history.length < 6) { // at least a few Q&A pairs
    return res.json({
      overall: 0,
      technical_accuracy: 0,
      communication: 0,
      problem_solving: 0,
      strengths: [],
      weaknesses: [],
      feedback: "Not enough content to evaluate properly.",
    });
  }

  const transcript = history
    .map(m => `${m.role === "user" ? "Candidate" : "Interviewer"}: ${m.content}`)
    .join("\n\n");

  const evalMessages = [
    {
      role: "system",
      content: `You are an experienced hiring manager evaluating a ${difficulty || "Medium"} level ${topic} technical interview.

Transcript:
${transcript}

Evaluate **only** based on answers (ignore interviewer messages).
Score 0–100 in:
- overall
- technical_accuracy
- communication
- problem_solving

Also provide:
- strengths: string[] (bullet points)
- weaknesses: string[] (bullet points)
- feedback: one paragraph summary

Return **valid JSON only**, no markdown, no extra text:
{
  "overall": number,
  "technical_accuracy": number,
  "communication": number,
  "problem_solving": number,
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "feedback": "string"
}`
    }
  ];

  try {
    const completion = await groq.chat.completions.create({
      messages: evalMessages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.4, // lower = more consistent scoring
      max_tokens: 800,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "{}";

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error("JSON parse failed:", raw);
      parsed = { overall: 50, feedback: "Evaluation parsing error." };
    }

    // Optional: clean session after evaluation
    // conversationHistory.delete(sessionId);

    res.json(parsed);
  } catch (error) {
    console.error("Evaluation error:", error);
    res.status(500).json({ error: "Evaluation failed" });
  }
});


connectDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.log(`Database connection failed: ${error.message}`);
  });