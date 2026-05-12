"use client";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const API = "https://hundredxmind.onrender.com";
  const bottomRef = useRef(null);

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
      setMessages(prev => [...prev, { id: Date.now() + 1, role: "assistant", content: data.response || "Hello! How can I help you?" }]);
      setSessionId(data.session_id);
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: "assistant", content: "Connection error. Please check backend." }]);
    }
    setLoading(false);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const suggestions = [
    "Write a Python function",
    "Explain quantum computing",
    "Generate an image of a cat",
    "Search for AI news",
  ];

  return (
    <div className="flex h-screen w-full bg-white">

      {/* Sidebar */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">HundredXMind</h1>
          <p className="text-xs text-gray-400">AI-OS v6.0</p>
        </div>
        <div className="p-4">
          <button className="w-full py-2 bg-blue-500 text-white rounded-full text-sm font-medium hover:bg-blue-600 transition">
            + New Chat
          </button>
        </div>
        <div className="px-4 pb-4">
          <input type="text" placeholder="Search..." className="w-full px-4 py-2 border border-gray-200 rounded-full text-sm bg-white" />
        </div>
        <div className="flex-1 px-3">
          <p className="text-xs text-gray-400 px-3 mb-2">MENU</p>
          {["Chat", "Code", "Image", "Files", "Settings"].map(item => (
            <div key={item} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer text-gray-700">
              <span>{item === "Chat" ? "💬" : item === "Code" ? "</>" : item === "Image" ? "🎨" : item === "Files" ? "📄" : "⚙️"}</span>
              <span className="text-sm">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">

        {/* Header */}
        <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold">A</div>
            <span className="font-semibold text-gray-800">HundredXMind</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">💬</span>
            <span className="text-sm text-gray-600">Chat</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold mb-6 shadow-lg">A</div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome to HundredXMind</h1>
              <p className="text-gray-400 mb-8">Your AI Assistant</p>
              <div className="flex flex-wrap gap-3 justify-center max-w-xl">
                {suggestions.map((s, i) => (
                  <button key={i} onClick={() => setInput(s)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition">{s}</button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${msg.role === "user" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800"}`}>
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
              {loading && <div className="flex justify-start"><div className="bg-gray-100 px-4 py-2 rounded-2xl">Typing...</div></div>}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 p-4">
          <div className="max-w-3xl mx-auto flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-200 rounded-2xl resize-none focus:outline-none focus:border-blue-400"
              rows={1}
              style={{ minHeight: "44px" }}
            />
            <button onClick={sendMessage} disabled={!input.trim() || loading} className="px-6 py-2 bg-blue-500 text-white rounded-2xl font-medium disabled:opacity-50">Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}
