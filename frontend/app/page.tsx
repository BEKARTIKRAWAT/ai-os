"use client";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const API = "https://hundredxmind.up.railway.app";

const AGENTS: Record<string, { icon: string; label: string; color: string; bg: string; border: string }> = {
  chat: { icon: "✦", label: "AI-OS", color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200" },
  code: { icon: "⌥", label: "Code", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  research: { icon: "◎", label: "Research", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  debug: { icon: "⚡", label: "Debug", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
  file: { icon: "◈", label: "File", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  search: { icon: "⊕", label: "Search", color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-200" },
  image: { icon: "◉", label: "Image", color: "text-pink-600", bg: "bg-pink-50", border: "border-pink-200" },
};

const SUGGESTIONS = [
  { icon: "💻", text: "Write a binary search algorithm in Python", agent: "code" },
  { icon: "🌐", text: "What are the latest AI developments today?", agent: "search" },
  { icon: "🎨", text: "Generate an image of a futuristic city", agent: "image" },
  { icon: "🔍", text: "Explain how transformers work in AI", agent: "research" },
  { icon: "🐛", text: "Debug this: TypeError: cannot read property", agent: "debug" },
  { icon: "📁", text: "Analyze my uploaded document", agent: "file" },
];

type Message = {
  role: string;
  content: string;
  agent?: string;
  tokens?: number;
  fileInfo?: any;
  image_base64?: string;
  image_type?: string;
  timestamp?: Date;
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
  const [sessions, setSessions] = useState<any[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [totalTokens, setTotalTokens] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      setMessages(data.history.map((m: any) => ({
        role: m.role === "assistant" ? "ai" : m.role,
        content: m.content,
        agent: m.agent,
        tokens: m.tokens,
        timestamp: new Date(m.timestamp)
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
    r.onresult = (e: any) => setInput(e.results[0][0].transcript);
    r.start();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const sendMessage = async (msg?: string) => {
    const text = msg || input;
    if ((!text.trim() && !selectedFile) || loading) return;

    setLoading(true);

    if (selectedFile) {
      const userMsg: Message = {
        role: "user",
        content: `📎 **${selectedFile.name}**${text ? `\n\n${text}` : ""}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMsg]);
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("question", text);
      try {
        const res = await fetch(`${API}/analyze-file`, { method: "POST", body: formData });
        const data = await res.json();
        setCurrentAgent("file");
        setMessages(prev => [...prev, {
          role: "ai", content: data.response, agent: "file",
          tokens: data.tokens_used, fileInfo: data.file_info, timestamp: new Date()
        }]);
        setTotalTokens(t => t + (data.tokens_used || 0));
      } catch {
        setMessages(prev => [...prev, { role: "ai", content: "❌ File analysis failed.", agent: "file" }]);
      }
      setSelectedFile(null);
      setInput("");
      setLoading(false);
      return;
    }

    setMessages(prev => [...prev, { role: "user", content: text, timestamp: new Date() }]);
    setInput("");

    try {
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages.map(m => ({ role: m.role === "ai" ? "assistant" : m.role, content: m.content })),
          session_id: sessionId
        }),
      });
      const data = await res.json();
      setCurrentAgent(data.agent_used || "chat");
      if (data.session_id) setSessionId(data.session_id);
      setMessages(prev => [...prev, {
        role: "ai", content: data.response, agent: data.agent_used,
        tokens: data.tokens_used, image_base64: data.image_base64,
        image_type: data.image_type, timestamp: new Date()
      }]);
      setTotalTokens(t => t + (data.tokens_used || 0));
      loadSessions();
    } catch {
      setMessages(prev => [...prev, { role: "ai", content: "❌ Connection failed. Please try again.", agent: "chat" }]);
    }
    setLoading(false);
  };

  const agent = AGENTS[currentAgent] || AGENTS.chat;

  return (
    <div
      className="flex h-screen bg-white text-gray-900 font-sans overflow-hidden"
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) setSelectedFile(file);
      }}
    >
      {/* Drag Overlay */}
      {dragOver && (
        <div className="absolute inset-0 bg-violet-500 bg-opacity-10 z-50 flex items-center justify-center border-4 border-violet-400 border-dashed rounded-2xl m-4">
          <div className="text-center">
            <div className="text-6xl mb-4">📁</div>
            <div className="text-2xl font-semibold text-violet-700">Drop your file here</div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`${showSidebar ? "w-64" : "w-0"} transition-all duration-300 overflow-hidden border-r border-gray-100 flex flex-col bg-gray-50`}>
        <div className="p-4 flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-6 px-2">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">A</div>
            <span className="font-semibold text-gray-800">AI-OS</span>
          </div>

          {/* New Chat */}
          <button
            onClick={() => { setMessages([]); setSessionId(null); }}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-white hover:shadow-sm transition-all mb-4 border border-gray-200"
          >
            <span className="text-lg">+</span> New Chat
          </button>

          {/* Agents */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">Agents</p>
            {Object.entries(AGENTS).map(([key, val]) => (
              <div key={key} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs mb-0.5 ${currentAgent === key ? `${val.bg} ${val.color} font-medium` : "text-gray-500 hover:bg-white"} transition-all cursor-default`}>
                <span>{val.icon}</span>
                <span>{val.label}</span>
                {currentAgent === key && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-current"></span>}
              </div>
            ))}
          </div>

          {/* History */}
          <div className="flex-1 overflow-y-auto">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">Recent</p>
            {sessions.slice(0, 15).map((s, i) => (
              <div key={i} className="group flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white cursor-pointer transition-all mb-0.5" onClick={() => loadHistory(s.session_id)}>
                <span className="text-gray-400 text-xs flex-1 truncate">{s.last_message}</span>
                <button onClick={(e) => { e.stopPropagation(); deleteSession(s.session_id); }} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-xs">✕</button>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="border-t border-gray-200 pt-3 mt-3">
            <div className="px-2 text-xs text-gray-400">
              <div className="flex justify-between mb-1"><span>Sessions</span><span className="font-medium text-gray-600">{sessions.length}</span></div>
              <div className="flex justify-between"><span>Tokens used</span><span className="font-medium text-gray-600">{totalTokens.toLocaleString()}</span></div>
            </div>
          </div>

          {/* Analytics Link */}
          <a href="/analytics" className="flex items-center gap-2 px-3 py-2 mt-2 rounded-xl text-xs text-gray-500 hover:bg-white hover:text-violet-600 transition-all">
            📊 Analytics Dashboard
          </a>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowSidebar(!showSidebar)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-violet-500 to-pink-500 rounded-md flex items-center justify-center text-white text-xs font-bold">A</div>
              <span className="font-semibold text-sm text-gray-800">AI-OS</span>
            </div>
          </div>

          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${agent.bg} ${agent.color} border ${agent.border}`}>
            <span>{agent.icon}</span>
            <span>{agent.label} Active</span>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
          </div>

          <button onClick={() => { setMessages([]); setSessionId(null); }} className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all">
            Clear
          </button>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-4">
              <div className="max-w-2xl w-full text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-pink-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-lg shadow-violet-200">A</div>
                <h1 className="text-2xl font-semibold text-gray-800 mb-2">How can I help you today?</h1>
                <p className="text-gray-400 text-sm mb-8">AI-OS with 7 specialized agents — Chat, Code, Research, Debug, File, Search & Image</p>

                <div className="grid grid-cols-2 gap-3 max-w-xl mx-auto">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(s.text)}
                      className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 hover:border-violet-300 hover:bg-violet-50 text-left transition-all group"
                    >
                      <span className="text-xl">{s.icon}</span>
                      <span className="text-xs text-gray-600 group-hover:text-violet-700 leading-relaxed">{s.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              {messages.map((msg, i) => {
                const msgAgent = AGENTS[msg.agent || "chat"] || AGENTS.chat;
                return (
                  <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "ai" && (
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${msgAgent.bg} ${msgAgent.color} border ${msgAgent.border}`}>
                        {msgAgent.icon}
                      </div>
                    )}
                    <div className={`max-w-2xl ${msg.role === "user" ? "order-first" : ""}`}>
                      {msg.role === "ai" && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium ${msgAgent.color}`}>{msgAgent.label}</span>
                          {msg.tokens && <span className="text-xs text-gray-300">{msg.tokens} tokens</span>}
                        </div>
                      )}
                      <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === "user"
                        ? "bg-gray-900 text-white rounded-tr-sm"
                        : "bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm"
                        }`}>
                        {msg.fileInfo && (
                          <div className="flex items-center gap-2 mb-2 text-xs text-gray-400 border-b border-gray-100 pb-2">
                            <span>📄</span>
                            <span>{msg.fileInfo.name}</span>
                            <span>•</span>
                            <span>{(msg.fileInfo.size / 1024).toFixed(1)}KB</span>
                          </div>
                        )}
                        {msg.image_base64 && (
                          <img
                            src={`data:image/jpeg;base64,${msg.image_base64}`}
                            alt="Generated"
                            className="rounded-xl mb-3 max-w-full"
                          />
                        )}
                        {msg.role === "ai" ? (
                          <ReactMarkdown
                            components={{
                              code({ className, children, ...props }: any) {
                                const match = /language-(\w+)/.exec(className || "");
                                const codeStr = String(children).replace(/\n$/, "");
                                return match ? (
                                  <div className="my-3 rounded-xl overflow-hidden border border-gray-200">
                                    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
                                      <span className="text-xs font-mono text-gray-500">{match[1]}</span>
                                      <button
                                        onClick={async () => {
                                          const res = await fetch(`${API}/execute-code`, {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ code: codeStr, language: match[1] })
                                          });
                                          const data = await res.json();
                                          alert(`Output:\n${data.output || data.error || "No output"}`);
                                        }}
                                        className="text-xs bg-gray-900 text-white px-2.5 py-1 rounded-lg hover:bg-gray-700 transition-all"
                                      >
                                        ▶ Run
                                      </button>
                                    </div>
                                    <SyntaxHighlighter style={oneDark as any} language={match[1]} PreTag="div" customStyle={{ margin: 0, borderRadius: 0 }}>
                                      {codeStr}
                                    </SyntaxHighlighter>
                                  </div>
                                ) : (
                                  <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>{children}</code>
                                );
                              },
                              p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                              ul: ({ children }) => <ul className="list-disc ml-4 mb-3 space-y-1">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal ml-4 mb-3 space-y-1">{children}</ol>,
                              li: ({ children }) => <li className="text-sm">{children}</li>,
                              h1: ({ children }) => <h1 className="text-lg font-bold mb-3 text-gray-900">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-base font-bold mb-2 text-gray-900">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-sm font-semibold mb-2 text-gray-800">{children}</h3>,
                              strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                              blockquote: ({ children }) => <blockquote className="border-l-4 border-violet-300 pl-4 italic text-gray-500 my-3">{children}</blockquote>,
                              table: ({ children }) => <div className="overflow-x-auto my-3"><table className="min-w-full border border-gray-200 rounded-lg text-xs">{children}</table></div>,
                              th: ({ children }) => <th className="px-3 py-2 bg-gray-50 border-b border-gray-200 text-left font-semibold">{children}</th>,
                              td: ({ children }) => <td className="px-3 py-2 border-b border-gray-100">{children}</td>,
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        ) : (
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        )}
                      </div>
                    </div>
                    {msg.role === "user" && (
                      <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">K</div>
                    )}
                  </div>
                );
              })}

              {loading && (
                <div className="flex gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${agent.bg} ${agent.color} border ${agent.border}`}>
                    {agent.icon}
                  </div>
                  <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                    <div className="flex gap-1 items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* File Preview */}
        {selectedFile && (
          <div className="mx-4 mb-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-amber-700">
              <span>📎</span>
              <span className="font-medium">{selectedFile.name}</span>
              <span className="text-amber-500 text-xs">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
            </div>
            <button onClick={() => setSelectedFile(null)} className="text-amber-400 hover:text-amber-600 text-sm">✕</button>
          </div>
        )}

        {/* Input */}
        <div className="px-4 pb-4">
          <div className="max-w-3xl mx-auto">
            <div className={`flex items-end gap-2 bg-white border rounded-2xl px-4 py-3 shadow-sm transition-all ${dragOver ? "border-violet-400" : "border-gray-200 hover:border-gray-300 focus-within:border-violet-400 focus-within:shadow-md"}`}>
              {/* File Button */}
              <button
                onClick={() => {
                  const inp = document.createElement("input");
                  inp.type = "file";
                  inp.accept = ".pdf,.txt,.py,.js,.ts,.json,.csv,.md,.html,.css";
                  inp.onchange = (e: any) => { if (e.target.files[0]) setSelectedFile(e.target.files[0]); };
                  inp.click();
                }}
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                title="Upload file"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
              </button>

              {/* Textarea */}
              <textarea
                ref={inputRef}
                className="flex-1 resize-none outline-none text-sm text-gray-800 placeholder-gray-400 max-h-32 leading-relaxed bg-transparent"
                placeholder="Message AI-OS... (Shift+Enter for new line)"
                value={input}
                rows={1}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
                }}
                onKeyDown={handleKeyDown}
              />

              {/* Voice Button */}
              <button
                onClick={startVoice}
                className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all ${isListening ? "bg-red-100 text-red-500 animate-pulse" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}
                title="Voice input"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              </button>

              {/* Send Button */}
              <button
                onClick={() => sendMessage()}
                disabled={loading || (!input.trim() && !selectedFile)}
                className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all ${loading || (!input.trim() && !selectedFile) ? "bg-gray-100 text-gray-300" : "bg-gray-900 text-white hover:bg-gray-700"}`}
              >
                {loading ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" /></svg>
                )}
              </button>
            </div>
            <p className="text-center text-xs text-gray-300 mt-2">AI-OS can make mistakes. Verify important information.</p>
          </div>
        </div>
      </div>
    </div>
  );
}