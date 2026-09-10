import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../../store";
import {
  setComplaintsList,
  setLoadingComplaints,
  setDrawerOpen,
  setStatusFilter,
  setSeverityFilter,
} from "../../store/slices/triageSlice";
import { loadExistingComplaint } from "../../store/slices/complaintSlice";
import { clearChat, addMessage } from "../../store/slices/chatSlice";
import { fetchComplaintsApi } from "../../api/client";
import {
  X,
  RefreshCw,
  FolderArchive,
} from "lucide-react";

export const TriageDrawer: React.FC = () => {
  const dispatch = useDispatch();
  const {
    complaintsList,
    isLoading,
    drawerOpen,
    statusFilter,
    severityFilter,
  } = useSelector((state: RootState) => state.triage);

  const loadData = async () => {
    dispatch(setLoadingComplaints(true));
    try {
      const data = await fetchComplaintsApi(statusFilter, severityFilter);
      dispatch(setComplaintsList(data));
    } catch (err) {
      console.error("Error loading triage list:", err);
    } finally {
      dispatch(setLoadingComplaints(false));
    }
  };

  useEffect(() => {
    if (drawerOpen) {
      loadData();
    }
  }, [drawerOpen, statusFilter, severityFilter]);

  const handleSelectComplaint = (cmp: any) => {
    dispatch(
      loadExistingComplaint({
        complaint: {
          id: cmp.id,
          complaint_source: cmp.complaint_source || "",
          customer_name: cmp.customer_name || "",
          customer_contact: cmp.customer_contact || "",
          product_name: cmp.product_name || "",
          product_strength: cmp.product_strength || "",
          batch_lot_number: cmp.batch_lot_number || "",
          manufacturing_date: cmp.manufacturing_date || "",
          expiry_date: cmp.expiry_date || "",
          quantity_affected: cmp.quantity_affected || "",
          complaint_type: cmp.complaint_type || "",
          complaint_date: cmp.complaint_date || "",
          description: cmp.description || "",
          severity: cmp.severity || "Major",
          priority: cmp.priority || "Medium",
          status: cmp.status || "pending_triage",
        },
        completenessReport: cmp.completeness_report,
        duplicateFlag: cmp.duplicate_flag,
        rootCauseRecommendation: cmp.root_cause_recommendation,
        capaRecommendation: cmp.capa_recommendation,
      })
    );

    // Update chat context
    dispatch(clearChat());
    dispatch(
      addMessage({
        id: "load-" + Date.now(),
        role: "assistant",
        content: `Loaded complaint **${cmp.id}** for **${cmp.product_name}** (${cmp.product_strength}, Lot: ${cmp.batch_lot_number}). Initial severity is rated **${cmp.severity}**. What questions do you have about this investigation?`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      })
    );

    dispatch(setDrawerOpen(false));
  };

  if (!drawerOpen) return null;

  return (
    <div className="drawer-overlay" onClick={() => dispatch(setDrawerOpen(false))}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-title-wrap">
            <FolderArchive size={20} className="drawer-icon" />
            <div>
              <h3>Triage Queue Archive</h3>
              <span className="drawer-subtitle">
                Logged Customer Complaints & Regulatory Audit Records
              </span>
            </div>
          </div>

          <div className="drawer-actions">
            <button
              className="icon-action-btn"
              onClick={loadData}
              title="Refresh Queue"
            >
              <RefreshCw size={16} className={isLoading ? "spin" : ""} />
            </button>
            <button
              className="icon-action-btn"
              onClick={() => dispatch(setDrawerOpen(false))}
              title="Close Drawer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="drawer-filter-bar">
          <div className="filter-group">
            <label>Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => dispatch(setStatusFilter(e.target.value))}
              className="filter-select"
            >
              <option value="all">All Statuses</option>
              <option value="pending_triage">Pending Triage</option>
              <option value="in_review">In Review</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Severity:</label>
            <select
              value={severityFilter}
              onChange={(e) => dispatch(setSeverityFilter(e.target.value))}
              className="filter-select"
            >
              <option value="all">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="Major">Major</option>
              <option value="Minor">Minor</option>
            </select>
          </div>
        </div>

        {/* Complaints List */}
        <div className="drawer-list-content">
          {isLoading ? (
            <div className="drawer-loading">
              <span className="spinner" /> Loading triage records...
            </div>
          ) : complaintsList.length === 0 ? (
            <div className="drawer-empty">
              <FolderArchive size={32} />
              <p>No complaints match the selected filter criteria.</p>
            </div>
          ) : (
            <div className="complaint-cards-list">
              {complaintsList.map((cmp) => (
                <div
                  key={cmp.id}
                  className="complaint-queue-card"
                  onClick={() => handleSelectComplaint(cmp)}
                >
                  <div className="card-top-row">
                    <span className="card-product">
                      {cmp.product_name || "Untitled Product"}
                    </span>
                    <span className={`severity-badge ${cmp.severity?.toLowerCase()}`}>
                      {cmp.severity}
                    </span>
                  </div>

                  <div className="card-details-row">
                    <span className="card-lot">Lot: {cmp.batch_lot_number || "N/A"}</span>
                    <span className="card-date">{cmp.complaint_date || "No date"}</span>
                  </div>

                  <p className="card-desc-snippet">
                    {cmp.description ? cmp.description.substring(0, 100) + "..." : "No description."}
                  </p>

                  <div className="card-bottom-row">
                    <span className={`status-tag ${cmp.status}`}>
                      {cmp.status.replace("_", " ")}
                    </span>
                    <span className="card-customer">{cmp.customer_name || "Unknown"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TriageDrawer;
