import React, { useState, useEffect } from "react";
import { configureGroqKeyApi, getGroqStatusApi } from "../api/client";
import { Key, CheckCircle2, AlertCircle, X, Sparkles } from "lucide-react";

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
    <div className="modal-backdrop">
      <div className="modal-dialog">
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Key size={20} className="modal-icon" />
            <h3>Configure Groq API Key</h3>
          </div>
          <button className="icon-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="modal-body">
          <p className="modal-description">
            The AI agent framework uses <strong>gemma2-9b-it</strong> for rapid schema extraction and <strong>llama-3.3-70b-versatile</strong> for CAPA root cause reasoning via Groq’s ultra-low latency LPU engine.
          </p>

          <div className="status-banner">
            {isConfigured ? (
              <div className="status-badge-live configured">
                <CheckCircle2 size={16} />
                <span>Groq API Key is currently ACTIVE</span>
              </div>
            ) : (
              <div className="status-badge-live unconfigured">
                <AlertCircle size={16} />
                <span>Groq Key not yet configured (using local pharma heuristic fallback)</span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="groqKeyInput">Groq API Key</label>
            <input
              id="groqKeyInput"
              type="password"
              className="text-input"
              placeholder="gsk_..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required
            />
            <span className="field-hint">
              Your key is held securely in the local backend process memory.
            </span>
          </div>

          {statusMsg && (
            <div className={`alert-banner ${statusMsg.type}`}>
              {statusMsg.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || !apiKey.trim()}>
              {loading ? (
                <>
                  <span className="spinner" /> Validating with Groq...
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Activate Key
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
