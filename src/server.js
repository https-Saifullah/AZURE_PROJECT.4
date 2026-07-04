const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const { AzureOpenAI } = require('openai');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// CORS
const allowedOrigins = [
    'http://localhost:3000',
    process.env.ALLOWED_ORIGIN
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));

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

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    const { message, systemPrompt } = req.body;

    try {
        const response = await client.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: systemPrompt || 'You are a helpful FAQ assistant.'
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
    console.log(`FAQBot running on port ${PORT}`);
});
