// /frontend/js/chatHistory.js

export function saveMessage(role, content) {
  const oldHistory = JSON.parse(localStorage.getItem("chatHistory") || "[]");
  const newMsg = { role, content, timestamp: Date.now() };
  const newHistory = [...oldHistory, newMsg];
  localStorage.setItem("chatHistory", JSON.stringify(newHistory));
}

export function loadHistory() {
  return JSON.parse(localStorage.getItem("chatHistory") || "[]");
}

export function clearHistory() {
  localStorage.removeItem("chatHistory");
}
