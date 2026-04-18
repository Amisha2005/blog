
const express = require("express");
const { Groq } = require("groq-sdk");
const app = express();
const PORT = Number(process.env.PORT) || 5000;
const connectDb = require("./utils/db");
const seedUsersIfNeeded = require("./utils/seedUsers");
require("dotenv").config();
const cors = require("cors");
const authRoute = require("./Router/auth-router");
const adminRoutes = require("./Router/admin");// In-memory store (restart server → loses history → ok for dev)
const topicRoutes = require("./Router/topicRoutes");
const InterviewResult = require("./model/interviewResult");

const corsOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000" , "https://virtualinterview.vercel.app")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: corsOrigins,
  methods: "GET,POST,PUT,DELETE,PATCH,HEAD",
  credentials: true,
};
app.use(cors(corsOptions));




app.use(express.json());
app.use("/api/auth", authRoute);
app.use("/api/admin", adminRoutes);
app.use("/api", topicRoutes);   // or app.use("/api", topicRoutes);
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});





const conversationHistory = new Map(); 
const recentFirstQuestionsByTopic = new Map();

const START_VARIANTS = [
  "Start the interview now. Ask one practical opening question appropriate for the difficulty.",
  "Begin immediately with one scenario-based first question for the selected topic and difficulty.",
  "Kick off with one non-generic opening interview question tailored to the topic and level.",
  "Start the interview with one concise question focused on real-world application, not definitions only.",
];

const normalizeTopicKey = (value = "") => value.trim().toLowerCase();

const getRandomStartVariant = () => {
  const index = Math.floor(Math.random() * START_VARIANTS.length);
  return START_VARIANTS[index];
};

const rememberFirstQuestion = (topicKey, question) => {
  if (!topicKey || !question) return;
  const list = recentFirstQuestionsByTopic.get(topicKey) || [];
  const normalized = question.trim();
  const next = [normalized, ...list.filter((item) => item !== normalized)].slice(0, 12);
  recentFirstQuestionsByTopic.set(topicKey, next);
};

const normalizeQuestion = (text = "") =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const isRecentlyUsedFirstQuestion = (candidate, recentList) => {
  const normalized = normalizeQuestion(candidate);
  if (!normalized) return false;
  return recentList.some((item) => normalizeQuestion(item) === normalized);
};

const buildFallbackOpeners = (topic, difficulty) => {
  const safeTopic = topic?.trim() || "the selected topic";
  const safeDifficulty = difficulty || "Medium";

  if (/react/i.test(safeTopic)) {
    return [
      `In React, when would you choose useRef over useState, and why?`,
      `How would you prevent unnecessary re-renders in a React component tree?`,
      `Explain a practical case where useEffect cleanup is essential in React.`,
      `How would you structure state for a medium-size React form with validation?`,
      `What trade-offs do you consider when memoizing components in React?`,
    ];
  }

  return [
    `For ${safeTopic}, what is one common real-world problem you would solve first at ${safeDifficulty} level?`,
    `In ${safeTopic}, explain one practical trade-off you would evaluate in production code.`,
    `For ${safeTopic}, how would you debug a bug that appears only under real user load?`,
    `In ${safeTopic}, what design decision would you revisit first when scaling from prototype to production?`,
  ];
};

const pickUniqueOpeningQuestion = (topic, difficulty, recentList = []) => {
  const blocked = new Set(recentList.map((q) => normalizeQuestion(q)).filter(Boolean));
  const candidates = buildFallbackOpeners(topic, difficulty);
  const available = candidates.filter((q) => !blocked.has(normalizeQuestion(q)));
  const pool = available.length ? available : candidates;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
};

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
  const isNewSession = history.length === 0;
  const topicKey = normalizeTopicKey(topic);
  const recentFirstQuestions = recentFirstQuestionsByTopic.get(topicKey) || [];

  // Special "start" handling only once
  let effectiveUserMessage = userMessage;
  if (userMessage.toLowerCase() === "start" && isNewSession) {
    effectiveUserMessage = getRandomStartVariant();
  }

  history.push({
  role: "user",
  content: effectiveUserMessage,
  timestamp: Date.now()
});

  if (isNewSession && userMessage.toLowerCase() === "start") {
    const openingQuestion = pickUniqueOpeningQuestion(topic, difficulty, recentFirstQuestions);
    history.push({
      role: "assistant",
      content: openingQuestion,
      timestamp: Date.now(),
    });

    conversationHistory.set(sessionId, history);
    rememberFirstQuestion(topicKey, openingQuestion);
    return res.json({ reply: openingQuestion, isComplete: false });
  }

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

First-question diversity requirement:
- For each new session of this topic, avoid repeating the same opener used recently.
- If possible, ask a different first question style (conceptual, scenario, debugging, optimization, design).

