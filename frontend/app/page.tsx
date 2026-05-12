"use client";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight, oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

// Types
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  tokens?: number;
}

interface Session {
  id: string;
  title: string;
  lastMessage: string;
  date: string;
  messageCount: number;
  isPinned: boolean;
}

interface Agent {
  id: string;
  name: string;
  icon: string;
  description: string;
  gradient: string;
}

interface Suggestion {
  icon: string;
  text: string;
  agent: string;
  prompt: string;
}

// Sample Data
const allAgents: Agent[] = [
  { id: "chat", name: "Chat Assistant", icon: "💬", description: "General conversation", gradient: "from-indigo-600 to-purple-600" },
  { id: "code", name: "Code Generator", icon: "</>", description: "Write and debug code", gradient: "from-emerald-500 to-teal-500" },
  { id: "image", name: "Image Creator", icon: "🎨", description: "Generate images", gradient: "from-pink-500 to-rose-500" },
  { id: "research", name: "Research Analyst", icon: "🔬", description: "Deep research", gradient: "from-violet-500 to-purple-500" },
  { id: "search", name: "Web Search", icon: "🔍", description: "Real-time search", gradient: "from-amber-500 to-orange-500" },
  { id: "file", name: "Document Analyzer", icon: "📄", description: "Process documents", gradient: "from-gray-500 to-gray-600" },
  { id: "debug", name: "Debug Assistant", icon: "🐛", description: "Fix bugs", gradient: "from-red-500 to-rose-500" },
];

const allSuggestions: Suggestion[] = [
  { icon: "💻", text: "Write a Python function to calculate fibonacci numbers", agent: "Code", prompt: "Write a Python function to calculate fibonacci numbers" },
  { icon: "🔬", text: "Explain quantum computing in simple terms", agent: "Research", prompt: "Explain quantum computing in simple terms" },
  { icon: "🎨", text: "Generate an image of a futuristic cyberpunk city", agent: "Image", prompt: "Generate an image of a futuristic cyberpunk city" },
  { icon: "🐛", text: "Help me debug this JavaScript error", agent: "Debug", prompt: "Help me debug this JavaScript error" },
  { icon: "📄", text: "Summarize this document for me", agent: "File", prompt: "Please summarize this document" },
  { icon: "🔍", text: "Search for latest developments in AI", agent: "Search", prompt: "Search for latest developments in AI" },
];

const sampleSessions: Session[] = [
  { id: "1", title: "Getting Started with AI", lastMessage: "Welcome to AI!", date: "Today", messageCount: 12, isPinned: true },
  { id: "2", title: "Python Code Generation", lastMessage: "Here's your Python function", date: "Today", messageCount: 8, isPinned: false },
  { id: "3", title: "Image Creation Tutorial", lastMessage: "Generated image ready", date: "Yesterday", messageCount: 6, isPinned: true },
  { id: "4", title: "Research Assistant", lastMessage: "Here's the research summary", date: "Yesterday", messageCount: 15, isPinned: false },
  { id: "5", title: "Debugging Help", lastMessage: "Found the bug", date: "2 days ago", messageCount: 4, isPinned: false },
];

