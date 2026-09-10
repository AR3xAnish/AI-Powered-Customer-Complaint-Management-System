import os
import json
import re
from typing import Dict, Any, Optional
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()

PRIMARY_EXTRACTION_MODEL = "gemma2-9b-it"
REASONING_MODEL = "llama-3.3-70b-versatile"


def get_groq_client(api_key: Optional[str] = None) -> Optional[Groq]:
    key = api_key or os.getenv("GROQ_API_KEY", "").strip()
    if key and len(key) > 5 and not key.startswith("your_"):
        try:
            return Groq(api_key=key)
        except Exception:
            return None
    return None


def extract_json_from_llm_response(text: str) -> Dict[str, Any]:
    """Helper to extract clean JSON object from LLM response containing markdown fences."""
    text = text.strip()
    # Match ```json ... ```
    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except Exception:
            pass
    # Match outermost curly braces
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(text[start : end + 1])
        except Exception:
            pass
    raise ValueError(f"Could not parse valid JSON from response: {text[:200]}")


def call_groq_chat(
    prompt: str,
    system_prompt: str = "",
    model: str = PRIMARY_EXTRACTION_MODEL,
    temperature: float = 0.1,
    api_key: Optional[str] = None,
) -> str:
    """Invokes Groq API with fallback."""
    client = get_groq_client(api_key)
    if not client:
        raise ValueError("GROQ_API_KEY_NOT_CONFIGURED")

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    response = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=4096,
    )
    return response.choices[0].message.content


def heuristic_pharma_fallback(text: str) -> Dict[str, Any]:
    """
    Realistic fallback extractor for testing and when API key is pending.
    Parses typical pharma complaint narratives, emails, and QA slips.
    """
    lower = text.lower()
    
    # Defaults
    extracted = {
        "complaint_source": "Healthcare Professional",
        "customer_name": "Regional Health Authority Hospital",
        "customer_contact": "pharmacy@healthcare.org",
        "product_name": "Atorvastatin Calcium Tablets",
        "product_strength": "20mg",
        "batch_lot_number": "LOT-2024-0988A",
        "manufacturing_date": "2024-01-15",
        "expiry_date": "2026-01-14",
        "quantity_affected": "12 boxes (360 tablets)",
        "complaint_type": "Packaging Defect",
        "complaint_date": "2026-09-10",
        "description": text[:500] if len(text) > 500 else text,
        "severity": "Major",
        "priority": "Medium"
    }

    # Heuristic overrides based on text patterns
    if "patient" in lower or "consumer" in lower:
        extracted["complaint_source"] = "Patient/Consumer"
    elif "distributor" in lower or "wholesaler" in lower:
        extracted["complaint_source"] = "Distributor"
    elif "clinic" in lower or "hospital" in lower:
        extracted["complaint_source"] = "Hospital/Clinic"
    elif "pharmacy" in lower:
        extracted["complaint_source"] = "Pharmacy"

    # Batch / Lot regex pattern
    batch_match = re.search(r"(?:batch|lot|lot\s*#|batch\s*no\.?|lot\s*no\.?)\s*[:=\-]?\s*([A-Z0-9\-_]{5,16})", text, re.IGNORECASE)
    if batch_match:
        extracted["batch_lot_number"] = batch_match.group(1).upper()

    # Product names
    products = [
        ("pembrolizumab", "Pembrolizumab Injection", "100mg/4mL"),
        ("atorvastatin", "Atorvastatin Calcium", "20mg"),
        ("amoxicillin", "Amoxicillin Trihydrate", "500mg"),
        ("metformin", "Metformin Hydrochloride", "850mg"),
        ("insulin glargine", "Insulin Glargine Soln", "100 units/mL"),
        ("ciprofloxacin", "Ciprofloxacin IV", "400mg/200mL"),
        ("paracetamol", "Paracetamol Infusion", "10mg/mL"),
    ]
    for key, name, strength in products:
        if key in lower:
            extracted["product_name"] = name
            extracted["product_strength"] = strength
            break

    # Severity & Defect
    if any(term in lower for term in ["death", "anaphylaxis", "icu", "critical", "precipitate", "sepsis", "recall", "glass"]):
        extracted["severity"] = "Critical"
        extracted["priority"] = "High"
        extracted["complaint_type"] = "Foreign Matter / Contamination" if "glass" in lower or "precipitate" in lower else "Adverse Event / Lack of Efficacy"
    elif any(term in lower for term in ["seal", "broken", "leak", "blister", "foil", "cracked", "packaging"]):
        extracted["complaint_type"] = "Packaging Defect"
        extracted["severity"] = "Major"
        extracted["priority"] = "Medium"
    elif any(term in lower for term in ["color", "discoloration", "dissolution", "smell", "sub-potency"]):
        extracted["complaint_type"] = "Suspected Sub-potency"
        extracted["severity"] = "Major"
        extracted["priority"] = "High"
    elif any(term in lower for term in ["label", "barcode", "print", "artwork", "misprint"]):
        extracted["complaint_type"] = "Labeling/Artwork Discrepancy"
        extracted["severity"] = "Minor"
        extracted["priority"] = "Low"

    # Customer Name match
    cust_match = re.search(r"(?:hospital|clinic|center|pharmacy|dr\.|doctor)\s+([A-Za-z0-9\s]+?)(?:,|\.|\n|$)", text, re.IGNORECASE)
    if cust_match:
        extracted["customer_name"] = cust_match.group(0).strip().rstrip(".,")

    return extracted
