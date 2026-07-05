// SoccerGPT - Azure OpenAI
// Smart FAQ Assistant

// The system prompt is fixed and intentionally hardcoded here so it can
// never be altered from the UI, dev tools, or a tampered request body.
const FIXED_SYSTEM_PROMPT = "You are a helpful FAQ assistant for SoccerGPT. You only answer questions related to soccer, including players, clubs, leagues, tournaments, rules, fixtures, scores, transfers, and football history. If asked anything outside this scope, politely decline.";

const sendBtn = document.getElementById('sendBtn');
const userInput = document.getElementById('userInput');
const chatBox = document.getElementById('chatBox');
const systemPrompt = document.getElementById('systemPrompt');

// Keep the visible textarea in sync with the fixed prompt, in case anything
// ever tries to change its value.
systemPrompt.value = FIXED_SYSTEM_PROMPT;

// Add message to chat
function addMessage(text, type) {
    const msg = document.createElement('div');
    msg.classList.add('message', type);
    msg.textContent = text;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
    return msg;
}

// Trigger a little kick + ripple animation on the send button
function animateSendButton(e) {
    sendBtn.classList.remove('clicked');
    // Force reflow so the animation can restart if clicked rapidly
    void sendBtn.offsetWidth;
    sendBtn.classList.add('clicked');

    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    const rect = sendBtn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = `${size}px`;

    // Center the ripple on click position, or button center for keyboard sends
    const x = (e && e.clientX ? e.clientX - rect.left : rect.width / 2) - size / 2;
    const y = (e && e.clientY ? e.clientY - rect.top : rect.height / 2) - size / 2;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    sendBtn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
}

// Send message to Azure OpenAI
async function sendMessage(e) {
    const message = userInput.value.trim();
    if (!message) return;

    animateSendButton(e);

    // Show user message
    addMessage(message, 'user');
    userInput.value = '';
    sendBtn.disabled = true;

    // Show loading
    const loadingMsg = addMessage(' Thinking...', 'loading');

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: message,
                systemPrompt: FIXED_SYSTEM_PROMPT
            })
        });

        const data = await response.json();

        // Remove loading message
        chatBox.removeChild(loadingMsg);

        if (data.reply) {
            addMessage(data.reply, 'bot');
        } else {
            addMessage('Sorry, something went wrong. Please try again.', 'bot');
        }

    } catch (error) {
        chatBox.removeChild(loadingMsg);
        addMessage('Error connecting to server. Please refresh.', 'bot');
    }

    sendBtn.disabled = false;
}

// Send on button click
sendBtn.addEventListener('click', sendMessage);

// Send on Enter key
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});
