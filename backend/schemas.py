from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


# ------------------------------
# Complaint Field Schemas
# ------------------------------
class ExtractedFields(BaseModel):
    complaint_source: Optional[str] = Field(None, description="Source of complaint (e.g., Healthcare Professional, Pharmacy, Patient)")
    customer_name: Optional[str] = Field(None, description="Customer or institution name")
    customer_contact: Optional[str] = Field(None, description="Email or phone contact")
    product_name: Optional[str] = Field(None, description="Brand or generic drug name")
    product_strength: Optional[str] = Field(None, description="Dosage strength or grade (e.g. 20mg, 100mg/4mL)")
    batch_lot_number: Optional[str] = Field(None, description="Batch or lot identification code")
    manufacturing_date: Optional[str] = Field(None, description="Manufacturing date YYYY-MM-DD")
    expiry_date: Optional[str] = Field(None, description="Expiry date YYYY-MM-DD")
    quantity_affected: Optional[str] = Field(None, description="Quantity or packaging units affected")
    complaint_type: Optional[str] = Field(None, description="Category of defect (e.g., Packaging Defect, Sub-potency, Contamination)")
    complaint_date: Optional[str] = Field(None, description="Date complaint was filed YYYY-MM-DD")
    description: Optional[str] = Field(None, description="Detailed narrative description")
    severity: Optional[str] = Field("Major", description="Initial severity: Critical, Major, or Minor")
    priority: Optional[str] = Field("Medium", description="Triage priority: High, Medium, or Low")


class ConfidenceScores(BaseModel):
    complaint_source: Optional[float] = 0.0
    customer_name: Optional[float] = 0.0
    customer_contact: Optional[float] = 0.0
    product_name: Optional[float] = 0.0
    product_strength: Optional[float] = 0.0
    batch_lot_number: Optional[float] = 0.0
    manufacturing_date: Optional[float] = 0.0
    expiry_date: Optional[float] = 0.0
    quantity_affected: Optional[float] = 0.0
    complaint_type: Optional[float] = 0.0
    complaint_date: Optional[float] = 0.0
    description: Optional[float] = 0.0
    severity: Optional[float] = 0.0
    priority: Optional[float] = 0.0


class CompletenessReport(BaseModel):
    score: int = Field(100, description="Completeness percentage 0-100")
    status: str = Field("Complete", description="Complete, Partially Complete, or Incomplete")
    missing_fields: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)


class DuplicateAlert(BaseModel):
    is_duplicate: bool = False
    match_count: int = 0
    matched_complaint_ids: List[str] = Field(default_factory=list)
    similarity_score: float = 0.0
    details: str = ""


class RootCauseRecommendation(BaseModel):
    category: str = "Investigation Required"
    sub_category: Optional[str] = None
    confidence: float = 0.85
    rationale: str = ""
    suggested_investigation_steps: List[str] = Field(default_factory=list)


class CAPARecommendation(BaseModel):
    corrective_actions: List[str] = Field(default_factory=list)
    preventive_actions: List[str] = Field(default_factory=list)
    timeline_days: int = 30
    regulatory_impact: str = "Standard 21 CFR Part 211 investigation"


# ------------------------------
# Request / Response Models
# ------------------------------
class ComplaintCreate(BaseModel):
    complaint_source: Optional[str] = None
    customer_name: Optional[str] = None
    customer_contact: Optional[str] = None
    product_name: Optional[str] = None
    product_strength: Optional[str] = None
    batch_lot_number: Optional[str] = None
    manufacturing_date: Optional[str] = None
    expiry_date: Optional[str] = None
    quantity_affected: Optional[str] = None
    complaint_type: Optional[str] = None
    complaint_date: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = "Major"
    priority: Optional[str] = "Medium"
    status: Optional[str] = "pending_triage"


class ComplaintUpdate(BaseModel):
    complaint_source: Optional[str] = None
    customer_name: Optional[str] = None
    customer_contact: Optional[str] = None
    product_name: Optional[str] = None
    product_strength: Optional[str] = None
    batch_lot_number: Optional[str] = None
    manufacturing_date: Optional[str] = None
    expiry_date: Optional[str] = None
    quantity_affected: Optional[str] = None
    complaint_type: Optional[str] = None
    complaint_date: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    completeness_report: Optional[Dict[str, Any]] = None
    duplicate_flag: Optional[Dict[str, Any]] = None
    root_cause_recommendation: Optional[Dict[str, Any]] = None
    capa_recommendation: Optional[Dict[str, Any]] = None


class ComplaintResponse(BaseModel):
    id: str
    complaint_source: Optional[str]
    customer_name: Optional[str]
    customer_contact: Optional[str]
    product_name: Optional[str]
    product_strength: Optional[str]
    batch_lot_number: Optional[str]
    manufacturing_date: Optional[str]
    expiry_date: Optional[str]
    quantity_affected: Optional[str]
    complaint_type: Optional[str]
    complaint_date: Optional[str]
    description: Optional[str]
    severity: Optional[str]
    priority: Optional[str]
    status: str
    completeness_report: Optional[Dict[str, Any]] = None
    duplicate_flag: Optional[Dict[str, Any]] = None
    root_cause_recommendation: Optional[Dict[str, Any]] = None
    capa_recommendation: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ExtractionRequest(BaseModel):
    text: Optional[str] = None
    complaint_id: Optional[str] = None


class ExtractionResponse(BaseModel):
    complaint_id: str
    extracted_fields: Dict[str, Any]
    confidence_scores: Dict[str, float]
    completeness_report: Dict[str, Any]
    duplicate_flag: Dict[str, Any]
    root_cause_recommendation: Dict[str, Any]
    capa_recommendation: Dict[str, Any]
    model_used: str


class ChatRequest(BaseModel):
    message: str
    complaint_id: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    suggested_field_updates: Optional[Dict[str, Any]] = None
    model_used: str
