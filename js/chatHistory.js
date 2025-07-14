export function saveMessage(sender, text, time) {
  const history = JSON.parse(localStorage.getItem("chatHistory") || "[]");
  history.push({ sender, text, time });
  localStorage.setItem("chatHistory", JSON.stringify(history));
}

export function loadHistory() {
  return JSON.parse(localStorage.getItem("chatHistory") || "[]");
}

export function clearHistory() {
  localStorage.removeItem("chatHistory");
}
