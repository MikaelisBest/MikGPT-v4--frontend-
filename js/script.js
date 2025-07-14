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

const BACKEND_URL = "https://mikgpt-v4-backend-production.up.railway.app/api/chat";
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCcClI7IoSqBc1WAitxRO9OWgcDoyers4Y",
  authDomain: "mikgpt.firebaseapp.com",
  projectId: "mikgpt",
  storageBucket: "mikgpt.appspot.com",
  messagingSenderId: "399290939653",
  appId: "1:399290939653:web:dbece7f7171b31112f9f6c"
};

// Initialize Firebase (should already be in your HTML)
firebase.initializeApp(FIREBASE_CONFIG);

let db = null;
let userId = null;
let activeChatId = localStorage.getItem("activeChatId") || null;
let chatHistory = [];

// 🔄 Theme toggle
ui.toggle.addEventListener("click", () => {
  const current = localStorage.getItem("theme") || "light";
  const next = current === "dark" ? "light" : "dark";
  document.getElementById("themeStylesheet").href = `css/${next}.css`;
  localStorage.setItem("theme", next);
  ui.toggle.textContent = next === "dark" ? "☀️" : "🌙";
});

// 🔐 Auth state listener
firebase.auth().onAuthStateChanged(async (user) => {
  if (user) {
    ui.auth.classList.add("hidden");
    ui.chatW.classList.remove("hidden");

    db = firebase.firestore();
    userId = user.uid;

    await loadChatSessions();

    if (!activeChatId) {
      await startNewChat();
    } else {
      await loadFromFirestore(activeChatId);
    }
  } else {
    ui.chatW.classList.add("hidden");
    ui.auth.classList.remove("hidden");
  }
});

// 🛠️ Auth actions
ui.signIn.onclick = () =>
  firebase
    .auth()
    .signInWithEmailAndPassword(ui.email.value, ui.pass.value)
    .catch((e) => alert("❌ " + e.message));

ui.signUp.onclick = () =>
  firebase
    .auth()
    .createUserWithEmailAndPassword(ui.email.value, ui.pass.value)
    .catch((e) => alert("❌ " + e.message));

ui.google.onclick = () =>
  firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider()).catch((e) => alert("❌ " + e.message));

ui.logout.onclick = () => firebase.auth().signOut();

// ➕ New Chat
ui.newChat.onclick = startNewChat;
async function startNewChat() {
  const ref = await db
    .collection("users")
    .doc(userId)
    .collection("chats")
    .add({
      createdAt: Date.now()
    });
  activeChatId = ref.id;
  localStorage.setItem("activeChatId", activeChatId);
  chatHistory = [];
  ui.window.innerHTML = "";
  await loadChatSessions();
}

// 📂 Load chat sessions into selector
async function loadChatSessions() {
  ui.selector.innerHTML = "";
  const snap = await db
    .collection("users")
    .doc(userId)
    .collection("chats")
    .orderBy("createdAt", "asc")
    .get();

  snap.forEach((d) => {
    const opt = document.createElement("option");
    opt.value = d.id;
    opt.textContent = "Chat " + d.id.slice(-5);
    if (d.id === activeChatId) opt.selected = true;
    ui.selector.appendChild(opt);
  });
}

// 🔁 Selector change
ui.selector.onchange = async () => {
  activeChatId = ui.selector.value;
  localStorage.setItem("activeChatId", activeChatId);
  chatHistory = [];
  ui.window.innerHTML = "";
  await loadFromFirestore(activeChatId);
};

// 📨 Submit message to backend + save
ui.form.onsubmit = async (e) => {
  e.preventDefault();
  const text = ui.input.value.trim();
  if (!text) return;

  const time = getTime();
  showMessage("user", text, time);
  await saveAndSend("user", text, time);

  ui.input.value = "";
  ui.loader.classList.remove("hidden");

  try {
    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });
    const data = await res.json();
    const resp = data.status === "success" ? data.response : "❌ " + data.message;
    showMessage("bot", resp, getTime());
    await saveAndSend("bot", resp, getTime());
  } catch {
    showMessage("bot", "🚫 Connection failed.", getTime());
    await saveAndSend("bot", "🚫 Connection failed.", getTime());
  } finally {
    ui.loader.classList.add("hidden");
  }
};

// 🗑️ Reset chat (local only)
ui.reset.onclick = () => {
  ui.window.innerHTML = "";
  chatHistory = [];
  clearHistory();
};

// 📥 Download chat
ui.download.onclick = () => {
  const blob = new Blob(
    [
      chatHistory
        .map((c) => `[${c.time}] ${c.sender.toUpperCase()}: ${c.text}`)
        .join("\n")
    ],
    { type: "text/plain" }
  );
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "chat.txt";
  link.click();
};

// 💬 Show message in UI
function showMessage(sender, text, time) {
  const div = document.createElement("div");
  div.classList.add("message-container", sender === "user" ? "user" : "bot");

  const bubble = document.createElement("div");
  bubble.classList.add("message");
  bubble.innerHTML = text;

  const stamp = document.createElement("div");
  stamp.classList.add("timestamp");
  stamp.textContent = time;

  div.append(bubble, stamp);

  if (ui.loader && ui.loader.parentNode === ui.window) {
    ui.window.insertBefore(div, ui.loader);
  } else {
    ui.window.appendChild(div);
  }

  ui.window.scrollTop = ui.window.scrollHeight;
}

// 💾 Save message to Firestore
async function saveAndSend(sender, text, time) {
  if (db && userId && activeChatId) {
    await db
      .collection("users")
      .doc(userId)
      .collection("chats")
      .doc(activeChatId)
      .collection("messages")
      .add({ sender, text, time, timestamp: Date.now() });
  }
}

// 📥 Load messages from Firestore
async function loadFromFirestore(id) {
  const snap = await db
    .collection("users")
    .doc(userId)
    .collection("chats")
    .doc(id)
    .collection("messages")
    .orderBy("timestamp")
    .get();

  ui.window.innerHTML = "";
  chatHistory = [];

  snap.forEach((d) => {
    const m = d.data();
    showMessage(m.sender, m.text, m.time);
  });
}

// 🕐 Get timestamp
function getTime() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}
