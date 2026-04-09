from datetime import datetime
from groq import Groq
import os
from dotenv import load_dotenv


load_dotenv()
# print(os.getenv("GROQ_API_KEY"))
client=Groq(api_key=os.getenv("GROQ_API_KEY"))

conversation_history = {}

async def handle_chat(req):
    user_message = req.chat.strip()
    # history = conversation_history.get(req.sessionId, [])

    # # Start logic
    # if user_message.lower() == "start" and len(history) == 0:
    #     user_message = "Start the interview now."

    # history.append({
    #     "role": "user",
    #     "content": user_message,
    #     "timestamp": datetime.now().timestamp()
    # })

    # conversation_history[req.sessionId] = history
    response = client.chat.completions.create(
        
        messages=[
            {"role": "system", "content": f"You are a technical interviewer. Ask one question at a time. Evaluate answers briefly. Ask {req.topic} questions with {req.difficulty} difficulty."},
            {
                "role": "user",
                "content": user_message
            }
        ],
        model="llama-3.3-70b-versatile"
        
        
    )
    reply=response.choices[0].message.content
    return {"reply": reply}
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

    # TEMP response (replace Groq later)
 
        # "reply": f"Question about {req.topic} ({req.difficulty})"
    if "start" in user_message:
                reply = f"Starting interview on {req.topic} with difficulty {req.difficulty}."
    elif "react" in user_message:
            reply= "What is useEffectt hook?"
    else:
                reply="Explain your answer in detail and more clearly"
        
            
    return {"reply": reply}