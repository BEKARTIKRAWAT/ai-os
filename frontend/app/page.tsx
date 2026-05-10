"use client";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import Sidebar from "./components/Sidebar";
import { API, AGENTS, SUGGESTIONS, THEMES, Message, Session } from "./constants";

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
  const [theme, setTheme] = useState("light");
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setShowSidebar(!mobile);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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
      if (isMobile) setShowSidebar(false);
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
      setMessages(p => [...p, { id: Date.now() + "e", role: "ai", content: "❌ Connection failed.", agent: "chat", timestamp: new Date(), isError: true }]);
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

  return (
    <div
      className="flex overflow-hidden"
      style={{ height: "100dvh", background: "var(--bg-primary)", color: "var(--text-primary)" }}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false); }}
      onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setSelectedFile(f); }}
    >
      {/* Drag Overlay */}
      {dragOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center border-4 border-dashed" style={{ background: "rgba(124,58,237,0.1)", borderColor: "var(--accent)" }}>
          <div className="text-center rounded-3xl p-8 shadow-2xl mx-4" style={{ background: "var(--bg-primary)" }}>
            <div className="text-5xl mb-3">📁</div>
            <div className="text-xl font-bold mb-1">Drop file here</div>
            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>PDF, TXT, Python, JS, JSON, CSV</div>
          </div>
        </div>
      )}

      {/* Mobile Overlay */}
      {isMobile && showSidebar && (
        <div className="absolute inset-0 z-30 bg-black bg-opacity-50" onClick={() => setShowSidebar(false)} />
      )}

      {/* Theme Picker */}
      {showThemePicker && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setShowThemePicker(false)}>
          <div className="rounded-3xl p-6 shadow-2xl w-full max-w-sm" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg">Choose Theme</h3>
              <button onClick={() => setShowThemePicker(false)} className="w-8 h-8 flex items-center justify-center rounded-xl" style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>✕</button>
            </div>
            <div className="space-y-2">
              {THEMES.map(t => (
                <button key={t.id} onClick={() => { setTheme(t.id); setShowThemePicker(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all active:scale-95"
                  style={{ background: theme === t.id ? "var(--accent)" : "var(--bg-tertiary)", color: theme === t.id ? "white" : "var(--text-primary)", border: `1px solid ${theme === t.id ? "var(--accent)" : "var(--border)"}` }}>
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

      {/* Sidebar */}
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
        onNewChat={() => { setMessages([]); setSessionId(null); setTotalTokens(0); if (isMobile) setShowSidebar(false); }}
        onLoadHistory={loadHistory}
        onDeleteSession={deleteSession}
        onSearchChange={setSearchQuery}
        onThemeClick={() => setShowThemePicker(true)}
        formatDate={formatDate}
      />

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Header */}
        <header className="flex items-center justify-between px-3 md:px-4 py-2.5 flex-shrink-0" style={{ background: "var(--header)", borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSidebar(!showSidebar)} className="w-8 h-8 flex items-center justify-center rounded-lg transition-all active:scale-90" style={{ color: "var(--text-secondary)", background: "var(--bg-tertiary)" }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>A</div>
              <span className="font-bold text-sm">AI-OS</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border)" }}>
            <span>{agent.icon}</span>
            <span className="hidden sm:block" style={{ color: "var(--accent)" }}>{agent.label}</span>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--accent)" }}></div>
          </div>

          <div className="flex items-center gap-1.5">
            {messages.length > 0 && (
              <button onClick={() => { setMessages([]); setSessionId(null); }} className="text-xs px-2.5 py-1.5 rounded-lg transition-all active:scale-90" style={{ color: "var(--text-secondary)", background: "var(--bg-tertiary)" }}>
                Clear
              </button>
            )}
            <button onClick={() => setShowThemePicker(true)} className="w-8 h-8 flex items-center justify-center rounded-lg transition-all active:scale-90" style={{ color: "var(--text-secondary)", background: "var(--bg-tertiary)" }}>
              {currentTheme.icon}
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-6" style={{ minHeight: "calc(100dvh - 120px)" }}>
              <div className="max-w-xl w-full">
                <div className="text-center mb-6">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-white text-xl md:text-2xl font-black mx-auto mb-4 shadow-xl"
                    style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>A</div>
                  <h1 className="text-xl md:text-2xl font-bold mb-2">
                    Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}! 👋
                  </h1>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    AI-OS — 7 specialized agents ready to help
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-1.5 mb-5">
                  {Object.entries(AGENTS).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--accent)" }}>
                      <span>{val.icon}</span><span>{val.label}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SUGGESTIONS.map((s, i) => (
                    <button key={i} onClick={() => sendMessage(s.text)}
                      className="flex items-start gap-3 p-3 rounded-xl text-left transition-all active:scale-95"
                      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                      <span className="text-xl flex-shrink-0">{s.icon}</span>
                      <div>
                        <div className="text-xs leading-relaxed" style={{ color: "var(--text-primary)" }}>{s.text}</div>
                        <div className="mt-1 text-xs" style={{ color: "var(--accent)" }}>{AGENTS[s.agent].icon} {AGENTS[s.agent].label}</div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-4 p-3 rounded-xl" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center text-xs" style={{ color: "var(--text-secondary)" }}>
                    <span>📎 Files</span>
                    <span>🎤 Voice</span>
                    <span>▶ Run code</span>
                    <span>🌐 Web search</span>
                    <span>🎨 AI images</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-3 md:px-4 py-4 space-y-4">
              {messages.map((msg) => {
                const ma = AGENTS[msg.agent || "chat"] || AGENTS.chat;
                const isUser = msg.role === "user";
                return (
                  <div key={msg.id} className={`flex gap-2 group ${isUser ? "justify-end" : "justify-start"}`}>
                    {!isUser && (
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 text-white shadow-sm"
                        style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>
                        {ma.icon}
                      </div>
                    )}
                    <div className={`max-w-[88%] md:max-w-[80%] flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
                      <div className={`flex items-center gap-1.5 px-1 ${isUser ? "flex-row-reverse" : ""}`}>
                        {!isUser && <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>{ma.label}</span>}
                        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{formatTime(msg.timestamp)}</span>
                        {msg.tokens && !isUser && <span className="text-xs hidden sm:block" style={{ color: "var(--text-secondary)" }}>{msg.tokens} tokens</span>}
                      </div>
                      <div className={`rounded-xl px-3 py-2.5 text-sm leading-relaxed ${isUser ? "rounded-tr-sm" : "rounded-tl-sm"}`}
                        style={{ background: isUser ? "var(--bubble-user)" : "var(--bubble-ai)", color: isUser ? "white" : "var(--text-primary)", border: isUser ? "none" : "1px solid var(--border)" }}>
                        {msg.fileInfo && (
                          <div className="flex items-center gap-1.5 mb-2 pb-2 text-xs" style={{ borderBottom: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                            <span>📄</span><span className="font-medium truncate max-w-32">{msg.fileInfo.name}</span>
                          </div>
                        )}
                        {msg.image_base64 && (
                          <div className="mb-2">
                            <img src={`data:image/jpeg;base64,${msg.image_base64}`} alt="AI Generated"
                              className="rounded-xl max-w-full w-full cursor-pointer"
                              onClick={() => { const l = document.createElement("a"); l.href = `data:image/jpeg;base64,${msg.image_base64}`; l.download = "ai.jpg"; l.click(); }} />
                            <p className="text-xs mt-1 text-center" style={{ color: "var(--text-secondary)" }}>Tap to download</p>
                          </div>
                        )}
                        {!isUser ? (
                          <ReactMarkdown components={{
                            code({ className, children, ...props }: any) {
                              const match = /language-(\w+)/.exec(className || "");
                              const cs = String(children).replace(/\n$/, "");
                              const ok = msg.id + (match?.[1] || "");
                              if (match) return (
                                <div className="my-2 rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                                  <div className="flex items-center justify-between px-3 py-1.5" style={{ background: "var(--bg-tertiary)", borderBottom: "1px solid var(--border)" }}>
                                    <span className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>{match[1]}</span>
                                    <div className="flex gap-1.5">
                                      <button onClick={() => navigator.clipboard.writeText(cs)} className="text-xs px-2 py-0.5 rounded" style={{ color: "var(--text-secondary)", background: "var(--bg-primary)" }}>Copy</button>
                                      {(match[1] === "python" || match[1] === "javascript" || match[1] === "js") && (
                                        <button onClick={() => runCode(cs, match[1], msg.id)} disabled={runningCode === ok} className="text-xs px-2 py-0.5 rounded text-white disabled:opacity-50" style={{ background: "var(--accent)" }}>
                                          {runningCode === ok ? "..." : "▶"}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  <div className="overflow-x-auto">
                                    <SyntaxHighlighter style={oneDark as any} language={match[1]} PreTag="div" customStyle={{ margin: 0, borderRadius: 0, fontSize: "11px" }}>{cs}</SyntaxHighlighter>
                                  </div>
                                  {codeOutputs[ok] && (
                                    <div className="px-3 py-2" style={{ background: "#0d0d0d", borderTop: "1px solid #333" }}>
                                      <div className="flex items-center gap-1.5 mb-1"><div className="w-1.5 h-1.5 rounded-full bg-green-400"></div><span className="text-xs text-green-400">Output</span></div>
                                      <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap overflow-x-auto">{codeOutputs[ok]}</pre>
                                    </div>
                                  )}
                                </div>
                              );
                              return <code className="px-1 py-0.5 rounded text-xs font-mono" style={{ background: "var(--bg-tertiary)", color: "var(--accent)" }} {...props}>{children}</code>;
                            },
                            p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                            ul: ({ children }) => <ul className="list-none mb-2 space-y-1">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
                            li: ({ children }) => <li className="flex items-start gap-1.5 text-sm"><span className="mt-1 flex-shrink-0" style={{ color: "var(--accent)" }}>•</span><span>{children}</span></li>,
                            h1: ({ children }) => <h1 className="text-lg font-bold mb-2 pb-1.5" style={{ borderBottom: "1px solid var(--border)" }}>{children}</h1>,
                            h2: ({ children }) => <h2 className="text-base font-bold mb-1.5 mt-3">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 mt-2">{children}</h3>,
                            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                            blockquote: ({ children }) => <blockquote className="border-l-4 pl-3 my-2 italic text-sm" style={{ borderColor: "var(--accent)", color: "var(--text-secondary)" }}>{children}</blockquote>,
                            a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }} className="underline underline-offset-2 break-all">{children}</a>,
                            table: ({ children }) => <div className="overflow-x-auto my-2 rounded-lg" style={{ border: "1px solid var(--border)" }}><table className="min-w-full text-xs">{children}</table></div>,
                            th: ({ children }) => <th className="px-3 py-2 text-left font-semibold" style={{ background: "var(--bg-tertiary)", borderBottom: "1px solid var(--border)" }}>{children}</th>,
                            td: ({ children }) => <td className="px-3 py-2" style={{ borderBottom: "1px solid var(--border)" }}>{children}</td>,
                            hr: () => <hr className="my-3" style={{ borderColor: "var(--border)" }} />,
                          }}>{msg.content}</ReactMarkdown>
                        ) : (
                          <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                        )}
                      </div>
                      {!isUser && (
                        <div className="flex items-center gap-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { navigator.clipboard.writeText(msg.content); setCopiedId(msg.id); setTimeout(() => setCopiedId(null), 2000); }}
                            className="text-xs px-2 py-0.5 rounded-lg" style={{ color: "var(--text-secondary)", background: "var(--bg-tertiary)" }}>
                            {copiedId === msg.id ? "✓" : "Copy"}
                          </button>
                        </div>
                      )}
                    </div>
                    {isUser && <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5" style={{ background: "linear-gradient(135deg, #374151, #111827)" }}>K</div>}
                  </div>
                );
              })}
              {loading && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 text-white" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>{agent.icon}</div>
                  <div className="rounded-xl rounded-tl-sm px-3 py-2.5" style={{ background: "var(--bubble-ai)", border: "1px solid var(--border)" }}>
                    <div className="flex gap-1">
                      {[0, 0.15, 0.3].map((d, i) => <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background: "var(--accent)", animationDelay: `${d}s` }}></div>)}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} className="h-2" />
            </div>
          )}
        </div>

        {/* File Preview */}
        {selectedFile && (
          <div className="mx-3 mb-2 px-3 py-2 rounded-xl flex items-center justify-between" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 min-w-0">
              <span>📎</span>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{selectedFile.name}</div>
                <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{(selectedFile.size / 1024).toFixed(1)} KB</div>
              </div>
            </div>
            <button onClick={() => setSelectedFile(null)} className="w-6 h-6 flex items-center justify-center rounded-lg flex-shrink-0 ml-2" style={{ color: "var(--text-secondary)", background: "var(--bg-tertiary)" }}>✕</button>
          </div>
        )}

        {/* Input */}
        <div className="px-3 pb-3 pt-2 flex-shrink-0" style={{ background: "var(--header)", borderTop: "1px solid var(--border)" }}>
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-2 rounded-xl px-3 py-2 transition-all" style={{ background: "var(--input-bg)", border: "1px solid var(--border)" }}>
              <button
                onClick={() => { const i = document.createElement("input"); i.type = "file"; i.accept = ".pdf,.txt,.py,.js,.ts,.json,.csv,.md,.html,.css"; i.onchange = (e: any) => { if (e.target.files[0]) setSelectedFile(e.target.files[0]); }; i.click(); }}
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all active:scale-90"
                style={{ color: selectedFile ? "var(--accent)" : "var(--text-secondary)" }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
              </button>
              <textarea
                ref={inputRef}
                className="flex-1 resize-none outline-none text-sm leading-relaxed bg-transparent"
                placeholder="Message AI-OS..."
                value={input}
                rows={1}
                style={{ color: "var(--text-primary)", maxHeight: "100px" }}
                onChange={e => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px"; }}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              />
              <button onClick={startVoice} className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all active:scale-90"
                style={{ color: isListening ? "red" : "var(--text-secondary)", background: isListening ? "rgba(255,0,0,0.1)" : "transparent" }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              </button>
              <button
                onClick={() => sendMessage()}
                disabled={loading || (!input.trim() && !selectedFile)}
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all text-white active:scale-90"
                style={{ background: (loading || (!input.trim() && !selectedFile)) ? "var(--bg-tertiary)" : "linear-gradient(135deg, var(--accent), var(--accent-2))", opacity: (loading || (!input.trim() && !selectedFile)) ? 0.4 : 1 }}
              >
                {loading ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" /></svg>}
              </button>
            </div>
            <p className="text-center text-xs mt-1.5" style={{ color: "var(--text-secondary)", opacity: 0.5 }}>AI-OS may make mistakes</p>
          </div>
        </div>
      </div>
    </div>
  );
}