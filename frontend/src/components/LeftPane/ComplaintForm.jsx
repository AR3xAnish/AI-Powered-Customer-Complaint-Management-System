import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  updateField,
  resetComplaintForm,
  setSaving,
  setSaveSuccessMessage,
} from "../../store/slices/complaintSlice";
import { saveComplaintApi, fetchComplaintsApi } from "../../api/client";
import { setComplaintsList } from "../../store/slices/triageSlice";
import {
  RotateCcw,
  Save,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  ClipboardList,
  Clock,
  ShieldCheck,
  Loader2,
} from "lucide-react";

export const ComplaintForm = () => {
  const dispatch = useDispatch();
  const {
    fields,
    confidenceScores,
    completenessReport,
    duplicateFlag,
    rootCauseRecommendation,
    capaRecommendation,
    isExtracted,
    isSaving,
    saveSuccessMessage,
  } = useSelector((state) => state.complaint);

  const [activeTab, setActiveTab] = useState("form");

  const handleChange = (e) => {
    const { name, value } = e.target;
    dispatch(updateField({ field: name, value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    dispatch(setSaving(true));
    try {
      await saveComplaintApi(fields.id, fields);
      dispatch(setSaveSuccessMessage("Complaint saved and filed for triage!"));
      const updatedList = await fetchComplaintsApi();
      dispatch(setComplaintsList(updatedList));
      setTimeout(() => {
        dispatch(setSaveSuccessMessage(null));
      }, 4000);
    } catch (err) {
      alert("Error saving complaint: " + err.message);
    } finally {
      dispatch(setSaving(false));
    }
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset this complaint form?")) {
      dispatch(resetComplaintForm());
    }
  };

  const renderConfidenceBadge = (fieldName) => {
    const score = confidenceScores[fieldName];
    if (score === undefined || score === null) return null;

    const pct = Math.round(score * 100);
    const isLow = score < 0.8;

    return (
      <span
        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
          isLow
            ? "bg-amber-50 text-amber-700 border-amber-300 animate-pulse"
            : "bg-emerald-50 text-emerald-700 border-emerald-300"
        }`}
        title={
          isLow
            ? "AI confidence is below 80%. Please manually verify."
            : "High AI extraction certainty"
        }
      >
        {isLow ? <AlertTriangle size={11} /> : <CheckCircle2 size={11} />}
        {pct}% {isLow ? "Verify" : "Conf"}
      </span>
    );
  };

  const placeholderText = isExtracted ? "" : "Awaiting AI extraction...";

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6">
      {/* Pane Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shadow-xs">
            <ClipboardList size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Log Customer Complaint</h2>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                  fields.status === "pending_triage"
                    ? "bg-amber-100 text-amber-800 border-amber-300"
                    : fields.status === "in_review"
                    ? "bg-blue-100 text-blue-800 border-blue-300"
                    : "bg-emerald-100 text-emerald-800 border-emerald-300"
                }`}
              >
                {fields.status === "pending_triage" && "Pending Triage"}
                {fields.status === "in_review" && "In Review"}
                {fields.status === "closed" && "Closed"}
              </span>
              {/* <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                ID: {fields.id}
              </span> */}
            </div>
          </div>
        </div>
      </div>

      {saveSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2.5 shadow-xs animate-in fade-in">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* Duplicate Lot Banner if detected */}
      {duplicateFlag && duplicateFlag.is_duplicate && (
        <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl text-amber-900 flex items-start gap-3 shadow-xs">
          <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <strong className="font-bold">Duplicate Batch Alert ({duplicateFlag.match_count} existing complaint(s)):</strong>
            <span> {duplicateFlag.details}</span>
          </div>
        </div>
      )}

      {/* Tab Switcher for Form vs AI Intelligence */}
      <div className="flex border-b border-slate-200 gap-3">
        <button
          className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "form"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
          onClick={() => setActiveTab("form")}
        >
          Structured Intake Form
        </button>
        <button
          className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "ai_insights"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
          onClick={() => setActiveTab("ai_insights")}
        >
          <Sparkles size={14} />
          AI Intelligence & CAPA
          {completenessReport && (
            <span className="ml-1 text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded-full border border-blue-200">
              {completenessReport.score}%
            </span>
          )}
        </button>
      </div>

      {/* Main Form Content */}
      {activeTab === "form" ? (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Section 1: Origin & Customer Details */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-200/80">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-xs">
                1
              </span>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Origin & Customer Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="complaint_source" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Complaint Source *
                  </label>
                  {renderConfidenceBadge("complaint_source")}
                </div>
                <select
                  id="complaint_source"
                  name="complaint_source"
                  value={fields.complaint_source}
                  onChange={handleChange}
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 transition-all shadow-xs ${
                    confidenceScores.complaint_source && confidenceScores.complaint_source < 0.8
                      ? "border-amber-400 bg-amber-50/30 focus:border-amber-500 focus:ring-amber-500/20"
                      : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                >
                  <option value="">{isExtracted ? "Select Source..." : "Awaiting AI extraction..."}</option>
                  <option value="Healthcare Professional">Healthcare Professional</option>
                  <option value="Hospital/Clinic">Hospital / Clinic</option>
                  <option value="Pharmacy">Pharmacy / Dispenser</option>
                  <option value="Patient/Consumer">Patient / Consumer</option>
                  <option value="Distributor">Wholesaler / Distributor</option>
                  <option value="Regulatory Authority">Regulatory Authority (FDA / EMA)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="customer_name" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Customer Name *
                  </label>
                  {renderConfidenceBadge("customer_name")}
                </div>
                <input
                  id="customer_name"
                  type="text"
                  name="customer_name"
                  value={fields.customer_name}
                  onChange={handleChange}
                  placeholder={placeholderText || "e.g., St. Jude Memorial Hospital, Dr. Jane Smith"}
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 transition-all shadow-xs ${
                    confidenceScores.customer_name && confidenceScores.customer_name < 0.8
                      ? "border-amber-400 bg-amber-50/30 focus:border-amber-500 focus:ring-amber-500/20"
                      : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="customer_contact" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Customer Contact / Email
                  </label>
                  {renderConfidenceBadge("customer_contact")}
                </div>
                <input
                  id="customer_contact"
                  type="text"
                  name="customer_contact"
                  value={fields.customer_contact}
                  onChange={handleChange}
                  placeholder={placeholderText || "e.g., triage-lead@hospital.org"}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-xs"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="complaint_date" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Complaint Date *
                  </label>
                  {renderConfidenceBadge("complaint_date")}
                </div>
                <input
                  id="complaint_date"
                  type="date"
                  name="complaint_date"
                  value={fields.complaint_date}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Product & Batch Identification */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-200/80">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-xs">
                2
              </span>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Product & Batch Identification</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="product_name" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Product Name *
                  </label>
                  {renderConfidenceBadge("product_name")}
                </div>
                <input
                  id="product_name"
                  type="text"
                  name="product_name"
                  value={fields.product_name}
                  onChange={handleChange}
                  placeholder={placeholderText || "e.g., Pembrolizumab, Atorvastatin Calcium"}
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 transition-all shadow-xs ${
                    confidenceScores.product_name && confidenceScores.product_name < 0.8
                      ? "border-amber-400 bg-amber-50/30 focus:border-amber-500 focus:ring-amber-500/20"
                      : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="product_strength" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Product Strength / Grade *
                  </label>
                  {renderConfidenceBadge("product_strength")}
                </div>
                <input
                  id="product_strength"
                  type="text"
                  name="product_strength"
                  value={fields.product_strength}
                  onChange={handleChange}
                  placeholder={placeholderText || "e.g., 20mg, 100mg/4mL"}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="batch_lot_number" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Batch / Lot Number *
                  </label>
                  {renderConfidenceBadge("batch_lot_number")}
                </div>
                <input
                  id="batch_lot_number"
                  type="text"
                  name="batch_lot_number"
                  value={fields.batch_lot_number}
                  onChange={handleChange}
                  placeholder={placeholderText || "e.g., LOT-2024-0988A"}
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-xs font-mono font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 transition-all shadow-xs ${
                    confidenceScores.batch_lot_number && confidenceScores.batch_lot_number < 0.8
                      ? "border-amber-400 bg-amber-50/30 focus:border-amber-500 focus:ring-amber-500/20"
                      : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="manufacturing_date" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Manufacturing Date
                  </label>
                  {renderConfidenceBadge("manufacturing_date")}
                </div>
                <input
                  id="manufacturing_date"
                  type="date"
                  name="manufacturing_date"
                  value={fields.manufacturing_date}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-xs"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="expiry_date" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Expiry Date *
                  </label>
                  {renderConfidenceBadge("expiry_date")}
                </div>
                <input
                  id="expiry_date"
                  type="date"
                  name="expiry_date"
                  value={fields.expiry_date}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Complaint Details */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-200/80">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-xs">
                3
              </span>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Complaint Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="complaint_type" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Complaint Type *
                  </label>
                  {renderConfidenceBadge("complaint_type")}
                </div>
                <select
                  id="complaint_type"
                  name="complaint_type"
                  value={fields.complaint_type}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-xs"
                >
                  <option value="">{isExtracted ? "Select Type..." : "Awaiting AI extraction..."}</option>
                  <option value="Packaging Defect">Packaging Defect (Seal / Cap / Foil)</option>
                  <option value="Foreign Matter / Contamination">Foreign Matter / Particulate Contamination</option>
                  <option value="Labeling/Artwork Discrepancy">Labeling / Artwork / Barcode Discrepancy</option>
                  <option value="Suspected Sub-potency">Suspected Sub-potency / Dissolution Failure</option>
                  <option value="Dissolution / Physical Defect">Physical Tablet / Capsule Chipping</option>
                  <option value="Adverse Event / Lack of Efficacy">Adverse Event / Lack of Therapeutic Efficacy</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="quantity_affected" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Quantity Affected
                  </label>
                  {renderConfidenceBadge("quantity_affected")}
                </div>
                <input
                  id="quantity_affected"
                  type="text"
                  name="quantity_affected"
                  value={fields.quantity_affected}
                  onChange={handleChange}
                  placeholder={placeholderText || "e.g., 14 HDPE bottles (1,260 tabs)"}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="description" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Detailed Description *
                </label>
                {renderConfidenceBadge("description")}
              </div>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={fields.description}
                onChange={handleChange}
                placeholder={
                  placeholderText ||
                  "Awaiting AI extraction from document or email. Narrative summary of defect, observations, and initial reporter remarks."
                }
                className={`w-full p-3.5 bg-white border rounded-lg text-xs text-slate-900 placeholder:text-slate-400 leading-relaxed focus:outline-hidden focus:ring-2 transition-all shadow-xs ${
                  confidenceScores.description && confidenceScores.description < 0.8
                    ? "border-amber-400 bg-amber-50/30 focus:border-amber-500 focus:ring-amber-500/20"
                    : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
                }`}
              />
            </div>
          </div>

          {/* Section 4: Initial Assessment & Priority */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-200/80">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-xs">
                4
              </span>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Initial Assessment & Priority</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Initial Severity *
                  </label>
                  {renderConfidenceBadge("severity")}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {["Critical", "Major", "Minor"].map((sev) => {
                    const isSelected = fields.severity === sev;
                    return (
                      <label
                        key={sev}
                        className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg border text-xs font-bold cursor-pointer transition-all shadow-2xs ${
                          isSelected
                            ? sev === "Critical"
                              ? "bg-red-50 text-red-700 border-red-400 ring-2 ring-red-400/20 shadow-xs"
                              : sev === "Major"
                              ? "bg-orange-50 text-orange-700 border-orange-400 ring-2 ring-orange-400/20 shadow-xs"
                              : "bg-blue-50 text-blue-700 border-blue-400 ring-2 ring-blue-400/20 shadow-xs"
                            : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="severity"
                          value={sev}
                          checked={isSelected}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <span>{sev}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Priority *
                  </label>
                  {renderConfidenceBadge("priority")}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {["High", "Medium", "Low"].map((prio) => {
                    const isSelected = fields.priority === prio;
                    return (
                      <label
                        key={prio}
                        className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg border text-xs font-bold cursor-pointer transition-all shadow-2xs ${
                          isSelected
                            ? prio === "High"
                              ? "bg-red-50 text-red-700 border-red-400 ring-2 ring-red-400/20 shadow-xs"
                              : prio === "Medium"
                              ? "bg-amber-50 text-amber-700 border-amber-400 ring-2 ring-amber-400/20 shadow-xs"
                              : "bg-slate-100 text-slate-800 border-slate-400 ring-2 ring-slate-400/20 shadow-xs"
                            : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="priority"
                          value={prio}
                          checked={isSelected}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <span>{prio}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Form Action Buttons at Bottom */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200 mt-4">
            <button
              type="button"
              className="px-4 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
              onClick={handleReset}
              title="Reset all form fields"
            >
              <RotateCcw size={15} />
              <span>Reset Form</span>
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs transition-all shadow-xs hover:shadow flex items-center gap-2 cursor-pointer disabled:opacity-50"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Saving Complaint...</span>
                </>
              ) : (
                <>
                  <Save size={15} />
                  <span>Save Complaint</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* AI Intelligence & Bonus Features Tab */
        <div className="space-y-6">
          {/* Completeness Checker */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={20} className="text-emerald-600" />
                <h4 className="text-sm font-bold text-slate-900">GMP Complaint Completeness Checker</h4>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300">
                {completenessReport ? `${completenessReport.score}% Score` : "Awaiting Data"}
              </span>
            </div>

            {completenessReport ? (
              <div className="space-y-3.5">
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${completenessReport.score}%` }}
                  />
                </div>
                <div className="text-xs text-slate-700">
                  <strong className="font-semibold">Status:</strong> {completenessReport.status}
                </div>

                {completenessReport.missing_fields.length > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                    <span className="block text-xs font-bold text-amber-800">Missing / Ambiguous Fields:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {completenessReport.missing_fields.map((f, i) => (
                        <span key={i} className="text-[11px] font-semibold bg-white border border-amber-300 text-amber-800 px-2 py-0.5 rounded-md">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {completenessReport.recommendations.length > 0 && (
                  <ul className="list-disc list-inside text-xs text-slate-600 space-y-1 bg-white p-3 rounded-lg border border-slate-200">
                    {completenessReport.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                Run AI extraction on a complaint to evaluate submission completeness against FDA 21 CFR Part 211 standards.
              </p>
            )}
          </div>

          {/* Root Cause & CAPA Recommendation Engine */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <Sparkles size={20} className="text-indigo-600" />
                <h4 className="text-sm font-bold text-slate-900">AI Root Cause & CAPA Recommendations</h4>
              </div>
              <span className="font-mono text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md font-semibold">
                llama-3.3-70b
              </span>
            </div>

            {rootCauseRecommendation ? (
              <div className="space-y-4">
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Predicted Ishikawa Root Cause:
                  </span>
                  <div className="text-sm font-bold text-indigo-700">{rootCauseRecommendation.category}</div>
                  <p className="text-xs text-slate-600 leading-relaxed">{rootCauseRecommendation.rationale}</p>
                </div>

                {capaRecommendation && (
                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold bg-blue-50 border border-blue-200 p-2 rounded-lg">
                      <Clock size={14} className="text-blue-600" />
                      <span>Recommended Investigation Timeline: <strong className="text-blue-900">{capaRecommendation.timeline_days} Days</strong></span>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-slate-800">Immediate Corrective Actions (Containment):</span>
                      <ul className="list-disc list-inside text-xs text-slate-600 space-y-1 pl-1">
                        {capaRecommendation.corrective_actions.map((act, i) => (
                          <li key={i}>{act}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-slate-800">Systemic Preventive Actions:</span>
                      <ul className="list-disc list-inside text-xs text-slate-600 space-y-1 pl-1">
                        {capaRecommendation.preventive_actions.map((act, i) => (
                          <li key={i}>{act}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                Root cause categorization and CAPA action items will generate automatically upon AI extraction.
              </p>
            )}
          </div>

          {/* Duplicate Batch Trend Check */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
              <Layers size={20} className="text-amber-600" />
              <h4 className="text-sm font-bold text-slate-900">Duplicate Complaint & Lot Cluster Detection</h4>
            </div>

            {duplicateFlag ? (
              <div>
                <div
                  className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
                    duplicateFlag.is_duplicate
                      ? "bg-amber-50 border-amber-300 text-amber-900"
                      : "bg-emerald-50 border-emerald-300 text-emerald-900"
                  }`}
                >
                  {duplicateFlag.is_duplicate ? (
                    <>
                      <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-bold">Batch Trend Alert:</strong> {duplicateFlag.details}
                      </div>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-bold">Clear:</strong> No recurring defect clusters found for this batch.
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                Historical batch comparison will activate once a lot number is extracted.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintForm;

