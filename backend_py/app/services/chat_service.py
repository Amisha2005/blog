
from datetime import datetime
from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

conversation_history = {}


async def handle_chat(req):
    user_message = (req.chat or "").strip()

    if not user_message:
        return {"reply": "Please type a message."}

    session_id = req.sessionId
    topic = req.topic
    difficulty = req.difficulty or "Medium"
    resume_text = req.resumeText or ""

    # 🧠 Get history
    history = conversation_history.get(session_id, [])

    # 🚀 Handle "start"
    effective_user_message = user_message
    if user_message.lower() == "start" and len(history) == 0:
        effective_user_message = (
            "Start the interview now. Ask the first question appropriate for the difficulty."
        )

    # ➕ Add user message to history
    history.append({
        "role": "user",
        "content": effective_user_message,
        # "timestamp": str(datetime.now())
    })

    # 📄 Resume section
    resume_section = ""
    if resume_text and len(resume_text.strip()) > 100:
        safe_resume = resume_text[:9000]
        resume_section = f"""
Candidate's actual experience from uploaded resume:
--------------------------------------------------------------------------------
{safe_resume}
--------------------------------------------------------------------------------

CRITICAL INSTRUCTIONS:
• Personalize questions using resume
• Refer to projects, tech, roles
• Keep using resume throughout interview
"""

    # 🧠 System prompt (IMPORTANT)
    system_prompt = f"""
You are Nova, a strict, professional technical interviewer.

Topic: "{topic}"
ONLY ask questions about this topic.

Difficulty: {difficulty}

{resume_section}

Rules:
- Ask ONE question at a time
- Wait for "continue", "next", or "skip"
- "skip" → next question
- NO explanations, NO hints
- Keep replies SHORT (just question)
- No greetings, no extra text
- When user says "stop" → reply with INTERVIEW_COMPLETE
"""

    messages = [
        {"role": "system", "content": system_prompt},
        *history
    ]

    try:
        response = client.chat.completions.create(
            messages=messages,
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=300
        )

        reply = response.choices[0].message.content.strip()

        # ➕ Save AI reply
        history.append({
            "role": "assistant",
            "content": reply,
            # "timestamp": str(datetime.now())
        })

        # 💾 Save history
        conversation_history[session_id] = history

        # 🛑 Detect completion
        is_complete = "INTERVIEW_COMPLETE" in reply or user_message.lower() == "stop"

        if is_complete:
            reply = reply.replace("INTERVIEW_COMPLETE", "Interview complete. Thank you!")

        return {
            "reply": reply,
            "isComplete": is_complete
        }

    except Exception as e:
        print("Groq Error:", str(e))
        return {"reply": "Server error. Try again later."}

# /////////////////////////////////////////////////////// #
    if not req.sessionId:
        return {"reply": "Missing sessionId"}

    if not req.topic:
        return {"reply": "No topic selected"}

    history = conversation_history.get(req.sessionId, [])

    # Start logic
    if user_message.lower() == "start" and len(history) == 0:
        user_message = "Start the interview now."

    history.append({
        "role": "user",
        "content": user_message,
        "timestamp": datetime.now().timestamp()
    })

    conversation_history[req.sessionId] = history