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
  chatName: document.getElementById("chatNameInput"),
  selector: document.getElementById("chatSelector"),
  reset: document.getElementById("resetChat"),
  download: document.getElementById("downloadChat"),
  form: document.getElementById("message-form"),
  input: document.getElementById("message-input"),
  window: document.getElementById("chat-messages"),
  loader: document.getElementById("loading-indicator")
};

const BACKEND_URL = "https://mikgpt-v4-backend-production.up.railway.app/api/chat";

let db, userId, activeChatId = localStorage.getItem("activeChatId");

let chatHistory = [];

// Theme toggle
ui.toggle.addEventListener("click", () => {
  const cur = localStorage.getItem("theme") || "light";
  const nxt = cur==="dark"? "light":"dark";
  document.getElementById("themeStylesheet").href = `css/${nxt}.css`;
  localStorage.setItem("theme", nxt);
  ui.toggle.textContent = nxt==="dark"?"☀️":"🌙";
});

// Auth state
firebase.auth().onAuthStateChanged(async user => {
  if (user) {
    ui.auth.classList.add("hidden");
    ui.chatW.classList.remove("hidden");

    db = firebase.firestore();
    userId = user.uid;

    await loadSessions();
    if(!activeChatId) createNewChat();
    else loadMessages(activeChatId);

  } else {
    ui.chatW.classList.add("hidden");
    ui.auth.classList.remove("hidden");
  }
});

// Auth handlers
ui.signIn.onclick = () => firebase.auth().signInWithEmailAndPassword(ui.email.value, ui.pass.value).catch(alert);
ui.signUp.onclick = () => firebase.auth().createUserWithEmailAndPassword(ui.email.value, ui.pass.value).catch(alert);
ui.google.onclick = () => firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider()).catch(alert);
ui.logout.onclick = () => firebase.auth().signOut();

// New chat with name
ui.newChat.onclick = createNewChat;
async function createNewChat() {
  const name = ui.chatName.value.trim() || "New Chat";
  const ref = await db.collection("users").doc(userId).collection("chats").add({
    name, createdAt: Date.now()
  });
  activeChatId = ref.id;
  localStorage.setItem("activeChatId", activeChatId);
  chatHistory = [];
  ui.window.innerHTML = "";
  await loadSessions();
}

// Load sessions
async function loadSessions() {
  ui.selector.innerHTML = "";
  const snap = await db.collection("users").doc(userId).collection("chats").orderBy("createdAt","asc").get();
  snap.forEach(d=>{
    const o = document.createElement("option");
    o.value = d.id;
    o.textContent = d.data().name;
    if(d.id===activeChatId) o.selected=true;
    ui.selector.appendChild(o);
  });
}

// Selector change
ui.selector.onchange = async ()=>{
  activeChatId = ui.selector.value;
  localStorage.setItem("activeChatId", activeChatId);
  chatHistory = [];
  ui.window.innerHTML = "";
  await loadMessages(activeChatId);
};

// Submit message
ui.form.onsubmit = async e=>{
  e.preventDefault();
  const txt = ui.input.value.trim();
  if(!txt) return;
  const time = new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
  typeMessage("user", txt, time);
  await saveMsg("user", txt, time);
  ui.input.value="";
  ui.loader.classList.remove("hidden");

  try {
    const res = await fetch(BACKEND_URL, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({message:txt})
    });
    const data = await res.json();
    const rsp = data.status==="success"? data.response : "❌ "+data.message;
    typeMessage("bot", rsp, getTime());
    await saveMsg("bot", rsp, getTime());
  } catch {
    typeMessage("bot", "🚫 Connection failed.", getTime());
    await saveMsg("bot", "🚫 Connection failed.", getTime());
  } finally {
    ui.loader.classList.add("hidden");
  }
};

// Reset and download
ui.reset.onclick = ()=>{ ui.window.innerHTML=""; chatHistory=[]; clearHistory(); };
ui.download.onclick = ()=>{
  const blob = new Blob([chatHistory.map(c=>`[${c.time}] ${c.sender.toUpperCase()}: ${c.text}`).join("\n")],{type:"text/plain"});
  const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="chat.txt"; a.click();
};

// Letter-by-letter typing
async function typeMessage(sender, text, time) {
  const tm = document.createElement("div");
  tm.className = "message-container "+sender;
  const msgDiv = document.createElement("div");
  msgDiv.className="message";
  tm.append(msgDiv);

  const stamp = document.createElement("div");
  stamp.className="timestamp";
  stamp.textContent = time;

  ui.loader.before(tm);
  for(let i=0;i<text.length;i++){
    msgDiv.innerHTML += text.charAt(i).replace(" ","&nbsp;");
    ui.window.scrollTop = ui.window.scrollHeight;
    await new Promise(r=>setTimeout(r,10));
  }
  tm.append(stamp);
  chatHistory.push({sender,text,time});
  saveMessage(sender,text,time);
}

// Save to Firestore
async function saveMsg(sender,text,time){
  if(db && userId && activeChatId){
    await db.collection("users").doc(userId).collection("chats").doc(activeChatId).collection("messages")
      .add({sender,text,time,timestamp:Date.now()});
  }
}

// Load chat messages
async function loadMessages(id){
  const snap = await db.collection("users").doc(userId).collection("chats").doc(id).collection("messages").orderBy("timestamp").get();
  ui.window.innerHTML="";
  chatHistory=[];
  for(const d of snap.docs){
    const m = d.data();
    typeMessage(m.sender,m.text,m.time);
  }
}

function getTime(){
  return new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
}
