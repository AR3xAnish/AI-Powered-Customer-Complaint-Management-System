const API_BASE = "http://localhost:8000";

export async function createComplaintDraft() {
  const res = await fetch(`${API_BASE}/complaints`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "pending_triage" }),
  });
  if (!res.ok) throw new Error("Failed to create complaint draft");
  return res.json();
}

export async function extractComplaintApi(
  complaintId: string,
  file?: File | null,
  pastedText?: string
) {
  const formData = new FormData();
  if (file) {
    formData.append("file", file);
  }
  if (pastedText && pastedText.trim()) {
    formData.append("pasted_text", pastedText.trim());
  }

  const res = await fetch(`${API_BASE}/complaints/${complaintId}/extract`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Extraction failed");
  }
  return res.json();
}

export async function saveComplaintApi(complaintId: string, payload: any) {
  const res = await fetch(`${API_BASE}/complaints/${complaintId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to save complaint");
  return res.json();
}

export async function sendChatApi(complaintId: string, message: string) {
  const res = await fetch(`${API_BASE}/complaints/${complaintId}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, complaint_id: complaintId }),
  });
  if (!res.ok) throw new Error("Failed to process chat message");
  return res.json();
}

export async function fetchComplaintsApi(status?: string, severity?: string) {
  const params = new URLSearchParams();
  if (status && status !== "all") params.append("status", status);
  if (severity && severity !== "all") params.append("severity", severity);

  const url = `${API_BASE}/complaints?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch triage queue");
  return res.json();
}

export async function configureGroqKeyApi(apiKey: string) {
  const res = await fetch(`${API_BASE}/api/groq-key`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: apiKey }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to configure Groq API Key");
  }
  return res.json();
}

export async function getGroqStatusApi() {
  const res = await fetch(`${API_BASE}/api/groq-status`);
  if (!res.ok) return { configured: false };
  return res.json();
}
