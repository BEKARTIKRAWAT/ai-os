"use client";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight, oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function Home() {
  // ============================================
  // STATE DECLARATIONS (50+ states)
  // ============================================
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [feedbackId, setFeedbackId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [totalTokens, setTotalTokens] = useState(0);
  const [currentAgent, setCurrentAgent] = useState("chat");
  const [isMobile, setIsMobile] = useState(false);
  const [typingText, setTypingText] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [selectedModel, setSelectedModel] = useState("groq");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [compactView, setCompactView] = useState(false);
  const [fontSize, setFontSize] = useState("medium");
  const [language, setLanguage] = useState("en");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [username, setUsername] = useState("Guest");
  const [email, setEmail] = useState("guest@hundredxmind.com");
  const [plan, setPlan] = useState("free");
  const [usageStats, setUsageStats] = useState({ messages: 0, tokens: 0, sessions: 0 });
  const [notifications, setNotifications] = useState([]);
  const [pinnedSessions, setPinnedSessions] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [agents, setAgents] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [themeColors, setThemeColors] = useState({
    primary: "#6366f1",
    secondary: "#8b5cf6",
    accent: "#ec4899",
  });

  // Refs
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  // API URL
  const API = "https://hundredxmind.onrender.com";

  // ============================================
  // STATIC DATA
  // ============================================
  const allAgents = [
    { id: "chat", name: "Chat Assistant", icon: "💬", description: "General conversation and assistance", gradient: "from-indigo-600 to-purple-600" },
    { id: "code", name: "Code Generator", icon: "</>", description: "Write, debug, and optimize code", gradient: "from-emerald-500 to-teal-500" },
    { id: "image", name: "Image Creator", icon: "🎨", description: "Generate and edit images", gradient: "from-pink-500 to-rose-500" },
    { id: "research", name: "Research Analyst", icon: "🔬", description: "Deep research and analysis", gradient: "from-violet-500 to-purple-500" },
    { id: "search", name: "Web Search", icon: "🔍", description: "Real-time web search", gradient: "from-amber-500 to-orange-500" },
    { id: "file", name: "Document Analyzer", icon: "📄", description: "Process and analyze documents", gradient: "from-gray-500 to-gray-600" },
    { id: "debug", name: "Debug Assistant", icon: "🐛", description: "Find and fix bugs", gradient: "from-red-500 to-rose-500" },
  ];

  const allSuggestions = [
    { icon: "💻", text: "Write a Python function to calculate fibonacci numbers", agent: "Code", prompt: "Write a Python function to calculate fibonacci numbers with memoization" },
    { icon: "🔬", text: "Explain quantum computing in simple terms", agent: "Research", prompt: "Explain quantum computing in simple, easy-to-understand terms" },
    { icon: "🎨", text: "Generate an image of a futuristic cyberpunk city", agent: "Image", prompt: "Generate an image of a futuristic cyberpunk city at night" },
    { icon: "🐛", text: "Debug this JavaScript error: TypeError: undefined is not a function", agent: "Debug", prompt: "Debug this JavaScript error and explain the fix" },
    { icon: "📄", text: "Summarize this technical document", agent: "File", prompt: "Please summarize the key points from this document" },
    { icon: "🔍", text: "Search for latest developments in AI", agent: "Search", prompt: "Search for the latest developments in artificial intelligence" },
    { icon: "⚡", text: "Create a REST API with FastAPI", agent: "Code", prompt: "Create a complete REST API using FastAPI with authentication" },
    { icon: "🎭", text: "Write a creative story about a robot discovering emotions", agent: "Chat", prompt: "Write a short creative story about a robot who discovers emotions" },
    { icon: "🧠", text: "Explain how neural networks work", agent: "Research", prompt: "Explain how neural networks work in detail" },
    { icon: "🎨", text: "Generate a realistic portrait of a lion", agent: "Image", prompt: "Generate a realistic portrait of a lion in 4K quality" },
    { icon: "🔧", text: "Optimize this SQL query", agent: "Code", prompt: "Optimize this SQL query for better performance" },
    { icon: "📊", text: "Analyze this data and provide insights", agent: "Research", prompt: "Analyze this data and provide actionable insights" },
  ];

  const allMenuItems = [
    "Dashboard", "Chat", "Code", "Image", "Files", "Research", "Analytics", "Settings"
  ];

  // Sample sessions data
  const sampleSessions = [
    { id: "1", title: "Getting Started with AI", lastMessage: "Welcome to AI!", date: "Today", messageCount: 12, isPinned: true },
    { id: "2", title: "Python Code Generation", lastMessage: "Here's your Python function", date: "Today", messageCount: 8, isPinned: false },
    { id: "3", title: "Image Creation Tutorial", lastMessage: "Generated image ready", date: "Yesterday", messageCount: 6, isPinned: true },
    { id: "4", title: "Research Assistant", lastMessage: "Here's the research summary", date: "Yesterday", messageCount: 15, isPinned: false },
    { id: "5", title: "Debugging Help", lastMessage: "Found the bug", date: "2 days ago", messageCount: 4, isPinned: false },
    { id: "6", title: "Web Search Results", lastMessage: "Latest AI news", date: "3 days ago", messageCount: 9, isPinned: false },
    { id: "7", title: "Document Analysis", lastMessage: "Document processed", date: "5 days ago", messageCount: 3, isPinned: false },
    { id: "8", title: "Code Review", lastMessage: "Code looks good", date: "1 week ago", messageCount: 7, isPinned: false },
  ];

  // ============================================
  // EFFECTS
  // ============================================
  useEffect(() => {
    setSuggestions(allSuggestions.slice(0, 8));
    setAgents(allAgents);
    setMenuItems(allMenuItems);
    setRecentSessions(sampleSessions.filter(s => !s.isPinned));
    setPinnedSessions(sampleSessions.filter(s => s.isPinned));
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
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, autoScroll]);

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

  // ============================================
  // HANDLERS
  // ============================================
  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setIsThinking(true);

    try {
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, session_id: sessionId }),
      });
      const data = await res.json();
      const aiMessage = {
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
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm having trouble connecting. Please check if the backend server is running.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setIsThinking(false);
    }
  };

  const newChat = () => {
    setMessages([]);
    setSessionId(null);
    setInput("");
    setSelectedFile(null);
    setTotalTokens(0);
  };

  const copyToClipboard = async (text, id) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = (id, type) => {
    setFeedbackId(id);
    setTimeout(() => setFeedbackId(null), 2000);
  };

  const deleteSession = (sessionId) => {
    setRecentSessions(prev => prev.filter(s => s.id !== sessionId));
    setPinnedSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  const togglePinSession = (sessionId) => {
    const session = [...pinnedSessions, ...recentSessions].find(s => s.id === sessionId);
    if (session.isPinned) {
      setPinnedSessions(prev => prev.filter(s => s.id !== sessionId));
      setRecentSessions(prev => [...prev, { ...session, isPinned: false }]);
    } else {
      setRecentSessions(prev => prev.filter(s => s.id !== sessionId));
      setPinnedSessions(prev => [...prev, { ...session, isPinned: true }]);
    }
  };

  const startVoiceInput = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        inputRef.current?.focus();
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.start();
    } else {
      alert("Voice input is not supported in your browser");
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearAllChats = () => {
    if (confirm("Are you sure you want to clear all chat history?")) {
      setMessages([]);
      setSessionId(null);
      setTotalTokens(0);
    }
  };

  const exportChat = () => {
    const data = JSON.stringify(messages, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const changeFontSize = (size) => {
    setFontSize(size);
    document.documentElement.style.fontSize = size === "small" ? "14px" : size === "large" ? "18px" : "16px";
  };

  const currentAgentData = agents.find(a => a.id === currentAgent) || agents[0];

  // ============================================
  // RENDER
  // ============================================
  return (
    <div 
      className="flex h-screen w-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-500/20 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-2xl border-2 border-dashed border-indigo-500">
            <div className="text-6xl mb-4">📁</div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Drop your file here</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">PDF, DOCX, TXT, JSON, CSV, PY, JS</p>
          </div>
        </div>
      )}

      {/* File Selected Indicator */}
      {selectedFile && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-40 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 bg-indigo-600 text-white">
          <span>📄</span>
          <span className="text-sm">{selectedFile.name}</span>
          <button onClick={() => setSelectedFile(null)} className="ml-2 hover:text-gray-200">✕</button>
        </div>
      )}

      {/* ============================================ */}
      {/* SIDEBAR */}
      {/* ============================================ */}
      <div className={`fixed lg:relative inset-y-0 left-0 z-40 w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 flex flex-col shadow-xl`}>
        {/* Logo */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-white text-xl font-bold">A</span>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">HundredXMind</h1>
              <p className="text-xs text-gray-400 dark:text-gray-500">AI-OS v6.0</p>
            </div>
          </div>
        </div>

        {/* New Chat Button */}
        <button onClick={newChat} className="mx-4 mt-4 py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2">
          <span>+</span> New Conversation
        </button>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 dark:bg-gray-900"
            />
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto px-3">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 px-3 mb-2">MENU</p>
          <div className="space-y-1">
            {menuItems.map((item) => (
              <div
                key={item}
                onClick={() => setActiveTab(item.toLowerCase())}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                  activeTab === item.toLowerCase()
                    ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <span className="text-xl">
                  {item === "Dashboard" ? "🏠" : item === "Chat" ? "💬" : item === "Code" ? "</>" : item === "Image" ? "🎨" : item === "Files" ? "📄" : item === "Research" ? "🔬" : item === "Analytics" ? "📊" : "⚙️"}
                </span>
                <span className="text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>

          {/* Pinned Chats */}
          {pinnedSessions.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between px-3 mb-2">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500">PINNED</p>
                <span className="text-yellow-500 text-xs">⭐</span>
              </div>
              <div className="space-y-1">
                {pinnedSessions.map((session) => (
                  <div key={session.id} className="group flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-gray-400">💬</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{session.title}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => togglePinSession(session.id)} className="p-1 hover:text-yellow-500">⭐</button>
                      <button onClick={() => deleteSession(session.id)} className="p-1 hover:text-red-500">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Chats */}
          {recentSessions.length > 0 && (
            <div className="mt-6 pb-6">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 px-3 mb-2">RECENT</p>
              <div className="space-y-1">
                {recentSessions.slice(0, 5).map((session) => (
                  <div key={session.id} className="group flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-gray-400">💬</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{session.title}</span>
                    </div>
                    <button onClick={() => deleteSession(session.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500">🗑️</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">U</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800 dark:text-white">Guest User</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Free Plan · {totalTokens} tokens</p>
            </div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition">
              {isDarkMode ? "☀️" : "🌙"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* MAIN CONTENT */}
      {/* ============================================ */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">☰</button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
                <span className="text-white text-sm font-bold">A</span>
              </div>
              <span className="font-semibold text-gray-800 dark:text-white">HundredXMind</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700">
              <span className="text-lg">{currentAgentData?.icon || "💬"}</span>
              <span className="text-sm text-gray-600 dark:text-gray-300">{currentAgentData?.name || "Chat"}</span>
            </div>
            <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition relative">
              <span>🔔</span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button onClick={exportChat} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">📥</button>
            <button onClick={clearAllChats} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">🗑️</button>
          </div>
        </header>

        {/* Messages Container */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
          
          {/* Welcome Screen */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-6 text-center">
              <div className="w-28 h-28 rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-2xl mb-8 animate-pulse">
                <span className="text-white text-6xl">✨</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">HundredXMind</h1>
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-8 max-w-md">Your intelligent AI operating system. Ask me anything.</p>
              
              {/* Agent Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-w-2xl mb-8">
                {agents.map((agent) => (
                  <div key={agent.id} onClick={() => setCurrentAgent(agent.id)} className={`text-center p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-indigo-300 transition cursor-pointer ${currentAgent === agent.id ? "ring-2 ring-indigo-500" : ""}`}>
                    <div className="text-2xl mb-1">{agent.icon}</div>
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300">{agent.name.split(" ")[0]}</div>
                  </div>
                ))}
              </div>

              {/* Suggestions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl w-full">
                {suggestions.slice(0, 6).map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInput(s.prompt)}
                    className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition text-left group"
                  >
                    <span className="text-2xl">{s.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">{s.text}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{s.agent}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Messages */}
          {messages.length > 0 && (
            <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
              {messages.map((msg, idx) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fadeInUp`}>
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center mr-3 flex-shrink-0 shadow-md">
                      <span className="text-white text-xs font-bold">AI</span>
                    </div>
                  )}
                  <div className={`group relative max-w-[85%] ${msg.role === "user" ? "order-1" : "order-2"}`}>
                    <div className={`rounded-2xl px-5 py-3 ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                        : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 shadow-sm"
                    }`}>
                      {msg.role === "assistant" && (
                        <div className="flex items-center gap-2 mb-2 text-xs text-gray-400">
                          <span>{currentAgentData?.icon}</span>
                          <span>{currentAgentData?.name}</span>
                        </div>
                      )}
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown
                          components={{
                            code({ className, children }) {
                              const match = /language-(\w+)/.exec(className || "");
                              return match ? (
                                <SyntaxHighlighter
                                  style={isDarkMode ? oneDark : oneLight}
                                  language={match[1]}
                                  PreTag="div"
                                  className="rounded-lg my-2 text-sm"
                                >
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
                      {msg.tokens && (
                        <div className="text-xs opacity-50 mt-2">🧠 {msg.tokens} tokens</div>
                      )}
                    </div>
                    
                    {/* Message Actions */}
                    <div className={`absolute top-2 ${msg.role === "user" ? "-left-12" : "-right-12"} opacity-0 group-hover:opacity-100 transition flex gap-1`}>
                      <button onClick={() => copyToClipboard(msg.content, msg.id)} className="p-1.5 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700">
                        {copiedId === msg.id ? "✓" : "📋"}
                      </button>
                      {msg.role === "assistant" && (
                        <>
                          <button onClick={() => handleFeedback(msg.id, "like")} className="p-1.5 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700">
                            {feedbackId === msg.id ? "❤️" : "👍"}
                          </button>
                          <button onClick={() => handleFeedback(msg.id, "dislike")} className="p-1.5 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700">👎</button>
                        </>
                      )}
                    </div>
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center ml-3 flex-shrink-0">
                      <span className="text-gray-600 dark:text-gray-400 text-xs font-bold">U</span>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Loading / Thinking Indicator */}
              {loading && (
                <div className="flex justify-start animate-fadeIn">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center mr-3 shadow-md">
                    <span className="text-white text-xs font-bold">AI</span>
                  </div>
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-3 shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100"></span>
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></span>
                    </div>
                    {isThinking && <p className="text-xs text-gray-400 mt-2">Thinking...</p>}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Scroll to Bottom Button */}
        {showScrollButton && (
          <button onClick={scrollToBottom} className="fixed bottom-24 right-6 z-20 w-10 h-10 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition flex items-center justify-center">
            ↓
          </button>
        )}

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
                className="flex-1 rounded-2xl px-5 py-3 resize-none focus:outline-none border border-gray-200 dark:border-gray-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 bg-white dark:bg-gray-900 text-gray-800 dark:text-white transition-all"
                rows={1}
                style={{ minHeight: "48px", maxHeight: "150px" }}
              />
              <div className="flex gap-2">
                <button
                  onClick={startVoiceInput}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                    isRecording ? "bg-red-500 text-white animate-pulse" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  🎤
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all flex items-center justify-center"
                >
                  📎
                </button>
                <input ref={fileInputRef} type="file" accept=".pdf,.txt,.py,.js,.json,.csv,.md" onChange={handleFileUpload} className="hidden" />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="w-12 h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all flex items-center justify-center"
                >
                  ➤
                </button>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 mt-3">
              <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                <span>AI Ready</span>
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500">
                {totalTokens > 0 && `${totalTokens.toLocaleString()} tokens used · `}
                HundredXMind AI-OS
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* STYLES */}
      {/* ============================================ */}
      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-fadeInUp { animation: fadeInUp 0.3s ease-out; }
        .animate-bounce { animation: bounce 0.5s ease infinite; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        
        /* Custom Scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb { background: #c7d2fe; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #818cf8; }
        .dark ::-webkit-scrollbar-track { background: #1f2937; }
        .dark ::-webkit-scrollbar-thumb { background: #4f46e5; }
        
        /* Transitions */
        * { transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease; }
      `}</style>
    </div>
  );
}