Recently used first questions for this topic (avoid these exact or near-identical openers):
${recentFirstQuestions.length ? recentFirstQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n") : "None recorded yet"}
`.trim(),
    },
  ...history.map(({ role, content }) => ({ role, content })),
  ];

  try {
    const requestOptions = {
      model: "llama-3.3-70b-versatile",
      temperature: 0.9,
      max_tokens: 300,
    };

    let botReply = "No response.";

    if (isNewSession && userMessage.toLowerCase() === "start") {
      const forbidden = new Set(
        recentFirstQuestions.map((q) => normalizeQuestion(q)).filter(Boolean),
      );

      for (let attempt = 0; attempt < 4; attempt++) {
        const avoidLines = recentFirstQuestions.length
          ? recentFirstQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")
          : "None";

        const attemptMessages = [
          ...messages,
          {
            role: "system",
            content: `First-question uniqueness check (attempt ${attempt + 1}):
- Do NOT ask any opener that is the same or very similar to the blocked list.
- Output exactly one fresh interview question.

Blocked openers:
${avoidLines}`,
          },
        ];

        const chatCompletion = await groq.chat.completions.create({
          messages: attemptMessages,
          ...requestOptions,
        });

        const candidate = chatCompletion.choices[0]?.message?.content?.trim() || "No response.";
        const normalizedCandidate = normalizeQuestion(candidate);
        botReply = candidate;

        if (!forbidden.has(normalizedCandidate)) {
          break;
        }

        forbidden.add(normalizedCandidate);
      }

      if (forbidden.has(normalizeQuestion(botReply))) {
        const fallbacks = buildFallbackOpeners(topic, difficulty);
        const uniqueFallback =
          fallbacks.find((q) => !forbidden.has(normalizeQuestion(q))) ||
          `For ${topic}, describe one practical scenario where your approach choice matters and justify it.`;
        botReply = uniqueFallback;
      }
    } else {
      const chatCompletion = await groq.chat.completions.create({
        messages,
        ...requestOptions,
      });
      botReply = chatCompletion.choices[0]?.message?.content?.trim() || "No response.";
    }

    // Add AI reply to history
    history.push({
  role: "assistant",
  content: botReply,
  timestamp: Date.now()
});

    // Save updated history
    conversationHistory.set(sessionId, history);

    if (isNewSession && userMessage.toLowerCase() === "start" && botReply) {
      rememberFirstQuestion(topicKey, botReply);
    }

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
  const { sessionId, topic, difficulty, presenceScore, candidateName, proctoring } = req.body;

  if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });

  const history = conversationHistory.get(sessionId) || [];

  const persistResult = async (overall, safePresenceOverride) => {
    const safeOverallValue = Math.max(0, Math.min(100, Number(overall) || 0));
    const safePresenceValue = Number.isFinite(Number(safePresenceOverride))
      ? Math.max(0, Math.min(100, Number(safePresenceOverride)))
      : 65;
    const finalScoreValue = Math.round(safePresenceValue * 0.4 + safeOverallValue * 0.6);

    try {
      await InterviewResult.findOneAndUpdate(
        { sessionId },
        {
          sessionId,
          topic: (topic || "General").trim(),
          difficulty: difficulty || "Medium",
          candidateName: (candidateName || "Candidate").trim(),
          overall: safeOverallValue,
          presenceScore: safePresenceValue,
          finalScore: finalScoreValue,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    } catch (saveError) {
      console.error("Failed to save interview result:", saveError.message);
    }

    return { safeOverallValue, safePresenceValue, finalScoreValue };
  };

  if (history.length < 2) { // at least a few Q&A pairs
    const persisted = await persistResult(0, Math.min(Number(presenceScore) || 65, 25));
    return res.json({
      overall: 0,
      technical_accuracy: 0,
      communication: 0,
      problem_solving: 0,
      strengths: [],
      weaknesses: [],
      feedback: "Not enough content to evaluate properly.",
      finalScore: persisted.finalScoreValue,
    });
  }

  const controlInputPattern = /^(start|next|continue|skip|stop|done|yes|ok)$/i;
  const userMessages = history
    .filter((m) => m.role === "user")
    .map((m) => String(m.content || "").trim())
    .filter(Boolean);

  const substantiveAnswers = userMessages.filter((content) => {
    if (controlInputPattern.test(content.toLowerCase())) return false;
    if (content.length < 4) return false;
    return true;
  });

  const substantiveWordCount = substantiveAnswers.reduce((sum, content) => {
    return sum + content.split(/\s+/).filter(Boolean).length;
  }, 0);

  if (substantiveAnswers.length === 0 || substantiveWordCount < 12) {
    const persisted = await persistResult(0, Math.min(Number(presenceScore) || 65, 20));
    return res.json({
      overall: 0,
      technical_accuracy: 0,
      communication: 0,
      problem_solving: 0,
      strengths: [],
      weaknesses: ["No meaningful answers were provided by the candidate."],
      feedback: "The interview could not be positively evaluated because meaningful technical answers were not provided.",
      finalScore: persisted.finalScoreValue,
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

    let safeOverall = Number.isFinite(Number(parsed?.overall))
      ? Math.max(0, Math.min(100, Number(parsed.overall)))
      : 0;
    let safePresence = Number.isFinite(Number(presenceScore))
      ? Math.max(0, Math.min(100, Number(presenceScore)))
      : 65;

    const suspiciousObjectCount = Math.max(0, Number(proctoring?.suspiciousObject) || 0);
    const multiFaceCount = Math.max(0, Number(proctoring?.multiFace) || 0);
    const totalIncidents = suspiciousObjectCount + multiFaceCount;

    if (totalIncidents > 0) {
      const incidentPenalty = Math.min(40, totalIncidents * 8 + suspiciousObjectCount * 4);
      safeOverall = Math.max(0, safeOverall - incidentPenalty);
      safePresence = Math.max(0, safePresence - Math.min(30, totalIncidents * 5));

      const priorWeaknesses = Array.isArray(parsed?.weaknesses) ? parsed.weaknesses : [];
      parsed.weaknesses = [
        ...priorWeaknesses,
        `Proctoring incidents detected (objects: ${suspiciousObjectCount}, multi-face: ${multiFaceCount}).`,
      ];
    }

    const computedFinal = Math.round(safePresence * 0.4 + safeOverall * 0.6);

    try {
      await InterviewResult.findOneAndUpdate(
        { sessionId },
        {
          sessionId,
          topic: (topic || "General").trim(),
          difficulty: difficulty || "Medium",
          candidateName: (candidateName || "Candidate").trim(),
          overall: safeOverall,
          presenceScore: safePresence,
          finalScore: computedFinal,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    } catch (saveError) {
      console.error("Failed to save interview result:", saveError.message);
    }

    res.json({
      ...parsed,
      finalScore: computedFinal,
    });
  } catch (error) {
    console.error("Evaluation error:", error);
    res.status(500).json({ error: "Evaluation failed" });
  }
});

app.get("/api/leaderboard", async (req, res) => {
  const topic = (req.query.topic || "").toString().trim();
  const limit = Math.max(3, Math.min(25, Number(req.query.limit) || 10));

  if (!topic) {
    return res.status(400).json({ error: "Missing topic query parameter" });
  }

  try {
    const escapedTopic = topic.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const topicQuery = new RegExp(`^${escapedTopic}$`, "i");

    const rows = await InterviewResult.find({ topic: topicQuery })
      .sort({ finalScore: -1, createdAt: 1 })
      .limit(limit)
      .select("candidateName topic difficulty overall presenceScore finalScore createdAt")
      .lean();

    res.json({
      topic,
      total: rows.length,
      leaderboard: rows.map((row, index) => ({
        rank: index + 1,
        candidateName: row.candidateName || "Candidate",
        difficulty: row.difficulty || "Medium",
        overall: row.overall,
        presenceScore: row.presenceScore,
        finalScore: row.finalScore,
        createdAt: row.createdAt,
      })),
    });
  } catch (error) {
    console.error("Leaderboard fetch error:", error.message);
    res.status(500).json({ error: "Failed to load leaderboard" });
  }
});

app.post("/api/code-review", async (req, res) => {
  const { code, language = "bash", topic = "", difficulty = "Medium" } = req.body || {};

  if (!code || !String(code).trim()) {
    return res.status(400).json({ error: "Code is required." });
  }

  const prompt = `You are a strict technical code reviewer for interview practice.

Context:
- Language: ${language}
- Topic: ${topic || "General"}
- Difficulty: ${difficulty}

Candidate code:
${code}

Return only valid JSON (no markdown):
{
  "summary": "short review summary",
  "issues": ["issue 1", "issue 2"],
  "correctedCode": "improved version if needed, else original",
  "expectedOutput": "expected output/result from the code if executed",
  "confidence": "low|medium|high"
}

Rules:
- Be precise and concise.
- If code cannot run as-is, explain expected behavior/output assumption clearly in expectedOutput.
- Do not include extra keys.
`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a JSON-only assistant.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      max_tokens: 900,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "{}";
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseError) {
      console.error("Code review JSON parse failed:", cleaned);
      parsed = {
        summary: "Unable to parse AI code review response.",
        issues: ["Parsing failed for AI response format."],
        correctedCode: String(code),
        expectedOutput: "Could not generate expected output reliably.",
        confidence: "low",
      };
    }

    res.json(parsed);
  } catch (error) {
    console.error("Code review error:", error.message);
    res.status(500).json({
      error: "Code review failed.",
      summary: "Server failed to review code.",
      issues: ["AI service unavailable"],
      correctedCode: String(code),
      expectedOutput: "No output available.",
      confidence: "low",
    });
  }
});


connectDb()
  .then(async () => {
    await seedUsersIfNeeded();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.log(`Database connection failed: ${error.message}`);
  });