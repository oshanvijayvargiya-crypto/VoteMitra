import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/voteiq')
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB error:', err));

// Chat Schema
const chatSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  message: { type: String, required: true },
  role: { type: String, enum: ['user', 'model'], required: true },
  timestamp: { type: Date, default: Date.now }
});

const Chat = mongoose.model('Chat', chatSchema);

const SYSTEM_PROMPT = `You are ElectBot 🗳️ — India's friendliest election education assistant.`;

// POST /api/chat - Send a message to Gemini
app.post('/chat', async (req, res) => {
  try {
    const { message, userId, conversationHistory = [] } = req.body;

    if (!message || !userId) {
      return res.status(400).json({ error: 'Message and userId are required' });
    }

    // Save user message
    await Chat.create({
      userId,
      message,
      role: 'user'
    });

    // Get Gemini response
    const response = await ai.generateContent({
      contents: [
        { role: 'user', parts: [{ text: SYSTEM_PROMPT + '\n\n' + message }] }
      ]
    });

    const modelResponse = response.response.text();

    // Save model response
    await Chat.create({
      userId,
      message: modelResponse,
      role: 'model'
    });

    res.json({ response: modelResponse });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process chat' });
  }
});

// GET /api/history/:userId - Get chat history
app.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const history = await Chat.find({ userId }).sort({ timestamp: 1 });
    res.json(history);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

export default app;
