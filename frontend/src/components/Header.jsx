import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toggleDrawer } from "../store/slices/triageSlice";
import { ShieldAlert, Key, FolderArchive, Cpu } from "lucide-react";
import GroqModal from "./GroqModal";

export const Header = () => {
  const dispatch = useDispatch();
  const [modalOpen, setModalOpen] = useState(false);
  const { complaintsList } = useSelector((state) => state.triage);

  return (
    <>
      <header className="app-header">
        <div className="header-left">
          <div className="logo-badge">
            <ShieldAlert size={22} className="logo-icon" />
            <div className="brand-text">
              <span className="brand-title">PharmaTriage AI</span>
              <span className="brand-subtitle">
                Customer Complaint Management • 21 CFR Part 211
              </span>
            </div>
          </div>
        </div>

        <div className="header-center">
          <div className="model-chip" title="Active Groq AI Models">
            <Cpu size={14} className="chip-icon" />
            <span className="chip-label">Agent Engine:</span>
            <span className="chip-value">gemma2-9b-it</span>
            <span className="chip-separator">•</span>
            <span className="chip-value-accent">llama-3.3-70b</span>
          </div>
        </div>

        <div className="header-right">
          <button
            className="header-btn"
            onClick={() => setModalOpen(true)}
            title="Configure Groq API Key"
          >
            <Key size={16} />
            <span>Groq Key</span>
          </button>

          <button
            className="header-btn primary-header-btn"
            onClick={() => dispatch(toggleDrawer())}
            title="View Triage Queue"
          >
            <FolderArchive size={16} />
            <span>Triage Queue</span>
            {complaintsList.length > 0 && (
              <span className="badge-count">{complaintsList.length}</span>
            )}
          </button>
        </div>
      </header>

      {modalOpen && <GroqModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />}
    </>
  );
};

export default Header;
