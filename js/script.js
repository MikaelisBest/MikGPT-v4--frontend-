import { saveMessage, loadHistory, clearHistory } from "./chatHistory.js";

const BACKEND_URL = "https://mikgpt-v4-backend-production.up.railway.app/api/chat";

const $ = id => document.getElementById(id);
const auth = firebase.auth();

const ui = {
  auth: $("auth-section"),
  chat: $("chat-wrapper"),
  messages: $("chat-messages"),
  input: $("message-input"),
  form: $("message-form"),
  loader: $("loading-indicator"),
  toggle: $("toggleMode"),
  reset: $("resetChat"),
  download: $("downloadChat"),
  logout: $("logoutBtn"),
  signIn: $("signInBtn"),
  signUp: $("signUpBtn"),
  google: $("googleBtn"),
  email: $("emailInput"),
  pass: $("passwordInput")
};

// Theme toggle
ui.toggle.onclick = () => {
  const next = document.body.classList.toggle("dark") ? "dark" : "light";
  document.getElementById("themeStylesheet").href = `css/${next}.css`;
  localStorage.setItem("theme", next);
  ui.toggle.textContent = next === "dark" ? "☀️" : "🌙";
};

// Auth
auth.onAuthStateChanged(user => {
  if (user) {
    ui.auth.classList.add("hidden");
    ui.chat.classList.remove("hidden");
  } else {
    ui.chat.classList.add("hidden");
    ui.auth.classList.remove("hidden");
  }
});
ui.signIn.onclick = () => auth.signInWithEmailAndPassword(ui.email.value, ui.pass.value).catch(alert);
ui.signUp.onclick = () => auth.createUserWithEmailAndPassword(ui.email.value, ui.pass.value).catch(alert);
ui.google.onclick = () => auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).catch(alert);
ui.logout.onclick = () => auth.signOut();

// Submit
ui.form.onsubmit = async e => {
  e.preventDefault();
  const text = ui.input.value.trim();
  if (!text) return;
  const time = getTime();
  ui.input.value = "";
  showMessage("user", text, time);
  ui.loader.classList.remove("hidden");

  try {
    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });
    const data = await res.json();
    const reply = data.status === "success" ? data.response : "❌ Error";
    typeMessage("bot", reply, getTime());
  } catch {
    showMessage("bot", "❌ Connection failed", getTime());
  }
};

// Reset & Download
ui.reset.onclick = () => ui.messages.innerHTML = "";
ui.download.onclick = () => {
  const text = Array.from(ui.messages.querySelectorAll(".message")).map(m => m.textContent).join("\n");
  const blob = new Blob([text], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "mikgpt_chat.txt";
  link.click();
};

// Helpers
function showMessage(sender, text, time) {
  const container = document.createElement("div");
  container.className = `message-container ${sender}`;

  const bubble = document.createElement("div");
  bubble.className = "message";
  bubble.textContent = text;

  const stamp = document.createElement("div");
  stamp.className = "timestamp";
  stamp.textContent = time;

  container.append(bubble, stamp);
  ui.messages.insertBefore(container, ui.loader);
  ui.messages.scrollTop = ui.messages.scrollHeight;
}

function typeMessage(sender, text, time) {
  const container = document.createElement("div");
  container.className = `message-container ${sender}`;

  const bubble = document.createElement("div");
  bubble.className = "message";

  const stamp = document.createElement("div");
  stamp.className = "timestamp";
  stamp.textContent = time;

  container.append(bubble, stamp);
  ui.messages.insertBefore(container, ui.loader);

  let i = 0;
  const type = setInterval(() => {
    if (i < text.length) {
      bubble.textContent += text[i++];
      ui.messages.scrollTop = ui.messages.scrollHeight;
    } else {
      clearInterval(type);
      ui.loader.classList.add("hidden");
    }
  }, 15);
}

function getTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
