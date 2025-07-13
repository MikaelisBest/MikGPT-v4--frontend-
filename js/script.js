const themeToggle = document.getElementById('theme-toggle');
const body = document.body;
const themeStyle = document.getElementById('theme-style');

let isDarkTheme = false;
const savedTheme = localStorage.getItem('mikgpt-theme');
if (savedTheme === 'dark') enableDarkTheme();

function enableDarkTheme() {
    body.classList.remove('light-theme');
    body.classList.add('dark-theme');
    themeStyle.href = 'css/dark.css';
    localStorage.setItem('mikgpt-theme', 'dark');
    isDarkTheme = true;
}

function enableLightTheme() {
    body.classList.remove('dark-theme');
    body.classList.add('light-theme');
    themeStyle.href = 'css/light.css';
    localStorage.setItem('mikgpt-theme', 'light');
    isDarkTheme = false;
}

themeToggle.addEventListener('click', () => {
    if (!isDarkTheme) enableDarkTheme();
    else enableLightTheme();
});

document.getElementById('message-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const input = document.getElementById('message-input');
    const message = input.value.trim();
    if (!message) return;

    displayMessage(message, 'user');
    input.value = '';

    const loader = document.getElementById('loading-indicator');
    loader.style.display = 'block';

    try {
        const response = await fetch('https://mikgpt-backend.up.railway.app/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });

        const data = await response.json();
        loader.style.display = 'none';

        if (data.status === 'success') {
            displayMessage(data.response, 'bot');
        } else {
            displayMessage('I encountered an error. Please try again.', 'bot');
        }
    } catch (error) {
        loader.style.display = 'none';
        console.error('Error:', error);
        displayMessage('An error occurred. Please check your connection.', 'bot');
    }
});

function displayMessage(text, sender) {
    const messagesDiv = document.getElementById('chat-messages');
    const messageElement = document.createElement('div');

    messageElement.className = `message ${sender}-message`;
    messageElement.textContent = text;

    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
