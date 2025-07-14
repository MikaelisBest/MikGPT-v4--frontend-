document.addEventListener("DOMContentLoaded", () => {
  // ==== FIREBASE CONFIG ====
  const firebaseConfig = {
    apiKey: "AIzaSyCcClI7IoSqBc1WAitxRO9OWgcDoyers4Y",
    authDomain: "mikgpt.firebaseapp.com",
    projectId: "mikgpt"
  };
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();

  // ==== ELEMENTS ====
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
      initChat(); // 🔥 Init chat AFTER login
    } else {
      authScreen.style.display = "flex";
      app.style.display = "none";
    }
  });

  // ==== INIT CHAT ====
  function initChat() {
    chatForm.onsubmit = async (e) => {
      e.preventDefault();
      const msg = chatInput.value.trim();
      if (!msg) return;

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
        typeMessage("bot", data.reply || "No response.");
      } catch (err) {
        console.error(err);
        typeMessage("bot", "Error contacting MikGPT backend.");
      }
    };

    newChatBtn.onclick = () => {
      chatMessages.innerHTML = "";
      document.getElementById("current-chat-title").textContent = "New Chat";
    };

    logoutBtn.onclick = () => auth.signOut();
  }

  // ==== CHAT BUBBLES ====
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
    const interval = setInterval(() => {
      msg.textContent += text[i];
      i++;
      if (i >= text.length) clearInterval(interval);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 20);
  }
});
