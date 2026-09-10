import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { ComplaintFields } from "./complaintSlice";

export interface TriageState {
  complaintsList: ComplaintFields[];
  isLoading: boolean;
  drawerOpen: boolean;
  statusFilter: string;
  severityFilter: string;
}

const initialState: TriageState = {
  complaintsList: [],
  isLoading: false,
  drawerOpen: false,
  statusFilter: "all",
  severityFilter: "all",
};

export const triageSlice = createSlice({
  name: "triage",
  initialState,
  reducers: {
    setComplaintsList: (state, action: PayloadAction<ComplaintFields[]>) => {
      state.complaintsList = action.payload;
    },
    setLoadingComplaints: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    toggleDrawer: (state) => {
      state.drawerOpen = !state.drawerOpen;
    },
    setDrawerOpen: (state, action: PayloadAction<boolean>) => {
      state.drawerOpen = action.payload;
    },
    setStatusFilter: (state, action: PayloadAction<string>) => {
      state.statusFilter = action.payload;
    },
    setSeverityFilter: (state, action: PayloadAction<string>) => {
      state.severityFilter = action.payload;
    },
  },
});

export const {
  setComplaintsList,
  setLoadingComplaints,
  toggleDrawer,
  setDrawerOpen,
  setStatusFilter,
  setSeverityFilter,
} = triageSlice.actions;

export default triageSlice.reducer;
