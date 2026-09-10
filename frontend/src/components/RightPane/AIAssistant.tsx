import React, { useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../../store";
import {
  startExtraction,
  updateExtractionProgress,
  extractionSuccess,
  extractionFailed,
  updateField,
} from "../../store/slices/complaintSlice";
import {
  addMessage,
  setSending,
} from "../../store/slices/chatSlice";
import { extractComplaintApi, sendChatApi } from "../../api/client";
import {
  UploadCloud,
  FileText,
  Send,
  Sparkles,
  Bot,
  User,
  CheckCircle2,
  Zap,
} from "lucide-react";

// Realistic Pharma Complaint Presets for instant demo
const DEMO_PRESETS = [
  {
    title: "Cracked Vials & Precipitate",
    subtitle: "Biologic / Critical",
    text: `From: Dr. Elizabeth Warren, MD <ewarren@mayo-oncology.org>
To: Complaints & Regulatory Safety <triage@pharma-corp.com>
Date: 2026-09-10
Subject: URGENT: Particulate and cracked neck in Pembrolizumab 100mg/4mL, Lot BIO-2024-912

Dear Quality Assurance Team,

During preparation of patient infusions this morning at the Mayo Oncology Clinic, pharmacy compounding staff inspected 6 vials of Pembrolizumab 100mg/4mL (Lot: BIO-2024-912, Exp: 2026-04-15, Mfg: 2024-04-12). 
We observed visible hairline micro-cracks at the vial glass neck finish on 2 vials, and 4 vials exhibited white needle-shaped precipitate particulate upon gentle agitation in the biological safety cabinet. 

None of these vials were administered to patients. Quantity affected is 6 vials from carton box #12. Given the risk of micro-capillary embolism or lack of sterility, we have marked this as Critical. Please arrange immediate courier pickup for analytical retain testing and provide your investigation response.

Dr. Elizabeth Warren, MD
Head of Compounding Oncology
Mayo Oncology Clinic`,
  },
  {
    title: "Induction Seal Failure",
    subtitle: "Solid Oral / Major",
    text: `URGENT COMPLAINT LOG
Source: Retail Pharmacy Dispenser
Customer: Walgreens Pharmacy #8821, Chicago IL
Contact: rx8821@walgreens.com
Date: 2026-09-08

Product: Atorvastatin Calcium Tablets, 20mg
Batch / Lot Number: LOT-2024-0988A
Manufacturing Date: 2024-01-15
Expiry Date: 2026-01-14
Affected Units: 18 HDPE Bottles (90ct each)

Description:
A patient returned an opened bottle reporting that the heat induction foil seal was completely loose inside the cap. Our dispensing pharmacist subsequently checked all 18 bottles from the same shipping shipper carton (Lot LOT-2024-0988A) and found 14 bottles with unbonded or partially scorched foil seals. Tablets exhibited slight powdering/chalking due to humidity ingress. Please issue credit and recall quarantine notice.

Severity: Major
Priority: High`,
  },
  {
    title: "Amoxicillin Discoloration",
    subtitle: "Antibiotic / Sub-potency",
    text: `Customer Complaint Report
Reporter: St. Anthony Community Hospital
Contact: Lead Pharmacist Thomas Reed (t.reed@stanthonyhealth.org)
Date: 2026-09-09

Product: Amoxicillin Trihydrate Capsules, 500mg
Lot Number: AMX-2024-3310
Mfg Date: 2024-02-10
Exp Date: 2026-02-09
Quantity: 35 blister cards (350 capsules)

Details:
Inpatient nursing staff reported that upon pushing capsules through the blister foil, multiple capsules showed uneven mottled brown discoloration instead of the normal uniform ivory color. Several gelatin shells appeared brittle and chipped during handling. We suspect degradation or moisture permeation affecting potency. All remaining blister boxes have been quarantined in our pharmacy vault. Initial severity assessed as Major.`,
  },
  {
    title: "Mislabeled Dosage Strength",
    subtitle: "Packaging / Major",
    text: `Regulatory & Quality Complaint Notice
Source: Health System Wholesaler (Amerisource)
Customer Name: AmerisourceBergen Distribution Center #14
Contact: qa-ops@amerisource.com
Date: 2026-09-07

Product Name: Metformin Hydrochloride Extended-Release
Reported Strength: Label says 500mg, but inner blister foil is printed 850mg
Lot: MET-2024-5509B
Manufacturing: 2024-05-01
Expiration: 2027-04-30
Quantity Affected: 120 cartons

Incident Narrative:
During receiving audit, warehouse QA noticed a discrepancy between the outer secondary folding box (stating 500mg ER) and the aluminum primary blister backing (printed 850mg ER). This poses a medication error risk if dispensed. Immediate quarantine initiated. Requires Root Cause and CAPA review under 21 CFR Part 211.198.`,
  },
];

export const AIAssistant: React.FC = () => {
  const dispatch = useDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const {
    fields,
    extractionStatus,
    extractionProgress,
    extractionStatusText,
  } = useSelector((state: RootState) => state.complaint);

  const { messages, isSending } = useSelector((state: RootState) => state.chat);

  const [inputMode, setInputMode] = useState<"upload" | "paste">("paste");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState(DEMO_PRESETS[0].text);
  const [isDragOver, setIsDragOver] = useState(false);
  const [chatInput, setChatInput] = useState("");

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.size > 10 * 1024 * 1024) {
        alert("File exceeds maximum allowed size of 10MB");
        return;
      }
      setSelectedFile(file);
      setInputMode("upload");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        alert("File exceeds maximum allowed size of 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const runExtraction = async () => {
    if (inputMode === "upload" && !selectedFile) {
      alert("Please select or drop a complaint document.");
      return;
    }
    if (inputMode === "paste" && !pastedText.trim()) {
      alert("Please paste complaint text or email content.");
      return;
    }

    dispatch(startExtraction());

    try {
      dispatch(
        updateExtractionProgress({
          progress: 25,
          statusText: "1/5 Ingesting and normalizing text...",
        })
      );
      await new Promise((r) => setTimeout(r, 300));

      dispatch(
        updateExtractionProgress({
          progress: 50,
          statusText: "2/5 Executing LangGraph schema extraction (Groq gemma2-9b-it)...",
        })
      );

      const result = await extractComplaintApi(
        fields.id,
        inputMode === "upload" ? selectedFile : null,
        inputMode === "paste" ? pastedText : undefined
      );

      dispatch(
        updateExtractionProgress({
          progress: 75,
          statusText: "3/5 Calculating field confidence & GMP completeness...",
        })
      );
      await new Promise((r) => setTimeout(r, 250));

      dispatch(
        updateExtractionProgress({
          progress: 90,
          statusText: "4/5 Checking duplicate lot trends & generating CAPA...",
        })
      );
      await new Promise((r) => setTimeout(r, 200));

      dispatch(
        extractionSuccess({
          extractedFields: result.extracted_fields,
          confidenceScores: result.confidence_scores,
          completenessReport: result.completeness_report,
          duplicateFlag: result.duplicate_flag,
          rootCauseRecommendation: result.root_cause_recommendation,
          capaRecommendation: result.capa_recommendation,
          modelUsed: result.model_used,
        })
      );

      dispatch(
        addMessage({
          id: "extract-msg-" + Date.now(),
          role: "assistant",
          content: `AI extraction completed successfully for **${result.extracted_fields.product_name || "product"}** (Lot: ${result.extracted_fields.batch_lot_number || "N/A"}). Initial severity is assessed as **${result.extracted_fields.severity}**. Review the populated form on the left or ask me follow-up questions below.`,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        })
      );
    } catch (err: any) {
      dispatch(extractionFailed(err.message || "Extraction failed"));
    }
  };

  const handleSendChat = async (messageToSend?: string) => {
    const text = (messageToSend || chatInput).trim();
    if (!text || isSending) return;

    const userMsg = {
      id: "user-" + Date.now(),
      role: "user" as const,
      content: text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    dispatch(addMessage(userMsg));
    setChatInput("");
    dispatch(setSending(true));

    try {
      const res = await sendChatApi(fields.id, text);
      dispatch(
        addMessage({
          id: "asst-" + Date.now(),
          role: "assistant",
          content: res.reply,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          suggestedUpdates: res.suggested_field_updates,
        })
      );

      if (res.suggested_field_updates) {
        Object.entries(res.suggested_field_updates).forEach(([key, val]) => {
          dispatch(updateField({ field: key as any, value: String(val) }));
        });
      }

      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err: any) {
      dispatch(
        addMessage({
          id: "err-" + Date.now(),
          role: "assistant",
          content: `Chat notice: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        })
      );
    } finally {
      dispatch(setSending(false));
    }
  };

  return (
    <div className="right-pane-container">
      {/* Pane Header */}
      <div className="pane-header">
        <div className="pane-title-group">
          <div className="icon-badge ai-icon-badge">
            <Bot size={20} />
          </div>
          <div>
            <h2 className="pane-heading">AI Complaint Intake Assistant</h2>
            <div className="pane-sub-bar">
              <span className="langgraph-pill">LangGraph Agent Graph</span>
              <span className="groq-model-pill">Groq LPU Engine</span>
            </div>
          </div>
        </div>
      </div>

      {/* Intake Ingestion Section */}
      <div className="assistant-ingest-card">
        {/* Mode Switcher */}
        <div className="ingest-toggle-row">
          <button
            type="button"
            className={`ingest-toggle-btn ${inputMode === "paste" ? "active" : ""}`}
            onClick={() => setInputMode("paste")}
          >
            <FileText size={15} /> Paste Complaint Text / Email
          </button>
          <button
            type="button"
            className={`ingest-toggle-btn ${inputMode === "upload" ? "active" : ""}`}
            onClick={() => setInputMode("upload")}
          >
            <UploadCloud size={15} /> Upload Document (PDF/DOCX/EML)
          </button>
        </div>

        {/* Upload Mode */}
        {inputMode === "upload" ? (
          <div
            className={`dropzone ${isDragOver ? "drag-over" : ""} ${selectedFile ? "has-file" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt,.eml,.msg"
              style={{ display: "none" }}
              onChange={handleFileSelect}
            />

            {selectedFile ? (
              <div className="selected-file-preview">
                <FileText size={32} className="file-icon" />
                <div className="file-meta">
                  <span className="file-name">{selectedFile.name}</span>
                  <span className="file-size">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Click to change
                  </span>
                </div>
              </div>
            ) : (
              <div className="dropzone-prompt">
                <UploadCloud size={36} className="dropzone-icon" />
                <p className="dropzone-text">
                  Drag & drop complaint document here, or{" "}
                  <span className="dropzone-browse">browse files</span>
                </p>
                <span className="dropzone-hint">
                  Supports PDF, DOCX, TXT, EML (Max 10MB per submission)
                </span>
              </div>
            )}
          </div>
        ) : (
          /* Paste Mode with Presets */
          <div className="paste-mode-container">
            <div className="preset-chips-row">
              <span className="preset-label">Quick Demo Presets:</span>
              {DEMO_PRESETS.map((preset, i) => (
                <button
                  key={i}
                  type="button"
                  className="preset-chip"
                  onClick={() => setPastedText(preset.text)}
                  title={preset.subtitle}
                >
                  <Zap size={12} /> {preset.title}
                </button>
              ))}
            </div>

            <textarea
              className="paste-textarea"
              rows={5}
              placeholder="Paste raw customer complaint email, adverse event narration, QA return slip, or transcription..."
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
            />
          </div>
        )}

        {/* Action Trigger Button */}
        <div className="ingest-action-row">
          <button
            type="button"
            className="btn btn-primary run-extraction-btn"
            onClick={runExtraction}
            disabled={extractionStatus === "extracting"}
          >
            {extractionStatus === "extracting" ? (
              <>
                <span className="spinner" /> Extracting with LangGraph...
              </>
            ) : (
              <>
                <Sparkles size={16} /> Run AI Extraction Pipeline
              </>
            )}
          </button>
        </div>

        {/* Multi-stage Progress Bar */}
        {(extractionStatus === "extracting" || extractionStatus === "completed" || extractionStatus === "error") && (
          <div className="extraction-progress-box">
            <div className="progress-info-row">
              <span className="progress-status-text">
                {extractionStatusText}
              </span>
              <span className="progress-pct">{extractionProgress}%</span>
            </div>
            <div className="progress-track">
              <div
                className={`progress-fill ${extractionStatus === "error" ? "error" : "active"}`}
                style={{ width: `${extractionProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Follow-up Chat Interface */}
      <div className="chat-section-wrapper">
        <div className="chat-header-bar">
          <div className="chat-title-group">
            <Bot size={16} className="chat-bot-icon" />
            <span className="chat-title">Complaint Follow-up & Triage Q&A</span>
          </div>
          <span className="chat-context-badge">Context: {fields.product_name || "Active Form"}</span>
        </div>

        {/* Chat Message Scroll List */}
        <div className="chat-messages-container">
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-bubble-row ${msg.role}`}>
              <div className="chat-avatar">
                {msg.role === "assistant" ? <Bot size={15} /> : <User size={15} />}
              </div>
              <div className="chat-bubble-content">
                <div className="chat-bubble-header">
                  <span className="chat-author">
                    {msg.role === "assistant" ? "AI QA Specialist" : "You"}
                  </span>
                  <span className="chat-time">{msg.timestamp}</span>
                </div>
                <div className="chat-text">{msg.content}</div>
                {msg.suggestedUpdates && (
                  <div className="suggested-updates-badge">
                    <CheckCircle2 size={13} />
                    <span>Auto-updated form field(s) on left pane</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isSending && (
            <div className="chat-bubble-row assistant">
              <div className="chat-avatar">
                <Bot size={15} />
              </div>
              <div className="chat-bubble-content">
                <div className="typing-dots">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Quick follow-up chip prompts */}
        <div className="quick-queries-row">
          <button
            type="button"
            className="query-chip"
            onClick={() => handleSendChat("Why is the initial severity classified as Critical?")}
          >
            Why is severity Critical?
          </button>
          <button
            type="button"
            className="query-chip"
            onClick={() => handleSendChat("What is the recommended CAPA for this defect?")}
          >
            What is the CAPA plan?
          </button>
          <button
            type="button"
            className="query-chip"
            onClick={() => handleSendChat("Did we have past complaints for this batch?")}
          >
            Check batch history
          </button>
          <button
            type="button"
            className="query-chip"
            onClick={() => handleSendChat("Are there missing fields in this complaint?")}
          >
            Check missing fields
          </button>
        </div>

        {/* Chat Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendChat();
          }}
          className="chat-input-form"
        >
          <input
            type="text"
            className="chat-text-input"
            placeholder="Ask follow-up questions about this complaint, re-extraction, or regulatory actions..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={isSending}
          />
          <button
            type="submit"
            className="chat-send-btn"
            disabled={isSending || !chatInput.trim()}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIAssistant;
