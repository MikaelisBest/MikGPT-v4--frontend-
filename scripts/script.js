document.addEventListener("DOMContentLoaded", () => {
  const firebaseConfig = {
    apiKey: "AIzaSyCcClI7IoSqBc1WAitxRO9OWgcDoyers4Y",
    authDomain: "mikgpt.firebaseapp.com",
    projectId: "mikgpt"
  };
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();

  // Elements
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
    auth.signInWithEmailAndPassword(email, pass)
      .catch(err => alert("Login failed: " + err.message));
  };

  signupBtn.onclick = () => {
    const email = document.getElementById("email").value;
    const pass = document.getElementById("password").value;
    auth.createUserWithEmailAndPassword(email, pass)
      .catch(err => alert("Signup failed: " + err.message));
  };

  googleBtn.onclick = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
      .catch(err => alert("Google login failed: " + err.message));
  };

  auth.onAuthStateChanged(user => {
    if (user) {
      authScreen.style.display = "none";
      app.style.display = "flex";
    } else {
      authScreen.style.display = "flex";
      app.style.display = "none";
    }
  });

  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const msg = chatInput.value.trim();
    if (!msg) return;

    console.log("📤 Sending:", msg);
    addMessage("user", msg);
    chatInput.value = "";

    try {
      const res = await fetch("https://mikgpt-v4-backend-production.up.railway.app/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          uid: auth.currentUser?.uid || "anon"
        })
      });

      const data = await res.json();
      console.log("✅ API Response:", data);

      if (data.reply) {
        typeMessage("bot", data.reply);
      } else {
        typeMessage("bot", "⚠️ No reply returned from backend.");
      }
    } catch (err) {
      console.error("🔥 Error during fetch:", err);
      typeMessage("bot", "⚠️ Failed to fetch response.");
    }
  });

  newChatBtn.onclick = () => {
    chatMessages.innerHTML = "";
    document.getElementById("current-chat-title").textContent = "New Chat";
  };

  logoutBtn.onclick = () => auth.signOut();

  function addMessage(sender, text) {
    const msg = document.createElement("div");
    msg.className = `message ${sender}`;
    msg.textContent = text;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    console.log(`💬 [${sender}]`, text);
  }

  function typeMessage(sender, text) {
    const msg = document.createElement("div");
    msg.className = `message ${sender}`;
    chatMessages.appendChild(msg);
    let i = 0;
    const interval = setInterval(() => {
      msg.textContent += text[i];
      i++;
      if (i >= text.length) clearInterval(interval);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 20);
  }
});
