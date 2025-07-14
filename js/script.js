import { saveMessage, loadHistory, clearHistory } from "./chatHistory.js";

const ui = {
  auth: document.getElementById("auth-section"),
  chatW: document.querySelector(".app"),
  email: document.getElementById("emailInput"),
  pass: document.getElementById("passwordInput"),
  signIn: document.getElementById("signInBtn"),
  signUp: document.getElementById("signUpBtn"),
  google: document.getElementById("googleBtn"),
  logout: document.getElementById("logoutBtn"),
  toggle: document.getElementById("toggleMode"),
  reset: document.getElementById("resetChat"),
  download: document.getElementById("downloadChat"),
  form: document.getElementById("message-form"),
  input: document.getElementById("message-input"),
  window: document.getElementById("chat-messages"),
  loader: document.getElementById("loading-indicator")
};

firebase.auth().onAuthStateChanged(user => {
  if (user) {
    ui.auth.classList.add("hidden");
    ui.chatW.classList.remove("hidden");
  } else {
    ui.chatW.classList.add("hidden");
    ui.auth.classList.remove("hidden");
  }
});

ui.signIn.onclick = () => firebase.auth().signInWithEmailAndPassword(ui.email.value, ui.pass.value).catch(alert);
ui.signUp.onclick = () => firebase.auth().createUserWithEmailAndPassword(ui.email.value, ui.pass.value).catch(alert);
ui.google.onclick = () => firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider()).catch(alert);
ui.logout.onclick = () => firebase.auth().signOut();

ui.toggle.onclick = () => {
  const current = localStorage.getItem("theme") || "light";
  const next = current === "dark" ? "light" : "dark";
  document.getElementById("themeStylesheet").href = `css/${next}.css`;
  localStorage.setItem("theme", next);
  ui.toggle.textContent = next === "dark" ? "☀️" : "🌙";
};

ui.reset.onclick = () => {
  ui.window.innerHTML = "";
  clearHistory();
};

ui.download.onclick = () => {
  const history = loadHistory();
  const txt = history.map(h => `[${h.time}] ${h.sender.toUpperCase()}: ${h.text}`).join("\n");
  const blob = new Blob([txt], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "mikgpt_chat.txt";
  link.click();
};

ui.form.onsubmit = async e => {
  e.preventDefault();
  const text = ui.input.value.trim();
  if (!text) return;

  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  showMessage("user", text, time);
  saveMessage("user", text, time);
  ui.input.value = "";
  ui.loader.classList.remove("hidden");

  try {
    const res = await fetch("https://mikgpt-v4-backend-production.up.railway.app/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });

    const data = await res.json();
    const reply = data.status === "success" ? data.response : "❌ " + data.message;
    showMessage("bot", reply, getTime());
  } catch {
    showMessage("bot", "🚫 Connection failed.", getTime());
  }
};

function showMessage(sender, text, time) {
  const container = document.createElement("div");
  container.classList.add("message-container", sender);

  const bubble = document.createElement("div");
  bubble.className = "message";
  bubble.style.backgroundColor = sender === "user"
    ? getComputedStyle(document.documentElement).getPropertyValue('--bubble-user')
    : getComputedStyle(document.documentElement).getPropertyValue('--bubble-bot');
  bubble.style.color = sender === "bot" && localStorage.getItem("theme") === "dark" ? "#fff" : "#000";

  let i = 0;
  const interval = setInterval(() => {
    if (i < text.length) {
      bubble.innerHTML += text[i++];
      ui.window.scrollTop = ui.window.scrollHeight;
    } else {
      clearInterval(interval);
      ui.loader.classList.add("hidden");
    }
  }, 10);

  const stamp = document.createElement("div");
  stamp.className = "timestamp";
  stamp.textContent = time;

  container.append(bubble, stamp);
  ui.window.appendChild(container);
  ui.window.scrollTop = ui.window.scrollHeight;
}

function getTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
// force
