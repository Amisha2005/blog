from groq import Groq
import os
from dotenv import load_dotenv
from app.services.chat_service import conversation_history

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


async def evaluate_interview(req):
    session_id = req.get("sessionId")
    topic = req.get("topic", "General")
    difficulty = req.get("difficulty", "Medium")
    presence_score = float(req.get("presenceScore", 65))

    history = conversation_history.get(session_id, [])

    if len(history) < 2:
        return {
            "overall": 0,
            "feedback": "Not enough content to evaluate."
        }

    # 🧠 Build transcript
    transcript = "\n\n".join([
        f"{'Candidate' if m['role']=='user' else 'Interviewer'}: {m['content']}"
        for m in history
    ])

    # 🔥 Advanced evaluation prompt
    system_prompt = f"""
You are a senior technical interviewer.

Evaluate ONLY candidate answers.

Topic: {topic}
Difficulty: {difficulty}

Transcript:
{transcript}

Evaluate deeply:
- correctness
- depth of knowledge
- clarity
- problem-solving thinking

Return STRICT JSON:

{{
  "overall": number,
  "technical_accuracy": number,
  "communication": number,
  "problem_solving": number,
  "strengths": ["..."],
  "weaknesses": ["..."],
  "feedback": "short paragraph"
}}
"""

    try:
        response = client.chat.completions.create(
            messages=[{"role": "system", "content": system_prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.3,
            max_tokens=800
        )

        raw = response.choices[0].message.content.strip()

        # 🧠 Safe JSON parsing
        try:
            import json
            parsed = json.loads(raw)
        except:
            parsed = {
                "overall": 50,
                "technical_accuracy": 50,
                "communication": 50,
                "problem_solving": 50,
                "strengths": [],
                "weaknesses": [],
                "feedback": "Evaluation parsing error."
            }

        # 🎯 Combine scores
        overall = float(parsed.get("overall", 0))
        final_score = round(presence_score * 0.4 + overall * 0.6)

        return {
            **parsed,
            "presenceScore": presence_score,
            "finalScore": final_score
        }

    except Exception as e:
        print("Eval Error:", str(e))
        return {"error": "Evaluation failed"}