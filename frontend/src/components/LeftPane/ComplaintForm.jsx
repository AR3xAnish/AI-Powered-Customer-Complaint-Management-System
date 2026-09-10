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
        className={`confidence-tag ${isLow ? "low-confidence" : "high-confidence"}`}
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
    <div className="left-pane-container">
      {/* Pane Header */}
      <div className="pane-header">
        <div className="pane-title-group">
          <div className="icon-badge">
            <ClipboardList size={20} />
          </div>
          <div>
            <h2 className="pane-heading">Log Customer Complaint</h2>
            <div className="pane-sub-bar">
              <span className={`status-pill ${fields.status}`}>
                {fields.status === "pending_triage" && "Pending Triage"}
                {fields.status === "in_review" && "In Review"}
                {fields.status === "closed" && "Closed"}
              </span>
              <span className="complaint-id-tag">ID: {fields.id}</span>
            </div>
          </div>
        </div>

        <div className="pane-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleReset}
            title="Reset form fields"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <span className="spinner" /> Saving...
              </>
            ) : (
              <>
                <Save size={14} />
                <span>Save</span>
              </>
            )}
          </button>
        </div>
      </div>

      {saveSuccessMessage && (
        <div className="alert-banner success-toast">
          <CheckCircle2 size={16} />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* Duplicate Lot Banner if detected */}
      {duplicateFlag && duplicateFlag.is_duplicate && (
        <div className="duplicate-alert-banner">
          <AlertTriangle size={18} className="banner-alert-icon" />
          <div className="duplicate-alert-content">
            <strong>Duplicate Batch Alert ({duplicateFlag.match_count} existing complaint(s)):</strong>
            <span> {duplicateFlag.details}</span>
          </div>
        </div>
      )}

      {/* Tab Switcher for Form vs AI Intelligence */}
      <div className="form-tab-nav">
        <button
          className={`tab-btn ${activeTab === "form" ? "active" : ""}`}
          onClick={() => setActiveTab("form")}
        >
          Structured Intake Form
        </button>
        <button
          className={`tab-btn ${activeTab === "ai_insights" ? "active" : ""}`}
          onClick={() => setActiveTab("ai_insights")}
        >
          <Sparkles size={14} />
          AI Intelligence & CAPA
          {completenessReport && (
            <span className="tab-badge">{completenessReport.score}%</span>
          )}
        </button>
      </div>

      {/* Main Form Content */}
      {activeTab === "form" ? (
        <form onSubmit={handleSave} className="complaint-structured-form">
          {/* Section 1: Origin & Customer Details */}
          <div className="form-section-card">
            <div className="section-header">
              <span className="section-number">1</span>
              <h3 className="section-title">Origin & Customer Details</h3>
            </div>

            <div className="grid-2-col">
              <div className="form-group">
                <div className="label-row">
                  <label htmlFor="complaint_source">Complaint Source *</label>
                  {renderConfidenceBadge("complaint_source")}
                </div>
                <select
                  id="complaint_source"
                  name="complaint_source"
                  value={fields.complaint_source}
                  onChange={handleChange}
                  className={`form-select ${confidenceScores.complaint_source && confidenceScores.complaint_source < 0.8 ? "highlight-low-conf" : ""}`}
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

              <div className="form-group">
                <div className="label-row">
                  <label htmlFor="customer_name">Customer / Institution Name *</label>
                  {renderConfidenceBadge("customer_name")}
                </div>
                <input
                  id="customer_name"
                  type="text"
                  name="customer_name"
                  value={fields.customer_name}
                  onChange={handleChange}
                  placeholder={placeholderText || "e.g., St. Jude Memorial Hospital, Dr. Jane Smith"}
                  className={`form-input ${confidenceScores.customer_name && confidenceScores.customer_name < 0.8 ? "highlight-low-conf" : ""}`}
                />
              </div>
            </div>

            <div className="grid-2-col">
              <div className="form-group">
                <div className="label-row">
                  <label htmlFor="customer_contact">Customer Contact / Email</label>
                  {renderConfidenceBadge("customer_contact")}
                </div>
                <input
                  id="customer_contact"
                  type="text"
                  name="customer_contact"
                  value={fields.customer_contact}
                  onChange={handleChange}
                  placeholder={placeholderText || "e.g., triage-lead@hospital.org"}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <div className="label-row">
                  <label htmlFor="complaint_date">Complaint Date *</label>
                  {renderConfidenceBadge("complaint_date")}
                </div>
                <input
                  id="complaint_date"
                  type="date"
                  name="complaint_date"
                  value={fields.complaint_date}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Product & Batch Identification */}
          <div className="form-section-card">
            <div className="section-header">
              <span className="section-number">2</span>
              <h3 className="section-title">Product & Batch Identification</h3>
            </div>

            <div className="grid-2-col">
              <div className="form-group">
                <div className="label-row">
                  <label htmlFor="product_name">Product Name *</label>
                  {renderConfidenceBadge("product_name")}
                </div>
                <input
                  id="product_name"
                  type="text"
                  name="product_name"
                  value={fields.product_name}
                  onChange={handleChange}
                  placeholder={placeholderText || "e.g., Pembrolizumab, Atorvastatin Calcium"}
                  className={`form-input ${confidenceScores.product_name && confidenceScores.product_name < 0.8 ? "highlight-low-conf" : ""}`}
                />
              </div>

              <div className="form-group">
                <div className="label-row">
                  <label htmlFor="product_strength">Product Strength / Grade *</label>
                  {renderConfidenceBadge("product_strength")}
                </div>
                <input
                  id="product_strength"
                  type="text"
                  name="product_strength"
                  value={fields.product_strength}
                  onChange={handleChange}
                  placeholder={placeholderText || "e.g., 20mg, 100mg/4mL"}
                  className="form-input"
                />
              </div>
            </div>

            <div className="grid-3-col">
              <div className="form-group">
                <div className="label-row">
                  <label htmlFor="batch_lot_number">Batch / Lot Number *</label>
                  {renderConfidenceBadge("batch_lot_number")}
                </div>
                <input
                  id="batch_lot_number"
                  type="text"
                  name="batch_lot_number"
                  value={fields.batch_lot_number}
                  onChange={handleChange}
                  placeholder={placeholderText || "e.g., LOT-2024-0988A"}
                  className={`form-input lot-input ${confidenceScores.batch_lot_number && confidenceScores.batch_lot_number < 0.8 ? "highlight-low-conf" : ""}`}
                />
              </div>

              <div className="form-group">
                <div className="label-row">
                  <label htmlFor="manufacturing_date">Manufacturing Date</label>
                  {renderConfidenceBadge("manufacturing_date")}
                </div>
                <input
                  id="manufacturing_date"
                  type="date"
                  name="manufacturing_date"
                  value={fields.manufacturing_date}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <div className="label-row">
                  <label htmlFor="expiry_date">Expiry Date *</label>
                  {renderConfidenceBadge("expiry_date")}
                </div>
                <input
                  id="expiry_date"
                  type="date"
                  name="expiry_date"
                  value={fields.expiry_date}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Complaint Details */}
          <div className="form-section-card">
            <div className="section-header">
              <span className="section-number">3</span>
              <h3 className="section-title">Complaint Details</h3>
            </div>

            <div className="grid-2-col">
              <div className="form-group">
                <div className="label-row">
                  <label htmlFor="complaint_type">Complaint Type *</label>
                  {renderConfidenceBadge("complaint_type")}
                </div>
                <select
                  id="complaint_type"
                  name="complaint_type"
                  value={fields.complaint_type}
                  onChange={handleChange}
                  className="form-select"
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

              <div className="form-group">
                <div className="label-row">
                  <label htmlFor="quantity_affected">Quantity Affected</label>
                  {renderConfidenceBadge("quantity_affected")}
                </div>
                <input
                  id="quantity_affected"
                  type="text"
                  name="quantity_affected"
                  value={fields.quantity_affected}
                  onChange={handleChange}
                  placeholder={placeholderText || "e.g., 14 HDPE bottles (1,260 tabs)"}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <div className="label-row">
                <label htmlFor="description">Detailed Description *</label>
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
                className={`form-textarea ${confidenceScores.description && confidenceScores.description < 0.8 ? "highlight-low-conf" : ""}`}
              />
            </div>
          </div>

          {/* Section 4: Initial Assessment & Priority */}
          <div className="form-section-card">
            <div className="section-header">
              <span className="section-number">4</span>
              <h3 className="section-title">Initial Assessment & Priority</h3>
            </div>

            <div className="grid-2-col">
              <div className="form-group">
                <div className="label-row">
                  <label htmlFor="severity">Initial Severity *</label>
                  {renderConfidenceBadge("severity")}
                </div>
                <div className="severity-radio-group">
                  {["Critical", "Major", "Minor"].map((sev) => (
                    <label
                      key={sev}
                      className={`severity-radio-btn ${fields.severity === sev ? `selected-${sev.toLowerCase()}` : ""}`}
                    >
                      <input
                        type="radio"
                        name="severity"
                        value={sev}
                        checked={fields.severity === sev}
                        onChange={handleChange}
                      />
                      <span>{sev}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <div className="label-row">
                  <label htmlFor="priority">Priority *</label>
                  {renderConfidenceBadge("priority")}
                </div>
                <div className="priority-radio-group">
                  {["High", "Medium", "Low"].map((prio) => (
                    <label
                      key={prio}
                      className={`priority-radio-btn ${fields.priority === prio ? `selected-${prio.toLowerCase()}` : ""}`}
                    >
                      <input
                        type="radio"
                        name="priority"
                        value={prio}
                        checked={fields.priority === prio}
                        onChange={handleChange}
                      />
                      <span>{prio}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </form>
      ) : (
        /* AI Intelligence & Bonus Features Tab */
        <div className="ai-insights-container">
          {/* Completeness Checker */}
          <div className="insight-card">
            <div className="insight-header">
              <div className="insight-title-wrap">
                <ShieldCheck size={18} className="icon-emerald" />
                <h4>GMP Complaint Completeness Checker</h4>
              </div>
              <span className="completeness-score-badge">
                {completenessReport ? `${completenessReport.score}% Score` : "Awaiting Data"}
              </span>
            </div>

            {completenessReport ? (
              <div className="insight-body">
                <div className="progress-bar-track">
                  <div
                    className="progress-bar-fill emerald"
                    style={{ width: `${completenessReport.score}%` }}
                  />
                </div>
                <div className="insight-status-line">
                  <strong>Status:</strong> {completenessReport.status}
                </div>

                {completenessReport.missing_fields.length > 0 && (
                  <div className="missing-fields-box">
                    <span className="missing-title">Missing / Ambiguous Fields:</span>
                    <div className="missing-pills">
                      {completenessReport.missing_fields.map((f, i) => (
                        <span key={i} className="missing-pill">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {completenessReport.recommendations.length > 0 && (
                  <ul className="recommendations-list">
                    {completenessReport.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <p className="empty-insight-text">
                Run AI extraction on a complaint to evaluate submission completeness against FDA 21 CFR Part 211 standards.
              </p>
            )}
          </div>

          {/* Root Cause & CAPA Recommendation Engine */}
          <div className="insight-card">
            <div className="insight-header">
              <div className="insight-title-wrap">
                <Sparkles size={18} className="icon-indigo" />
                <h4>AI Root Cause & CAPA Recommendations</h4>
              </div>
              <span className="model-sub-badge">llama-3.3-70b-versatile</span>
            </div>

            {rootCauseRecommendation ? (
              <div className="insight-body">
                <div className="root-cause-box">
                  <span className="rc-label">Predicted Ishikawa Root Cause:</span>
                  <div className="rc-category">{rootCauseRecommendation.category}</div>
                  <p className="rc-rationale">{rootCauseRecommendation.rationale}</p>
                </div>

                {capaRecommendation && (
                  <div className="capa-box">
                    <div className="capa-timeline">
                      <Clock size={14} /> Recommended Investigation Timeline:{" "}
                      <strong>{capaRecommendation.timeline_days} Days</strong>
                    </div>

                    <div className="capa-section">
                      <span className="capa-heading">Immediate Corrective Actions (Containment):</span>
                      <ul>
                        {capaRecommendation.corrective_actions.map((act, i) => (
                          <li key={i}>{act}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="capa-section">
                      <span className="capa-heading">Systemic Preventive Actions:</span>
                      <ul>
                        {capaRecommendation.preventive_actions.map((act, i) => (
                          <li key={i}>{act}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="empty-insight-text">
                Root cause categorization and CAPA action items will generate automatically upon AI extraction.
              </p>
            )}
          </div>

          {/* Duplicate Batch Trend Check */}
          <div className="insight-card">
            <div className="insight-header">
              <div className="insight-title-wrap">
                <Layers size={18} className="icon-amber" />
                <h4>Duplicate Complaint & Lot Cluster Detection</h4>
              </div>
            </div>

            {duplicateFlag ? (
              <div className="insight-body">
                <div className={`duplicate-result ${duplicateFlag.is_duplicate ? "is-dup" : "not-dup"}`}>
                  {duplicateFlag.is_duplicate ? (
                    <>
                      <AlertTriangle size={18} />
                      <div>
                        <strong>Batch Trend Alert:</strong> {duplicateFlag.details}
                      </div>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      <div>
                        <strong>Clear:</strong> No recurring defect clusters found for this batch.
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <p className="empty-insight-text">
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
