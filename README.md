# 🏥 PharmaTriage AI — Customer Complaint Management System

An enterprise-grade, AI-powered Pharmaceutical Customer Complaint Management & Regulatory Triage System built with **React 19**, **Tailwind CSS v4**, **FastAPI**, **LangGraph**, and **Groq LPUs**.

Designed specifically for compliance with **FDA 21 CFR Part 211** and **ISO 13485**, PharmaTriage AI transforms unstructured complaint reports (text, emails, PDF, DOCX) into structured regulatory findings, root cause analyses (Ishikawa 5M+E), CAPA recommendations, and historical batch trend alerts in under 2 seconds.

---

## 📑 Table of Contents
1. [Key Features](#-key-features)
2. [Architecture & Tech Stack](#-architecture--tech-stack)
3. [Prerequisites](#-prerequisites)
4. [Quick Start (One-Click Launch)](#-quick-start-one-click-launch-windows)
5. [Manual Step-by-Step Setup](#-manual-step-by-step-setup)
   - [1. Backend Setup](#1-backend-setup-fastapi)
   - [2. Frontend Setup](#2-frontend-setup-react--vite)
6. [Demo Data & Verification Walkthrough](#-demo-data--verification-walkthrough)
7. [System Architecture & Folder Structure](#-system-architecture--folder-structure)
8. [Troubleshooting & FAQs](#-troubleshooting--faqs)

---

## ✨ Key Features

- **⚡ Sub-Second AI Extraction (LangGraph + Groq LPUs)**: Processes unstructured complaint reports using a multi-stage StateGraph powered by `llama-3.3-70b-versatile` and `llama-3.1-8b-instant`.
- **📜 FDA 21 CFR Part 211 Compliance Verification**: Audits incoming complaints against 6 strict regulatory checkpoints (Reporter identity, Lot/Batch ID, Expiration date, Adverse event specifics, Storage conditions, and Retained sample availability).
- **🛡️ Automated Severity & Risk Matrix**: Evaluates patient safety impact and assigns triage levels (`CRITICAL`, `MAJOR`, `MODERATE`, `MINOR`) with regulatory reporting deadlines (e.g., 24-hour expedited alerts for Critical).
- **🔬 Root Cause & Ishikawa (5M+E) Analysis**: Identifies probable failure modes across Machine, Method, Material, Manpower, Measurement, and Environment, generating targeted CAPA plans.
- **🔍 Batch Clustering & Repeat Defect Detection**: Automatically checks active database records for recurring defects in the same manufacturing lot/batch.
- **💬 Interactive Triage Chat Assistant**: Context-aware Q&A agent grounded in the extracted complaint data, answering investigator inquiries and drafting follow-up emails to reporters.
- **📂 Multi-Format Document Parsing**: Native extraction support for `.pdf`, `.docx`, `.txt`, and RFC 822 `.eml` files.
- **💾 Dual-Engine Database Resiliency**: Connects to PostgreSQL with automatic zero-downtime fallback to local SQLite (`complaints_local.db`).

---

## 🛠️ Architecture & Tech Stack

| Component | Technologies |
|---|---|
| **Frontend** | React 19, Redux Toolkit, Tailwind CSS v4, Lucide Icons, Vite 8 |
| **Backend API** | FastAPI, Uvicorn, Pydantic v2, Python-Multipart |
| **AI / Orchestration** | LangGraph (StateGraph), Groq LPU API, Llama-3.3-70b, Llama-3.1-8b |
| **Database** | PostgreSQL with SQLAlchemy ORM + automatic local SQLite fallback |
| **Document Parsers** | PyPDF, python-docx, Python standard email/policy parser |

---

## 📋 Prerequisites

Before running the application, ensure you have the following installed on your machine:

1. **Python 3.10+** (Python 3.11, 3.12, or 3.14 recommended)
   - Verify with: `python --version`
2. **Node.js 18+ & npm**
   - Verify with: `node -v` and `npm -v`
3. **Groq API Key**
   - Get a free key at [console.groq.com](https://console.groq.com)
4. *(Optional)* **PostgreSQL**
   - If PostgreSQL is not installed or running, the backend **automatically initializes a local SQLite database (`complaints_local.db`)** without any errors.

---

## 🚀 Quick Start (One-Click Launch, Windows)

The easiest way to run the complete system on Windows:

1. Double-click **`start.bat`** in the project root directory, or run it from PowerShell / CMD:
   ```cmd
   .\start.bat
   ```
2. What `start.bat` does automatically:
   - Detects your Python executable.
   - Spawns the **FastAPI Backend** on `http://localhost:8000`.
   - Spawns the **React/Vite Frontend** on `http://localhost:5173`.
   - Automatically opens your default web browser to `http://localhost:5173`.

---

## 💻 Manual Step-by-Step Setup

If you prefer running services manually in separate terminals:

### 1. Backend Setup (FastAPI)

1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. *(Recommended)* Create and activate a Python virtual environment:
   ```powershell
   # Windows PowerShell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   - Check `backend/.env`. If missing, copy from `.env.example`:
     ```powershell
     copy .env.example .env
     ```
   - Ensure your `GROQ_API_KEY` is provided in `backend/.env`:
     ```env
     GROQ_API_KEY=gsk_your_actual_groq_api_key_here
     
     # Optional: PostgreSQL Database URL (Leave blank to use local SQLite)
     DATABASE_URL=postgresql+psycopg2://postgres:admin@localhost:5432/complaint_db
     ```

5. Launch the FastAPI server:
   ```bash
   python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```
   - API Docs will be available at: **[http://localhost:8000/docs](http://localhost:8000/docs)**
   - Health check: **[http://localhost:8000/api/seed/status](http://localhost:8000/api/seed/status)**

---

### 2. Frontend Setup (React + Vite)

1. Open a second terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install npm dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev -- --host 0.0.0.0 --port 5173
   ```
   *(Or run production preview if already built: `npm run preview -- --host 0.0.0.0 --port 5173`)*

4. Access the web app in your browser:
   - **Frontend UI**: **[http://localhost:5173](http://localhost:5173)**

---

## 🧪 Demo Data & Verification Walkthrough

Once both servers are running:

### Step 1: Open the Application
Navigate to `http://localhost:5173`. You will see the two-pane dashboard:
- **Left Pane**: Complaint Intake & Submission (Raw text, Quick presets, File upload).
- **Right Pane**: Regulatory Intelligence & Analysis output.

### Step 2: Test with Quick Load Presets
In the left pane, click any of the pre-configured buttons:
- **Preset 1 (Critical)**: Sub-potency & severe adverse reaction (Batch `#B7712`, Paracetamol 500mg).
- **Preset 2 (Moderate)**: Discoloration & packaging defect (Batch `#A3301`, Amoxicillin 250mg).
- **Preset 3 (Incomplete)**: Vague report lacking lot number and adverse event details.

### Step 3: Run AI Extraction
Click **"Analyze & Triage Complaint"**. Observe the real-time processing banner:
1. Extraction agent maps raw fields into structured entities.
2. Compliance agent performs 21 CFR Part 211 audit.
3. Risk agent computes severity score and regulatory response deadline.
4. Ishikawa & CAPA agent generates root cause failure modes.

### Step 4: Verify Repeat Defect Detection
Submit a complaint with the **same batch number** (e.g., `#B7712`). Notice the amber **Batch Alert Banner** warning investigators of recurring failures in the same manufacturing lot.

### Step 5: Test Interactive Chat Assistant
Scroll to the bottom of the right pane to the **Complaint Follow-up & Triage Q&A**:
- Ask: *"Draft an email to the clinic requesting the retained sample and storage temperature logs."*
- Ask: *"What are the immediate containment actions for this batch?"*
- Observe instant, context-grounded responses without any page overflow.

---

## 📁 System Architecture & Folder Structure

```
Aivoa Assignment/
├── start.bat                   # One-click Windows startup script
├── README.md                   # Complete system documentation
├── backend/
│   ├── .env                    # Environment variables (GROQ_API_KEY, DATABASE_URL)
│   ├── .env.example            # Environment template
│   ├── requirements.txt        # Python backend dependencies
│   ├── main.py                 # FastAPI application & middleware initialization
│   ├── database.py             # Database engine with auto-SQLite fallback
│   ├── models.py               # SQLAlchemy ORM models (Complaints, Chat, Documents)
│   ├── schemas.py              # Pydantic schemas for request/response validation
│   ├── agent/
│   │   ├── groq_service.py     # Groq client wrapper, model routing & JSON cleaning
│   │   ├── extraction_graph.py # LangGraph multi-node complaint triage workflow
│   │   ├── chat_graph.py       # LangGraph interactive conversational triage agent
│   │   └── doc_parser.py       # File parsers (.pdf, .docx, .txt, .eml)
│   └── routers/
│       ├── complaints.py       # Complaint CRUD & filtering endpoints
│       ├── extraction.py       # Document ingestion & AI extraction endpoint
│       ├── chat.py             # Context-aware chat assistant endpoints
│       └── seed.py             # Database seeding & health endpoints
│
└── frontend/
    ├── package.json            # Frontend dependencies (React 19, Tailwind v4, Redux)
    ├── vite.config.js          # Vite bundler configuration
    ├── index.html              # HTML5 entrypoint
    └── src/
        ├── main.jsx            # React root component mounting Redux Provider
        ├── App.jsx             # Main 2-pane triage layout & navigation
        ├── index.css           # Tailwind v4 styles & design tokens
        ├── store/              # Redux Toolkit store & complaintSlice
        └── components/
            ├── Header.jsx      # Top navigation & system status badge
            ├── ComplaintForm.jsx # Intake form, document dropzone & preset loader
            ├── TriageResults.jsx # Severity badge, 21 CFR checklist & Ishikawa analysis
            ├── AIAssistant.jsx # Interactive triage conversation component
            └── ComplaintList.jsx # Recent complaints archive & search
```

---

## ❓ Troubleshooting & FAQs

### 1. "Failed to connect to PostgreSQL / Falling back to local SQLite"
- **Behavior**: You may see a warning in the backend console: `PostgreSQL connection error... Falling back to local SQLite.`
- **Resolution**: This is completely normal and intentional. If you don't have a local PostgreSQL database configured, the system automatically uses SQLite (`complaints_local.db`) so you can test all features without database administration.

### 2. "Groq API error or Invalid API Key"
- Ensure your key in `backend/.env` is active and starts with `gsk_`.
- Test the key by running:
  ```powershell
  curl http://localhost:8000/api/seed/status
  ```

### 3. Port 8000 or 5173 is already in use
- **FastAPI**: Run with a different port using `--port 8001` and update the proxy or API URL in `frontend/src/store/slices/complaintSlice.js`.
- **Frontend**: Vite will automatically offer the next available port (e.g., `5174`).

### 4. PowerShell Execution Policy Restriction
- If running `activate.ps1` gives a script execution error in PowerShell, run:
  ```powershell
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
  ```

---

## 📜 License & Compliance Notice

This system is built as a technical demonstration for automated pharmaceutical quality management and regulatory intake. All analytical recommendations should be verified by certified Quality Assurance (QA) and Qualified Persons (QP) prior to regulatory submission.
