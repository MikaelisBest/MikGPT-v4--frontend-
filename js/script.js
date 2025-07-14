import { saveMessage, loadHistory, clearHistory } from "./chatHistory.js";

// 🌗 Theme toggle
const toggleBtn = document.getElementById("toggleMode");
const themeLink = document.getElementById("themeStylesheet");

let savedTheme = localStorage.getItem("theme") || "light";
themeLink.href = `css/${savedTheme}.css`;
toggleBtn.textContent = savedTheme === "dark" ? "☀️" : "🌙";

toggleBtn.addEventListener("click", () => {
  document.documentElement.classList.add("transitioning");
  setTimeout(() => {
    const current = themeLink.href.includes("dark") ? "dark" : "light";
    const next = current === "dark" ? "light" : "dark";
    themeLink.href = `css/${next}.css`;
    localStorage.setItem("theme", next);
    toggleBtn.textContent = next === "dark" ? "☀️" : "🌙";
    setTimeout(() => document.documentElement.classList.remove("transitioning"), 300);
  }, 50);
});

// 🔁 Chat state
let chatHistory = [];
let userId = null;
let db = null;
let activeChatId = null;

// DOM refs
const form = document.getElementById("message-form");
const input = document.getElementById("message-input");
const messages = document.getElementById("chat-messages");
const loader = document.getElementById("loading-indicator");
const resetBtn = document.getElementById("resetChat");
const downloadBtn = document.getElementById("downloadChat");
const promptBtns = document.querySelectorAll(".prompt-btn");
const chatSelector = document.getElementById("chatSelector");
const newChatBtn = document.getElementById("newChat");

const BACKEND_URL = "https://mikgpt-v4-backend-production.up.railway.app/api/chat";

// 🔐 Firebase Auth + Firestore Chat Loading
firebase.auth().onAuthStateChanged(async (user) => {
  const authSection = document.getElementById("auth-section");
  const chatWrapper = document.getElementById("chat-wrapper");

  if (user) {
    db = firebase.firestore();
    userId = user.uid;

    authSection.style.display = "none";
    chatWrapper.style.display = "flex";

    await loadChatSessions();
    if (!activeChatId) {
      startNewChat();
    } else {
      loadChatFromFirestore(activeChatId);
    }
  } else {
    chatWrapper.style.display = "none";
    authSection.style.display = "flex";
  }
});

// 🆕 New Chat
newChatBtn.addEventListener("click", startNewChat);

async function startNewChat() {
  if (!db || !userId) return;

  const newChatRef = await db.collection("users").doc(userId).collection("chats").add({
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });

  activeChatId = newChatRef.id;
  localStorage.setItem("activeChatId", activeChatId);
  chatHistory = [];
  clearMessagesFromDOM();
  await loadChatSessions();
}

// 🔄 Load Chat Sessions
async function loadChatSessions() {
  chatSelector.innerHTML = "";
  const snapshot = await db.collection("users").doc(userId).collection("chats").orderBy("createdAt").get();

  snapshot.forEach(doc => {
    const option = document.createElement("option");
    option.value = doc.id;
    option.textContent = `Chat ${doc.id.substring(0, 5)}`;
    if (doc.id === activeChatId) option.selected = true;
    chatSelector.appendChild(option);
  });
}

// 🧠 Switch between chat sessions
chatSelector.addEventListener("change", async (e) => {
  activeChatId = e.target.value;
  localStorage.setItem("activeChatId", activeChatId);
  chatHistory = [];
  clearMessagesFromDOM();
  await loadChatFromFirestore(activeChatId);
});

async function loadChatFromFirestore(chatId) {
  const snapshot = await db.collection("users").doc(userId).collection("chats").doc(chatId).collection("messages").orderBy("timestamp").get();
  messages.innerHTML = "";

  snapshot.forEach(doc => {
    const msg = doc.data();
    const time = msg.timestamp?.toDate?.().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) || "⏱";
    addMessage(msg.sender, msg.text, time);
    chatHistory.push({ sender: msg.sender, text: msg.text, time });
  });
}

// 📨 Form submit
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userMessage = input.value.trim();
  if (!userMessage) return;

  const time = getTime();
  addMessage("user", userMessage, time);
  saveAndPush("user", userMessage, time);
  input.value = "";
  loader.style.display = "block";

  try {
    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage }),
    });

    const data = await res.json();

    if (data.status === "success") {
      const botTime = getTime();
      addMessage("bot", data.response, botTime);
      saveAndPush("bot", data.response, botTime);
    } else {
      addMessage("bot", "❌ Error: " + data.message);
    }
  } catch (err) {
    addMessage("bot", "🚫 Backend connection failed.");
    console.error(err);
  }
});

// ➕ Add to DOM
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
    }, 10);
  } else {
    message.innerHTML = formatMarkdown(text);
  }

  container.appendChild(message);
  if (time) container.appendChild(timestamp);
  messages.insertBefore(container, loader);
  messages.scrollTo({ top: messages.scrollHeight, behavior: "smooth" });
}

// 💾 Save message
function saveAndPush(sender, text, time) {
  chatHistory.push({ sender, text, time });
  localStorage.setItem("chatHistory", JSON.stringify(chatHistory));

  if (db && userId && activeChatId) {
    db.collection("users")
      .doc(userId)
      .collection("chats")
      .doc(activeChatId)
      .collection("messages")
      .add({
        sender,
        text,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });
  }
}

// 🧹 Reset
resetBtn.addEventListener("click", () => {
  clearMessagesFromDOM();
  input.value = "";
  loader.style.display = "none";
  chatHistory = [];
  clearHistory();
});

function clearMessagesFromDOM() {
  Array.from(messages.children).forEach((child) => {
    if (child.id !== "loading-indicator") child.remove();
  });
}

// 📥 Download
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

// 🔘 Prompts
promptBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    input.value = btn.textContent;
    input.focus();
  });
});

// ⌨️ Enter to send
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    form.dispatchEvent(new Event("submit"));
  }
});

// 🕐 Time
function getTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// 📄 Markdown
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

// 🔐 Auth buttons
document.getElementById("signInBtn").addEventListener("click", () => {
  const email = document.getElementById("emailInput").value;
  const pass = document.getElementById("passwordInput").value;
  firebase.auth().signInWithEmailAndPassword(email, pass).catch(console.error);
});

document.getElementById("signUpBtn").addEventListener("click", () => {
  const email = document.getElementById("emailInput").value;
  const pass = document.getElementById("passwordInput").value;
  firebase.auth().createUserWithEmailAndPassword(email, pass).catch(console.error);
});

document.getElementById("googleBtn").addEventListener("click", () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider).catch(console.error);
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  firebase.auth().signOut().catch(console.error);
});
