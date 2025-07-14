const form = document.getElementById("message-form");
const input = document.getElementById("message-input");
const messages = document.getElementById("chat-messages");
const loader = document.getElementById("loading-indicator");

const BACKEND_URL = location.hostname === "localhost"
    ? "http://127.0.0.1:3000/api/chat"
    : "https://mikgpt-backend.up.railway.app/api/chat";

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const userMessage = input.value.trim();
    if (!userMessage) return;

    addMessage("user", userMessage);
    input.value = "";

    loader.style.display = "block";

    try {
        const res = await fetch(BACKEND_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: userMessage })
        });

        const data = await res.json();
        loader.style.display = "none";

        if (data.status === "success") {
            addMessage("bot", data.response);
        } else {
            addMessage("bot", "❌ Error: " + data.message);
        }
    } catch (err) {
        loader.style.display = "none";
        addMessage("bot", "🚫 Failed to connect to backend.");
        console.error("Error:", err);
    }
});

function addMessage(sender, text) {
    const message = document.createElement("div");
    message.classList.add("message", `${sender}-message`);
    message.textContent = text;
    messages.insertBefore(message, loader);
    messages.scrollTop = messages.scrollHeight;
}
