import mongoose from 'mongoose';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// MongoDB connection (reuse across warm invocations)
let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGODB_URI);
  isConnected = true;
}

const chatSchema = new mongoose.Schema({
  userId:    { type: String, required: true },
  message:   { type: String, required: true },
  role:      { type: String, enum: ['user', 'model'], required: true },
  timestamp: { type: Date, default: Date.now }
});
const Chat = mongoose.models.Chat || mongoose.model('Chat', chatSchema);

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
2. Use simple, friendly language
3. Format responses with bullet points or numbered steps
4. If asked anything outside elections, say: "I'm specialized in Indian election education! Let's explore how democracy works 🗳️"
5. Never make up facts
6. Celebrate civic participation
`;

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  await connectDB();

  // POST /api/chat — send message
  if (req.method === 'POST') {
    try {
      const { message, userId = 'anonymous', history = [] } = req.body;
      if (!message) return res.status(400).json({ error: 'Message is required' });

      await Chat.create({ userId, message, role: 'user' });

      const formattedHistory = history.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      }));

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
      await Chat.create({ userId, message: reply, role: 'model' });
      return res.json({ reply });

    } catch (error) {
      console.error('Chat error:', error);
      return res.status(500).json({ error: 'Failed to process chat message' });
    }
  }

  // GET /api/chat?userId=xxx — fetch history
  if (req.method === 'GET') {
    try {
      const { userId } = req.query;
      if (!userId) return res.status(400).json({ error: 'userId is required' });

      const history = await Chat.find({ userId }).sort({ timestamp: 1 });
      const formatted = history.map(item => ({
        role: item.role,
        text: item.message,
        timestamp: item.timestamp
      }));
      return res.json(formatted);

    } catch (error) {
      console.error('History error:', error);
      return res.status(500).json({ error: 'Failed to fetch history' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