export default function Home() {
  // States
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("chat");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showScrollButton, setShowScrollButton] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [totalTokens, setTotalTokens] = useState<number>(0);
  const [currentAgent, setCurrentAgent] = useState<string>("chat");
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [pinnedSessions, setPinnedSessions] = useState<Session[]>([]);
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [suggestionsList, setSuggestionsList] = useState<Suggestion[]>([]);
  const [agentsList, setAgentsList] = useState<Agent[]>([]);
  const [menuItemsList] = useState<string[]>(["Dashboard", "Chat", "Code", "Image", "Files", "Analytics", "Settings"]);

  // Refs
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API = "https://hundredxmind.onrender.com";

  // Effects
  useEffect(() => {
    setSuggestionsList(allSuggestions);
    setAgentsList(allAgents);
    setPinnedSessions(sampleSessions.filter(s => s.isPinned));
    setRecentSessions(sampleSessions.filter(s => !s.isPinned));
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") setIsDarkMode(true);
    else if (savedTheme === "light") setIsDarkMode(false);
    else if (window.matchMedia("(prefers-color-scheme: dark)").matches) setIsDarkMode(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    if (isDarkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [isDarkMode]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowScrollButton(scrollHeight - scrollTop - clientHeight > 300);
    };
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [messages]);

  // Handlers
  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };
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
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "Thank you for your message. How can I help you further?",
        timestamp: new Date(),
        tokens: data.tokens_used,
      };
      setMessages(prev => [...prev, aiMessage]);
      setSessionId(data.session_id);
      setTotalTokens(prev => prev + (data.tokens_used || 0));
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm having trouble connecting. Please check if the backend server is running.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const newChat = () => {
    setMessages([]);
    setSessionId(null);
    setInput("");
    setTotalTokens(0);
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteSession = (sessionId: string) => {
    setRecentSessions(prev => prev.filter(s => s.id !== sessionId));
    setPinnedSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  const togglePinSession = (sessionId: string) => {
    const allSessions = [...pinnedSessions, ...recentSessions];
    const session = allSessions.find(s => s.id === sessionId);
    if (!session) return;
    
    if (session.isPinned) {
      setPinnedSessions(prev => prev.filter(s => s.id !== sessionId));
      setRecentSessions(prev => [...prev, { ...session, isPinned: false }]);
    } else {
      setRecentSessions(prev => prev.filter(s => s.id !== sessionId));
      setPinnedSessions(prev => [...prev, { ...session, isPinned: true }]);
    }
  };

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input not supported");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      inputRef.current?.focus();
    };
    recognition.start();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const currentAgentData = agentsList.find(a => a.id === currentAgent) || agentsList[0];

  return (
    <div 
      className="flex h-screen w-full overflow-hidden bg-gray-50 dark:bg-gray-900"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-500/20 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-2xl border-2 border-dashed border-indigo-500">
            <div className="text-6xl mb-4">📁</div>
            <h3 className="text-lg font-semibold">Drop your file here</h3>
            <p className="text-sm text-gray-500 mt-2">PDF, DOCX, TXT, JSON, CSV, PY, JS</p>
          </div>
        </div>
      )}

      {selectedFile && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-40 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 bg-indigo-600 text-white">
          <span>📄</span>
          <span className="text-sm">{selectedFile.name}</span>
          <button onClick={() => setSelectedFile(null)} className="ml-2">✕</button>
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed lg:relative inset-y-0 left-0 z-40 w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 flex flex-col shadow-xl`}>
        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-white text-xl font-bold">A</span>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">HundredXMind</h1>
              <p className="text-xs text-gray-400">AI-OS v6.0</p>
            </div>
          </div>
        </div>

        <button onClick={newChat} className="mx-4 mt-4 py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all">
          + New Conversation
        </button>

        <div className="p-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-900"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3">
          <p className="text-xs font-semibold text-gray-400 px-3 mb-2">MENU</p>
          <div className="space-y-1">
            {menuItemsList.map((item) => (
              <div
                key={item}
                onClick={() => setActiveTab(item.toLowerCase())}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                  activeTab === item.toLowerCase()
                    ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <span className="text-xl">
                  {item === "Dashboard" ? "🏠" : item === "Chat" ? "💬" : item === "Code" ? "</>" : item === "Image" ? "🎨" : item === "Files" ? "📄" : item === "Analytics" ? "📊" : "⚙️"}
                </span>
                <span className="text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>

          {pinnedSessions.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-semibold text-gray-400 px-3 mb-2">PINNED</p>
              {pinnedSessions.map((session) => (
                <div key={session.id} className="group flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                  <div className="flex items-center gap-2 flex-1">
                    <span>💬</span>
                    <span className="text-sm truncate">{session.title}</span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                    <button onClick={() => togglePinSession(session.id)} className="hover:text-yellow-500">⭐</button>
                    <button onClick={() => deleteSession(session.id)} className="hover:text-red-500">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {recentSessions.length > 0 && (
            <div className="mt-6 pb-6">
              <p className="text-xs font-semibold text-gray-400 px-3 mb-2">RECENT</p>
              {recentSessions.map((session) => (
                <div key={session.id} className="group flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                  <div className="flex items-center gap-2 flex-1">
                    <span>💬</span>
                    <span className="text-sm truncate">{session.title}</span>
                  </div>
                  <button onClick={() => deleteSession(session.id)} className="opacity-0 group-hover:opacity-100 hover:text-red-500">🗑️</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">U</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Guest User</p>
              <p className="text-xs text-gray-400">Free Plan · {totalTokens} tokens</p>
            </div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
              {isDarkMode ? "☀️" : "🌙"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">☰</button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
                <span className="text-white text-sm font-bold">A</span>
              </div>
              <span className="font-semibold">HundredXMind</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700">
              <span>{currentAgentData?.icon}</span>
              <span className="text-sm">{currentAgentData?.name}</span>
            </div>
            <button className="p-2 rounded-lg hover:bg-gray-100">🔔</button>
            <button className="p-2 rounded-lg hover:bg-gray-100">⚙️</button>
          </div>
        </header>

        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-6 text-center">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-2xl mb-8">
                <span className="text-white text-5xl">✨</span>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">Welcome to HundredXMind</h1>
              <p className="text-gray-500 mb-8">Your intelligent AI operating system</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mb-8">
                {agentsList.map((agent) => (
                  <div key={agent.id} onClick={() => setCurrentAgent(agent.id)} className={`text-center p-3 bg-white dark:bg-gray-800 rounded-xl border hover:shadow-md cursor-pointer ${currentAgent === agent.id ? "ring-2 ring-indigo-500" : ""}`}>
                    <div className="text-2xl mb-1">{agent.icon}</div>
                    <div className="text-xs font-medium">{agent.name.split(" ")[0]}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl w-full">
                {suggestionsList.slice(0, 6).map((s, idx) => (
                  <button key={idx} onClick={() => setInput(s.prompt)} className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border hover:shadow-md hover:border-indigo-200 text-left">
                    <span className="text-2xl">{s.icon}</span>
                    <div>
                      <p className="text-sm">{s.text}</p>
                      <p className="text-xs text-gray-400 mt-1">{s.agent}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center mr-3 flex-shrink-0">
                      <span className="text-white text-xs">AI</span>
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-2xl px-5 py-3 ${msg.role === "user" ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white" : "bg-white dark:bg-gray-800 border shadow-sm"}`}>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown
                        components={{
                          code({ className, children }) {
                            const match = /language-(\w+)/.exec(className || "");
                            return match ? (
                              <SyntaxHighlighter style={isDarkMode ? oneDark : oneLight} language={match[1]} PreTag="div" className="rounded-lg my-2 text-sm">
                                {String(children).replace(/\n$/, "")}
                              </SyntaxHighlighter>
                            ) : (
                              <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm">{children}</code>
                            );
                          },
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                    {msg.tokens && <div className="text-xs opacity-50 mt-2">🧠 {msg.tokens} tokens</div>}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center ml-3 flex-shrink-0">
                      <span className="text-gray-600 text-xs">U</span>
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center mr-3">
                    <span className="text-white text-xs">AI</span>
                  </div>
                  <div className="bg-white dark:bg-gray-800 border rounded-2xl px-5 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100"></span>
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {showScrollButton && (
          <button onClick={scrollToBottom} className="fixed bottom-24 right-6 z-20 w-10 h-10 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 flex items-center justify-center">
            ↓
          </button>
        )}

        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="max-w-4xl mx-auto flex gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message... (Enter to send)"
              className="flex-1 rounded-2xl px-5 py-3 resize-none focus:outline-none border focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white dark:bg-gray-900"
              rows={1}
              style={{ minHeight: "48px" }}
            />
            <button onClick={startVoiceInput} className={`w-12 h-12 rounded-xl flex items-center justify-center ${isRecording ? "bg-red-500 text-white animate-pulse" : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200"}`}>
              🎤
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 flex items-center justify-center">
              📎
            </button>
            <input ref={fileInputRef} type="file" accept=".pdf,.txt,.py,.js,.json,.csv,.md" onChange={handleFileUpload} className="hidden" />
            <button onClick={sendMessage} disabled={!input.trim() || loading} className="w-12 h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white disabled:opacity-50 hover:shadow-lg flex items-center justify-center">
              ➤
            </button>
          </div>
          <div className="text-center text-xs text-gray-400 mt-3">HundredXMind AI-OS — Your Intelligent Assistant</div>
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce { animation: bounce 0.5s ease infinite; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb { background: #c7d2fe; border-radius: 10px; }
        .dark ::-webkit-scrollbar-track { background: #1f2937; }
        .dark ::-webkit-scrollbar-thumb { background: #4f46e5; }
      `}</style>
    </div>
  );
}