import { createSlice } from "@reduxjs/toolkit";

const generateId = () => "cmp-" + Math.random().toString(36).substring(2, 9);

const initialFields = {
  id: generateId(),
  complaint_source: "",
  customer_name: "",
  customer_contact: "",
  product_name: "",
  product_strength: "",
  batch_lot_number: "",
  manufacturing_date: "",
  expiry_date: "",
  quantity_affected: "",
  complaint_type: "",
  complaint_date: new Date().toISOString().split("T")[0],
  description: "",
  severity: "Major",
  priority: "Medium",
  status: "pending_triage",
};

const initialState = {
  fields: initialFields,
  confidenceScores: {},
  completenessReport: null,
  duplicateFlag: null,
  rootCauseRecommendation: null,
  capaRecommendation: null,
  extractionStatus: "idle",
  extractionProgress: 0,
  extractionStatusText: "Awaiting complaint document or text...",
  modelUsed: "gemma2-9b-it",
  isExtracted: false,
  isSaving: false,
  saveSuccessMessage: null,
};

export const complaintSlice = createSlice({
  name: "complaint",
  initialState,
  reducers: {
    updateField: (state, action) => {
      const { field, value } = action.payload;
      state.fields[field] = value;
      state.confidenceScores[field] = 1.0;
    },
    setAllFields: (state, action) => {
      state.fields = { ...state.fields, ...action.payload };
    },
    startExtraction: (state) => {
      state.extractionStatus = "extracting";
      state.extractionProgress = 15;
      state.extractionStatusText = "Ingesting and parsing document...";
    },
    updateExtractionProgress: (state, action) => {
      state.extractionProgress = action.payload.progress;
      state.extractionStatusText = action.payload.statusText;
    },
    extractionSuccess: (state, action) => {
      const {
        extractedFields,
        confidenceScores,
        completenessReport,
        duplicateFlag,
        rootCauseRecommendation,
        capaRecommendation,
        modelUsed,
      } = action.payload;

      state.fields = {
        ...state.fields,
        ...extractedFields,
        status: "pending_triage",
      };
      state.confidenceScores = confidenceScores || {};
      state.completenessReport = completenessReport || null;
      state.duplicateFlag = duplicateFlag || null;
      state.rootCauseRecommendation = rootCauseRecommendation || null;
      state.capaRecommendation = capaRecommendation || null;
      state.modelUsed = modelUsed || "gemma2-9b-it";
      state.extractionStatus = "completed";
      state.extractionProgress = 100;
      state.extractionStatusText = "AI Extraction & Intelligence Analysis Complete";
      state.isExtracted = true;
    },
    extractionFailed: (state, action) => {
      state.extractionStatus = "error";
      state.extractionProgress = 0;
      state.extractionStatusText = action.payload;
    },
    resetComplaintForm: (state) => {
      state.fields = { ...initialFields, id: generateId() };
      state.confidenceScores = {};
      state.completenessReport = null;
      state.duplicateFlag = null;
      state.rootCauseRecommendation = null;
      state.capaRecommendation = null;
      state.extractionStatus = "idle";
      state.extractionProgress = 0;
      state.extractionStatusText = "Awaiting complaint document or text...";
      state.isExtracted = false;
      state.saveSuccessMessage = null;
    },
    loadExistingComplaint: (state, action) => {
      state.fields = action.payload.complaint;
      state.completenessReport = action.payload.completenessReport || null;
      state.duplicateFlag = action.payload.duplicateFlag || null;
      state.rootCauseRecommendation = action.payload.rootCauseRecommendation || null;
      state.capaRecommendation = action.payload.capaRecommendation || null;
      state.confidenceScores = {};
      state.isExtracted = true;
      state.extractionStatus = "completed";
      state.extractionProgress = 100;
      state.extractionStatusText = "Loaded from Triage Queue";
    },
    setSaving: (state, action) => {
      state.isSaving = action.payload;
    },
    setSaveSuccessMessage: (state, action) => {
      state.saveSuccessMessage = action.payload;
    },
  },
});

export const {
  updateField,
  setAllFields,
  startExtraction,
  updateExtractionProgress,
  extractionSuccess,
  extractionFailed,
  resetComplaintForm,
  loadExistingComplaint,
  setSaving,
  setSaveSuccessMessage,
} = complaintSlice.actions;

export default complaintSlice.reducer;
