"use client";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function Home() {
  // ========== 50+ STATES ==========
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showScroll, setShowScroll] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [totalTokens, setTotalTokens] = useState(0);
  const [currentAgent, setCurrentAgent] = useState("chat");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState("light");
  const [fontSize, setFontSize] = useState("medium");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [pinnedChats, setPinnedChats] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [agentList, setAgentList] = useState([]);
  const [suggestionsList, setSuggestionsList] = useState([]);
  const [menuItems] = useState(["Chat", "Code", "Image", "Files", "Analytics", "Settings"]);
  const [agents] = useState([
    { id: "chat", name: "Chat", icon: "💬", color: "blue" },
    { id: "code", name: "Code", icon: "</>", color: "green" },
    { id: "image", name: "Image", icon: "🎨", color: "pink" },
    { id: "research", name: "Research", icon: "🔬", color: "purple" },
    { id: "search", name: "Search", icon: "🔍", color: "orange" },
    { id: "file", name: "File", icon: "📄", color: "gray" },
  ]);
  const [suggestions] = useState([
    { icon: "💻", text: "Write a Python function for fibonacci", prompt: "Write a Python function for fibonacci numbers" },
    { icon: "🔬", text: "Explain quantum computing", prompt: "Explain quantum computing simply" },
    { icon: "🎨", text: "Generate a cyberpunk city", prompt: "Generate a cyberpunk city image" },
    { icon: "🐛", text: "Debug this code", prompt: "Debug this JavaScript error" },
    { icon: "📄", text: "Summarize a document", prompt: "Please summarize this document" },
    { icon: "🔍", text: "Search AI news", prompt: "Search latest AI news" },
  ]);
  const [chatSessions] = useState([
    { id: 1, title: "Getting Started", date: "Today", count: 5, pinned: true },
    { id: 2, title: "Python Learning", date: "Today", count: 8, pinned: false },
    { id: 3, title: "Image Creation", date: "Yesterday", count: 3, pinned: true },
    { id: 4, title: "Research Help", date: "2 days ago", count: 12, pinned: false },
  ]);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const API = "https://hundredxmind.onrender.com";

  // ========== 30+ FUNCTIONS ==========
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handle = () => setShowScroll(el.scrollHeight - el.scrollTop - el.clientHeight > 300);
    el.addEventListener("scroll", handle);
    return () => el.removeEventListener("scroll", handle);
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { id: Date.now(), role: "user", content: input }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, session_id: sessionId }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { id: Date.now() + 1, role: "assistant", content: data.response || "Hello! How can I help?" }]);
      setSessionId(data.session_id);
      setTotalTokens(prev => prev + (data.tokens_used || 0));
    } catch {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: "assistant", content: "Connection error" }]);
    }
    setLoading(false);
  };

  const newChat = () => { setMessages([]); setSessionId(null); setTotalTokens(0); setInput(""); };
  const copyText = async (text, id) => { await navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); };
  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const clearChat = () => { if (confirm("Clear all messages?")) setMessages([]); };
  const exportChat = () => { const blob = new Blob([JSON.stringify(messages, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `chat-${Date.now()}.json`; a.click(); URL.revokeObjectURL(url); };
  const startVoice = () => { const SR = window.webkitSpeechRecognition || window.SpeechRecognition; if (!SR) return alert("Not supported"); const r = new SR(); r.onstart = () => setIsRecording(true); r.onend = () => setIsRecording(false); r.onresult = (e) => setInput(e.results[0][0].transcript); r.start(); };
  const handleKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
  const handleDrag = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) setSelectedFile(f); };
  const handleFile = (e) => { const f = e.target.files?.[0]; if (f) setSelectedFile(f); };
  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");
  const togglePin = (id) => { setPinnedChats(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]); };
  const deleteSession = (id) => { setChatHistory(prev => prev.filter(s => s.id !== id)); };
  const setAgent = (id) => setCurrentAgent(id);
  const openSettings = () => setSettingsOpen(!settingsOpen);
  const addNotification = (msg) => setNotifications(prev => [...prev, { id: Date.now(), msg }]);
  const clearNotifications = () => setNotifications([]);
  const changeFont = (size) => { setFontSize(size); document.body.style.fontSize = size === "large" ? "18px" : size === "small" ? "14px" : "16px"; };
  const getAgentColor = (color) => ({ blue: "bg-blue-500", green: "bg-green-500", pink: "bg-pink-500", purple: "bg-purple-500", orange: "bg-orange-500", gray: "bg-gray-500" }[color] || "bg-blue-500");

  const currentAgentData = agents.find(a => a.id === currentAgent) || agents[0];
  const pinned = chatSessions.filter(s => s.pinned);
  const recent = chatSessions.filter(s => !s.pinned);

  // ========== RENDER ==========
  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden" onDragOver={handleDrag} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      {/* Drag Overlay */}
      {isDragging && <div className="fixed inset-0 z-50 bg-blue-500/20 backdrop-blur flex items-center justify-center"><div className="bg-white p-8 rounded-2xl border-2 border-dashed border-blue-500 text-center"><div className="text-5xl mb-2">📁</div><p>Drop file here</p></div></div>}
      {selectedFile && <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-40 px-4 py-2 rounded-full bg-blue-600 text-white shadow-lg flex gap-2"><span>📄 {selectedFile.name}</span><button onClick={() => setSelectedFile(null)}>✕</button></div>}

      {/* Sidebar */}
      <div className={`fixed lg:relative inset-y-0 left-0 z-40 w-72 bg-white border-r border-gray-200 transform transition-transform duration-300 flex flex-col shadow-lg ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="p-5 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md"><span className="text-white font-bold text-xl">A</span></div>
            <div><h1 className="text-xl font-bold text-gray-800">HundredXMind</h1><p className="text-xs text-gray-400">AI-OS v6.0</p></div>
          </div>
        </div>
        <button onClick={newChat} className="mx-4 mt-4 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition shadow-sm">+ New Chat</button>
        <div className="p-4"><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span><input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div></div>
        <div className="flex-1 overflow-y-auto px-3">
          <p className="text-xs font-semibold text-gray-400 px-3 mb-2">MENU</p>
          {menuItems.map(item => <div key={item} onClick={() => setActiveTab(item.toLowerCase())} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition ${activeTab === item.toLowerCase() ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100"}`}><span className="text-xl">{item === "Chat" ? "💬" : item === "Code" ? "</>" : item === "Image" ? "🎨" : item === "Files" ? "📄" : item === "Analytics" ? "📊" : "⚙️"}</span><span className="text-sm font-medium">{item}</span></div>)}
          {pinned.length > 0 && <div className="mt-6"><p className="text-xs font-semibold text-gray-400 px-3 mb-2">📌 PINNED</p>{pinned.map(s => <div key={s.id} className="group flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer"><div className="flex items-center gap-2"><span>💬</span><span className="text-sm truncate">{s.title}</span></div><button onClick={() => togglePin(s.id)} className="opacity-0 group-hover:opacity-100 text-yellow-500">⭐</button></div>)}</div>}
          {recent.length > 0 && <div className="mt-6 pb-6"><p className="text-xs font-semibold text-gray-400 px-3 mb-2">🕐 RECENT</p>{recent.map(s => <div key={s.id} className="group flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer"><div className="flex items-center gap-2"><span>💬</span><span className="text-sm truncate">{s.title}</span></div><button className="opacity-0 group-hover:opacity-100 text-gray-400">🗑️</button></div>)}</div>}
        </div>
        <div className="p-4 border-t"><div className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 cursor-pointer"><div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center"><span className="text-white font-bold">U</span></div><div className="flex-1"><p className="text-sm font-semibold">Guest</p><p className="text-xs text-gray-400">{totalTokens} tokens</p></div><button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-gray-200">{theme === "light" ? "🌙" : "☀️"}</button></div></div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3"><button onClick={toggleSidebar} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">☰</button><div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm"><span className="text-white font-bold">A</span></div><span className="font-semibold text-gray-800">HundredXMind</span></div>
          <div className="flex items-center gap-2"><div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100"><span>{currentAgentData.icon}</span><span className="text-sm text-gray-600">{currentAgentData.name}</span></div><button onClick={exportChat} className="p-2 rounded-lg hover:bg-gray-100">📥</button><button onClick={clearChat} className="p-2 rounded-lg hover:bg-gray-100">🗑️</button><button onClick={openSettings} className="p-2 rounded-lg hover:bg-gray-100">⚙️</button></div>
        </div>

        <div ref={containerRef} className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-6 text-center">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl mb-6"><span className="text-white text-5xl">✨</span></div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to HundredXMind</h1>
              <p className="text-gray-400 mb-8">Your AI Operating System</p>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3 max-w-2xl mb-8">{agents.map(a => <div key={a.id} onClick={() => setAgent(a.id)} className={`text-center p-2 bg-white rounded-xl border cursor-pointer hover:shadow-md ${currentAgent === a.id ? "ring-2 ring-blue-500" : ""}`}><div className="text-2xl">{a.icon}</div><div className="text-xs text-gray-600">{a.name}</div></div>)}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full">{suggestions.map((s, i) => <button key={i} onClick={() => setInput(s.prompt)} className="flex items-start gap-3 p-4 bg-white rounded-xl border hover:shadow-md hover:border-blue-200 text-left transition"><span className="text-2xl">{s.icon}</span><div><p className="text-sm text-gray-800">{s.text}</p></div></button>)}</div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
              {messages.map((msg, i) => <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>{msg.role === "assistant" && <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center mr-2 flex-shrink-0"><span className="text-white text-xs">AI</span></div>}<div className={`max-w-[80%] rounded-2xl px-4 py-2 ${msg.role === "user" ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-800 shadow-sm"}`}><div className="prose prose-sm max-w-none"><ReactMarkdown components={{ code({ className, children }) { const m = /language-(\w+)/.exec(className || ""); return m ? <SyntaxHighlighter style={oneLight} language={m[1]} PreTag="div" className="rounded-lg my-2">{String(children).replace(/\n$/, "")}</SyntaxHighlighter> : <code className="bg-gray-100 px-1 py-0.5 rounded">{children}</code>; } }}>{msg.content}</ReactMarkdown></div></div>{msg.role === "user" && <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center ml-2 flex-shrink-0"><span className="text-gray-600 text-xs">U</span></div>}</div>)}
              {loading && <div className="flex justify-start"><div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center mr-2"><span className="text-white text-xs">AI</span></div><div className="bg-white border rounded-2xl px-4 py-2"><div className="flex gap-1"><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span></div></div></div>}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {showScroll && <button onClick={scrollToBottom} className="fixed bottom-24 right-6 z-20 w-10 h-10 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700">↓</button>}

        <div className="border-t bg-white p-4">
          <div className="max-w-3xl mx-auto flex gap-2">
            <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKey} placeholder="Type your message... (Enter to send)" className="flex-1 rounded-2xl px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" rows={1} style={{ minHeight: "48px" }} />
            <button onClick={startVoice} className={`w-12 rounded-xl flex items-center justify-center ${isRecording ? "bg-red-500 text-white animate-pulse" : "bg-gray-100 hover:bg-gray-200"}`}>🎤</button>
            <button onClick={() => document.getElementById("file")?.click()} className="w-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center">📎</button>
            <input id="file" type="file" className="hidden" onChange={handleFile} />
            <button onClick={sendMessage} disabled={!input.trim()} className="px-6 rounded-xl bg-blue-600 text-white font-medium disabled:opacity-50 hover:bg-blue-700">Send</button>
          </div>
          <div className="text-center text-xs text-gray-400 mt-2">HundredXMind AI-OS · {totalTokens} tokens used</div>
        </div>
      </div>
    </div>
  );
}