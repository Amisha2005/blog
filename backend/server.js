const express = require("express");
const { Groq } = require("groq-sdk"); // Fixed: use require(), not import
const app = express();
const PORT = 5000;
const connectDb = require("./utils/db");
require("dotenv").config();
const cors = require("cors");
const authRoute = require("./Router/auth-router");


const corsOptions = {
  origin: "http://localhost:3000",
  methods: "GET,POST,PUT,DELETE,PATCH,HEAD",
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use("/api/auth", authRoute);
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "your-api-key-here", // Replace with your actual key or use .env
});

// index.js (add this outside the route, at the top with other variables)
// At the top, replace conversationHistory with this:
let conversationHistory = [
  {
    role: "system",
    content: `You are a strict technical interviewer conducting a  software interview.
Your ONLY job is to ask ONE clear, concise question related to that topic at aploid time.
The topic is: {topic}.
Start the interview by asking the first question.
NEVER explain concepts, NEVER give feedback, NEVER say "good" or "great" or evaluate the answer.
Start with easy to hard questions if you think that the client answer your question approximate correctly then give him/her feedback in 
% form."
every time it refresh or open interview give new question or shuffle the question.
Start asking professional questions as the time progress.
Do not ask repeated questions. 
If the user message is short or says 'next', 'continue', or similar, just ask the next question without feedback.
If the candidate says skip the question, just ask the next question.
If the candidate take more than 1 min to answer the question, remind him/her to answer quickly and ask the next question and tell them to write "skip" for next question.
If the candidate didn't says skip wait for another 1 min to answer if still candidate doesn't give the answer in 1min ask next question.
If candidate didn't give any answer for about 3min quit the interview and give there feedback in % form.
You don't have to give feedback after every question in % form, only when the candidate says "done" or "stop" to end the interview.
If candidate says "stop" or "done" to end the interview then give him/her feedback in % form and say "Interview complete"
Only correct the answer if it is factually wrong in short.
Shuffle the question every time the client select the topic.
After the candidate answers, immediately ask the next logical follow-up question about topic.
Do not add any extra text, introductions, or chit-chat.
Start from easy question to hard level questions.
Ask medium to hard level questions.
If the candidate do not say "stop" or "done" you have to ask question about 30min after that stop the interview and give feedback in % form.
If the candidate says "done" or "stop", say "Interview complete. Thank you!" and stop.`,
  },
];
// This array will store the full conversation

// Updated POST route with memory
app.post("/api/chat", async (req, res) => {
  console.log(process.env.GROQ_API_KEY);
  try {
    const userMessage = req.body.chat?.trim() || req.body?.trim();

    if (!userMessage) {
      return res.status(400).json({ reply: "Please send a valid message." });
    }

    console.log("User:", userMessage);

    // 1. Add user's message to history
    conversationHistory.push({
      role: "user",
      content: userMessage,
    });

    // 2. Call Groq with FULL conversation history
    const chatCompletion = await groq.chat.completions.create({
      messages: conversationHistory, // ← Now sending full history!
      model: "meta-llama/llama-4-maverick-17b-128e-instruct", // Use a valid, fast model
      temperature: 0.7,
      max_tokens: 512,
      top_p: 1,
      stream: false,
    });

    // 3. Get bot reply
    const botReply =
      chatCompletion.choices[0]?.message?.content ||
      "I'm having trouble responding right now.";

    // 4. Add bot reply to history (so it remembers its own responses)
    conversationHistory.push({
      role: "assistant",
      content: botReply,
    });

    // Optional: Limit history size to avoid token overflow (e.g., keep last 20 messages)
    if (conversationHistory.length > 21) {
      // 1 system + 10 user/assistant pairs
      conversationHistory = [
        conversationHistory[0], // Keep system prompt
        ...conversationHistory.slice(-20), // Keep last 20 messages
      ];
    }

    // 5. Send reply to frontend
    res.json({ reply: botReply });
  } catch (error) {
    console.error("Groq API Error:", error.message);
    res.status(500).json({ reply: "Sorry, something went wrong. Try again!" });
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
