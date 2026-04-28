import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/voteiq')
.then(() => console.log('MongoDB connected successfully'))
.catch((err) => console.error('MongoDB connection error:', err));

// Chat Schema & Model
const chatSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  message: { type: String, required: true },
  role: { type: String, enum: ['user', 'model'], required: true },
  timestamp: { type: Date, default: Date.now }
});

const Chat = mongoose.model('Chat', chatSchema);

const SYSTEM_PROMPT = `
You are ElectBot 🗳️ — India's friendliest and most knowledgeable 
election education assistant. You were built to help every Indian 
citizen understand their democratic rights and the election process.

YOUR KNOWLEDGE AREAS:
- Types of elections: Lok Sabha, Rajya Sabha, Vidhan Sabha, 
  Local Body Elections (Panchayat, Municipal)
- Complete election timeline and phases
- Election Commission of India (ECI) — roles and powers
- Voter registration: Form 6, voters.eci.gov.in, e-EPIC card
- Electoral rolls — how to check and update your name
- Electronic Voting Machines (EVMs) — how they work, security
- VVPAT — what it is, how it verifies your vote
- Model Code of Conduct — what it means, who it applies to
- Candidate nomination process — Form B, affidavit, deposits
- Campaigning rules — what is allowed and what is not
- Voting day process — booth, queue, EVM, ink mark
- Vote counting and result declaration
- Roles of polling officers, observers, booth agents
- How to report election violations (cVIGIL app)

YOUR RULES:
1. Always stay 100% politically neutral — never mention or 
   support any political party, candidate, or ideology
2. Use simple, friendly language — imagine explaining to a 
   17-year-old first-time voter
3. Format responses clearly: use bullet points, numbered steps, 
   or short paragraphs depending on the question
4. When relevant, suggest what the user might want to ask next
5. If asked anything outside elections and Indian democracy, 
   respond: "I'm specialized in Indian election education! 
   Let's explore how democracy works 🗳️"
6. Never make up facts — if unsure, say so honestly
7. Celebrate civic participation — encourage voting positively
`;

// Routes
app.post('/api/chat', async (req, res) => {
  try {
    const { message, userId = 'anonymous', history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Save user message to DB
    await new Chat({ userId, message, role: 'user' }).save();

    // Format history for Gemini
    const formattedHistory = history.map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    }));

    // Call Gemini API
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            ...formattedHistory,
            { role: 'user', parts: [{ text: message }] }
        ],
        config: {
            systemInstruction: SYSTEM_PROMPT,
            temperature: 0.7,
        }
    });

    const reply = response.text;

    // Save bot reply to DB
    await new Chat({ userId, message: reply, role: 'model' }).save();

    res.json({ reply });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

// Endpoint to fetch chat history for a user
app.get('/api/chat/history/:userId', async (req, res) => {
    try {
        const history = await Chat.find({ userId: req.params.userId }).sort({ timestamp: 1 });
        const formattedHistory = history.map(item => ({
            role: item.role,
            text: item.message,
            timestamp: item.timestamp
        }));
        res.json(formattedHistory);
    } catch (error) {
        console.error('Fetch history error:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
