"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const API = "https://hundredxmind.up.railway.app";

const AGENTS: Record<string, { icon: string; label: string; desc: string; color: string; bg: string; border: string; gradient: string; dot: string }> = {
  chat: { icon: "✦", label: "AI-OS", desc: "General Assistant", color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200", gradient: "from-violet-500 to-purple-600", dot: "bg-violet-400" },
  code: { icon: "⌥", label: "Code", desc: "Write & Execute Code", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", gradient: "from-blue-500 to-cyan-600", dot: "bg-blue-400" },
  research: { icon: "◎", label: "Research", desc: "Deep Analysis", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", gradient: "from-emerald-500 to-teal-600", dot: "bg-emerald-400" },
  debug: { icon: "⚡", label: "Debug", desc: "Fix Errors Fast", color: "text-red-600", bg: "bg-red-50", border: "border-red-200", gradient: "from-red-500 to-rose-600", dot: "bg-red-400" },
  file: { icon: "◈", label: "File", desc: "Analyze Documents", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", gradient: "from-amber-500 to-orange-600", dot: "bg-amber-400" },
  search: { icon: "⊕", label: "Search", desc: "Real-time Web", color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-200", gradient: "from-sky-500 to-blue-600", dot: "bg-sky-400" },
  image: { icon: "◉", label: "Image", desc: "AI Art Generation", color: "text-pink-600", bg: "bg-pink-50", border: "border-pink-200", gradient: "from-pink-500 to-rose-600", dot: "bg-pink-400" },
};

const SUGGESTIONS = [
  { icon: "💻", text: "Write a REST API with authentication in Python", agent: "code" },
  { icon: "🌐", text: "What are the latest breakthroughs in AI today?", agent: "search" },
  { icon: "🎨", text: "Generate a cyberpunk city at night with neon lights", agent: "image" },
  { icon: "🔍", text: "Explain the architecture of large language models", agent: "research" },
  { icon: "⚡", text: "Debug: Why does async/await cause deadlocks?", agent: "debug" },
  { icon: "📁", text: "Analyze and summarize my uploaded document", agent: "file" },
];

type Message = {
  id: string;
  role: string;
  content: string;
  agent?: string;
  tokens?: number;
  fileInfo?: any;
  image_base64?: string;
  image_type?: string;
  timestamp: Date;
  isError?: boolean;
};

type Session = {
  session_id: string;
  last_message: string;
  message_count: number;
  last_time: string;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentAgent, setCurrentAgent] = useState("chat");
  const [isListening, setIsListening] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [totalTokens, setTotalTokens] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [codeOutputs, setCodeOutputs] = useState<Record<string, string>>({});
  const [runningCode, setRunningCode] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const res = await fetch(`${API}/sessions`);
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch { }
  };

  const loadHistory = async (sid: string) => {
    try {
      const res = await fetch(`${API}/history/${sid}`);
      const data = await res.json();
      setMessages(data.history.map((m: any, i: number) => ({
        id: `history-${i}`,
        role: m.role === "assistant" ? "ai" : m.role,
        content: m.content,
        agent: m.agent,
        tokens: m.tokens,
        timestamp: new Date(m.timestamp),
      })));
      setSessionId(sid);
    } catch { }
  };

  const deleteSession = async (sid: string) => {
    try {
      await fetch(`${API}/session/${sid}`, { method: "DELETE" });
      loadSessions();
      if (sessionId === sid) { setMessages([]); setSessionId(null); }
    } catch { }
  };

  const copyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return alert("Voice not supported in this browser!");
    const r = new SR();
    r.lang = "en-US";
    r.continuous = false;
    r.interimResults = false;
    r.onstart = () => setIsListening(true);
    r.onend = () => setIsListening(false);
    r.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(prev => prev + transcript);
      inputRef.current?.focus();
    };
    r.start();
  };

  const runCode = async (codeStr: string, language: string, msgId: string) => {
    setRunningCode(msgId + language);
    try {
      const res = await fetch(`${API}/execute-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeStr, language })
      });
      const data = await res.json();
      setCodeOutputs(prev => ({
        ...prev,
        [msgId + language]: data.output || data.error || "No output"
      }));
    } catch {
      setCodeOutputs(prev => ({ ...prev, [msgId + language]: "❌ Execution failed" }));
    }
    setRunningCode(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const adjustTextarea = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  };

  const sendMessage = async (msg?: string) => {
    const text = msg || input;
    if ((!text.trim() && !selectedFile) || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: selectedFile ? `📎 **${selectedFile.name}**${text ? `\n\n${text}` : ""}` : text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    if (inputRef.current) { inputRef.current.style.height = "auto"; }

    if (selectedFile) {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("question", text);
      setSelectedFile(null);
      try {
        const res = await fetch(`${API}/analyze-file`, { method: "POST", body: formData });
        const data = await res.json();
        setCurrentAgent("file");
        const aiMsg: Message = {
          id: Date.now().toString() + "ai",
          role: "ai",
          content: data.response,
          agent: "file",
          tokens: data.tokens_used,
          fileInfo: data.file_info,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMsg]);
        setTotalTokens(t => t + (data.tokens_used || 0));
      } catch {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: "ai", content: "❌ File analysis failed. Please try again.", agent: "file", timestamp: new Date(), isError: true }]);
      }
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-20).map(m => ({ role: m.role === "ai" ? "assistant" : m.role, content: m.content })),
          session_id: sessionId
        }),
      });
      const data = await res.json();
      setCurrentAgent(data.agent_used || "chat");
      if (data.session_id) setSessionId(data.session_id);
      const aiMsg: Message = {
        id: Date.now().toString() + "ai",
        role: "ai",
        content: data.response,
        agent: data.agent_used,
        tokens: data.tokens_used,
        image_base64: data.image_base64,
        image_type: data.image_type,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setTotalTokens(t => t + (data.tokens_used || 0));
      loadSessions();
    } catch {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: "ai", content: "❌ Connection failed. Please check your connection and try again.", agent: "chat", timestamp: new Date(), isError: true }]);
    }
    setLoading(false);
  };

  const agent = AGENTS[currentAgent] || AGENTS.chat;
  const filteredSessions = sessions.filter(s => s.last_message?.toLowerCase().includes(searchQuery.toLowerCase()));

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) return "Today";
    if (diff < 172800000) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div
      className={`flex h-screen overflow-hidden font-sans ${theme === "dark" ? "bg-gray-950 text-gray-100" : "bg-white text-gray-900"}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false); }}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) setSelectedFile(file);
      }}
    >
      {/* Drag Overlay */}
      {dragOver && (
        <div className="absolute inset-0 bg-violet-500/10 backdrop-blur-sm z-50 flex items-center justify-center border-4 border-violet-400 border-dashed">
          <div className="text-center bg-white rounded-3xl p-12 shadow-2xl">
            <div className="text-7xl mb-4">📁</div>
            <div className="text-2xl font-bold text-gray-800 mb-2">Drop your file here</div>
            <div className="text-gray-500 text-sm">PDF, TXT, Python, JS, JSON, CSV supported</div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
           SIDEBAR
      ═══════════════════════════════════════════════════════════ */}
      <aside className={`${showSidebar ? "w-72" : "w-0"} transition-all duration-300 overflow-hidden flex-shrink-0 ${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-gray-50 border-gray-100"} border-r flex flex-col`}>
        <div className="flex flex-col h-full p-4 overflow-hidden">

          {/* Logo */}
          <div className="flex items-center gap-3 px-2 mb-6">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-black text-base shadow-lg shadow-violet-200">A</div>
            <div>
              <div className={`font-bold text-sm ${theme === "dark" ? "text-white" : "text-gray-900"}`}>AI-OS</div>
              <div className="text-xs text-gray-400">7 Specialized Agents</div>
            </div>
          </div>

          {/* New Chat Button */}
          <button
            onClick={() => { setMessages([]); setSessionId(null); setTotalTokens(0); }}
            className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-violet-500 to-pink-500 text-white hover:opacity-90 transition-all shadow-md shadow-violet-200 mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            New Chat
          </button>

          {/* Agents */}
          <div className="mb-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2 mb-3">Agents</p>
            <div className="space-y-0.5">
              {Object.entries(AGENTS).map(([key, val]) => (
                <div key={key} className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all cursor-default ${currentAgent === key ? `${val.bg} ${val.color} font-semibold` : `${theme === "dark" ? "text-gray-400 hover:bg-gray-800" : "text-gray-500 hover:bg-white"}`}`}>
                  <span className="text-base">{val.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{val.label}</div>
                    <div className="text-gray-400 text-xs truncate">{val.desc}</div>
                  </div>
                  {currentAgent === key && <div className={`w-2 h-2 rounded-full ${val.dot} animate-pulse`}></div>}
                </div>
              ))}
            </div>
          </div>

          {/* Search Sessions */}
          <div className="relative mb-3">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`w-full pl-8 pr-3 py-2 text-xs rounded-xl border outline-none transition-all ${theme === "dark" ? "bg-gray-800 border-gray-700 text-gray-300 placeholder-gray-500 focus:border-violet-500" : "bg-white border-gray-200 focus:border-violet-400"}`}
            />
          </div>

          {/* History */}
          <div className="flex-1 overflow-y-auto space-y-0.5 scrollbar-hide">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2 mb-2">History</p>
            {filteredSessions.length === 0 && (
              <div className="text-center py-6 text-gray-400 text-xs">No conversations yet</div>
            )}
            {filteredSessions.map((s, i) => (
              <div
                key={i}
                onClick={() => loadHistory(s.session_id)}
                className={`group flex items-start gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${sessionId === s.session_id ? `${theme === "dark" ? "bg-gray-800" : "bg-white"} shadow-sm` : `${theme === "dark" ? "hover:bg-gray-800" : "hover:bg-white"}`}`}
              >
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center text-white text-xs flex-shrink-0 mt-0.5">✦</div>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs truncate ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>{s.last_message}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-xs text-gray-400">{formatDate(s.last_time)}</span>
                    <span className="text-gray-300">•</span>
                    <span className="text-xs text-gray-400">{s.message_count} msgs</span>
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); deleteSession(s.session_id); }}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all text-xs flex-shrink-0 mt-1"
                >✕</button>
              </div>
            ))}
          </div>

        {/* Bottom */}
          <div className={`border-t ${theme === "dark" ? "border-gray-800" : "border-gray-200"} pt-3 mt-2 space-y-1`}>
            <div className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
              <span>Tokens used</span>
              <span className="font-semibold">{totalTokens.toLocaleString()}</span>
            </div>
            <a href="/analytics" className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all ${theme === "dark" ? "text-gray-400 hover:bg-gray-800 hover:text-violet-400" : "text-gray-500 hover:bg-white hover:text-violet-600"}`}>
              <span>{"📊"}</span> Analytics Dashboard
            </a>
            <button
              onClick={() => setTheme(t => t === "light" ? "dark" : "light")}
              className={`flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs transition-all ${theme === "dark" ? "text-gray-400 hover:bg-gray-800" : "text-gray-500 hover:bg-white"}`}
            >
              <span>{theme === "light" ? "🌙" : "☀️"}</span>
              {theme === "light" ? "Dark Mode" : "Light Mode"}
            </button>
          </div>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════════
           MAIN CONTENT
      ═══════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Header */}
        <header className={`flex items-center justify-between px-4 py-3 border-b flex-shrink-0 ${theme === "dark" ? "bg-gray-950 border-gray-800" : "bg-white border-gray-100"}`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${theme === "dark" ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            {!showSidebar && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">A</div>
                <span className={`font-semibold text-sm ${theme === "dark" ? "text-white" : "text-gray-800"}`}>AI-OS</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${agent.bg} ${agent.color} ${agent.border}`}>
              <span>{agent.icon}</span>
              <span>{agent.label}</span>
              <div className={`w-1.5 h-1.5 rounded-full ${agent.dot} animate-pulse`}></div>
            </div>
            {messages.length > 0 && (
              <div className={`text-xs px-3 py-1.5 rounded-full ${theme === "dark" ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-500"}`}>
                {messages.length} messages
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={() => { setMessages([]); setSessionId(null); }}
                className={`text-xs px-3 py-1.5 rounded-xl transition-all ${theme === "dark" ? "text-gray-400 hover:bg-gray-800" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"}`}
              >
                Clear
              </button>
            )}
            
        <a href="/analytics" className={`text-xs px-3 py-1.5 rounded-xl transition-all ${theme === "dark" ? "text-gray-400 hover:bg-gray-800" : "text-gray-400 hover:bg-gray-100"}`}>{"📊"}</a>
              📊
            </a>
          </div>
        </header>

        {/* Messages Area */}
        <div ref={messagesRef} className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            /* Welcome Screen */
            <div className="h-full flex flex-col items-center justify-center px-4 py-12">
              <div className="max-w-2xl w-full">
                {/* Hero */}
                <div className="text-center mb-10">
                  <div className="w-20 h-20 bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center text-white text-3xl font-black mx-auto mb-6 shadow-2xl shadow-violet-300 rotate-3 hover:rotate-0 transition-transform duration-300">A</div>
                  <h1 className={`text-3xl font-bold mb-3 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                    Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}! 👋
                  </h1>
                  <p className={`text-base ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                    I'm AI-OS with 7 specialized agents. What would you like to explore today?
                  </p>
                </div>

                {/* Agent Pills */}
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                  {Object.entries(AGENTS).map(([key, val]) => (
                    <div key={key} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${val.bg} ${val.color} border ${val.border}`}>
                      <span>{val.icon}</span>
                      <span>{val.label}</span>
                    </div>
                  ))}
                </div>

                {/* Suggestions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(s.text)}
                      className={`flex items-start gap-3 p-4 rounded-2xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98] group ${theme === "dark" ? "bg-gray-900 border-gray-800 hover:border-violet-500 hover:bg-gray-800" : "bg-white border-gray-200 hover:border-violet-300 hover:shadow-md hover:shadow-violet-100"}`}
                    >
                      <span className="text-2xl flex-shrink-0">{s.icon}</span>
                      <div>
                        <div className={`text-sm leading-relaxed ${theme === "dark" ? "text-gray-300 group-hover:text-white" : "text-gray-600 group-hover:text-gray-900"} transition-colors`}>{s.text}</div>
                        <div className="mt-1 flex items-center gap-1">
                          <span className={`text-xs ${AGENTS[s.agent].color}`}>{AGENTS[s.agent].icon} {AGENTS[s.agent].label}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Tips */}
                <div className={`mt-8 p-4 rounded-2xl border ${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-gray-50 border-gray-100"}`}>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center text-xs text-gray-400">
                    <span>📎 Drop files to analyze</span>
                    <span>🎤 Click mic for voice</span>
                    <span>▶ Run code inline</span>
                    <span>🌐 Live web search</span>
                    <span>🎨 AI image generation</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Chat Messages */
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              {messages.map((msg) => {
                const msgAgent = AGENTS[msg.agent || "chat"] || AGENTS.chat;
                const isUser = msg.role === "user";
                return (
                  <div key={msg.id} className={`flex gap-3 group ${isUser ? "justify-end" : "justify-start"}`}>
                    {!isUser && (
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5 bg-gradient-to-br ${msgAgent.gradient} text-white shadow-md`}>
                        {msgAgent.icon}
                      </div>
                    )}

                    <div className={`max-w-[85%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
                      {/* Meta */}
                      <div className={`flex items-center gap-2 px-1 ${isUser ? "flex-row-reverse" : ""}`}>
                        {!isUser && <span className={`text-xs font-semibold ${msgAgent.color}`}>{msgAgent.label}</span>}
                        <span className="text-xs text-gray-300">{formatTime(msg.timestamp)}</span>
                        {msg.tokens && !isUser && <span className="text-xs text-gray-300">{msg.tokens} tokens</span>}
                      </div>

                      {/* Bubble */}
                      <div className={`relative rounded-2xl px-4 py-3 text-sm leading-relaxed ${isUser
                        ? `${theme === "dark" ? "bg-violet-600 text-white" : "bg-gray-900 text-white"} rounded-tr-sm`
                        : `${theme === "dark" ? "bg-gray-900 border-gray-800 text-gray-200" : "bg-white border-gray-100 text-gray-800"} border rounded-tl-sm shadow-sm`
                        } ${msg.isError ? "border-red-200 bg-red-50 text-red-700" : ""}`}>

                        {/* File Info */}
                        {msg.fileInfo && (
                          <div className={`flex items-center gap-2 mb-3 pb-3 text-xs border-b ${theme === "dark" ? "border-gray-700 text-gray-400" : "border-gray-100 text-gray-400"}`}>
                            <span>📄</span>
                            <span className="font-medium">{msg.fileInfo.name}</span>
                            <span>•</span>
                            <span>{(msg.fileInfo.size / 1024).toFixed(1)} KB</span>
                            <span>•</span>
                            <span>{msg.fileInfo.type}</span>
                          </div>
                        )}

                        {/* Image */}
                        {msg.image_base64 && (
                          <div className="mb-3">
                            <img
                              src={`data:image/jpeg;base64,${msg.image_base64}`}
                              alt="AI Generated"
                              className="rounded-xl max-w-full w-full cursor-pointer hover:opacity-95 transition-opacity"
                              onClick={() => {
                                const link = document.createElement("a");
                                link.href = `data:image/jpeg;base64,${msg.image_base64}`;
                                link.download = "ai-generated.jpg";
                                link.click();
                              }}
                              title="Click to download"
                            />
                            <p className="text-xs text-gray-400 mt-1 text-center">Click image to download</p>
                          </div>
                        )}

                        {/* Content */}
                        {!isUser ? (
                          <ReactMarkdown
                            components={{
                              code({ className, children, ...props }: any) {
                                const match = /language-(\w+)/.exec(className || "");
                                const codeStr = String(children).replace(/\n$/, "");
                                const outputKey = msg.id + (match?.[1] || "");
                                if (match) {
                                  return (
                                    <div className={`my-3 rounded-xl overflow-hidden border ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
                                      <div className={`flex items-center justify-between px-4 py-2 ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"} border-b`}>
                                        <div className="flex items-center gap-2">
                                          <div className="flex gap-1"><div className="w-2.5 h-2.5 rounded-full bg-red-400"></div><div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div><div className="w-2.5 h-2.5 rounded-full bg-green-400"></div></div>
                                          <span className="text-xs font-mono text-gray-500">{match[1]}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={() => { navigator.clipboard.writeText(codeStr); }}
                                            className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-200 transition-all"
                                          >Copy</button>
                                          {(match[1] === "python" || match[1] === "javascript" || match[1] === "js") && (
                                            <button
                                              onClick={() => runCode(codeStr, match[1], msg.id)}
                                              disabled={runningCode === outputKey}
                                              className="text-xs bg-gray-900 text-white px-3 py-1 rounded-lg hover:bg-gray-700 transition-all disabled:opacity-50 flex items-center gap-1"
                                            >
                                              {runningCode === outputKey ? (
                                                <><div className="w-2.5 h-2.5 border border-white border-t-transparent rounded-full animate-spin"></div> Running...</>
                                              ) : "▶ Run"}
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                      <SyntaxHighlighter
                                        style={oneDark as any}
                                        language={match[1]}
                                        PreTag="div"
                                        customStyle={{ margin: 0, borderRadius: 0, fontSize: "12px" }}
                                      >{codeStr}</SyntaxHighlighter>
                                      {codeOutputs[outputKey] && (
                                        <div className={`px-4 py-3 border-t ${theme === "dark" ? "bg-gray-900 border-gray-700" : "bg-gray-900 border-gray-700"}`}>
                                          <div className="flex items-center gap-2 mb-2">
                                            <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                            <span className="text-xs text-green-400 font-medium">Output</span>
                                          </div>
                                          <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">{codeOutputs[outputKey]}</pre>
                                        </div>
                                      )}
                                    </div>
                                  );
                                }
                                return <code className={`px-1.5 py-0.5 rounded text-xs font-mono ${theme === "dark" ? "bg-gray-800 text-violet-300" : "bg-gray-100 text-gray-800"}`} {...props}>{children}</code>;
                              },
                              p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
                              ul: ({ children }) => <ul className="list-none mb-3 space-y-1.5">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal ml-4 mb-3 space-y-1.5">{children}</ol>,
                              li: ({ children }) => <li className="flex items-start gap-2 text-sm"><span className="text-violet-400 mt-1 flex-shrink-0">•</span><span>{children}</span></li>,
                              h1: ({ children }) => <h1 className={`text-xl font-bold mb-3 pb-2 border-b ${theme === "dark" ? "border-gray-700" : "border-gray-100"}`}>{children}</h1>,
                              h2: ({ children }) => <h2 className="text-base font-bold mb-2 mt-4">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-sm font-semibold mb-2 mt-3">{children}</h3>,
                              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                              em: ({ children }) => <em className="italic text-gray-500">{children}</em>,
                              blockquote: ({ children }) => <blockquote className={`border-l-4 border-violet-400 pl-4 my-3 italic ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>{children}</blockquote>,
                              a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-violet-500 hover:text-violet-700 underline underline-offset-2">{children}</a>,
                              table: ({ children }) => <div className="overflow-x-auto my-3 rounded-xl border border-gray-200"><table className="min-w-full text-xs">{children}</table></div>,
                              thead: ({ children }) => <thead className={`${theme === "dark" ? "bg-gray-800" : "bg-gray-50"}`}>{children}</thead>,
                              th: ({ children }) => <th className={`px-4 py-2.5 text-left font-semibold border-b ${theme === "dark" ? "border-gray-700 text-gray-300" : "border-gray-200 text-gray-700"}`}>{children}</th>,
                              td: ({ children }) => <td className={`px-4 py-2.5 border-b ${theme === "dark" ? "border-gray-800 text-gray-400" : "border-gray-100 text-gray-600"}`}>{children}</td>,
                              hr: () => <hr className={`my-4 ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`} />,
                            }}
                          >{msg.content}</ReactMarkdown>
                        ) : (
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        )}
                      </div>

                      {/* Actions */}
                      {!isUser && (
                        <div className={`flex items-center gap-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
                          <button
                            onClick={() => copyMessage(msg.id, msg.content)}
                            className={`text-xs px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${theme === "dark" ? "text-gray-500 hover:text-gray-300 hover:bg-gray-800" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}
                          >
                            {copiedId === msg.id ? "✓ Copied" : "Copy"}
                          </button>
                        </div>
                      )}
                    </div>

                    {isUser && (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5 shadow-md">K</div>
                    )}
                  </div>
                );
              })}

              {/* Loading */}
              {loading && (
                <div className="flex gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 bg-gradient-to-br ${agent.gradient} text-white shadow-md`}>
                    {agent.icon}
                  </div>
                  <div className={`rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border ${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"}`}>
                    <div className="flex gap-1 items-center">
                      <div className={`w-2 h-2 rounded-full ${agent.dot} animate-bounce`}></div>
                      <div className={`w-2 h-2 rounded-full ${agent.dot} animate-bounce`} style={{ animationDelay: "0.15s" }}></div>
                      <div className={`w-2 h-2 rounded-full ${agent.dot} animate-bounce`} style={{ animationDelay: "0.3s" }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} className="h-4" />
            </div>
          )}
        </div>

        {/* File Preview Bar */}
        {selectedFile && (
          <div className={`mx-4 mb-2 px-4 py-2.5 rounded-xl border flex items-center justify-between ${theme === "dark" ? "bg-amber-900/30 border-amber-700/50" : "bg-amber-50 border-amber-200"}`}>
            <div className="flex items-center gap-2">
              <span className="text-lg">📎</span>
              <div>
                <div className="text-sm font-medium text-amber-700">{selectedFile.name}</div>
                <div className="text-xs text-amber-500">{(selectedFile.size / 1024).toFixed(1)} KB • Ready to analyze</div>
              </div>
            </div>
            <button onClick={() => setSelectedFile(null)} className="text-amber-400 hover:text-amber-600 text-sm font-bold w-6 h-6 flex items-center justify-center rounded-lg hover:bg-amber-100 transition-all">✕</button>
          </div>
        )}

        {/* Input Area */}
        <div className={`px-4 pb-4 pt-2 flex-shrink-0 ${theme === "dark" ? "bg-gray-950" : "bg-white"}`}>
          <div className="max-w-3xl mx-auto">
            <div className={`flex items-end gap-2 rounded-2xl border px-3 py-3 transition-all shadow-sm ${dragOver ? "border-violet-400 shadow-violet-100" : theme === "dark" ? "bg-gray-900 border-gray-700 focus-within:border-violet-500" : "bg-gray-50 border-gray-200 hover:border-gray-300 focus-within:border-violet-400 focus-within:bg-white focus-within:shadow-md"}`}>

              {/* File Upload */}
              <button
                onClick={() => {
                  const inp = document.createElement("input");
                  inp.type = "file";
                  inp.accept = ".pdf,.txt,.py,.js,.ts,.json,.csv,.md,.html,.css";
                  inp.onchange = (e: any) => { if (e.target.files[0]) setSelectedFile(e.target.files[0]); };
                  inp.click();
                }}
                className={`flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl transition-all ${selectedFile ? "bg-amber-100 text-amber-600" : theme === "dark" ? "text-gray-500 hover:text-gray-300 hover:bg-gray-800" : "text-gray-400 hover:text-gray-600 hover:bg-gray-200"}`}
                title="Upload file"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
              </button>

              {/* Textarea */}
              <textarea
                ref={inputRef}
                className={`flex-1 resize-none outline-none text-sm leading-relaxed bg-transparent placeholder-gray-400 ${theme === "dark" ? "text-gray-200" : "text-gray-800"}`}
                placeholder={selectedFile ? `Ask about ${selectedFile.name}... (optional)` : "Message AI-OS... (Shift+Enter for new line)"}
                value={input}
                rows={1}
                onChange={(e) => { setInput(e.target.value); adjustTextarea(e.target); }}
                onKeyDown={handleKeyDown}
              />

              {/* Voice */}
              <button
                onClick={startVoice}
                className={`flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl transition-all ${isListening ? "bg-red-100 text-red-500 animate-pulse shadow-md shadow-red-200" : theme === "dark" ? "text-gray-500 hover:text-gray-300 hover:bg-gray-800" : "text-gray-400 hover:text-gray-600 hover:bg-gray-200"}`}
                title={isListening ? "Listening..." : "Voice input"}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              </button>

              {/* Send */}
              <button
                onClick={() => sendMessage()}
                disabled={loading || (!input.trim() && !selectedFile)}
                className={`flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl transition-all ${loading || (!input.trim() && !selectedFile)
                  ? `${theme === "dark" ? "bg-gray-800 text-gray-600" : "bg-gray-200 text-gray-400"}`
                  : "bg-gradient-to-br from-violet-500 to-pink-500 text-white hover:opacity-90 shadow-md shadow-violet-200"
                  }`}
                title="Send message"
              >
                {loading ? (
                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" /></svg>
                )}
              </button>
            </div>

            {/* Footer Note */}
            <div className="flex items-center justify-center gap-4 mt-2">
              <p className="text-center text-xs text-gray-300">
                AI-OS may make mistakes — verify important information
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}