document.addEventListener("DOMContentLoaded", () => {
  const firebaseConfig = {
    apiKey: "AIzaSyCcClI7IoSqBc1WAitxRO9OWgcDoyers4Y",
    authDomain: "mikgpt.firebaseapp.com",
    projectId: "mikgpt"
  };
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();

  const authScreen = document.getElementById("auth-screen");
  const app = document.getElementById("app");
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");
  const chatMessages = document.getElementById("chat-messages");
  const logoutBtn = document.getElementById("logout-btn");
  const newChatBtn = document.getElementById("new-chat-btn");
  const loginBtn = document.getElementById("login-btn");
  const signupBtn = document.getElementById("signup-btn");
  const googleBtn = document.getElementById("google-login");

  loginBtn.onclick = () => {
    const email = document.getElementById("email").value;
    const pass = document.getElementById("password").value;
    auth.signInWithEmailAndPassword(email, pass).catch(err => alert("Login failed: " + err.message));
  };
  signupBtn.onclick = () => {
    const email = document.getElementById("email").value;
    const pass = document.getElementById("password").value;
    auth.createUserWithEmailAndPassword(email, pass).catch(err => alert("Signup failed: " + err.message));
  };
  googleBtn.onclick = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(err => alert("Google login failed: " + err.message));
  };

  auth.onAuthStateChanged(user => {
    if (user) {
      authScreen.classList.add("hidden");
      app.classList.remove("hidden");
    } else {
      authScreen.classList.remove("hidden");
      app.classList.add("hidden");
    }
  });

  chatForm.addEventListener("submit", async e => {
    e.preventDefault();
    const msg = chatInput.value.trim();
    if (!msg) return;
    addMessage("user", msg);
    chatInput.value = "";

    try {
      const res = await fetch("https://mikgpt-v4-backend-production.up.railway.app/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, uid: auth.currentUser?.uid || "anon" })
      });
      const data = await res.json();
      if (data.reply) {
        typeMessage("bot", data.reply);
      } else {
        typeMessage("bot", "⚠️ No reply received.");
      }
    } catch (err) {
      console.error(err);
      typeMessage("bot", "⚠️ Backend error.");
    }
  });

  logoutBtn.onclick = () => auth.signOut();
  newChatBtn.onclick = () => {
    chatMessages.innerHTML = "";
    document.getElementById("current-chat-title").textContent = "New Chat";
  };

  function addMessage(sender, text) {
    const msg = document.createElement("div");
    msg.className = `message ${sender}`;
    msg.textContent = text;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function typeMessage(sender, text) {
    const msg = document.createElement("div");
    msg.className = `message ${sender}`;
    chatMessages.appendChild(msg);
    let i = 0;
    const chars = [...text];
    const interval = setInterval(() => {
      if (i < chars.length) {
        msg.textContent += chars[i++];
        chatMessages.scrollTop = chatMessages.scrollHeight;
      } else {
        clearInterval(interval);
      }
    }, 20);
  }
});
