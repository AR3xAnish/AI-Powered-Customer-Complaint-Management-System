import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
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
  AlertCircle,
  Loader2,
} from "lucide-react";

export const TriageDrawer = () => {
  const dispatch = useDispatch();
  const {
    complaintsList,
    isLoading,
    drawerOpen,
    statusFilter,
    severityFilter,
  } = useSelector((state) => state.triage);

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

  const handleSelectComplaint = (cmp) => {
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
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex justify-end animate-in fade-in duration-200"
      onClick={() => dispatch(setDrawerOpen(false))}
    >
      <div
        className="w-full max-w-xl bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shadow-xs">
              <FolderArchive size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">Triage Queue Archive</h3>
              <span className="text-xs text-slate-500 font-medium">
                Logged Customer Complaints & Regulatory Audit Records
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
              onClick={loadData}
              title="Refresh Queue"
            >
              <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            </button>
            <button
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
              onClick={() => dispatch(setDrawerOpen(false))}
              title="Close Drawer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/40 flex items-center gap-4 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <label className="font-semibold text-slate-600">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => dispatch(setStatusFilter(e.target.value))}
              className="bg-white border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-800 font-medium focus:outline-hidden focus:border-blue-500 shadow-2xs"
            >
              <option value="all">All Statuses</option>
              <option value="pending_triage">Pending Triage</option>
              <option value="in_review">In Review</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="font-semibold text-slate-600">Severity:</label>
            <select
              value={severityFilter}
              onChange={(e) => dispatch(setSeverityFilter(e.target.value))}
              className="bg-white border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-800 font-medium focus:outline-hidden focus:border-blue-500 shadow-2xs"
            >
              <option value="all">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="Major">Major</option>
              <option value="Minor">Minor</option>
            </select>
          </div>
        </div>

        {/* Complaints List */}
        <div className="flex-1 p-6 overflow-y-auto min-h-0 bg-slate-50/30">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-500 gap-2 text-sm font-medium">
              <Loader2 size={18} className="animate-spin text-blue-600" />
              <span>Loading triage records...</span>
            </div>
          ) : complaintsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3 text-center">
              <FolderArchive size={36} className="text-slate-300" />
              <p className="text-sm font-medium text-slate-500">No complaints match the selected filter criteria.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {complaintsList.map((cmp) => {
                const isCritical = cmp.severity === "Critical";
                const isMajor = cmp.severity === "Major";

                return (
                  <div
                    key={cmp.id}
                    className="p-4 bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-blue-400 rounded-xl transition-all cursor-pointer shadow-xs hover:shadow-sm space-y-2.5"
                    onClick={() => handleSelectComplaint(cmp)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">
                        {cmp.product_name || "Untitled Product"}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          isCritical
                            ? "bg-red-50 text-red-700 border-red-200"
                            : isMajor
                            ? "bg-orange-50 text-orange-700 border-orange-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}
                      >
                        {cmp.severity}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[11px] text-slate-600 font-semibold border border-slate-200">
                        Lot: {cmp.batch_lot_number || "N/A"}
                      </span>
                      <span>{cmp.complaint_date || "No date"}</span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {cmp.description ? cmp.description : "No description provided."}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                        {cmp.status.replace("_", " ")}
                      </span>
                      <span className="text-slate-500 font-medium">{cmp.customer_name || "Unknown"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TriageDrawer;

