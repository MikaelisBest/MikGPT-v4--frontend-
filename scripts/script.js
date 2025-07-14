const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatMessages = document.getElementById("chat-messages");

// Handle form submission
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = chatInput.value.trim();
  if (!message) return;

  addMessage("user", message);
  chatInput.value = "";

  // Simulated response delay
  setTimeout(() => {
    typeBotMessage("Hmm... let me think.");
  }, 500);
});

// Add a message to chat
function addMessage(sender, text) {
  const msg = document.createElement("div");
  msg.className = `message ${sender}`;
  msg.textContent = text;
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Type message letter-by-letter
function typeBotMessage(text) {
  const msg = document.createElement("div");
  msg.className = "message bot";
  chatMessages.appendChild(msg);

  let i = 0;
  const interval = setInterval(() => {
    msg.textContent += text[i];
    i++;
    if (i >= text.length) clearInterval(interval);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }, 30); // adjust typing speed here
}
