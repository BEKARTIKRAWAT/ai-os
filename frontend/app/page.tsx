"use client";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import Sidebar from "./components/Sidebar";
import { API, AGENTS, SUGGESTIONS, Message, Session } from "./constants";

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [totalTokens, setTotalTokens] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [codeOutputs, setCodeOutputs] = useState<Record<string, string>>({});
  const [runningCode, setRunningCode] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
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
      if (isMobile) setIsSidebarOpen(false);
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

  const newChat = () => {
    setMessages([]);
    setSessionId(null);
    setTotalTokens(0);
    setSelectedFile(null);
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
        const res = await fetch(`${API}/analyze-file`, { method: "POST", body: formData });
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
        image_base64: data.image_base64,
        image_type: data.image_type,
        style: data.style
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
      setCodeOutputs(prev => ({ ...prev, [key]: data.output || data.error || "No output" }));
    } catch (error) {
      setCodeOutputs(prev => ({ ...prev, [key]: `Error: ${error}` }));
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

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file);
  };

  const agent = AGENTS[currentAgent as keyof typeof AGENTS] || AGENTS.chat;

  return (
    <div className="flex h-screen overflow-hidden bg-white" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      
      {dragOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="text-center p-8 rounded-2xl border-2 border-dashed border-green-500 bg-white">
            <div className="text-5xl mb-2">📁</div>
            <div className="text-xl font-bold text-gray-800">Drop file here</div>
            <div className="text-sm text-gray-500">PDF, TXT, Python, JS, JSON, CSV</div>
          </div>
        </div>
      )}

      {selectedFile && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-40 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 bg-green-600 text-white">
          <span>📄</span>
          <span className="text-sm">{selectedFile.name}</span>
          <button onClick={() => setSelectedFile(null)} className="ml-2 text-white">✕</button>
        </div>
      )}

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNewChat={newChat}
        sessions={sessions}
        currentSessionId={sessionId}
        onSelectSession={loadHistory}
        onDeleteSession={deleteSession}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-600 to-teal-600 flex items-center justify-center text-white font-bold">A</div>
              <span className="font-semibold text-gray-800">HundredXMind</span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-sm">
            <span>{agent.icon}</span>
            <span className="text-gray-700">{agent.label}</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6 bg-gray-50">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
              <div className="max-w-2xl w-full text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-600 to-teal-600 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6 shadow-lg">AI</div>
                <h1 className="text-3xl font-bold text-gray-800 mb-3">Welcome to HundredXMind</h1>
                <p className="mb-8 text-gray-500">7 specialized agents at your command</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                  {Object.entries(AGENTS).map(([key, val]) => (
                    <div key={key} className="text-center p-3 rounded-xl bg-white border border-gray-200 shadow-sm">
                      <div className="text-2xl mb-1">{val.icon}</div>
                      <div className="text-sm font-medium text-gray-700">{val.label}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {SUGGESTIONS.map((s, i) => (
                    <button key={i} onClick={() => sendMessage(s.text)} className="flex items-start gap-3 p-4 rounded-xl text-left transition-all hover:shadow-md bg-white border border-gray-200">
                      <span className="text-2xl">{s.icon}</span>
                      <div><div className="text-sm text-gray-800">{s.text}</div><div className="text-xs mt-1 text-green-600">{AGENTS[s.agent as keyof typeof AGENTS]?.icon} {AGENTS[s.agent as keyof typeof AGENTS]?.label}</div></div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto w-full space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === "user" ? "bg-green-600 text-white" : "bg-white border border-gray-200 text-gray-800"}`}>
                    {msg.role === "ai" && msg.agent && (<div className="text-xs mb-2 text-gray-400">{AGENTS[msg.agent as keyof typeof AGENTS]?.icon} {AGENTS[msg.agent as keyof typeof AGENTS]?.label}</div>)}
                    <div className="prose prose-sm max-w-none">
                      {(msg as any).image_base64 ? (
                        <div className="my-4">
                          <img src={`data:${(msg as any).image_type || 'image/jpeg'};base64,${(msg as any).image_base64}`} alt="Generated" className="rounded-xl max-w-full h-auto shadow-lg cursor-pointer" style={{ maxHeight: "512px" }} onClick={() => window.open(`data:${(msg as any).image_type || 'image/jpeg'};base64,${(msg as any).image_base64}`, '_blank')} />
                          <div className="text-xs text-center mt-2 text-gray-400">🎨 {(msg as any).style ? `Style: ${(msg as any).style}` : 'AI Generated'} | Click to expand</div>
                        </div>
                      ) : (
                        <ReactMarkdown components={{
                          code({ className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || "");
                            const codeString = String(children).replace(/\n$/, "");
                            const msgId = msg.id;
                            if (match) {
                              return (<div className="relative my-2"><div className="flex items-center justify-between px-3 py-1.5 text-xs bg-gray-800 rounded-t-lg"><span className="text-gray-400">{match[1]}</span><div className="flex gap-2"><button onClick={() => copyToClipboard(codeString, `code-${msgId}`)} className="hover:text-white transition-colors text-gray-500">{copiedId === `code-${msgId}` ? "✓" : "📋"}</button><button onClick={() => runCode(codeString, match[1], msgId)} className="hover:text-white transition-colors text-gray-500">{runningCode === `${msgId}-${match[1]}` ? "⏳" : "▶"}</button></div></div><SyntaxHighlighter language={match[1]} style={oneLight} PreTag="div" className="rounded-b-lg">{codeString}</SyntaxHighlighter>{codeOutputs[`${msgId}-${match[1]}`] && (<div className="mt-2 p-3 rounded-lg text-sm font-mono bg-gray-900 text-green-400 border border-gray-700"><div className="text-xs mb-1 text-gray-400">Output:</div><pre className="whitespace-pre-wrap text-xs">{codeOutputs[`${msgId}-${match[1]}`]}</pre></div>)}</div>);
                            }
                            return <code className={className} {...props}>{children}</code>;
                          }
                        }}>{msg.content}</ReactMarkdown>
                      )}
                    </div>
                    {msg.tokens && (<div className="text-xs mt-2 opacity-50">🧠 {msg.tokens} tokens</div>)}
                  </div>
                </div>
              ))}
              {loading && (<div className="flex justify-start"><div className="rounded-2xl px-4 py-3 bg-white border border-gray-200"><div className="flex gap-1"><span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></span><span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0.1s" }}></span><span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0.2s" }}></span></div></div></div>)}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white">
          <div className="max-w-4xl mx-auto w-full">
            <div className="flex gap-2 items-end">
              <button onClick={startVoice} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isListening ? "bg-red-500 text-white animate-pulse" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>🎤</button>
              <button onClick={() => document.getElementById("file-input")?.click()} className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200">📎</button>
              <input id="file-input" type="file" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} accept=".pdf,.txt,.py,.js,.json,.csv,.md" />
              <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder="Type your message... (Enter to send, Shift+Enter for new line)" className="flex-1 rounded-xl px-4 py-3 resize-none focus:outline-none border border-gray-200 bg-white text-gray-800 focus:border-green-500 focus:ring-1 focus:ring-green-500" rows={1} />
              <button onClick={() => sendMessage()} disabled={!input.trim() || loading} className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-50 bg-green-600 hover:bg-green-700 text-white">➤</button>
            </div>
            <div className="text-xs text-center mt-2 text-gray-400">{totalTokens > 0 && `Total tokens: ${totalTokens.toLocaleString()} | `}HundredXMind AI-OS</div>
          </div>
        </div>
      </div>

      {isMobile && isSidebarOpen && (<div className="fixed inset-0 z-20 bg-black/50" onClick={() => setIsSidebarOpen(false)} />)}
    </div>
  );
}