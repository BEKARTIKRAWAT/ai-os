"use client";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const API = "https://hundredxmind.onrender.com";

const THEMES = [
  { id: "light", name: "Light", icon: "☀️", desc: "Clean & Minimal" },
  { id: "dark", name: "Dark", icon: "🌙", desc: "Easy on Eyes" },
  { id: "ocean", name: "Ocean", icon: "🌊", desc: "Deep Blue" },
  { id: "forest", name: "Forest", icon: "🌿", desc: "Nature Green" },
  { id: "sunset", name: "Sunset", icon: "🌅", desc: "Purple Dusk" },
];

const AGENTS: Record<string, { icon: string; label: string; desc: string }> = {
  chat: { icon: "✦", label: "AI-OS", desc: "General Assistant" },
  code: { icon: "⌥", label: "Code", desc: "Write & Execute Code" },
  research: { icon: "◎", label: "Research", desc: "Deep Analysis" },
  debug: { icon: "⚡", label: "Debug", desc: "Fix Errors Fast" },
  file: { icon: "◈", label: "File", desc: "Analyze Documents" },
  search: { icon: "⊕", label: "Search", desc: "Real-time Web" },
  image: { icon: "◉", label: "Image", desc: "AI Art Generation" },
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
  const [theme, setTheme] = useState("light");
  const [showThemePicker, setShowThemePicker] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("ai-os-theme", theme);
  }, [theme]);

  useEffect(() => {
    const saved = localStorage.getItem("ai-os-theme");
    if (saved) setTheme(saved);
    loadSessions();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

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
        id: `h-${i}`,
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

  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return alert("Voice not supported!");
    const r = new SR();
    r.lang = "en-US";
    r.onstart = () => setIsListening(true);
    r.onend = () => setIsListening(false);
    r.onresult = (e: any) => { setInput(p => p + e.results[0][0].transcript); inputRef.current?.focus(); };
    r.start();
  };

  const runCode = async (code: string, lang: string, msgId: string) => {
    const key = msgId + lang;
    setRunningCode(key);
    try {
      const res = await fetch(`${API}/execute-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language: lang })
      });
      const data = await res.json();
      setCodeOutputs(p => ({ ...p, [key]: data.output || data.error || "No output" }));
    } catch {
      setCodeOutputs(p => ({ ...p, [key]: "❌ Execution failed" }));
    }
    setRunningCode(null);
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
    setMessages(p => [...p, userMsg]);
    setInput("");
    setLoading(true);
    if (inputRef.current) inputRef.current.style.height = "auto";

    if (selectedFile) {
      const fd = new FormData();
      fd.append("file", selectedFile);
      fd.append("question", text);
      setSelectedFile(null);
      try {
        const res = await fetch(`${API}/analyze-file`, { method: "POST", body: fd });
        const data = await res.json();
        setCurrentAgent("file");
        setMessages(p => [...p, { id: Date.now() + "ai", role: "ai", content: data.response, agent: "file", tokens: data.tokens_used, fileInfo: data.file_info, timestamp: new Date() }]);
        setTotalTokens(t => t + (data.tokens_used || 0));
      } catch {
        setMessages(p => [...p, { id: Date.now() + "e", role: "ai", content: "❌ File analysis failed.", agent: "file", timestamp: new Date(), isError: true }]);
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
      setMessages(p => [...p, { id: Date.now() + "ai", role: "ai", content: data.response, agent: data.agent_used, tokens: data.tokens_used, image_base64: data.image_base64, timestamp: new Date() }]);
      setTotalTokens(t => t + (data.tokens_used || 0));
      loadSessions();
    } catch {
      setMessages(p => [...p, { id: Date.now() + "e", role: "ai", content: "❌ Connection failed. Please try again.", agent: "chat", timestamp: new Date(), isError: true }]);
    }
    setLoading(false);
  };

  const formatTime = (d: Date) => d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const formatDate = (s: string) => {
    const d = new Date(s), diff = Date.now() - d.getTime();
    if (diff < 86400000) return "Today";
    if (diff < 172800000) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const currentTheme = THEMES.find(t => t.id === theme) || THEMES[0];
  const agent = AGENTS[currentAgent] || AGENTS.chat;
  const filtered = sessions.filter(s => s.last_message?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false); }}
      onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setSelectedFile(f); }}
    >
      {/* Drag Overlay */}
      {dragOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center border-4 border-dashed" style={{ background: "rgba(124,58,237,0.1)", borderColor: "var(--accent)" }}>
          <div className="text-center rounded-3xl p-12 shadow-2xl" style={{ background: "var(--bg-primary)" }}>
            <div className="text-7xl mb-4">📁</div>
            <div className="text-2xl font-bold mb-2">Drop your file here</div>
            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>PDF, TXT, Python, JS, JSON, CSV</div>
          </div>
        </div>
      )}

      {/* Theme Picker Modal */}
      {showThemePicker && (
        <div className="absolute inset-0 z-40 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setShowThemePicker(false)}>
          <div className="rounded-3xl p-6 shadow-2xl w-80" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }} onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">Choose Theme</h3>
            <div className="space-y-2">
              {THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setTheme(t.id); setShowThemePicker(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                  style={{
                    background: theme === t.id ? "var(--accent)" : "var(--bg-tertiary)",
                    color: theme === t.id ? "white" : "var(--text-primary)",
                    border: `1px solid ${theme === t.id ? "var(--accent)" : "var(--border)"}`
                  }}
                >
                  <span className="text-2xl">{t.icon}</span>
                  <div className="text-left">
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs opacity-70">{t.desc}</div>
                  </div>
                  {theme === t.id && <span className="ml-auto">✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside
        className={`${showSidebar ? "w-72" : "w-0"} transition-all duration-300 overflow-hidden flex-shrink-0 flex flex-col border-r`}
        style={{ background: "var(--sidebar)", borderColor: "var(--border)" }}
      >
        <div className="flex flex-col h-full p-4 overflow-hidden">
          {/* Logo */}
          <div className="flex items-center gap-3 px-2 mb-6">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-base shadow-lg" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>A</div>
            <div>
              <div className="font-bold text-sm">AI-OS</div>
              <div className="text-xs" style={{ color: "var(--text-secondary)" }}>7 Specialized Agents</div>
            </div>
          </div>

          {/* New Chat */}
          <button
            onClick={() => { setMessages([]); setSessionId(null); setTotalTokens(0); }}
            className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-white mb-4 transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))", boxShadow: "0 4px 15px rgba(124,58,237,0.3)" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            New Chat
          </button>

          {/* Agents */}
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-widest px-2 mb-3" style={{ color: "var(--text-secondary)" }}>Agents</p>
            <div className="space-y-0.5">
              {Object.entries(AGENTS).map(([key, val]) => (
                <div
                  key={key}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all cursor-default"
                  style={{
                    background: currentAgent === key ? "var(--accent)" + "20" : "transparent",
                    color: currentAgent === key ? "var(--accent)" : "var(--text-secondary)",
                  }}
                >
                  <span className="text-base">{val.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{val.label}</div>
                    <div className="text-xs truncate opacity-60">{val.desc}</div>
                  </div>
                  {currentAgent === key && <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--accent)" }}></div>}
                </div>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "var(--text-secondary)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl outline-none"
              style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            />
          </div>

          {/* History */}
          <div className="flex-1 overflow-y-auto scrollbar-hide space-y-0.5">
            <p className="text-xs font-bold uppercase tracking-widest px-2 mb-2" style={{ color: "var(--text-secondary)" }}>History</p>
            {filtered.length === 0 && <div className="text-center py-6 text-xs" style={{ color: "var(--text-secondary)" }}>No conversations yet</div>}
            {filtered.map((s, i) => (
              <div
                key={i}
                onClick={() => loadHistory(s.session_id)}
                className="group flex items-start gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all"
                style={{ background: sessionId === s.session_id ? "var(--bg-tertiary)" : "transparent" }}
              >
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs flex-shrink-0 mt-0.5" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>✦</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs truncate" style={{ color: "var(--text-primary)" }}>{s.last_message}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{formatDate(s.last_time)}</span>
                    <span style={{ color: "var(--border)" }}>•</span>
                    <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{s.message_count} msgs</span>
                  </div>
                </div>
                <button onClick={e => { e.stopPropagation(); deleteSession(s.session_id); }} className="opacity-0 group-hover:opacity-100 text-xs transition-all" style={{ color: "var(--text-secondary)" }}>✕</button>
              </div>
            ))}
          </div>

          {/* Bottom */}
          <div className="pt-3 mt-2 space-y-1" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs" style={{ color: "var(--text-secondary)" }}>
              <span>Tokens used</span>
              <span className="font-semibold">{totalTokens.toLocaleString()}</span>
            </div>
            <button
              onClick={() => setShowThemePicker(true)}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs transition-all hover:opacity-80"
              style={{ color: "var(--text-secondary)", background: "var(--bg-tertiary)" }}
            >
              <span>{currentTheme.icon}</span>
              <span>{currentTheme.name} Theme</span>
              <span className="ml-auto">↗</span>
            </button>
            <a href="/analytics" className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all" style={{ color: "var(--text-secondary)" }}>
              {"📊"} Analytics
            </a>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ background: "var(--header)", borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowSidebar(!showSidebar)} className="w-9 h-9 flex items-center justify-center rounded-xl transition-all hover:opacity-70" style={{ color: "var(--text-secondary)" }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            {!showSidebar && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>A</div>
                <span className="font-semibold text-sm">AI-OS</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border)" }}>
            <span>{agent.icon}</span>
            <span style={{ color: "var(--accent)" }}>{agent.label}</span>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--accent)" }}></div>
          </div>

          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button onClick={() => { setMessages([]); setSessionId(null); }} className="text-xs px-3 py-1.5 rounded-xl transition-all" style={{ color: "var(--text-secondary)", background: "var(--bg-tertiary)" }}>
                Clear
              </button>
            )}
            <button onClick={() => setShowThemePicker(true)} className="text-xs px-3 py-1.5 rounded-xl transition-all" style={{ color: "var(--text-secondary)", background: "var(--bg-tertiary)" }}>
              {currentTheme.icon} Theme
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-4 py-12">
              <div className="max-w-2xl w-full">
                <div className="text-center mb-10">
                  <div
                    className="w-20 h-20 rounded-3xl flex items-center justify-center text-white text-3xl font-black mx-auto mb-6 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-300 cursor-pointer"
                    style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))", boxShadow: "0 20px 40px rgba(124,58,237,0.3)" }}
                  >A</div>
                  <h1 className="text-3xl font-bold mb-3">
                    Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}! 👋
                  </h1>
                  <p className="text-base" style={{ color: "var(--text-secondary)" }}>
                    I'm AI-OS with 7 specialized agents. What would you like to explore today?
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-2 mb-8">
                  {Object.entries(AGENTS).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--accent)" }}>
                      <span>{val.icon}</span><span>{val.label}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(s.text)}
                      className="flex items-start gap-3 p-4 rounded-2xl text-left transition-all hover:scale-[1.02] active:scale-[0.98] group"
                      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
                    >
                      <span className="text-2xl flex-shrink-0">{s.icon}</span>
                      <div>
                        <div className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{s.text}</div>
                        <div className="mt-1 text-xs" style={{ color: "var(--accent)" }}>{AGENTS[s.agent].icon} {AGENTS[s.agent].label}</div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-8 p-4 rounded-2xl" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center text-xs" style={{ color: "var(--text-secondary)" }}>
                    <span>📎 Drop files to analyze</span>
                    <span>🎤 Voice input</span>
                    <span>▶ Run code inline</span>
                    <span>🌐 Live web search</span>
                    <span>🎨 AI image generation</span>
                    <span>{currentTheme.icon} {currentTheme.name} theme active</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              {messages.map((msg) => {
                const ma = AGENTS[msg.agent || "chat"] || AGENTS.chat;
                const isUser = msg.role === "user";
                return (
                  <div key={msg.id} className={`flex gap-3 group ${isUser ? "justify-end" : "justify-start"}`}>
                    {!isUser && (
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5 text-white shadow-md" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>
                        {ma.icon}
                      </div>
                    )}
                    <div className={`max-w-[85%] flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
                      <div className={`flex items-center gap-2 px-1 ${isUser ? "flex-row-reverse" : ""}`}>
                        {!isUser && <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>{ma.label}</span>}
                        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{formatTime(msg.timestamp)}</span>
                        {msg.tokens && !isUser && <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{msg.tokens} tokens</span>}
                      </div>
                      <div
                        className={`relative rounded-2xl px-4 py-3 text-sm leading-relaxed ${isUser ? "rounded-tr-sm" : "rounded-tl-sm shadow-sm"}`}
                        style={{
                          background: isUser ? "var(--bubble-user)" : "var(--bubble-ai)",
                          color: isUser ? "white" : "var(--text-primary)",
                          border: isUser ? "none" : "1px solid var(--border)",
                        }}
                      >
                        {msg.fileInfo && (
                          <div className="flex items-center gap-2 mb-3 pb-3 text-xs" style={{ borderBottom: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                            <span>📄</span><span className="font-medium">{msg.fileInfo.name}</span><span>•</span><span>{(msg.fileInfo.size / 1024).toFixed(1)} KB</span>
                          </div>
                        )}
                        {msg.image_base64 && (
                          <div className="mb-3">
                            <img src={`data:image/jpeg;base64,${msg.image_base64}`} alt="AI Generated" className="rounded-xl max-w-full w-full cursor-pointer hover:opacity-95 transition-opacity" onClick={() => { const l = document.createElement("a"); l.href = `data:image/jpeg;base64,${msg.image_base64}`; l.download = "ai-generated.jpg"; l.click(); }} title="Click to download" />
                            <p className="text-xs mt-1 text-center" style={{ color: "var(--text-secondary)" }}>Click to download</p>
                          </div>
                        )}
                        {!isUser ? (
                          <ReactMarkdown components={{
                            code({ className, children, ...props }: any) {
                              const match = /language-(\w+)/.exec(className || "");
                              const cs = String(children).replace(/\n$/, "");
                              const ok = msg.id + (match?.[1] || "");
                              if (match) return (
                                <div className="my-3 rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                                  <div className="flex items-center justify-between px-4 py-2" style={{ background: "var(--bg-tertiary)", borderBottom: "1px solid var(--border)" }}>
                                    <div className="flex items-center gap-2">
                                      <div className="flex gap-1"><div className="w-2.5 h-2.5 rounded-full bg-red-400"></div><div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div><div className="w-2.5 h-2.5 rounded-full bg-green-400"></div></div>
                                      <span className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>{match[1]}</span>
                                    </div>
                                    <div className="flex gap-2">
                                      <button onClick={() => navigator.clipboard.writeText(cs)} className="text-xs px-2 py-1 rounded-lg" style={{ color: "var(--text-secondary)", background: "var(--bg-primary)" }}>Copy</button>
                                      {(match[1] === "python" || match[1] === "javascript" || match[1] === "js") && (
                                        <button onClick={() => runCode(cs, match[1], msg.id)} disabled={runningCode === ok} className="text-xs px-3 py-1 rounded-lg text-white transition-all disabled:opacity-50" style={{ background: "var(--accent)" }}>
                                          {runningCode === ok ? "Running..." : "▶ Run"}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  <SyntaxHighlighter style={oneDark as any} language={match[1]} PreTag="div" customStyle={{ margin: 0, borderRadius: 0, fontSize: "12px" }}>{cs}</SyntaxHighlighter>
                                  {codeOutputs[ok] && (
                                    <div className="px-4 py-3" style={{ background: "#0d0d0d", borderTop: "1px solid var(--border)" }}>
                                      <div className="flex items-center gap-2 mb-2"><div className="w-2 h-2 rounded-full bg-green-400"></div><span className="text-xs text-green-400 font-medium">Output</span></div>
                                      <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">{codeOutputs[ok]}</pre>
                                    </div>
                                  )}
                                </div>
                              );
                              return <code className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: "var(--bg-tertiary)", color: "var(--accent)" }} {...props}>{children}</code>;
                            },
                            p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
                            ul: ({ children }) => <ul className="list-none mb-3 space-y-1.5">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal ml-4 mb-3 space-y-1.5">{children}</ol>,
                            li: ({ children }) => <li className="flex items-start gap-2 text-sm"><span className="mt-1 flex-shrink-0" style={{ color: "var(--accent)" }}>•</span><span>{children}</span></li>,
                            h1: ({ children }) => <h1 className="text-xl font-bold mb-3 pb-2" style={{ borderBottom: "1px solid var(--border)" }}>{children}</h1>,
                            h2: ({ children }) => <h2 className="text-base font-bold mb-2 mt-4">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-sm font-semibold mb-2 mt-3">{children}</h3>,
                            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                            blockquote: ({ children }) => <blockquote className="border-l-4 pl-4 my-3 italic" style={{ borderColor: "var(--accent)", color: "var(--text-secondary)" }}>{children}</blockquote>,
                            a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }} className="underline underline-offset-2">{children}</a>,
                            table: ({ children }) => <div className="overflow-x-auto my-3 rounded-xl" style={{ border: "1px solid var(--border)" }}><table className="min-w-full text-xs">{children}</table></div>,
                            th: ({ children }) => <th className="px-4 py-2.5 text-left font-semibold" style={{ background: "var(--bg-tertiary)", borderBottom: "1px solid var(--border)" }}>{children}</th>,
                            td: ({ children }) => <td className="px-4 py-2.5" style={{ borderBottom: "1px solid var(--border)" }}>{children}</td>,
                            hr: () => <hr className="my-4" style={{ borderColor: "var(--border)" }} />,
                          }}>{msg.content}</ReactMarkdown>
                        ) : (
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        )}
                      </div>
                      {!isUser && (
                        <div className="flex items-center gap-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { navigator.clipboard.writeText(msg.content); setCopiedId(msg.id); setTimeout(() => setCopiedId(null), 2000); }} className="text-xs px-2 py-1 rounded-lg transition-all" style={{ color: "var(--text-secondary)", background: "var(--bg-tertiary)" }}>
                            {copiedId === msg.id ? "✓ Copied" : "Copy"}
                          </button>
                        </div>
                      )}
                    </div>
                    {isUser && <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5 shadow-md" style={{ background: "linear-gradient(135deg, #374151, #111827)" }}>K</div>}
                  </div>
                );
              })}
              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 text-white shadow-md" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>{agent.icon}</div>
                  <div className="rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm" style={{ background: "var(--bubble-ai)", border: "1px solid var(--border)" }}>
                    <div className="flex gap-1 items-center">
                      {[0, 0.15, 0.3].map((d, i) => <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background: "var(--accent)", animationDelay: `${d}s` }}></div>)}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} className="h-4" />
            </div>
          )}
        </div>

        {/* File Preview */}
        {selectedFile && (
          <div className="mx-4 mb-2 px-4 py-2.5 rounded-xl flex items-center justify-between" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2">
              <span className="text-lg">📎</span>
              <div>
                <div className="text-sm font-medium">{selectedFile.name}</div>
                <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{(selectedFile.size / 1024).toFixed(1)} KB • Ready to analyze</div>
              </div>
            </div>
            <button onClick={() => setSelectedFile(null)} className="text-sm font-bold w-6 h-6 flex items-center justify-center rounded-lg transition-all" style={{ color: "var(--text-secondary)" }}>✕</button>
          </div>
        )}

        {/* Input */}
        <div className="px-4 pb-4 pt-2 flex-shrink-0" style={{ background: "var(--header)" }}>
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-2 rounded-2xl px-3 py-3 transition-all shadow-sm" style={{ background: "var(--input-bg)", border: "1px solid var(--border)" }}>
              <button
                onClick={() => { const i = document.createElement("input"); i.type = "file"; i.accept = ".pdf,.txt,.py,.js,.ts,.json,.csv,.md,.html,.css"; i.onchange = (e: any) => { if (e.target.files[0]) setSelectedFile(e.target.files[0]); }; i.click(); }}
                className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl transition-all"
                style={{ color: selectedFile ? "var(--accent)" : "var(--text-secondary)", background: selectedFile ? "var(--bg-tertiary)" : "transparent" }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
              </button>
              <textarea
                ref={inputRef}
                className="flex-1 resize-none outline-none text-sm leading-relaxed bg-transparent"
                placeholder={selectedFile ? `Ask about ${selectedFile.name}...` : "Message AI-OS... (Shift+Enter for new line)"}
                value={input}
                rows={1}
                style={{ color: "var(--text-primary)" }}
                onChange={e => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px"; }}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              />
              <button onClick={startVoice} className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl transition-all" style={{ color: isListening ? "red" : "var(--text-secondary)", background: isListening ? "rgba(255,0,0,0.1)" : "transparent" }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              </button>
              <button
                onClick={() => sendMessage()}
                disabled={loading || (!input.trim() && !selectedFile)}
                className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl transition-all text-white"
                style={{ background: (loading || (!input.trim() && !selectedFile)) ? "var(--bg-tertiary)" : "linear-gradient(135deg, var(--accent), var(--accent-2))", opacity: (loading || (!input.trim() && !selectedFile)) ? 0.5 : 1 }}
              >
                {loading ? <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" /></svg>}
              </button>
            </div>
            <p className="text-center text-xs mt-2" style={{ color: "var(--text-secondary)" }}>AI-OS may make mistakes — verify important information</p>
          </div>
        </div>
      </div>
    </div>
  );
}