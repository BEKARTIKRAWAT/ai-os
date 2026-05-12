"use client";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

export default function Home() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const API = "https://hundredxmind.onrender.com";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { id: Date.now().toString(), role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, session_id: sessionId }),
      });
      const data = await res.json();
      const aiMessage = { id: (Date.now() + 1).toString(), role: "ai", content: data.response };
      setMessages(prev => [...prev, aiMessage]);
      setSessionId(data.session_id);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const newChat = () => {
    setMessages([]);
    setSessionId(null);
  };

  return (
    <div className="flex h-screen w-full bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed lg:relative inset-y-0 left-0 z-50 w-72 bg-white border-r transform transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 flex flex-col`}>
        <div className="p-5 border-b">
          <h1 className="text-xl font-bold text-indigo-600">HundredXMind</h1>
          <p className="text-xs text-gray-400">AI-OS v6.0</p>
        </div>
        <button onClick={newChat} className="mx-4 mt-4 py-3 bg-indigo-600 text-white rounded-xl font-semibold">+ New Chat</button>
        <div className="flex-1 overflow-y-auto px-3 mt-4">
          {["Chat", "Code", "Image", "Files"].map(item => (
            <div key={item} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer">
              <span>{item === "Chat" ? "💬" : item === "Code" ? "</>" : item === "Image" ? "🎨" : "📄"}</span>
              <span className="text-sm">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full">
        <header className="bg-white border-b px-4 py-3 flex items-center">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 mr-3">☰</button>
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">A</div>
          <span className="ml-2 font-semibold">HundredXMind</span>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-3xl font-bold mb-6">AI</div>
              <h1 className="text-3xl font-bold mb-2">Welcome to HundredXMind</h1>
              <p className="text-gray-500">Your AI Operating System</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === "user" ? "bg-indigo-600 text-white" : "bg-white border text-gray-800"}`}>
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
              {loading && <div className="flex justify-start"><div className="bg-white border rounded-2xl px-4 py-3">Typing...</div></div>}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="border-t bg-white p-4">
          <div className="max-w-3xl mx-auto flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Type your message..."
              className="flex-1 rounded-xl px-4 py-3 border focus:outline-none focus:border-indigo-500"
              rows={1}
            />
            <button onClick={sendMessage} disabled={!input.trim() || loading} className="px-6 rounded-xl bg-indigo-600 text-white font-semibold disabled:opacity-50">Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}