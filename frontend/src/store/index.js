import { configureStore } from "@reduxjs/toolkit";
import complaintReducer from "./slices/complaintSlice";
import chatReducer from "./slices/chatSlice";
import triageReducer from "./slices/triageSlice";

export const store = configureStore({
  reducer: {
    complaint: complaintReducer,
    chat: chatReducer,
    triage: triageReducer,
  },
});
