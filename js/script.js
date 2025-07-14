// 🌗 Theme toggle setup — PUT THIS AT THE VERY TOP
const toggleBtn = document.getElementById("toggleMode");
const themeLink = document.getElementById("themeStylesheet");

// saved theme from localStorage
let savedTheme = localStorage.getItem("theme") || "light";
themeLink.href = `css/${savedTheme}.css`;
toggleBtn.textContent = savedTheme === "dark" ? "☀️" : "🌙";

// 🌟 Smooth transition with blur+scale
toggleBtn.addEventListener("click", () => {
    document.documentElement.classList.add("transitioning");

    setTimeout(() => {
        const current = themeLink.href.includes("dark") ? "dark" : "light";
        const next = current === "dark" ? "light" : "dark";

        themeLink.href = `css/${next}.css`;
        localStorage.setItem("theme", next);
        toggleBtn.textContent = next === "dark" ? "☀️" : "🌙";

        // remove transition effect after 300ms
        setTimeout(() => {
            document.documentElement.classList.remove("transitioning");
        }, 300);
    }, 50);
});

// 💬 Chat logic below — already working 🔥
const form = document.getElementById("message-form");
const input = document.getElementById("message-input");
const messages = document.getElementById("chat-messages");
const loader = document.getElementById("loading-indicator");

const BACKEND_URL = "https://mikgpt-v4-backend-production.up.railway.app/api/chat";

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

        if (data.status === "success") {
            addMessage("bot", data.response);
        } else {
            addMessage("bot", "❌ Error: " + data.message);
        }
    } catch (err) {
        addMessage("bot", "🚫 Failed to connect to backend.");
        console.error("Error:", err);
    }
});

function addMessage(sender, text) {
    const message = document.createElement("div");
    message.classList.add("message", `${sender}-message`);

    if (sender === "bot") {
        // Typing animation
        let i = 0;
        const typingInterval = setInterval(() => {
            if (i < text.length) {
                message.textContent += text.charAt(i);
                i++;
                messages.scrollTop = messages.scrollHeight;
            } else {
                clearInterval(typingInterval);
                loader.style.display = "none";
            }
        }, 7.5); // typing speed (lower = faster)
    } else {
        message.textContent = text;
    }

    messages.insertBefore(message, loader);
    messages.scrollTop = messages.scrollHeight;
}
