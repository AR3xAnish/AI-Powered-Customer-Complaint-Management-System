import { createSlice } from "@reduxjs/toolkit";

const initialState = {
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
    setComplaintsList: (state, action) => {
      state.complaintsList = action.payload;
    },
    setLoadingComplaints: (state, action) => {
      state.isLoading = action.payload;
    },
    toggleDrawer: (state) => {
      state.drawerOpen = !state.drawerOpen;
    },
    setDrawerOpen: (state, action) => {
      state.drawerOpen = action.payload;
    },
    setStatusFilter: (state, action) => {
      state.statusFilter = action.payload;
    },
    setSeverityFilter: (state, action) => {
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
