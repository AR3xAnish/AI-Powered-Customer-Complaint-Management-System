import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
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
  Loader2,
} from "lucide-react";

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

export const AIAssistant = () => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const chatScrollContainerRef = useRef(null);

  const {
    fields,
    extractionStatus,
    extractionProgress,
    extractionStatusText,
  } = useSelector((state) => state.complaint);

  const { messages, isSending } = useSelector((state) => state.chat);

  const [inputMode, setInputMode] = useState("paste");
  const [selectedFile, setSelectedFile] = useState(null);
  const [pastedText, setPastedText] = useState(DEMO_PRESETS[0].text);
  const [isDragOver, setIsDragOver] = useState(false);
  const [chatInput, setChatInput] = useState("");

  const scrollToBottom = () => {
    if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTo({
        top: chatScrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, isSending]);


  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
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

  const handleFileSelect = (e) => {
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
    } catch (err) {
      dispatch(extractionFailed(err.message || "Extraction failed"));
    }
  };

  const handleSendChat = async (messageToSend) => {
    const text = (messageToSend || chatInput).trim();
    if (!text || isSending) return;

    const userMsg = {
      id: "user-" + Date.now(),
      role: "user",
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
          dispatch(updateField({ field: key, value: String(val) }));
        });
      }

      setTimeout(() => {
        scrollToBottom();
      }, 50);
    } catch (err) {
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
    <div className="p-6 lg:p-8 flex flex-col gap-6 min-h-full">
      {/* Pane Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shadow-xs">
            <Bot size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">AI Complaint Intake Assistant</h2>
          </div>
        </div>
      </div>

      {/* Intake Ingestion Section */}
      <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        {/* Mode Switcher */}
        <div className="flex bg-slate-200/70 p-1 rounded-lg gap-1">
          <button
            type="button"
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs rounded-md transition-all cursor-pointer ${
              inputMode === "paste"
                ? "bg-white text-slate-900 font-bold shadow-xs"
                : "text-slate-600 hover:text-slate-900 font-medium"
            }`}
            onClick={() => setInputMode("paste")}
          >
            <FileText size={15} />
            <span>Paste Complaint Text / Email</span>
          </button>
          <button
            type="button"
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs rounded-md transition-all cursor-pointer ${
              inputMode === "upload"
                ? "bg-white text-slate-900 font-bold shadow-xs"
                : "text-slate-600 hover:text-slate-900 font-medium"
            }`}
            onClick={() => setInputMode("upload")}
          >
            <UploadCloud size={15} />
            <span>Upload Document (PDF/DOCX/EML)</span>
          </button>
        </div>

        {/* Upload Mode */}
        {inputMode === "upload" ? (
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 bg-white ${
              isDragOver
                ? "border-blue-500 bg-blue-50/50"
                : selectedFile
                ? "border-emerald-400 bg-emerald-50/20"
                : "border-slate-300 hover:border-blue-400"
            }`}
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
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <FileText size={24} />
                </div>
                <div>
                  <span className="block font-bold text-xs text-slate-900">{selectedFile.name}</span>
                  <span className="block text-[11px] text-slate-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Click to change
                  </span>
                </div>
              </div>
            ) : (
              <>
                <UploadCloud size={36} className="text-slate-400" />
                <p className="text-xs text-slate-700 font-medium">
                  Drag & drop complaint document here, or{" "}
                  <span className="text-blue-600 font-bold underline">browse files</span>
                </p>
                <span className="text-[11px] text-slate-400">
                  Supports PDF, DOCX, TXT, EML (Max 10MB per submission)
                </span>
              </>
            )}
          </div>
        ) : (
          /* Paste Mode with Presets */
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-slate-600 mr-1">Quick Demo Presets:</span>
              {DEMO_PRESETS.map((preset, i) => (
                <button
                  key={i}
                  type="button"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 rounded-full text-xs font-medium transition-all shadow-2xs cursor-pointer"
                  onClick={() => setPastedText(preset.text)}
                  title={preset.subtitle}
                >
                  <Zap size={12} className="text-amber-500" />
                  <span>{preset.title}</span>
                </button>
              ))}
            </div>

            <textarea
              className="w-full p-3.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 placeholder:text-slate-400 leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-xs"
              rows={5}
              placeholder="Paste raw customer complaint email, adverse event narration, QA return slip, or transcription..."
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
            />
          </div>
        )}

        {/* Action Trigger Button */}
        <div>
          <button
            type="button"
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl text-xs transition-all shadow-xs hover:shadow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            onClick={runExtraction}
            disabled={extractionStatus === "extracting"}
          >
            {extractionStatus === "extracting" ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Extracting with LangGraph...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Run AI Extraction Pipeline</span>
              </>
            )}
          </button>
        </div>

        {/* Multi-stage Progress Bar */}
        {(extractionStatus === "extracting" || extractionStatus === "completed" || extractionStatus === "error") && (
          <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-2xs animate-in fade-in">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>{extractionStatusText}</span>
              <span className="font-mono">{extractionProgress}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  extractionStatus === "error" ? "bg-red-500" : "bg-blue-600"
                }`}
                style={{ width: `${extractionProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Follow-up Chat Interface */}
      <div className="border border-slate-200 rounded-xl bg-white flex flex-col shadow-2xs flex-1 min-h-[460px] overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Bot size={16} className="text-indigo-600" />
            <span className="text-xs font-bold text-slate-800">Complaint Follow-up & Triage Q&A</span>
          </div>
          <span className="font-mono text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 font-semibold">
            Context: {fields.product_name || "Active Form"}
          </span>
        </div>

        {/* Chat Message Scroll List */}
        <div ref={chatScrollContainerRef} className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[380px] bg-slate-50/30">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 max-w-[90%] ${
                msg.role === "user" ? "ml-auto flex-row-reverse" : ""
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs shadow-2xs ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-indigo-50 border border-indigo-200 text-indigo-600"
                }`}
              >
                {msg.role === "assistant" ? <Bot size={15} /> : <User size={15} />}
              </div>
              <div
                className={`p-3.5 text-xs leading-relaxed shadow-2xs ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-2xl rounded-tr-xs"
                    : "bg-white text-slate-800 border border-slate-200 rounded-2xl rounded-tl-xs"
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-1 text-[10px] opacity-75 font-semibold">
                  <span>{msg.role === "assistant" ? "AI QA Specialist" : "You"}</span>
                  <span>{msg.timestamp}</span>
                </div>
                <div className="whitespace-pre-wrap">{msg.content}</div>
                {msg.suggestedUpdates && (
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    <span>Auto-updated form field(s) on left pane</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isSending && (
            <div className="flex items-start gap-2.5 max-w-[90%]">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
                <Bot size={15} />
              </div>
              <div className="p-3.5 bg-white border border-slate-200 rounded-2xl rounded-tl-xs shadow-2xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
        </div>

        {/* Quick follow-up chip prompts */}
        <div className="flex flex-wrap gap-1.5 px-4 py-2 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <button
            type="button"
            className="text-[11px] font-medium px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-full cursor-pointer transition-colors shadow-2xs"
            onClick={() => handleSendChat("Why is the initial severity classified as Critical?")}
          >
            Why is severity Critical?
          </button>
          <button
            type="button"
            className="text-[11px] font-medium px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-full cursor-pointer transition-colors shadow-2xs"
            onClick={() => handleSendChat("What is the recommended CAPA for this defect?")}
          >
            What is the CAPA plan?
          </button>
          <button
            type="button"
            className="text-[11px] font-medium px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-full cursor-pointer transition-colors shadow-2xs"
            onClick={() => handleSendChat("Did we have past complaints for this batch?")}
          >
            Check batch history
          </button>
          <button
            type="button"
            className="text-[11px] font-medium px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-full cursor-pointer transition-colors shadow-2xs"
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
          className="p-3 border-t border-slate-200 flex items-center gap-2 bg-white shrink-0"
        >
          <input
            type="text"
            className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            placeholder="Ask follow-up questions about this complaint, re-extraction, or regulatory actions..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={isSending}
          />
          <button
            type="submit"
            className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-40 shadow-xs flex items-center justify-center"
            disabled={isSending || !chatInput.trim()}
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIAssistant;

