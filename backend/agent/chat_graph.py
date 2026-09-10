import json
import re
from typing import TypedDict, Dict, Any, Optional, List
from langgraph.graph import StateGraph, END
from agent.groq_service import (
    call_groq_chat,
    extract_json_from_llm_response,
    get_groq_client,
    PRIMARY_EXTRACTION_MODEL,
    REASONING_MODEL,
)
from database import SessionLocal
from models import Complaint, ChatMessage


class ChatGraphState(TypedDict):
    complaint_id: Optional[str]
    user_message: str
    complaint_context: Dict[str, Any]
    history: List[Dict[str, str]]
    assistant_reply: str
    suggested_field_updates: Optional[Dict[str, Any]]
    model_used: str


CHAT_SYSTEM_PROMPT = """You are an expert AI Complaint Intake & QA Assistant for a pharmaceutical manufacturing enterprise.
You assist Quality Assurance (QA) managers, complaint handlers, and regulatory specialists during complaint triage and investigation.

You have full context of the loaded customer complaint:
- Form fields: {fields}
- Raw document text excerpt: {raw_text}
- CAPA Recommendation: {capa}
- Root Cause Analysis: {root_cause}
- Duplicate Alert: {duplicate}

Your capabilities:
1. Answer questions clearly based on GMP guidelines, pharmacovigilance regulations (e.g. FDA 21 CFR Part 211, ICH Q9/Q10), and the provided complaint facts.
2. If the user asks to modify, correct, or re-extract a specific field (e.g. "change batch number to LOT-998" or "set severity to Critical"), include a JSON block formatted as:
```json
{{
  "field_updates": {{
    "field_name": "new_value"
  }}
}}
```
Valid field names: complaint_source, customer_name, customer_contact, product_name, product_strength, batch_lot_number, manufacturing_date, expiry_date, quantity_affected, complaint_type, complaint_date, description, severity, priority.
3. Be professional, concise, authoritative, and helpful.
"""


def load_complaint_context(complaint_id: Optional[str]) -> Dict[str, Any]:
    if not complaint_id:
        return {}
    try:
        db = SessionLocal()
        c = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        if not c:
            db.close()
            return {}
        context = {
            "id": c.id,
            "fields": {
                "complaint_source": c.complaint_source,
                "customer_name": c.customer_name,
                "customer_contact": c.customer_contact,
                "product_name": c.product_name,
                "product_strength": c.product_strength,
                "batch_lot_number": c.batch_lot_number,
                "manufacturing_date": c.manufacturing_date,
                "expiry_date": c.expiry_date,
                "quantity_affected": c.quantity_affected,
                "complaint_type": c.complaint_type,
                "complaint_date": c.complaint_date,
                "description": c.description,
                "severity": c.severity,
                "priority": c.priority,
                "status": c.status,
            },
            "root_cause": c.root_cause_recommendation or {},
            "capa": c.capa_recommendation or {},
            "duplicate": c.duplicate_flag or {},
            "raw_text": "",
        }
        if c.documents:
            context["raw_text"] = c.documents[0].raw_text[:1200] if c.documents[0].raw_text else ""
        db.close()
        return context
    except Exception as e:
        print(f"[Chat Context Warning] {e}")
        return {}


