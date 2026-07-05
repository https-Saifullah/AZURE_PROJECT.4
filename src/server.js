const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const { AzureOpenAI } = require('openai');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Serve frontend
app.use(express.static(path.join(__dirname, '../public')));

// Check environment variables
console.log("===== Azure OpenAI Configuration =====");
console.log("ENDPOINT:", process.env.AZURE_OPENAI_ENDPOINT ? "Loaded" : "Missing");
console.log("KEY:", process.env.AZURE_OPENAI_KEY ? "Loaded" : "Missing");
console.log("DEPLOYMENT:", process.env.AZURE_OPENAI_DEPLOYMENT || "Missing");
console.log("API VERSION:", process.env.AZURE_OPENAI_API_VERSION || "Missing");
console.log("======================================");

// Azure OpenAI client
const client = new AzureOpenAI({
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    apiKey: process.env.AZURE_OPENAI_KEY,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION,
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT
});

// Fixed system prompt — this is the single source of truth for the bot's
// identity and scope. It is intentionally hardcoded on the server so it
// can never be overridden by anything sent from the client (UI, dev tools,
// or a direct API call).
const FIXED_SYSTEM_PROMPT = "You are a helpful FAQ assistant for SoccerGPT. You only answer questions related to soccer, including players, clubs, leagues, tournaments, rules, fixtures, scores, transfers, and football history. If asked anything outside this scope, politely decline.";

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    // Note: systemPrompt is intentionally NOT read from req.body.
    // The prompt is fixed server-side and cannot be changed by any client request.
    const { message } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ error: 'A non-empty "message" field is required.' });
    }

    try {
        const response = await client.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: FIXED_SYSTEM_PROMPT
                },
                {
                    role: 'user',
                    content: message
                }
            ],
            max_tokens: 500
        });

        res.json({
            reply: response.choices[0].message.content
        });

    } catch (error) {

        console.error("========== AZURE OPENAI ERROR ==========");
        console.error("Message:", error.message);

        if (error.status) {
            console.error("Status:", error.status);
        }

        if (error.code) {
            console.error("Code:", error.code);
        }

        if (error.response) {
            console.error("Response:", error.response.data);
        }

        console.error(error);
        console.error("========================================");

        res.status(500).json({
            error: error.message,
            details: error.response?.data || null
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`SoccerGPT running on port ${PORT}`);
});
