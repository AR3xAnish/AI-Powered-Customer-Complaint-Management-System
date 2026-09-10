import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface ComplaintFields {
  id: string;
  complaint_source: string;
  customer_name: string;
  customer_contact: string;
  product_name: string;
  product_strength: string;
  batch_lot_number: string;
  manufacturing_date: string;
  expiry_date: string;
  quantity_affected: string;
  complaint_type: string;
  complaint_date: string;
  description: string;
  severity: "Critical" | "Major" | "Minor" | string;
  priority: "High" | "Medium" | "Low" | string;
  status: "pending_triage" | "in_review" | "closed" | string;
}

export interface CompletenessReport {
  score: number;
  status: string;
  missing_fields: string[];
  recommendations: string[];
}

export interface DuplicateAlert {
  is_duplicate: boolean;
  match_count: number;
  matched_complaint_ids: string[];
  similarity_score: number;
  details: string;
}

export interface RootCauseRecommendation {
  category: string;
  sub_category?: string;
  confidence?: number;
  rationale: string;
  suggested_investigation_steps?: string[];
}

export interface CAPARecommendation {
  corrective_actions: string[];
  preventive_actions: string[];
  timeline_days: number;
  regulatory_impact?: string;
}

export interface ComplaintState {
  fields: ComplaintFields;
  confidenceScores: Record<string, number>;
  completenessReport: CompletenessReport | null;
  duplicateFlag: DuplicateAlert | null;
  rootCauseRecommendation: RootCauseRecommendation | null;
  capaRecommendation: CAPARecommendation | null;
  extractionStatus: "idle" | "extracting" | "completed" | "error";
  extractionProgress: number;
  extractionStatusText: string;
  modelUsed: string;
  isExtracted: boolean;
  isSaving: boolean;
  saveSuccessMessage: string | null;
}

const generateId = () => "cmp-" + Math.random().toString(36).substring(2, 9);

const initialFields: ComplaintFields = {
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

const initialState: ComplaintState = {
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
    updateField: (
      state,
      action: PayloadAction<{ field: keyof ComplaintFields; value: string }>
    ) => {
      const { field, value } = action.payload;
      state.fields[field] = value;
      state.confidenceScores[field] = 1.0;
    },
    setAllFields: (state, action: PayloadAction<Partial<ComplaintFields>>) => {
      state.fields = { ...state.fields, ...action.payload };
    },
    startExtraction: (state) => {
      state.extractionStatus = "extracting";
      state.extractionProgress = 15;
      state.extractionStatusText = "Ingesting and parsing document...";
    },
    updateExtractionProgress: (
      state,
      action: PayloadAction<{ progress: number; statusText: string }>
    ) => {
      state.extractionProgress = action.payload.progress;
      state.extractionStatusText = action.payload.statusText;
    },
    extractionSuccess: (
      state,
      action: PayloadAction<{
        extractedFields: Partial<ComplaintFields>;
        confidenceScores: Record<string, number>;
        completenessReport: CompletenessReport;
        duplicateFlag: DuplicateAlert;
        rootCauseRecommendation: RootCauseRecommendation;
        capaRecommendation: CAPARecommendation;
        modelUsed: string;
      }>
    ) => {
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
    extractionFailed: (state, action: PayloadAction<string>) => {
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
    loadExistingComplaint: (
      state,
      action: PayloadAction<{
        complaint: ComplaintFields;
        completenessReport?: CompletenessReport;
        duplicateFlag?: DuplicateAlert;
        rootCauseRecommendation?: RootCauseRecommendation;
        capaRecommendation?: CAPARecommendation;
      }>
    ) => {
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
    setSaving: (state, action: PayloadAction<boolean>) => {
      state.isSaving = action.payload;
    },
    setSaveSuccessMessage: (state, action: PayloadAction<string | null>) => {
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
