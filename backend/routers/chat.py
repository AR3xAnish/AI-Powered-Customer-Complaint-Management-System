from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Complaint, ChatMessage
from schemas import ChatRequest, ChatResponse
from agent.chat_graph import chat_agent

router = APIRouter(prefix="/complaints", tags=["Chat"])


@router.post("/{complaint_id}/chat", response_model=ChatResponse)
def chat_with_complaint_assistant(
    complaint_id: str,
    payload: ChatRequest,
    db: Session = Depends(get_db),
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # Fetch prior messages for conversational memory
    history_records = (
        db.query(ChatMessage)
        .filter(ChatMessage.complaint_id == complaint_id)
        .order_by(ChatMessage.created_at.asc())
        .limit(20)
        .all()
    )
    history = [{"role": msg.role, "content": msg.content} for msg in history_records]

    state_input = {
        "complaint_id": complaint_id,
        "user_message": payload.message,
        "complaint_context": {},
        "history": history,
        "assistant_reply": "",
        "suggested_field_updates": None,
        "model_used": "llama-3.3-70b-versatile",
    }

    result = chat_agent.invoke(state_input)

    reply = result.get("assistant_reply", "Understood.")
    suggested_updates = result.get("suggested_field_updates")
    model_used = result.get("model_used", "llama-3.3-70b-versatile")

    # If suggested field updates were produced by the agent and confirmed, update the complaint
    if suggested_updates and isinstance(suggested_updates, dict):
        for field, val in suggested_updates.items():
            if hasattr(complaint, field) and val is not None:
                setattr(complaint, field, val)
        db.commit()

    return ChatResponse(
        reply=reply,
        suggested_field_updates=suggested_updates,
        model_used=model_used,
    )


@router.get("/{complaint_id}/chat")
def get_chat_history(complaint_id: str, db: Session = Depends(get_db)):
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.complaint_id == complaint_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    return [{"id": m.id, "role": m.role, "content": m.content, "created_at": m.created_at} for m in messages]
