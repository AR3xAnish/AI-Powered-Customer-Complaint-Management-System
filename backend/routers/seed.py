import os
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models import Complaint, ComplaintDocument, ChatMessage
from agent.groq_service import get_groq_client, PRIMARY_EXTRACTION_MODEL

router = APIRouter(prefix="", tags=["Seed & Configuration"])


class GroqKeyPayload(BaseModel):
    api_key: str


@router.post("/api/groq-key")
def configure_groq_key(payload: GroqKeyPayload):
    key = payload.api_key.strip()
    if not key or len(key) < 10:
        raise HTTPException(status_code=400, detail="Invalid Groq API key provided.")

    os.environ["GROQ_API_KEY"] = key
    
    # Validate key by calling groq test
    client = get_groq_client(key)
    if not client:
        raise HTTPException(status_code=400, detail="Failed to initialize Groq client with provided key.")
    
    try:
        test_res = client.chat.completions.create(
            model=PRIMARY_EXTRACTION_MODEL,
            messages=[{"role": "user", "content": "ping"}],
            max_tokens=5,
        )
        return {"status": "success", "message": "Groq API key validated and configured successfully!"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Groq validation failed: {str(e)}")


@router.get("/api/groq-status")
def get_groq_status():
    key = os.getenv("GROQ_API_KEY", "").strip()
    has_key = bool(key and len(key) > 5 and not key.startswith("your_"))
    return {
        "configured": has_key,
        "primary_model": PRIMARY_EXTRACTION_MODEL,
        "reasoning_model": "llama-3.3-70b-versatile",
    }


@router.post("/complaints/seed")
def seed_demo_complaints(db: Session = Depends(get_db)):
    """Seeds realistic pharmaceutical complaints representing varied dosage forms, defect classes, and severities."""
    existing_count = db.query(Complaint).count()
    if existing_count >= 4:
        return {"message": f"Database already has {existing_count} complaints seeded."}

    demo_complaints = [
        {
            "id": "c1001-atorvastatin-seal",
            "complaint_source": "Hospital/Clinic",
            "customer_name": "St. Luke's University Health Network",
            "customer_contact": "clinical-pharmacy@sluhn.org",
            "product_name": "Atorvastatin Calcium Tablets",
            "product_strength": "20mg",
            "batch_lot_number": "LOT-2024-0988A",
            "manufacturing_date": "2024-01-15",
            "expiry_date": "2026-01-14",
            "quantity_affected": "14 bottles (1,260 tablets)",
            "complaint_type": "Packaging Defect",
            "complaint_date": "2026-09-02",
            "description": "During inpatient dispensing, hospital staff noted that induction foil inner seals on 14 HDPE bottles were completely loose or unsealed. Tablets exhibited moisture exposure with slight chalking on tablet surface.",
            "severity": "Major",
            "priority": "High",
            "status": "in_review",
            "completeness_report": {"score": 95, "status": "Complete (Ready for Triage)", "missing_fields": []},
            "duplicate_flag": {
                "is_duplicate": True,
                "match_count": 2,
                "details": "Alert: Batch LOT-2024-0988A has 2 prior complaints logged within the last 14 days regarding induction seal integrity.",
            },
            "root_cause_recommendation": {
                "category": "Packaging Equipment & Sealing",
                "sub_category": "Induction Sealer Temperature Variance",
                "rationale": "Loss of heat induction bond between foil liner and HDPE bottle lip caused by thermocouple sensor drift on Line 4.",
            },
            "capa_recommendation": {
                "corrective_actions": ["Quarantine suspect lot retain bottles in central warehouse.", "100% peel test on retain cartons."],
                "preventive_actions": ["Recalibrate induction sealing coil temperature sensors.", "Implement automated inline vision inspection for seal presence."],
                "timeline_days": 30,
            },
        },
        {
            "id": "c1002-pembrolizumab-particulate",
            "complaint_source": "Healthcare Professional",
            "customer_name": "Dr. Aris Thorne, MD - Memorial Oncology Clinic",
            "customer_contact": "athorne@memorial-oncology.org",
            "product_name": "Pembrolizumab Injection (Biologic)",
            "product_strength": "100mg/4mL",
            "batch_lot_number": "BIO-2024-774X",
            "manufacturing_date": "2024-03-20",
            "expiry_date": "2025-09-19",
            "quantity_affected": "2 vials",
            "complaint_type": "Foreign Matter / Contamination",
            "complaint_date": "2026-09-06",
            "description": "During pre-infusion inspection in laminar airflow hood, oncology nurse noticed translucent floating sub-visible proteinaceous particulate in two vials. Product was withheld from patient administration.",
            "severity": "Critical",
            "priority": "High",
            "status": "pending_triage",
            "completeness_report": {"score": 100, "status": "Complete (Ready for Triage)", "missing_fields": []},
            "duplicate_flag": {"is_duplicate": False, "match_count": 0, "details": "No prior complaints found for batch BIO-2024-774X."},
            "root_cause_recommendation": {
                "category": "Formulation Stability & Aggregation",
                "sub_category": "Cold-Chain Thermal Excursion / Shear Stress",
                "rationale": "Monoclonal antibody protein aggregation often triggers when exposed to freeze-thaw cycles or excessive vibration during transit.",
            },
            "capa_recommendation": {
                "corrective_actions": ["Audit cold-chain data loggers from distributor shipment.", "Send suspect vials for Micro-Flow Imaging (MFI) and SEC-HPLC."],
                "preventive_actions": ["Validate tertiary insulated shipping containers for extreme ambient routes.", "Revise carrier handling protocol."],
                "timeline_days": 15,
            },
        },
        {
            "id": "c1003-amoxicillin-potency",
            "complaint_source": "Pharmacy",
            "customer_name": "Walgreens Pharmacy #4192",
            "customer_contact": "rx4192@walgreens.com",
            "product_name": "Amoxicillin Trihydrate Capsules",
            "product_strength": "500mg",
            "batch_lot_number": "AMX-2023-1102",
            "manufacturing_date": "2023-11-10",
            "expiry_date": "2025-11-09",
            "quantity_affected": "50 blister cards",
            "complaint_type": "Dissolution / Physical Defect",
            "complaint_date": "2026-08-28",
            "description": "Customer returned opened blister pack stating capsules showed dark yellow discoloration and brittle gelatin shells that cracked when pushed through the lidding foil.",
            "severity": "Major",
            "priority": "Medium",
            "status": "closed",
            "completeness_report": {"score": 90, "status": "Complete", "missing_fields": []},
            "duplicate_flag": {"is_duplicate": False, "match_count": 0, "details": "Single incident report."},
            "root_cause_recommendation": {
                "category": "Storage & Humidity Degradation",
                "sub_category": "Patient/Store Storage Moisture Ingress",
                "rationale": "Hydrolysis of amoxicillin trihydrate in compromised gelatin shells accelerated by elevated humidity.",
            },
            "capa_recommendation": {
                "corrective_actions": ["Analyze retain blister retention samples in stability chambers."],
                "preventive_actions": ["Evaluate upgrade to tropical blister foil for high humidity markets."],
                "timeline_days": 45,
            },
        },
    ]

    for item in demo_complaints:
        complaint = Complaint(**item)
        db.add(complaint)
        # Add sample document
        doc = ComplaintDocument(
            complaint_id=item["id"],
            filename=f"Intake_Report_{item['batch_lot_number']}.pdf",
            file_type="pdf",
            raw_text=item["description"],
            file_size=len(item["description"].encode("utf-8")),
        )
        db.add(doc)
        # Add welcome assistant chat message
        chat = ChatMessage(
            complaint_id=item["id"],
            role="assistant",
            content=f"Hello. I am your AI QA Assistant reviewing complaint **{item['id']}** for **{item['product_name']}** ({item['product_strength']}, Lot: {item['batch_lot_number']}). Initial severity is rated **{item['severity']}**. How can I assist with this investigation?",
        )
        db.add(chat)

    db.commit()
    return {"message": "Successfully seeded 3 realistic pharmaceutical complaints with full history and documents."}