def process_chat_node(state: ChatGraphState) -> Dict[str, Any]:
    complaint_id = state.get("complaint_id")
    user_msg = state.get("user_message", "")
    context = state.get("complaint_context") or load_complaint_context(complaint_id)
    fields = context.get("fields", {})
    raw_text = context.get("raw_text", "")
    capa = context.get("capa", {})
    root_cause = context.get("root_cause", {})
    duplicate = context.get("duplicate", {})

    system_prompt = CHAT_SYSTEM_PROMPT.format(
        fields=json.dumps(fields, indent=2),
        raw_text=raw_text[:800],
        capa=json.dumps(capa, indent=2),
        root_cause=json.dumps(root_cause, indent=2),
        duplicate=json.dumps(duplicate, indent=2),
    )

    model_used = REASONING_MODEL
    reply = ""
    suggested_updates = None

    try:
        client = get_groq_client()
        if client:
            response_text = call_groq_chat(
                prompt=user_msg,
                system_prompt=system_prompt,
                model=REASONING_MODEL,
                temperature=0.3,
            )
            reply = response_text
            # Check for JSON block with field_updates
            if "```json" in reply and "field_updates" in reply:
                try:
                    parsed = extract_json_from_llm_response(reply)
                    if "field_updates" in parsed:
                        suggested_updates = parsed["field_updates"]
                except Exception:
                    pass
        else:
            # Smart rule-based pharmaceutical Q&A fallback
            lower_msg = user_msg.lower()
            model_used = f"{REASONING_MODEL} (Local QA Engine)"
            
            if "severity" in lower_msg or "critical" in lower_msg:
                sev = fields.get("severity", "Major")
                desc = fields.get("description", "defects observed")
                reply = f"The initial severity is classified as **{sev}** based on risk assessment guidelines: {desc}. Any defect involving contamination, potential sterility failure, or adverse drug reaction requires elevated priority under 21 CFR Part 211.198."
            elif "capa" in lower_msg or "preventive" in lower_msg or "action" in lower_msg:
                ca = capa.get("corrective_actions", ["Quarantine batch retain samples."])
                pa = capa.get("preventive_actions", ["Recalibrate packaging sensor limits."])
                reply = f"**Recommended CAPA Plan:**\n- **Immediate Corrective Actions:** {'; '.join(ca)}\n- **Systemic Preventive Actions:** {'; '.join(pa)}\n- **Investigation Window:** {capa.get('timeline_days', 30)} days."
            elif "duplicate" in lower_msg or "lot" in lower_msg or "batch" in lower_msg:
                lot = fields.get("batch_lot_number", "Unknown")
                dup_details = duplicate.get("details", "No prior duplicates detected.")
                reply = f"**Batch Investigation for {lot}:**\n{dup_details} All incoming complaints under this lot are clustered for trend analysis."
            elif "root cause" in lower_msg or "why" in lower_msg:
                rc_cat = root_cause.get("category", "Packaging Integrity")
                rc_rat = root_cause.get("rationale", "Process parameter variance.")
                reply = f"**Root Cause Hypothesis:** {rc_cat}.\n**Technical Rationale:** {rc_rat}"
            elif "update" in lower_msg or "change" in lower_msg or "set" in lower_msg:
                # Check for simple field update request
                if "critical" in lower_msg:
                    suggested_updates = {"severity": "Critical", "priority": "High"}
                    reply = "I have updated the severity to **Critical** and priority to **High**."
                elif "major" in lower_msg:
                    suggested_updates = {"severity": "Major", "priority": "Medium"}
                    reply = "I have updated the severity to **Major**."
                else:
                    reply = f"I have analyzed your request regarding {fields.get('product_name', 'the product')}. Please specify the exact field and new value."
            else:
                reply = f"I am reviewing complaint for **{fields.get('product_name', 'Pharmaceutical Product')}** (Lot: {fields.get('batch_lot_number', 'N/A')}). What details would you like to investigate or update?"

    except Exception as e:
        reply = f"Assistance notice: {str(e)}"

    # Save to database if complaint_id is provided
    if complaint_id:
        try:
            db = SessionLocal()
            user_chat = ChatMessage(complaint_id=complaint_id, role="user", content=user_msg)
            asst_chat = ChatMessage(complaint_id=complaint_id, role="assistant", content=reply)
            db.add(user_chat)
            db.add(asst_chat)
            db.commit()
            db.close()
        except Exception as e:
            print(f"[Chat Save Warning] {e}")

    return {
        "assistant_reply": reply,
        "suggested_field_updates": suggested_updates,
        "model_used": model_used,
    }


def build_chat_graph():
    graph = StateGraph(ChatGraphState)
    graph.add_node("process_chat", process_chat_node)
    graph.set_entry_point("process_chat")
    graph.add_edge("process_chat", END)
    return graph.compile()


chat_agent = build_chat_graph()
