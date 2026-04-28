import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, ChevronDown, CheckCircle, HelpCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

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

GREETING (use on first message only):
"Jai Hind! 🇮🇳 I'm ElectBot, your personal guide to Indian 
elections. Whether you're a first-time voter or just curious 
about democracy, I'm here to help! What would you like to 
know about India's election process?"
`;

const TIMELINE_STEPS = [
  { id: 1, title: "Schedule Announced", icon: "📋", desc: "ECI announces election dates and phases.", facts: ["Dates are legally binding", "Phases depend on security forces", "Press conference held by CEC"] },
  { id: 2, title: "Model Code Begins", icon: "📜", desc: "All parties must follow strict conduct rules.", facts: ["No new government schemes", "Official machinery cannot be used for campaigns", "Applies until results are declared"] },
  { id: 3, title: "Nominations Filed", icon: "📝", desc: "Candidates submit Form B + affidavit + deposit.", facts: ["Affidavit details assets & criminal record", "Security deposit required", "Proposers must sign"] },
  { id: 4, title: "Scrutiny", icon: "🔍", desc: "Returning Officer reviews nomination papers.", facts: ["Checks for valid signatures", "Ensures affidavit is complete", "Can reject invalid forms"] },
  { id: 5, title: "Withdrawal Deadline", icon: "↩️", desc: "Last chance for candidates to drop out.", facts: ["Official final candidate list prepared after this", "Symbols allotted to independents", "Cannot withdraw after deadline"] },
  { id: 6, title: "Campaigning", icon: "📢", desc: "Rallies, ads, door-to-door outreach (48hr silence before voting).", facts: ["Strict spending limits", "No hate speech allowed", "48-hour silence period before polling"] },
  { id: 7, title: "Voting Day", icon: "🗳️", desc: "EVM + VVPAT voting at designated booths.", facts: ["Indelible ink applied to finger", "Secret ballot system", "VVPAT slip visible for 7 seconds"] },
  { id: 8, title: "Counting & Results", icon: "📊", desc: "Votes counted, winner declared, MCC ends.", facts: ["EVMs unsealed in presence of candidates", "First-past-the-post system", "Certificate of election issued to winner"] }
];

const REGISTRATION_STEPS = [
  { id: 1, title: "Check Eligibility", desc: "Age 18+, Indian citizen, resident of constituency" },
  { id: 2, title: "Visit voters.eci.gov.in", desc: "Official ECI portal — only use official government site" },
  { id: 3, title: "Fill Form 6", desc: "New voter registration form — available online and offline" },
  { id: 4, title: "Upload Documents", desc: "Aadhaar card, passport photo, address proof" },
  { id: 5, title: "Track Application", desc: "Use reference number to check status on ECI portal" },
  { id: 6, title: "Get e-EPIC Card", desc: "Download digital Voter ID from ECI portal after approval" }
];

const KNOWLEDGE_CARDS = [
  { id: 1, q: "What is an EVM?", a: "Electronic Voting Machine, used since 1999, tamper-proof, battery operated" },
  { id: 2, q: "What is VVPAT?", a: "Voter Verified Paper Audit Trail, shows 7-second paper slip confirming your vote" },
  { id: 3, q: "Who can vote?", a: "Indian citizen, 18+ years, enrolled in electoral roll, not disqualified by law" },
  { id: 4, q: "What is Model Code of Conduct?", a: "Guidelines for parties/candidates from schedule announcement to result declaration" },
  { id: 5, q: "How many Lok Sabha seats?", a: "543 elected seats, majority = 272, elections every 5 years" },
  { id: 6, q: "What is Form 6?", a: "Application form for new voter registration on electoral roll" }
];

const TURNOUT_DATA = [
  { year: "2004", turnout: 58.1 },
  { year: "2009", turnout: 58.2 },
  { year: "2014", turnout: 66.4 },
  { year: "2019", turnout: 67.4 },
  { year: "2024", turnout: 65.8 }
];

const VIDEOS_DATA = [
  {
    id: 1,
    title: "Voter Registration — How to Register Online",
    channel: "🏛️ Election Commission of India",
    tag: "Official ECI",
    desc: "Step-by-step guide from ECI on how to register as a voter using the official Voter Helpline Portal and the Voter Helpline App.",
    url: "https://www.youtube.com/results?search_query=voter+registration+Election+Commission+of+India+official"
  },
  {
    id: 2,
    title: "How EVM Works — Explained by ECI",
    channel: "🏛️ Election Commission of India",
    tag: "Official ECI",
    desc: "The Election Commission of India demonstrates step-by-step how Electronic Voting Machines are designed, operated, and kept tamper-proof.",
    url: "https://www.youtube.com/results?search_query=EVM+how+it+works+Election+Commission+India+official"
  },
  {
    id: 3,
    title: "VVPAT — Voter Verified Paper Audit Trail",
    channel: "🏛️ PIB India",
    tag: "Official Govt",
    desc: "Press Information Bureau's official explainer on how VVPAT works alongside EVMs to ensure your vote is verified and counted correctly.",
    url: "https://www.youtube.com/results?search_query=VVPAT+explained+PIB+India+official"
  },
  {
    id: 4,
    title: "Model Code of Conduct — Complete Guide",
    channel: "🏛️ Sansad TV",
    tag: "Parliament TV",
    desc: "Sansad TV's in-depth session on the Model Code of Conduct — what rules apply to candidates, parties, and government machinery during elections.",
    url: "https://www.youtube.com/results?search_query=Model+Code+of+Conduct+Sansad+TV+election"
  },
  {
    id: 5,
    title: "Election Phases & Schedule in India",
    channel: "🏛️ DD News",
    tag: "National Broadcaster",
    desc: "DD News covers how India conducts multi-phase elections across constituencies, the role of security forces, and the election schedule process.",
    url: "https://www.youtube.com/results?search_query=India+election+phases+schedule+DD+News+official"
  },
  {
    id: 6,
    title: "Know Your Vote — Awareness Campaign",
    channel: "🏛️ PIB India",
    tag: "Official Govt",
    desc: "Government of India's voter awareness campaign — understanding your rights as a voter, how to cast your vote, and why every vote matters.",
    url: "https://www.youtube.com/results?search_query=voter+awareness+PIB+India+official+Know+Your+Vote"
  }
];

const SUGGESTION_CHIPS = [
  "How do I register? 🗳️",
  "How does EVM work? 🗳️",
  "What is VVPAT? 🗳️",
  "Lok Sabha explained 🗳️",
  "Model Code of Conduct ⚖️",
  "How are votes counted? 🗳️",
  "Who can vote in India? 🗳️",
  "What is cVIGIL app? 🗳️"
];

const API_BASE = import.meta.env.DEV ? 'http://localhost:5000' : '';

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userId] = useState(() => "user_" + Math.random().toString(36).substr(2, 9));
  const [selectedStep, setSelectedStep] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [flippedCards, setFlippedCards] = useState({});
  const [expandedAccordion, setExpandedAccordion] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (chatOpen && messages.length === 0) {
      // Fetch history when chat opens
      fetch(`${API_BASE}/api/chat?userId=${userId}`)
        .then(res => res.json())
        .then(history => {
            if (history && history.length > 0) {
                setMessages(history);
            } else {
                setMessages([
                    { role: "user", text: "Hello VoteMitra!" },
                    { role: "model", text: "Jai Hind! 🇮🇳 I'm VoteMitra, your personal guide to Indian elections. Whether you're a first-time voter or just curious about democracy, I'm here to help! What would you like to know about India's election process?" }
                ]);
            }
        })
        .catch(err => {
            console.error("Failed to load history:", err);
            setMessages([
              { role: "user", text: "Hello VoteMitra!" },
              { role: "model", text: "Jai Hind! 🇮🇳 I'm VoteMitra, your personal guide to Indian elections. Whether you're a first-time voter or just curious about democracy, I'm here to help! What would you like to know about India's election process?" }
            ]);
        });
    }
  }, [chatOpen, messages.length, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (textOverride) => {
    const textToSend = typeof textOverride === 'string' ? textOverride : inputText;
    if (!textToSend.trim()) return;

    const newMessages = [...messages, { role: "user", text: textToSend }];
    setMessages(newMessages);
    setInputText("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          userId: userId,
          history: messages
        })
      });

      if (!response.ok) {
          throw new Error('Network response was not ok');
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setMessages(prev => [...prev, { role: "model", text: data.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "model", text: "⚠️ ElectBot is momentarily unavailable. Please check your API key and try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChipClick = (chipText) => {
    setInputText(chipText);
    handleSendMessage(chipText);
  };

  const openTimelineModal = (step) => {
    setSelectedStep(step);
    setModalOpen(true);
  };

  const toggleCardFlip = (id) => {
    setFlippedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAccordion = (id) => {
    setExpandedAccordion(prev => prev === id ? null : id);
  };

  const askBotAbout = (topic) => {
    setChatOpen(true);
    setTimeout(() => {
      handleSendMessage(`Can you explain more about ${topic}?`);
    }, 300);
    setModalOpen(false);
  };

  return (
    <div className="min-h-screen text-[var(--text-primary)] font-sans selection:bg-[var(--orange-core)] selection:text-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

        :root {
          --bg-base: #060D0A;
          --bg-surface: #0D1A13;
          --bg-elevated: #162B1E;
          --bg-card: #111F16;
          --orange-core: #16A34A;
          --orange-glow: #15803D;
          --orange-light: #4ADE80;
          --amber: #F97316;
          --gold: #FBBF24;
          --text-primary: #F9FAF8;
          --text-secondary: #7EA888;
          --text-dim: #3D5C47;
          --border-subtle: rgba(22,163,74,0.15);
          --border-glow: rgba(22,163,74,0.35);
          --border-card: rgba(255,255,255,0.05);
        }

        body {
          background: 
            url("data:image/svg+xml,%3Csvg width='60' height='52' viewBox='0 0 60 52' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0 L60 17.3 L60 34.6 L30 52 L0 34.6 L0 17.3 Z' fill='none' stroke='rgba(22,163,74,0.06)' stroke-width='1'/%3E%3C/svg%3E"),
            radial-gradient(ellipse 80% 50% at 50% -10%, rgba(22,163,74, 0.15) 0%, transparent 60%),
            var(--bg-base);
          background-size: 60px 52px, 100% 100%, 100% 100%;
          background-attachment: fixed;
          color: var(--text-primary);
          font-family: 'Inter', sans-serif;
          margin: 0;
          min-height: 100vh;
        }

        h1, h2, h3, .playfair { 
          font-family: 'Inter', sans-serif; 
          font-weight: 700;
          text-shadow: 0 2px 20px rgba(22,163,74,0.15);
        }
        .font-sans { font-family: 'Inter', sans-serif; }

        .section-label {
          font-size: 10px;
          letter-spacing: 3px;
          color: var(--orange-light);
          font-weight: 700;
          text-transform: uppercase;
        }

        .section-divider {
          border-top: 1px solid var(--border-subtle);
          box-shadow: 0 -1px 0 rgba(22,163,74,0.08);
        }

        /* Nav */
        .vel-nav {
          background: rgba(6,13,10,0.85);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border-subtle);
          padding: 14px 32px;
        }
        .vel-nav-btn {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.08);
          color: var(--text-secondary);
          border-radius: 20px;
          padding: 6px 16px;
          font-size: 12px;
          transition: all 0.3s ease;
        }
        .vel-nav-btn.active {
          background: linear-gradient(135deg, var(--orange-core), var(--orange-glow));
          border: 1px solid var(--orange-core);
          color: white;
          box-shadow: 0 4px 20px rgba(22,163,74,0.4);
        }

        /* Hero */
        .hero-bloom {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 600px; height: 300px;
          background: radial-gradient(ellipse, rgba(22,163,74,0.15), transparent 70%);
          filter: blur(40px);
          pointer-events: none;
          animation: glow-breathe 4s infinite ease-in-out;
        }
        .hero-badge {
          background: rgba(22,163,74,0.1);
          border: 1px solid rgba(22,163,74,0.3);
          color: var(--orange-light);
          padding: 4px 16px;
          border-radius: 20px;
          font-size: 11px;
          letter-spacing: 3px;
        }
        .hero-headline-gradient {
          background: linear-gradient(135deg, var(--orange-core), var(--gold));
          -webkit-background-clip: text;
          color: transparent;
        }
        .btn-primary {
          background: linear-gradient(135deg, var(--orange-core), var(--orange-glow));
          border: none;
          padding: 14px 28px;
          border-radius: 10px;
          font-weight: 700;
          color: white;
          box-shadow: 0 8px 32px rgba(22,163,74,0.4);
          transition: all 0.3s ease;
        }
        .btn-primary:hover {
          box-shadow: 0 12px 40px rgba(22,163,74,0.6);
          transform: translateY(-2px);
        }
        .btn-secondary {
          background: transparent;
          border: 1px solid rgba(22,163,74,0.3);
          color: var(--orange-light);
          padding: 14px 28px;
          border-radius: 10px;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        .btn-secondary:hover {
          background: rgba(22,163,74,0.05);
        }

        /* Generic Card (Used for Modals) */
        .vel-card {
          background: linear-gradient(135deg, rgba(30, 20, 10, 0.95) 0%, rgba(20, 12, 5, 0.98) 100%);
          border: 1px solid var(--border-subtle);
          border-radius: 20px;
          box-shadow: 0 0 0 1px var(--border-card) inset, 0 8px 32px rgba(0,0,0,0.6), 0 0 60px rgba(22,163,74,0.04);
          backdrop-filter: blur(12px);
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        .vel-card::before {
          content: '';
          position: absolute;
          top: -30px; right: -30px;
          width: 120px; height: 120px;
          background: radial-gradient(circle, rgba(22,163,74,0.12) 0%, transparent 70%);
          pointer-events: none;
        }
        .vel-card:hover {
          border-color: rgba(22,163,74,0.4);
          box-shadow: 0 0 0 1px rgba(22,163,74,0.2) inset, 0 12px 40px rgba(0,0,0,0.7), 0 0 80px rgba(22,163,74,0.08);
        }

        /* Timeline */
        .timeline-node {
          width: 60px; height: 60px;
          background: linear-gradient(135deg, var(--bg-elevated), var(--bg-surface));
          border: 1.5px solid rgba(22,163,74,0.3);
          box-shadow: 0 0 20px rgba(22,163,74,0.1);
          transition: all 0.3s ease;
        }
        .timeline-step-hover:hover .timeline-node {
          border-color: var(--orange-core);
          background: linear-gradient(135deg, #0D2A18, #0A1F10);
          box-shadow: 0 0 0 4px rgba(22,163,74,0.1), 0 0 30px rgba(22,163,74,0.3);
        }
        .timeline-line {
          stroke: rgba(22,163,74,0.2);
          stroke-dasharray: 6 4;
          animation: dash-flow 20s linear infinite;
        }
        @keyframes dash-flow { to { stroke-dashoffset: -100; } }

        /* Accordion */
        .acc-closed {
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: 12px;
          padding: 16px 20px;
          color: var(--text-secondary);
          transition: all 0.3s ease;
        }
        .acc-open {
          border-color: var(--border-glow);
          background: linear-gradient(135deg, var(--bg-elevated), var(--bg-surface));
          box-shadow: 0 0 40px rgba(22,163,74,0.06);
        }
        .acc-badge {
          background: linear-gradient(135deg, var(--orange-core), var(--orange-glow));
          color: white;
          width: 24px; height: 24px;
          border-radius: 50%;
          font-size: 11px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
        }

        /* Flip Cards */
        .flip-front {
          background: linear-gradient(135deg, var(--bg-elevated), var(--bg-surface));
          border: 1px solid var(--border-subtle);
          border-radius: 16px;
        }
        .flip-icon {
          font-size: 32px;
          color: var(--orange-core);
          text-shadow: 0 0 20px rgba(22,163,74,0.5);
        }
        .flip-back {
          background: linear-gradient(135deg, var(--orange-core) 0%, var(--orange-glow) 100%);
          border-radius: 16px;
          color: white;
          padding: 20px;
        }
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; transition: 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }

        /* Chart */
        .chart-container {
          background: linear-gradient(135deg, var(--bg-elevated), var(--bg-surface));
          border: 1px solid var(--border-subtle);
          border-radius: 20px;
          padding: 28px;
        }
        .chart-tooltip {
          background: var(--bg-elevated);
          border: 1px solid rgba(22,163,74,0.3);
          color: var(--text-primary);
          border-radius: 8px;
          padding: 8px 12px;
        }

        /* Chat */
        .chat-panel {
          background: linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-base) 100%);
          border: 1px solid rgba(22,163,74,0.2);
          border-radius: 20px;
          box-shadow: 0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04);
        }
        .chat-header {
          background: linear-gradient(135deg, var(--bg-elevated), var(--bg-card));
          border-bottom: 1px solid var(--border-subtle);
          padding: 16px 20px;
        }
        .msg-bot {
          background: linear-gradient(135deg, var(--bg-elevated), var(--bg-card));
          border: 1px solid var(--border-subtle);
          border-radius: 4px 16px 16px 16px;
          color: #D4C4B0;
          font-size: 13px;
          padding: 12px 16px;
        }
        .msg-user {
          background: linear-gradient(135deg, var(--orange-core), var(--orange-glow));
          border-radius: 16px 4px 16px 16px;
          color: white;
          padding: 12px 16px;
          font-size: 13px;
        }
        .chat-chip {
          background: rgba(22,163,74,0.08);
          border: 1px solid rgba(22,163,74,0.2);
          color: var(--orange-light);
          border-radius: 16px;
          padding: 4px 12px;
          font-size: 11px;
          transition: all 0.2s ease;
        }
        .chat-chip:hover {
          background: rgba(22,163,74,0.15);
        }
        .chat-input {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(22,163,74,0.2);
          border-radius: 10px;
          color: var(--text-primary);
          padding: 10px 14px;
        }
        .chat-input:focus {
          border-color: rgba(22,163,74,0.5);
          outline: none;
        }
        .chat-send {
          background: linear-gradient(135deg, var(--orange-core), var(--orange-glow));
          border-radius: 8px;
          padding: 10px 14px;
          box-shadow: 0 4px 16px rgba(22,163,74,0.4);
        }
        .chat-fab {
          background: linear-gradient(135deg, var(--orange-core), var(--orange-glow));
          border-radius: 50%;
          width: 56px; height: 56px;
          box-shadow: 0 8px 32px rgba(22,163,74,0.5), 0 0 0 4px rgba(22,163,74,0.15);
          animation: pulse-green 2s infinite;
        }

        /* Animations */
        @keyframes pulse-green {
          0%, 100% { box-shadow: 0 8px 32px rgba(22,163,74,0.5), 0 0 0 0 rgba(22,163,74,0.4); }
          50% { box-shadow: 0 8px 32px rgba(22,163,74,0.5), 0 0 0 12px rgba(22,163,74,0); }
        }
        @keyframes glow-breathe {
          0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.05); }
        }
        .animate-fade-up {
          animation: fadeUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) both;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: var(--bg-base); }
        ::-webkit-scrollbar-thumb { background: linear-gradient(var(--orange-core), var(--orange-glow)); border-radius: 2px; }

        .typing-dot { animation: typingBounce 1.4s infinite ease-in-out both; }
        .typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .typing-dot:nth-child(2) { animation-delay: -0.16s; }
        @keyframes typingBounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }

        /* ===== HAMBURGER MENU ===== */
        .hamburger {
          display: none;
          flex-direction: column;
          justify-content: center;
          gap: 5px;
          cursor: pointer;
          padding: 6px;
          border: 1px solid rgba(22,163,74,0.2);
          border-radius: 8px;
          background: transparent;
          transition: all 0.2s ease;
        }
        .hamburger:hover { border-color: rgba(22,163,74,0.5); background: rgba(22,163,74,0.05); }
        .hamburger span {
          display: block;
          width: 22px;
          height: 2px;
          background: var(--orange-light);
          border-radius: 2px;
          transition: all 0.3s ease;
        }
        .hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
        .hamburger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
        .hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

        .mob-menu {
          display: none;
          position: absolute;
          top: 100%;
          left: 0; right: 0;
          background: rgba(6,13,10,0.98);
          backdrop-filter: blur(24px);
          border-bottom: 1px solid rgba(22,163,74,0.15);
          padding: 12px 16px 20px 16px;
          z-index: 39;
          flex-direction: column;
          gap: 6px;
          animation: fadeUp 0.25s ease both;
        }
        .mob-menu.open { display: flex; }
        .mob-menu-btn {
          width: 100%;
          text-align: left;
          padding: 12px 16px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.06);
          background: transparent;
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.2s ease;
        }
        .mob-menu-btn:hover { background: rgba(22,163,74,0.06); color: var(--text-primary); border-color: rgba(22,163,74,0.2); }
        .mob-menu-btn.active {
          background: linear-gradient(135deg, rgba(22,163,74,0.15), rgba(21,128,61,0.1));
          border-color: rgba(22,163,74,0.35);
          color: var(--orange-light);
        }

        @media (max-width: 640px) {
          .hamburger { display: flex; }
          .desktop-nav-tabs { display: none !important; }
          main { padding-top: 12px; }
          .hero-bloom { width: 90vw; height: 160px; }
          .chat-panel { border-radius: 0 !important; border-left: none !important; border-right: none !important; }
        }
        @media (min-width: 641px) {
          .hamburger { display: none !important; }
          .mob-menu { display: none !important; }
          .desktop-nav-tabs { display: flex !important; }
        }
      `}</style>

      {/* Navbar */}
      <nav className="vel-nav sticky top-0 z-40" style={{position: 'relative'}}>
        <div className="max-w-6xl mx-auto flex justify-between items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xl playfair tracking-tight font-bold" style={{color: 'var(--orange-core)', textShadow: '0 0 20px rgba(60, 150, 21, 0.56)'}}>
              VoteMitra 
            </span>
          </div>

          {/* Desktop Nav Tabs */}
          <div className="desktop-nav-tabs flex-wrap justify-center gap-2 sm:gap-3">
            {["home", "timeline", "register", "know more", "statistics", "videos"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`vel-nav-btn capitalize ${activeTab === tab ? "active" : ""}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Hamburger Button — mobile only */}
          <button
            className={`hamburger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>

        {/* Mobile Slide-Down Menu */}
        <div className={`mob-menu ${menuOpen ? 'open' : ''}`}>
          {[
            { id: "home",        icon: "🏠", label: "Home" },
            { id: "timeline",   icon: "📋", label: "Election Timeline" },
            { id: "register",   icon: "📝", label: "Voter Registration" },
            { id: "know more",  icon: "💡", label: "Knowledge Base" },
            { id: "statistics", icon: "📊", label: "Statistics" },
            { id: "videos",     icon: "🎬", label: "Video Guide" },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); setMenuOpen(false); }}
              className={`mob-menu-btn ${activeTab === t.id ? 'active' : ''}`}
            >
              <span style={{fontSize: 18}}>{t.icon}</span>
              {t.label}
              {activeTab === t.id && <span style={{marginLeft: 'auto', color: 'var(--orange-core)', fontSize: 12}}>•</span>}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 py-16 pb-32">
        
        {/* Home Tab */}
        {activeTab === "home" && (
          <div className="text-center relative animate-fade-up">
            <div className="hero-bloom"></div>
            <div className="relative z-10 pt-10 pb-16">
              <span className="hero-badge inline-block mb-6">INDIA'S ELECTION EDUCATION ASSISTANT</span>
              <h1 className="text-[clamp(36px,6vw,64px)] font-black playfair mb-6 leading-[1.05] text-[var(--text-primary)]">
                Understand Your Vote.<br />
                <span className="hero-headline-gradient">Shape Your Nation.</span>
              </h1>
              <p className="text-[var(--text-secondary)] text-[15px] max-w-[480px] mx-auto mb-10 leading-relaxed">
                Understand your democratic rights, track the election timeline, and learn everything you need to know about the world's largest democracy.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button 
                  onClick={() => setChatOpen(true)}
                  className="btn-primary"
                >
                  Ask VoteMitra ➜
                </button>
                <button 
                  onClick={() => setActiveTab("timeline")}
                  className="btn-secondary"
                >
                  View Timeline ➜
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Timeline Tab */}
        {activeTab === "timeline" && (
          <div className="animate-fade-up">
            <div className="text-center mb-16">
              <div className="section-label mb-2">Process</div>
              <h2 className="text-4xl playfair font-bold">The Election Journey</h2>
            </div>
            <div className="relative">
              {/* Desktop Line */}
              <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 pointer-events-none">
                <svg width="100%" height="2"><line x1="0" y1="1" x2="100%" y2="1" className="timeline-line" strokeWidth="2" /></svg>
              </div>
              {/* Mobile Line */}
              <div className="md:hidden absolute top-0 bottom-0 left-[38px] w-1 pointer-events-none">
                <svg width="2" height="100%"><line x1="1" y1="0" x2="1" y2="100%" className="timeline-line" strokeWidth="2" /></svg>
              </div>
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
                {TIMELINE_STEPS.map((step) => (
                  <div 
                    key={step.id}
                    onClick={() => openTimelineModal(step)}
                    className="flex md:flex-col items-center gap-5 cursor-pointer timeline-step-hover group w-full md:w-32"
                  >
                    <div className="timeline-node rounded-full flex items-center justify-center text-2xl z-10 shrink-0">
                      {step.icon}
                    </div>
                    <div className="md:text-center">
                      <div className="text-[var(--orange-light)] font-bold text-[10px] uppercase tracking-wider mb-1 group-hover:text-[var(--orange-core)] transition-colors">Step {step.id}</div>
                      <div className="font-semibold text-[13px] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">{step.title}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Register Tab */}
        {activeTab === "register" && (
          <div className="max-w-3xl mx-auto animate-fade-up">
            <div className="text-center mb-12">
              <div className="section-label mb-2">Guide</div>
              <h2 className="text-4xl playfair font-bold">Voter Registration</h2>
            </div>
            <div className="space-y-4">
              {REGISTRATION_STEPS.map((step) => (
                <div key={step.id} className={`cursor-pointer ${expandedAccordion === step.id ? 'acc-open' : 'acc-closed'}`} onClick={() => toggleAccordion(step.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="acc-badge">{step.id}</div>
                      <span className="font-semibold text-[15px] text-[var(--text-primary)]">{step.title}</span>
                    </div>
                    <ChevronDown className={`text-[var(--orange-core)] transition-transform duration-300 ${expandedAccordion === step.id ? 'rotate-180' : ''}`} />
                  </div>
                  {expandedAccordion === step.id && (
                    <div className="mt-4 pt-4 border-t border-[rgba(22,163,74,0.15)] animate-fade-up" onClick={(e) => e.stopPropagation()}>
                      <p className="text-[var(--text-secondary)] mb-4 leading-relaxed text-sm">{step.desc}</p>
                      <button 
                        onClick={() => askBotAbout(step.title)}
                        className="text-[12px] font-semibold text-[var(--gold)] flex items-center gap-1.5 hover:underline"
                      >
                        <MessageSquare size={14} /> Ask ElectBot about this
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Know More Tab */}
        {activeTab === "know more" && (
          <div className="animate-fade-up">
            <div className="text-center mb-12">
              <div className="section-label mb-2">Knowledge Base</div>
              <h2 className="text-4xl playfair font-bold">Election Insights</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {KNOWLEDGE_CARDS.map((card) => (
                <div 
                  key={card.id} 
                  className="relative h-56 rounded-2xl perspective-1000 cursor-pointer group"
                  onClick={() => toggleCardFlip(card.id)}
                >
                  <div className={`w-full h-full absolute top-0 left-0 transform-style-3d ${flippedCards[card.id] ? 'rotate-y-180' : ''}`}>
                    {/* Front */}
                    <div className="absolute w-full h-full backface-hidden flip-front flex flex-col items-center justify-center text-center p-6 shadow-xl hover:border-[rgba(22,163,74,0.4)] transition-colors">
                      <div className="flip-icon mb-4">?</div>
                      <h3 className="font-semibold text-[15px] text-[var(--text-primary)]">{card.q}</h3>
                    </div>
                    {/* Back */}
                    <div className="absolute w-full h-full backface-hidden flip-back flex items-center justify-center text-center p-6 rotate-y-180 shadow-2xl">
                      <p className="font-medium text-[14px] leading-relaxed">{card.a}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === "statistics" && (
          <div className="max-w-4xl mx-auto animate-fade-up">
            <div className="text-center mb-12">
              <div className="section-label mb-2">Data Overview</div>
              <h2 className="text-4xl playfair font-bold">Lok Sabha Voter Turnout History (%)</h2>
            </div>
            <div className="chart-container h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={TURNOUT_DATA} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="orangeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--orange-light)" />
                      <stop offset="100%" stopColor="var(--orange-glow)" />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="year" stroke="var(--text-dim)" tick={{fill: 'var(--text-secondary)', fontSize: 11}} axisLine={false} tickLine={false} dy={10} />
                  <YAxis domain={[50, 75]} stroke="var(--text-dim)" tick={{fill: 'var(--text-secondary)', fontSize: 11}} axisLine={false} tickLine={false} dx={-10} />
                  <CartesianGrid vertical={false} stroke="rgba(22,163,74,0.08)" strokeDasharray="3 3" />
                  <Tooltip 
                    cursor={{ fill: 'rgba(22,163,74,0.05)' }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="chart-tooltip">
                            <p className="font-bold text-[13px] mb-1">Year: {label}</p>
                            <p className="text-[var(--orange-core)] text-[12px] font-semibold">Turnout: {payload[0].value}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="turnout" 
                    fill="url(#orangeGradient)" 
                    radius={[4, 4, 0, 0]} 
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Videos Tab */}
        {activeTab === "videos" && (
          <div className="animate-fade-up">
            <div className="text-center mb-12">
              <div className="section-label mb-2">Learn More</div>
              <h2 className="text-4xl playfair font-bold">Election Video Guide</h2>
              <p className="text-[var(--text-secondary)] text-[14px] mt-3 max-w-lg mx-auto">Curated videos to help you understand every aspect of India's democratic process.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {VIDEOS_DATA.map((video) => (
                <div key={video.id} className="vel-card overflow-hidden flex flex-col" style={{transition: 'all 0.3s ease'}}>
                  {/* Thumbnail Placeholder */}
                  <div
                    className="w-full flex items-center justify-center relative overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, #1A1208 0%, #100C07 100%)',
                      height: '180px',
                      borderBottom: '1px solid rgba(22,163,74,0.15)'
                    }}
                  >
                    <div className="text-center">
                      <div style={{ fontSize: 48, marginBottom: 8, filter: 'drop-shadow(0 0 16px rgba(22,163,74,0.4))' }}>🇮🇳</div>
                      <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--orange-light)', fontWeight: 700, textTransform: 'uppercase' }}>{video.tag}</div>
                    </div>
                    {/* Decorative bloom */}
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 200, height: 120, background: 'radial-gradient(ellipse, rgba(22,163,74,0.12), transparent 70%)', filter: 'blur(20px)', pointerEvents: 'none' }} />
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="section-label mb-2">{video.channel}</div>
                    <h3 className="font-bold text-[15px] playfair mb-2 leading-snug" style={{ color: 'var(--text-primary)' }}>{video.title}</h3>
                    <p className="text-[12px] leading-relaxed flex-1 mb-4" style={{ color: 'var(--text-secondary)' }}>{video.desc}</p>
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary text-center text-[12px] font-bold"
                      style={{ display: 'block', padding: '10px 16px', textDecoration: 'none', borderRadius: 8 }}
                    >
                      ▶️ Watch on YouTube ➜
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Floating Chat Button */}
      {!chatOpen && (
        <button 
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 chat-fab text-white flex items-center justify-center z-50 hover:scale-110 transition-transform"
        >
          <MessageSquare size={24} />
        </button>
      )}

      {/* Chat Overlay */}
      {chatOpen && (
        <div className="chat-panel fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[450px] sm:h-[700px] max-h-[100vh] flex flex-col z-50 overflow-hidden animate-fade-up">
          {/* Header */}
          <div className="chat-header flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl bg-[rgba(22,163,74,0.1)] border border-[rgba(22,163,74,0.2)]">🗳️</div>
                  <div>
                    <h3 className="font-bold text-[var(--text-primary)] playfair text-lg">VoteMitra</h3>
                    <div className="text-xs text-[#4ade80] flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-[#4ade80] rounded-full animate-pulse shadow-[0_0_8px_#4ade80]"></div> Online
                    </div>
                  </div>
                </div>
                <button onClick={() => setChatOpen(false)} className="text-[var(--text-secondary)] hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>


              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-transparent">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-up`}>
                    {msg.role === "model" && (
                      <div className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] border border-[rgba(22,163,74,0.2)] flex items-center justify-center mr-2 shrink-0 text-sm">🗳️</div>
                    )}
                    <div 
                      className={`max-w-[80%] ${msg.role === "user" ? "msg-user" : "msg-bot"}`}
                      style={{ whiteSpace: "pre-wrap" }}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] border border-[rgba(22,163,74,0.2)] flex items-center justify-center mr-2 shrink-0 text-sm">🗳️</div>
                    <div className="msg-bot flex gap-1.5 items-center py-4 px-5">
                      <div className="w-1.5 h-1.5 bg-[var(--orange-light)] rounded-full typing-dot"></div>
                      <div className="w-1.5 h-1.5 bg-[var(--orange-light)] rounded-full typing-dot"></div>
                      <div className="w-1.5 h-1.5 bg-[var(--orange-light)] rounded-full typing-dot"></div>
                    </div>
                  </div>
                )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Chips */}
          <div className="border-t border-[rgba(22,163,74,0.1)] p-3 overflow-x-auto whitespace-nowrap shrink-0 flex gap-2 bg-[var(--bg-surface)]" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {SUGGESTION_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleChipClick(chip)}
                disabled={isLoading}
                className="chat-chip disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className="bg-[var(--bg-surface)] p-4 shrink-0 border-t border-[rgba(22,163,74,0.05)]">
            <div className="flex gap-2">
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Ask about elections..."
                disabled={isLoading}
                className="flex-1 chat-input"
              />
              <button 
                onClick={() => handleSendMessage()}
                disabled={isLoading || !inputText.trim()}
                className="chat-send text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                <Send size={18} className="ml-0.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Modal */}
      {modalOpen && selectedStep && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="vel-card max-w-lg w-full p-8 animate-fade-up relative">
            <button 
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 text-[var(--text-secondary)] hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            <div className="text-5xl mb-6 text-center drop-shadow-[0_0_15px_rgba(22,163,74,0.3)]">{selectedStep.icon}</div>
            <h3 className="text-3xl font-bold playfair text-center mb-3 text-[var(--text-primary)]">{selectedStep.title}</h3>
            <p className="text-[var(--text-secondary)] text-center mb-8 leading-relaxed text-[15px]">{selectedStep.desc}</p>
            
            <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(22,163,74,0.1)] rounded-xl p-6 mb-8">
              <h4 className="section-label mb-4">Key Facts</h4>
              <ul className="space-y-3">
                {selectedStep.facts.map((fact, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-[14px] text-[var(--text-primary)] leading-snug">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--orange-core)] mt-1.5 shrink-0 shadow-[0_0_8px_var(--orange-core)]"></div>
                    {fact}
                  </li>
                ))}
              </ul>
            </div>
            
            <button 
              onClick={() => askBotAbout(selectedStep.title)}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              Ask VoteMitra about this <Send size={16} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}



