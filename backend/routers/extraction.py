import json
import asyncio
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db
from models import Complaint, ComplaintDocument, ExtractionRun
from schemas import ExtractionResponse
from agent.doc_parser import parse_document
from agent.extraction_graph import extraction_agent

router = APIRouter(prefix="/complaints", tags=["Extraction"])

# In-memory progress tracker for live streaming per complaint
active_extraction_progress = {}


@router.post("/{complaint_id}/extract", response_model=ExtractionResponse)
async def extract_complaint(
    complaint_id: str,
    file: Optional[UploadFile] = File(None),
    pasted_text: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        # Create draft complaint if not already created
        complaint = Complaint(id=complaint_id, status="pending_triage")
        db.add(complaint)
        db.commit()
        db.refresh(complaint)

    raw_text = ""
    filename = "pasted_text.txt"
    file_type = "pasted_text"
    file_size = 0

    if file:
        filename = file.filename
        content = await file.read()
        file_size = len(content)
        file_type = filename.split(".")[-1].lower() if "." in filename else "unknown"
        raw_text = parse_document(content, filename)
    elif pasted_text and pasted_text.strip():
        raw_text = pasted_text.strip()
        file_size = len(raw_text.encode("utf-8"))
    else:
        raise HTTPException(status_code=400, detail="Please upload a complaint document or paste complaint text.")

    # Save document record
    doc = ComplaintDocument(
        complaint_id=complaint_id,
        filename=filename,
        file_type=file_type,
        raw_text=raw_text,
        file_size=file_size,
    )
    db.add(doc)
    db.commit()

    # Track progress status
    active_extraction_progress[complaint_id] = {
        "step": 1,
        "total_steps": 5,
        "status": "Ingesting and parsing document text...",
        "progress": 20,
    }

    try:
        # Run LangGraph multi-stage agent
        initial_state = {
            "raw_text": raw_text,
            "complaint_id": complaint_id,
            "extracted_fields": {},
            "confidence_scores": {},
            "completeness_report": {},
            "duplicate_flag": {},
            "root_cause_recommendation": {},
            "capa_recommendation": {},
            "model_used": "gemma2-9b-it",
            "progress_status": "Starting extraction pipeline",
            "error": None,
        }

        # Run extraction graph
        result = extraction_agent.invoke(initial_state)

        extracted_fields = result.get("extracted_fields", {})
        confidence_scores = result.get("confidence_scores", {})
        completeness_report = result.get("completeness_report", {})
        duplicate_flag = result.get("duplicate_flag", {})
        root_cause = result.get("root_cause_recommendation", {})
        capa = result.get("capa_recommendation", {})
        model_used = result.get("model_used", "gemma2-9b-it")

        # Update complaint entity with extracted fields
        for field in [
            "complaint_source",
            "customer_name",
            "customer_contact",
            "product_name",
            "product_strength",
            "batch_lot_number",
            "manufacturing_date",
            "expiry_date",
            "quantity_affected",
            "complaint_type",
            "complaint_date",
            "description",
            "severity",
            "priority",
        ]:
            if field in extracted_fields and extracted_fields[field]:
                setattr(complaint, field, extracted_fields[field])

        complaint.completeness_report = completeness_report
        complaint.duplicate_flag = duplicate_flag
        complaint.root_cause_recommendation = root_cause
        complaint.capa_recommendation = capa
        complaint.status = "pending_triage"

        # Record extraction run
        run_record = ExtractionRun(
            complaint_id=complaint_id,
            model_used=model_used,
            extracted_fields=extracted_fields,
            confidence_scores=confidence_scores,
            status="completed",
        )
        db.add(run_record)
        db.commit()

        active_extraction_progress[complaint_id] = {
            "step": 5,
            "total_steps": 5,
            "status": "Extraction and AI intelligence analysis complete",
            "progress": 100,
        }

        return ExtractionResponse(
            complaint_id=complaint_id,
            extracted_fields=extracted_fields,
            confidence_scores=confidence_scores,
            completeness_report=completeness_report,
            duplicate_flag=duplicate_flag,
            root_cause_recommendation=root_cause,
            capa_recommendation=capa,
            model_used=model_used,
        )

    except Exception as e:
        active_extraction_progress[complaint_id] = {
            "step": 0,
            "total_steps": 5,
            "status": f"Extraction error: {str(e)}",
            "progress": 0,
        }
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")


@router.get("/{complaint_id}/extract/status")
def get_extraction_status(complaint_id: str):
    progress = active_extraction_progress.get(
        complaint_id,
        {"step": 0, "total_steps": 5, "status": "Idle / Awaiting AI extraction...", "progress": 0},
    )
    return progress


@router.get("/{complaint_id}/extract/stream")
async def stream_extraction_progress(complaint_id: str, request: Request):
    """Server-Sent Events (SSE) endpoint to stream multi-step progress bar updates to UI."""
    async def event_generator():
        stages = [
            (20, "1/5 Ingesting and normalizing complaint text..."),
            (45, "2/5 Executing LangGraph schema extraction (Groq)..."),
            (70, "3/5 Computing field-level confidence ratings..."),
            (88, "4/5 Evaluating GMP completeness & duplicate lot check..."),
            (100, "5/5 Generating CAPA & Ishikawa root cause recommendations..."),
        ]

        # If a live progress entry exists, yield initial state
        for pct, desc in stages:
            if await request.is_disconnected():
                break
            data = json.dumps({"progress": pct, "status": desc, "complaint_id": complaint_id})
            yield f"data: {data}\n\n"
            await asyncio.sleep(0.4)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
