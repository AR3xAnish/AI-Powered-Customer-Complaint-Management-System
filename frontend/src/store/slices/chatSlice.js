import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  messages: [
    {
      id: "init-msg",
      role: "assistant",
      content:
        "Welcome to the AI Complaint Intake Assistant. Upload a complaint document or paste text above, or ask me any question about Good Manufacturing Practice (GMP), complaint triage, CAPA, or severity classifications.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ],
  isSending: false,
  error: null,
};

export const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    setSending: (state, action) => {
      state.isSending = action.payload;
    },
    setChatError: (state, action) => {
      state.error = action.payload;
    },
    clearChat: (state) => {
      state.messages = [initialState.messages[0]];
      state.error = null;
    },
    loadChatHistory: (state, action) => {
      if (action.payload.length > 0) {
        state.messages = action.payload;
      }
    },
  },
});

export const { addMessage, setSending, setChatError, clearChat, loadChatHistory } =
  chatSlice.actions;

export default chatSlice.reducer;
