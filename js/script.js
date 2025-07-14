import { saveMessage, loadHistory, clearHistory } from "./chatHistory.js";

const ui = {
  auth: document.getElementById("auth-section"),
  chatW: document.getElementById("chat-wrapper"),
  email: document.getElementById("emailInput"),
  pass: document.getElementById("passwordInput"),
  signIn: document.getElementById("signInBtn"),
  signUp: document.getElementById("signUpBtn"),
  google: document.getElementById("googleBtn"),
  logout: document.getElementById("logoutBtn"),
  toggle: document.getElementById("toggleMode"),
  newChat: document.getElementById("newChatBtn"),
  selector: document.getElementById("chatSelector"),
  reset: document.getElementById("resetChat"),
  download: document.getElementById("downloadChat"),
  form: document.getElementById("message-form"),
  input: document.getElementById("message-input"),
  window: document.getElementById("chat-messages"),
  loader: document.getElementById("loading-indicator")
};

let db, userId, activeChatId;
let chatHistory = [];

ui.toggle.addEventListener("click", () => {
  const current = localStorage.getItem("theme") || "light";
  const next = current === "dark" ? "light" : "dark";
  document.getElementById("themeStylesheet").href = `css/${next}.css`;
  localStorage.setItem("theme", next);
  ui.toggle.textContent = next === "dark" ? "☀️" : "🌙";
});

// 🧠 Auth + Chat Loader
firebase.auth().onAuthStateChanged(async user => {
  if (user) {
    ui.auth.classList.add("hidden");
    ui.chatW.classList.remove("hidden");

    db = firebase.firestore();
    userId = user.uid;

    await loadChatSessions();

    const savedId = localStorage.getItem("activeChatId");
    if (!savedId) startNewChat();
    else {
      activeChatId = savedId;
      await loadFromFirestore(activeChatId);
    }
  } else {
    ui.chatW.classList.add("hidden");
    ui.auth.classList.remove("hidden");
  }
});

// Auth buttons
ui.signIn.onclick = () => firebase.auth().signInWithEmailAndPassword(ui.email.value, ui.pass.value).catch(alert);
ui.signUp.onclick = () => firebase.auth().createUserWithEmailAndPassword(ui.email.value, ui.pass.value).catch(alert);
ui.google.onclick = () => firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider()).catch(alert);
ui.logout.onclick = () => firebase.auth().signOut();

// ➕ New Chat
ui.newChat.onclick = async () => {
  const name = prompt("Name this chat:");
  if (!name) return;

  const ref = await db.collection("users").doc(userId).collection("chats").add({
    name,
    createdAt: Date.now()
  });

  activeChatId = ref.id;
  localStorage.setItem("activeChatId", activeChatId);
  chatHistory = [];
  ui.window.innerHTML = "";
  await loadChatSessions();
};

// 🔁 Load Chat Sessions
async function loadChatSessions() {
  ui.selector.innerHTML = "";
  const snap = await db.collection("users").doc(userId).collection("chats").orderBy("createdAt", "asc").get();

  snap.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d.id;
    opt.textContent = d.data().name || ("Chat " + d.id.slice(-5));
    if (d.id === localStorage.getItem("activeChatId")) opt.selected = true;
    ui.selector.appendChild(opt);
  });
}

// 📁 Switch Chat
ui.selector.onchange = async () => {
  activeChatId = ui.selector.value;
  localStorage.setItem("activeChatId", activeChatId);
  chatHistory = [];
  ui.window.innerHTML = "";
  await loadFromFirestore(activeChatId);
};

// 📨 Form Submission
ui.form.onsubmit = async e => {
  e.preventDefault();
  const text = ui.input.value.trim();
  if (!text) return;

  const time = getTime();
  showMessage("user", text, time);
  saveAndPush("user", text, time);
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
    saveAndPush("bot", reply, getTime());
  } catch {
    showMessage("bot", "🚫 Backend error", getTime());
  }
};

// 💬 Display Message
function showMessage(sender, text, time) {
  const div = document.createElement("div");
  div.classList.add("message-container", sender === "user" ? "user" : "bot");

  const bubble = document.createElement("div");
  bubble.classList.add("message");

  const stamp = document.createElement("div");
  stamp.classList.add("timestamp");
  stamp.textContent = time;

  if (sender === "bot") {
    let i = 0;
    const typing = setInterval(() => {
      if (i < text.length) {
        bubble.innerHTML += format(text[i++]);
        ui.window.scrollTop = ui.window.scrollHeight;
      } else {
        clearInterval(typing);
        ui.loader.classList.add("hidden");
      }
    }, 10);
  } else {
    bubble.innerHTML = format(text);
  }

  div.append(bubble, stamp);
  ui.window.insertBefore(div, ui.loader);
  ui.window.scrollTop = ui.window.scrollHeight;
}

// 💾 Save to Firestore
function saveAndPush(sender, text, time) {
  chatHistory.push({ sender, text, time });
  saveMessage(sender, text, time);

  if (db && userId && activeChatId) {
    db.collection("users").doc(userId).collection("chats")
      .doc(activeChatId).collection("messages")
      .add({ sender, text, time, timestamp: Date.now() });
  }
}

// ⬇️ Load from Firestore
async function loadFromFirestore(id) {
  const snap = await db.collection("users").doc(userId)
    .collection("chats").doc(id).collection("messages")
    .orderBy("timestamp").get();

  chatHistory = [];
  ui.window.innerHTML = "";

  snap.forEach(doc => {
    const { sender, text, time } = doc.data();
    showMessage(sender, text, time);
    chatHistory.push({ sender, text, time });
  });
}

// 🧹 Reset
ui.reset.onclick = () => {
  ui.window.innerHTML = "";
  chatHistory = [];
  clearHistory();
};

// 📥 Download
ui.download.onclick = () => {
  const txt = chatHistory.map(c => `[${c.time}] ${c.sender.toUpperCase()}: ${c.text}`).join("\n");
  const blob = new Blob([txt], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "chat.txt";
  a.click();
};

// 🧠 Util
function format(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br>");
}

function getTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
