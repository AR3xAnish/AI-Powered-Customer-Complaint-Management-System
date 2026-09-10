import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface ChatMessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  suggestedUpdates?: Record<string, any>;
}

export interface ChatState {
  messages: ChatMessageItem[];
  isSending: boolean;
  error: string | null;
}

const initialState: ChatState = {
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
    addMessage: (state, action: PayloadAction<ChatMessageItem>) => {
      state.messages.push(action.payload);
    },
    setSending: (state, action: PayloadAction<boolean>) => {
      state.isSending = action.payload;
    },
    setChatError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearChat: (state) => {
      state.messages = [initialState.messages[0]];
      state.error = null;
    },
    loadChatHistory: (state, action: PayloadAction<ChatMessageItem[]>) => {
      if (action.payload.length > 0) {
        state.messages = action.payload;
      }
    },
  },
});

export const { addMessage, setSending, setChatError, clearChat, loadChatHistory } =
  chatSlice.actions;

export default chatSlice.reducer;
