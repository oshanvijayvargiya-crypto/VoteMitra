// Ultra-lean Vercel function — no heavy imports, direct REST API call
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET — no DB yet, return empty history
  if (req.method === 'GET') {
    return res.json([]);
  }

  // POST — chat with Gemini via direct REST API (no SDK)
  if (req.method === 'POST') {
    try {
      const { message, history = [] } = req.body;
      if (!message) return res.status(400).json({ error: 'Message is required' });

      const SYSTEM_PROMPT = `You are ElectBot 🗳️ — India's friendliest election education assistant.
Help Indian citizens understand their democratic rights and the election process.
Topics: Lok Sabha, Rajya Sabha, Vidhan Sabha, ECI, voter registration (Form 6, e-EPIC), EVMs, VVPAT, Model Code of Conduct, cVIGIL app, election timeline, vote counting.
Rules: Stay 100% politically neutral. Use simple friendly language. Format with bullet points. Never make up facts. Celebrate civic participation.
If asked anything outside Indian elections: "I'm specialized in Indian election education! Let's explore how democracy works 🗳️"
First greeting: "Jai Hind! 🇮🇳 I'm ElectBot, your personal guide to Indian elections. What would you like to know?"`;

      // Build contents array
      const contents = [
        ...history.map(msg => ({
          role: msg.role === 'model' ? 'model' : 'user',
          parts: [{ text: msg.text }]
        })),
        { role: 'user', parts: [{ text: message }] }
      ];

      // Direct Gemini REST API call — no SDK needed
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents,
            generationConfig: { temperature: 0.7 }
          })
        }
      );

      if (!geminiRes.ok) {
        const err = await geminiRes.json();
        console.error('Gemini error:', err);
        return res.status(500).json({ error: err.error?.message || 'Gemini API error' });
      }

      const data = await geminiRes.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';

      return res.json({ reply });

    } catch (error) {
      console.error('Handler error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
