// 🌗 Theme toggle setup — PUT THIS AT THE VERY TOP
const toggleBtn = document.getElementById("toggleMode");
const themeLink = document.getElementById("themeStylesheet");

// saved theme from localStorage
let savedTheme = localStorage.getItem("theme") || "light";
themeLink.href = `css/${savedTheme}.css`;
toggleBtn.textContent = savedTheme === "dark" ? "☀️" : "🌙";

// 🌟 Smooth transition with blur+scale
toggleBtn.addEventListener("click", () => {
  document.documentElement.classList.add("transitioning");
  setTimeout(() => {
    const current = themeLink.href.includes("dark") ? "dark" : "light";
    const next = current === "dark" ? "light" : "dark";
    themeLink.href = `css/${next}.css`;
    localStorage.setItem("theme", next);
    toggleBtn.textContent = next === "dark" ? "☀️" : "🌙";
    setTimeout(() => {
      document.documentElement.classList.remove("transitioning");
    }, 300);
  }, 50);
});

// 🔁 Chat history
let chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];

// 💬 DOM refs
const form = document.getElementById("message-form");
const input = document.getElementById("message-input");
const messages = document.getElementById("chat-messages");
const loader = document.getElementById("loading-indicator");
const resetBtn = document.getElementById("resetChat");
const downloadBtn = document.getElementById("downloadChat");
const promptBtns = document.querySelectorAll(".prompt-btn");

const BACKEND_URL = "https://mikgpt-v4-backend-production.up.railway.app/api/chat";

// 🔥 Load saved chat
chatHistory.forEach(({ sender, text, time }) => addMessage(sender, text, time));

// 🚀 Form submit
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userMessage = input.value.trim();
  if (!userMessage) return;

  const userTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  addMessage("user", userMessage, userTime);
  saveMessage("user", userMessage, userTime);
  input.value = "";

  loader.style.display = "block";

  try {
    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage })
    });

    const data = await res.json();

    if (data.status === "success") {
      const botTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      addMessage("bot", data.response, botTime);
      saveMessage("bot", data.response, botTime);
    } else {
      addMessage("bot", "❌ Error: " + data.message);
    }
  } catch (err) {
    addMessage("bot", "🚫 Failed to connect to backend.");
    console.error("Error:", err);
  }
});

// ➕ Add message to DOM
function addMessage(sender, text, time = "") {
  const container = document.createElement("div");
  container.classList.add("message-container");
  if (sender === "user") container.classList.add("user");

  const message = document.createElement("div");
  message.classList.add("message", `${sender}-message`);

  const timestamp = document.createElement("div");
  timestamp.className = "timestamp";
  timestamp.textContent = time;

  if (sender === "bot") {
    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < text.length) {
        message.innerHTML += formatMarkdown(text.charAt(i));
        i++;
        messages.scrollTop = messages.scrollHeight;
      } else {
        clearInterval(typingInterval);
        loader.style.display = "none";
      }
    }, 7.5 + text.length * 0.05); // speed depends on length
  } else {
    message.innerHTML = formatMarkdown(text);
  }

  container.appendChild(message);
  if (time) container.appendChild(timestamp);
  messages.insertBefore(container, loader);
  messages.scrollTo({ top: messages.scrollHeight, behavior: "smooth" });
}

// 💾 Save to localStorage
function saveMessage(sender, text, time) {
  chatHistory.push({ sender, text, time });
  localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
}

// ♻️ Reset Chat
resetBtn.addEventListener("click", () => {
  Array.from(messages.children).forEach((child) => {
    if (child.id !== "loading-indicator") {
      child.remove();
    }
  });
  input.value = "";
  loader.style.display = "none";
  chatHistory = [];
  localStorage.removeItem("chatHistory");
});

// ⬇️ Download chat
downloadBtn.addEventListener("click", () => {
  let txt = "";
  chatHistory.forEach(({ sender, text, time }) => {
    txt += `[${time}] ${sender.toUpperCase()}: ${text}\n`;
  });
  const blob = new Blob([txt], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "mikgpt_chat.txt";
  link.click();
});

// ⚡ Suggested prompts
promptBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    input.value = btn.textContent;
    input.focus();
  });
});

// ↵ Enter to send, Shift+Enter for newline
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    form.dispatchEvent(new Event("submit"));
  }
});

// ✨ Markdown formatter
function formatMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code>$1</code>")
    .replace(/(?:\r\n|\r|\n)/g, "<br>")
    .replace(/:\)/g, "😊")
    .replace(/:\(/g, "😢")
    .replace(/:D/g, "😄");
}
