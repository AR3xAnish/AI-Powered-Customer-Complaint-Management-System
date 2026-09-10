from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models import Complaint, ComplaintDocument, ExtractionRun, ChatMessage
from schemas import ComplaintCreate, ComplaintUpdate, ComplaintResponse

router = APIRouter(prefix="/complaints", tags=["Complaints"])


@router.post("", response_model=ComplaintResponse)
def create_complaint(data: ComplaintCreate, db: Session = Depends(get_db)):
    complaint = Complaint(
        complaint_source=data.complaint_source,
        customer_name=data.customer_name,
        customer_contact=data.customer_contact,
        product_name=data.product_name,
        product_strength=data.product_strength,
        batch_lot_number=data.batch_lot_number,
        manufacturing_date=data.manufacturing_date,
        expiry_date=data.expiry_date,
        quantity_affected=data.quantity_affected,
        complaint_type=data.complaint_type,
        complaint_date=data.complaint_date,
        description=data.description,
        severity=data.severity or "Major",
        priority=data.priority or "Medium",
        status=data.status or "pending_triage",
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    return complaint


@router.get("", response_model=List[ComplaintResponse])
def list_complaints(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Complaint)
    if status:
        query = query.filter(Complaint.status == status)
    if severity:
        query = query.filter(Complaint.severity == severity)
    complaints = query.order_by(Complaint.created_at.desc()).limit(limit).all()
    return complaints


@router.get("/{complaint_id}", response_model=ComplaintResponse)
def get_complaint(complaint_id: str, db: Session = Depends(get_db)):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return complaint


@router.put("/{complaint_id}", response_model=ComplaintResponse)
def update_complaint(complaint_id: str, data: ComplaintUpdate, db: Session = Depends(get_db)):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(complaint, field, val)

    db.commit()
    db.refresh(complaint)
    return complaint


@router.delete("/{complaint_id}")
def delete_complaint(complaint_id: str, db: Session = Depends(get_db)):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    db.delete(complaint)
    db.commit()
    return {"message": "Complaint deleted successfully", "id": complaint_id}
