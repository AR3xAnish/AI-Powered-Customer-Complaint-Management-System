import React, { useState, useEffect } from "react";
import { configureGroqKeyApi, getGroqStatusApi } from "../api/client";
import { Key, CheckCircle2, AlertCircle, X, Sparkles, Loader2 } from "lucide-react";

export const GroqModal = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    getGroqStatusApi().then((data) => {
      setIsConfigured(data.configured);
    });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await configureGroqKeyApi(apiKey.trim());
      setStatusMsg({ type: "success", text: res.message || "Groq API key activated successfully!" });
      setIsConfigured(true);
      setApiKey("");
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setStatusMsg({ type: "error", text: err.message || "Failed to validate key" });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
              <Key size={18} />
            </div>
            <h3 className="text-base font-bold text-slate-900">Configure Groq API Key</h3>
          </div>
          <button
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          <p className="text-xs text-slate-600 leading-relaxed">
            The AI agent framework uses <strong className="text-slate-900">gemma2-9b-it</strong> for rapid schema extraction and <strong className="text-slate-900">llama-3.3-70b-versatile</strong> for CAPA root cause reasoning via Groq’s ultra-low latency LPU engine.
          </p>

          <div>
            {isConfigured ? (
              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>Groq API Key is currently ACTIVE</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-semibold">
                <AlertCircle size={16} className="text-amber-600 shrink-0" />
                <span>Groq Key not yet configured (using local pharma heuristic fallback)</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="groqKeyInput" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Groq API Key
            </label>
            <input
              id="groqKeyInput"
              type="password"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-xs"
              placeholder="gsk_..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required
            />
            <span className="block text-[11px] text-slate-500">
              Your key is held securely in the local backend process memory.
            </span>
          </div>

          {statusMsg && (
            <div
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium border ${
                statusMsg.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              {statusMsg.type === "success" ? <CheckCircle2 size={16} className="text-emerald-600 shrink-0" /> : <AlertCircle size={16} className="text-red-600 shrink-0" />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
              onClick={onClose}
            >
              Close
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer flex items-center gap-2 shadow-xs disabled:opacity-50"
              disabled={loading || !apiKey.trim()}
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Validating with Groq...</span>
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  <span>Activate Key</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroqModal;

