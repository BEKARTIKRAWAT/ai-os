"use client";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const API = "https://hundredxmind.onrender.com";

  useEffect(() => {
    const checkMobile = () => {
      if (window.innerWidth < 768) setIsSidebarOpen(false);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

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
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: "assistant", content: "Error connecting to server" }]);
    }
    setLoading(false);
  };

  const newChat = () => {
    setMessages([]);
    setSessionId(null);
    setInput("");
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const menuItems = ["Chat", "Code", "Image", "Files"];
  const suggestions = [
    "Write a Python function",
    "Explain quantum computing",
    "Generate an image of a cat",
    "Search for AI news",
  ];

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div className={`fixed lg:relative inset-y-0 left-0 z-40 w-72 bg-white border-r border-gray-200 transform transition-transform duration-300 flex flex-col shadow-lg ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">HundredXMind</h1>
              <p className="text-xs text-gray-400">AI-OS v6.0</p>
            </div>
          </div>
        </div>

        <button onClick={newChat} className="mx-4 mt-4 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition shadow-sm">
          + New Chat
        </button>

        <div className="flex-1 overflow-y-auto px-3 mt-4">
          <p className="text-xs font-semibold text-gray-400 px-3 mb-2">MENU</p>
          {menuItems.map((item) => (
            <div key={item} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 cursor-pointer text-gray-700">
              <span className="text-xl">{item === "Chat" ? "💬" : item === "Code" ? "</>" : item === "Image" ? "🎨" : "📄"}</span>
              <span className="text-sm font-medium">{item}</span>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold">U</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Guest User</p>
              <p className="text-xs text-gray-400">Free Plan</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
              ☰
            </button>
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold">A</span>
            </div>
            <span className="font-semibold text-gray-800">HundredXMind</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100">
              <span>💬</span>
              <span className="text-sm text-gray-600">Chat</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl mb-6">
                <span className="text-white text-5xl">✨</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to HundredXMind</h1>
              <p className="text-gray-400 mb-8">Your AI Operating System</p>
              <div className="flex flex-wrap gap-3 justify-center max-w-xl">
                {suggestions.map((s, i) => (
                  <button key={i} onClick={() => setInput(s)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center mr-2 flex-shrink-0">
                      <span className="text-white text-xs font-bold">AI</span>
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${msg.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"}`}>
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center ml-2 flex-shrink-0">
                      <span className="text-gray-600 text-xs font-bold">U</span>
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center mr-2">
                    <span className="text-white text-xs">AI</span>
                  </div>
                  <div className="bg-gray-100 rounded-2xl px-4 py-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="max-w-3xl mx-auto flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type your message... (Enter to send)"
              className="flex-1 rounded-2xl px-4 py-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={1}
              style={{ minHeight: "48px" }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="px-6 rounded-xl bg-blue-600 text-white font-medium disabled:opacity-50 hover:bg-blue-700 transition"
            >
              Send
            </button>
          </div>
          <div className="text-center text-xs text-gray-400 mt-2">HundredXMind AI-OS</div>
        </div>
      </div>
    </div>
  );
}