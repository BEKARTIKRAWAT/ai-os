"use client";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import Sidebar from "./components/Sidebar";
import { API, AGENTS, SUGGESTIONS, THEMES, THEME_STYLES, Message, Session } from "./constants";

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
  const [showSidebar, setShowSidebar] = useState(false);
  const [totalTokens, setTotalTokens] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [codeOutputs, setCodeOutputs] = useState<Record<string, string>>({});
  const [runningCode, setRunningCode] = useState<string | null>(null);
  const [theme, setTheme] = useState("dark");
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const styles = THEME_STYLES[theme as keyof typeof THEME_STYLES];
    if (styles) {
      Object.entries(styles).forEach(([key, value]) => {
        document.documentElement.style.setProperty(key, value as string);
      });
    }
    localStorage.setItem("ai-os-theme", theme);
  }, [theme]);

  useEffect(() => {
    const saved = localStorage.getItem("ai-os-theme");
    if (saved && THEMES.some(t => t.id === saved)) setTheme(saved);
    loadSessions();

    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const loadSessions = async () => {
    try {
      const res = await fetch(`${API}/sessions`);
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error("Failed to load sessions:", error);
    }
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
      if (isMobile) setShowSidebar(false);
    } catch (error) {
      console.error("Failed to load history:", error);
    }
  };

  const deleteSession = async (sid: string) => {
    try {
      await fetch(`${API}/session/${sid}`, { method: "DELETE" });
      loadSessions();
      if (sessionId === sid) {
        setMessages([]);
        setSessionId(null);
        setTotalTokens(0);
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
  };

  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("Voice input not supported in this browser");
      return;
    }
    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(prev => prev + (prev ? " " : "") + transcript);
      inputRef.current?.focus();
    };
    recognition.start();
  };

  const sendMessage = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    if (selectedFile) {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("question", messageText);

      try {
        const res = await fetch(`${API}/analyze-file`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "ai",
          content: data.response,
          agent: "file",
          tokens: data.tokens_used,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);
        setSelectedFile(null);
        setLoading(false);
        return;
      } catch (error) {
        console.error("File upload failed:", error);
      }
    }

    try {
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          history: messages.map(m => ({ role: m.role === "ai" ? "assistant" : "user", content: m.content })),
          session_id: sessionId,
        }),
      });

      const data = await res.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: data.response,
        agent: data.agent_used,
        tokens: data.tokens_used,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      setSessionId(data.session_id);
      setTotalTokens(prev => prev + (data.tokens_used || 0));
      loadSessions();

      if (data.agent_used) setCurrentAgent(data.agent_used);

    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: "Sorry, I'm having trouble connecting. Please make sure the backend server is running.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const runCode = async (code: string, language: string, msgId: string) => {
    const key = `${msgId}-${language}`;
    setRunningCode(key);
    try {
      const res = await fetch(`${API}/execute-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });
      const data = await res.json();
      setCodeOutputs(prev => ({
        ...prev,
        [key]: data.output || data.error || "No output"
      }));
    } catch (error) {
      setCodeOutputs(prev => ({
        ...prev,
        [key]: `Error: ${error}`
      }));
    } finally {
      setRunningCode(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file);
  };

  const currentTheme = THEMES.find(t => t.id === theme) || THEMES[0];
  const agent = AGENTS[currentAgent as keyof typeof AGENTS] || AGENTS.chat;

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {dragOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="text-center p-8 rounded-2xl border-2 border-dashed" style={{ borderColor: "var(--accent)" }}>
            <div className="text-5xl mb-2">📁</div>
            <div className="text-xl font-bold mb-1">Drop file here</div>
            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>PDF, TXT, Python, JS, JSON, CSV</div>
          </div>
        </div>
      )}

      {selectedFile && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-40 px-4 py-2 rounded-full shadow-lg flex items-center gap-2" style={{ background: "var(--accent)", color: "white" }}>
          <span>📄</span>
          <span className="text-sm">{selectedFile.name}</span>
          <button onClick={() => setSelectedFile(null)} className="ml-2 text-white">✕</button>
        </div>
      )}

      {showThemePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setShowThemePicker(false)}>
          <div className="rounded-3xl p-6 shadow-2xl w-full max-w-sm" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg">Choose Theme</h3>
              <button onClick={() => setShowThemePicker(false)} className="w-8 h-8 flex items-center justify-center rounded-xl" style={{ background: "var(--bg-tertiary)" }}>✕</button>
            </div>
            <div className="space-y-2">
              {THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setTheme(t.id); setShowThemePicker(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                  style={{
                    background: theme === t.id ? "var(--accent)" : "var(--bg-tertiary)",
                    color: theme === t.id ? "white" : "var(--text-primary)"
                  }}
                >
                  <span className="text-2xl">{t.icon}</span>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs opacity-70">{t.desc}</div>
                  </div>
                  {theme === t.id && <span>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <Sidebar
        showSidebar={showSidebar}
        isMobile={isMobile}
        currentAgent={currentAgent}
        sessions={sessions}
        sessionId={sessionId}
        searchQuery={searchQuery}
        totalTokens={totalTokens}
        theme={theme}
        onClose={() => setShowSidebar(false)}
        onNewChat={() => {
          setMessages([]);
          setSessionId(null);
          setTotalTokens(0);
          setSelectedFile(null);
          if (isMobile) setShowSidebar(false);
        }}
        onLoadHistory={loadHistory}
        onDeleteSession={deleteSession}
        onSearchChange={setSearchQuery}
        onThemeClick={() => setShowThemePicker(true)}
        formatDate={formatDate}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ background: "var(--header)", borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-all"
              style={{ background: "var(--bg-tertiary)" }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>
                A
              </div>
              <span className="font-semibold">AI-OS</span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border)" }}>
            <span>{agent.icon}</span>
            <span style={{ color: "var(--accent)" }}>{agent.label}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowThemePicker(true)}
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-all"
              style={{ background: "var(--bg-tertiary)" }}
            >
              {currentTheme.icon}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
              <div className="max-w-2xl w-full text-center">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6 shadow-xl" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>
                  AI
                </div>
                <h1 className="text-3xl font-bold mb-3">Welcome to AI-OS</h1>
                <p className="mb-8" style={{ color: "var(--text-secondary)" }}>7 specialized agents at your command</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                  {Object.entries(AGENTS).map(([key, val]) => (
                    <div key={key} className="text-center p-3 rounded-xl" style={{ background: "var(--bg-secondary)" }}>
                      <div className="text-2xl mb-1">{val.icon}</div>
                      <div className="text-sm font-medium">{val.label}</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(s.text)}
                      className="flex items-start gap-3 p-4 rounded-xl text-left transition-all hover:scale-[1.02]"
                      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
                    >
                      <span className="text-2xl">{s.icon}</span>
                      <div>
                        <div className="text-sm">{s.text}</div>
                        <div className="text-xs mt-1" style={{ color: "var(--accent)" }}>{AGENTS[s.agent as keyof typeof AGENTS]?.icon} {AGENTS[s.agent as keyof typeof AGENTS]?.label}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto w-full space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === "user"
                      ? "bg-blue-500 text-white"
                      : "border"
                      }`}
                    style={msg.role === "ai" ? { background: "var(--bg-secondary)", borderColor: "var(--border)" } : {}}
                  >
                    {msg.role === "ai" && msg.agent && (
                      <div className="text-xs mb-2" style={{ color: "var(--accent)" }}>
                        {AGENTS[msg.agent as keyof typeof AGENTS]?.icon} {AGENTS[msg.agent as keyof typeof AGENTS]?.label}
                      </div>
                    )}
                    <div className="prose prose-sm max-w-none" style={{ color: msg.role === "user" ? "white" : "var(--text-primary)" }}>
                      <ReactMarkdown
                        components={{
                          code({ className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || "");
                            const codeString = String(children).replace(/\n$/, "");
                            const msgId = msg.id;

                            if (match) {
                              return (
                                <div className="relative my-2">
                                  <div className="flex items-center justify-between px-3 py-1.5 text-xs" style={{ background: "#1a1a1a", borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
                                    <span style={{ color: "#aaa" }}>{match[1]}</span>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => copyToClipboard(codeString, `code-${msgId}`)}
                                        className="hover:text-white transition-colors"
                                        style={{ color: "#888" }}
                                      >
                                        {copiedId === `code-${msgId}` ? "✓" : "📋"}
                                      </button>
                                      <button
                                        onClick={() => runCode(codeString, match[1], msgId)}
                                        className="hover:text-white transition-colors"
                                        style={{ color: "#888" }}
                                      >
                                        {runningCode === `${msgId}-${match[1]}` ? "⏳" : "▶"}
                                      </button>
                                    </div>
                                  </div>
                                  <SyntaxHighlighter
                                    style={oneDark as any}
                                    language={match[1]}
                                    PreTag="div"
                                    customStyle={{ margin: 0, borderRadius: 8 }}
                                  >
                                    {codeString}
                                  </SyntaxHighlighter>
                                  {codeOutputs[`${msgId}-${match[1]}`] && (
                                    <div className="mt-2 p-3 rounded-lg text-sm font-mono" style={{ background: "#0a0a0a", border: "1px solid #2a2a2a" }}>
                                      <div className="text-xs mb-1" style={{ color: "#4ade80" }}>Output:</div>
                                      <pre className="whitespace-pre-wrap text-xs" style={{ color: "#ccc" }}>{codeOutputs[`${msgId}-${match[1]}`]}</pre>
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            return <code className={className} {...props}>{children}</code>;
                          }
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                    {msg.tokens && (
                      <div className="text-xs mt-2 opacity-50">🧠 {msg.tokens} tokens</div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl px-4 py-3" style={{ background: "var(--bg-secondary)" }}>
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: "var(--accent)" }}></span>
                      <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: "var(--accent)", animationDelay: "0.1s" }}></span>
                      <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: "var(--accent)", animationDelay: "0.2s" }}></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="flex-shrink-0 p-4 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="max-w-4xl mx-auto w-full">
            <div className="flex gap-2 items-end">
              <button
                onClick={startVoice}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isListening ? "animate-pulse" : ""
                  }`}
                style={{ background: isListening ? "var(--accent)" : "var(--bg-tertiary)" }}
              >
                🎤
              </button>

              <button
                onClick={() => document.getElementById("file-input")?.click()}
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "var(--bg-tertiary)" }}
              >
                📎
              </button>
              <input
                id="file-input"
                type="file"
                className="hidden"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                accept=".pdf,.txt,.py,.js,.json,.csv,.md"
              />

              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
                className="flex-1 rounded-xl px-4 py-3 resize-none focus:outline-none"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                rows={1}
              />

              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-50"
                style={{ background: "var(--accent)", color: "white" }}
              >
                ➤
              </button>
            </div>
            <div className="text-xs text-center mt-2" style={{ color: "var(--text-secondary)" }}>
              {totalTokens > 0 && `Total tokens: ${totalTokens.toLocaleString()} | `}
              AI-OS v1.0
            </div>
          </div>
        </div>
      </div>

      {isMobile && showSidebar && (
        <div className="fixed inset-0 z-20 bg-black bg-opacity-50" onClick={() => setShowSidebar(false)} />
      )}
    </div>
  );
}