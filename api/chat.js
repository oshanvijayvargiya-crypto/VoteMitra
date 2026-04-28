import mongoose from 'mongoose';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// MongoDB — optional, gracefully skipped if URI not set
let isConnected = false;
let Chat = null;

async function connectDB() {
  if (!process.env.MONGODB_URI) return false;
  if (isConnected) return true;
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;

    const chatSchema = new mongoose.Schema({
      userId:    { type: String, required: true },
      message:   { type: String, required: true },
      role:      { type: String, enum: ['user', 'model'], required: true },
      timestamp: { type: Date, default: Date.now }
    });
    Chat = mongoose.models.Chat || mongoose.model('Chat', chatSchema);
    return true;
  } catch (err) {
    console.error('MongoDB connection failed (non-fatal):', err.message);
    return false;
  }
}

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
1. Always stay 100% politically neutral
2. Use simple, friendly language — imagine explaining to a 17-year-old first-time voter
3. Format responses clearly with bullet points or numbered steps
4. When relevant, suggest what the user might want to ask next
5. If asked anything outside elections, say: "I'm specialized in Indian election education! Let's explore how democracy works 🗳️"
6. Never make up facts — if unsure, say so honestly
7. Celebrate civic participation — encourage voting positively

GREETING (use on first message only):
"Jai Hind! 🇮🇳 I'm ElectBot, your personal guide to Indian elections. Whether you're a first-time voter or just curious about democracy, I'm here to help! What would you like to know about India's election process?"
`;

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const dbConnected = await connectDB();

  // GET — fetch chat history
  if (req.method === 'GET') {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    if (!dbConnected || !Chat) return res.json([]); // no DB → return empty history

    try {
      const history = await Chat.find({ userId }).sort({ timestamp: 1 });
      return res.json(history.map(item => ({
        role: item.role,
        text: item.message,
        timestamp: item.timestamp
      })));
    } catch (err) {
      console.error('History fetch error:', err.message);
      return res.json([]);
    }
  }

  // POST — send message to Gemini
  if (req.method === 'POST') {
    try {
      const { message, userId = 'anonymous', history = [] } = req.body;
      if (!message) return res.status(400).json({ error: 'Message is required' });

      // Save user message (if DB available)
      if (dbConnected && Chat) {
        await Chat.create({ userId, message, role: 'user' }).catch(() => {});
      }

      // Format conversation history for Gemini
      const formattedHistory = history.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      }));

      // Call Gemini
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
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

      // Save bot reply (if DB available)
      if (dbConnected && Chat) {
        await Chat.create({ userId, message: reply, role: 'model' }).catch(() => {});
      }

      return res.json({ reply });

    } catch (error) {
      console.error('Chat error:', error);
      return res.status(500).json({ error: error.message || 'Failed to process chat' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
