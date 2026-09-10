import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, JSON, Integer
from sqlalchemy.orm import relationship
from database import Base


def generate_uuid():
    return str(uuid.uuid4())


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(String, primary_key=True, default=generate_uuid)
    complaint_source = Column(String, nullable=True)          # e.g., Healthcare Professional, Pharmacy, Patient
    customer_name = Column(String, nullable=True)             # e.g., St. Jude Memorial Hospital, Dr. Jane Smith
    customer_contact = Column(String, nullable=True)          # email or phone
    product_name = Column(String, nullable=True)              # e.g., Atorvastatin, Pembrolizumab
    product_strength = Column(String, nullable=True)          # e.g., 20mg, 100mg/4mL
    batch_lot_number = Column(String, nullable=True, index=True) # e.g., LOT-2024-089A
    manufacturing_date = Column(String, nullable=True)        # YYYY-MM-DD
    expiry_date = Column(String, nullable=True)               # YYYY-MM-DD
    quantity_affected = Column(String, nullable=True)         # e.g., 12 vials, 5 cartons
    complaint_type = Column(String, nullable=True)            # e.g., Packaging Defect, Sub-potency, Contamination
    complaint_date = Column(String, nullable=True)            # YYYY-MM-DD
    description = Column(Text, nullable=True)                 # Detailed complaint narrative
    severity = Column(String, nullable=True, default="Major") # Critical, Major, Minor
    priority = Column(String, nullable=True, default="Medium")# High, Medium, Low
    status = Column(String, nullable=False, default="pending_triage") # pending_triage, in_review, closed
    
    # AI Analysis & Bonus Feature fields
    completeness_report = Column(JSON, nullable=True)         # missing fields, completeness score
    duplicate_flag = Column(JSON, nullable=True)              # detected duplicate complaints / batch alerts
    root_cause_recommendation = Column(JSON, nullable=True)   # suggested root cause category & rationale
    capa_recommendation = Column(JSON, nullable=True)         # corrective & preventive actions

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    documents = relationship("ComplaintDocument", back_populates="complaint", cascade="all, delete-orphan")
    extraction_runs = relationship("ExtractionRun", back_populates="complaint", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="complaint", cascade="all, delete-orphan")


class ComplaintDocument(Base):
    __tablename__ = "complaint_documents"

    id = Column(String, primary_key=True, default=generate_uuid)
    complaint_id = Column(String, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)                # pdf, docx, txt, eml, pasted_text
    raw_text = Column(Text, nullable=True)
    file_size = Column(Integer, nullable=True)                # in bytes
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    complaint = relationship("Complaint", back_populates="documents")


class ExtractionRun(Base):
    __tablename__ = "extraction_runs"

    id = Column(String, primary_key=True, default=generate_uuid)
    complaint_id = Column(String, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False)
    model_used = Column(String, nullable=False, default="gemma2-9b-it")
    extracted_fields = Column(JSON, nullable=False, default=dict)
    confidence_scores = Column(JSON, nullable=False, default=dict)
    status = Column(String, nullable=False, default="completed") # processing, completed, failed
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    complaint = relationship("Complaint", back_populates="extraction_runs")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, default=generate_uuid)
    complaint_id = Column(String, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False)
    role = Column(String, nullable=False)                     # user, assistant
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    complaint = relationship("Complaint", back_populates="chat_messages")


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False, default="qa_specialist") # qa_specialist, triage_lead, auditor
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
