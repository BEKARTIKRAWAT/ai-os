"use client";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight, oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiMenu, FiPlus, FiSend, FiMic, FiPaperclip, FiSun, FiMoon, 
  FiUser, FiHome, FiMessageSquare, FiCode, FiImage, FiFolder, 
  FiSettings, FiLogOut, FiBell, FiSearch, FiStar, FiClock, 
  FiTrash2, FiEdit2, FiCopy, FiCheck, FiX, FiChevronLeft, 
  FiChevronRight, FiChevronDown, FiChevronUp, FiMoreVertical,
  FiExternalLink, FiDownload, FiUpload, FiSave, FiShare2,
  FiHeart, FiBookmark, FiFlag, FiRefreshCw, FiMaximize2,
  FiMinimize2, FiVolume2, FiVolumeX, FiVideo, FiCamera,
  FiMusic, FiGrid, FiList, FiLayout, FiMonitor, FiSmartphone,
  FiTablet, FiDesktop, FiCloud, FiDatabase, FiCpu, FiHardDrive,
  FiWifi, FiBluetooth, FiBattery, FiZap, FiAward, FiTrophy,
  FiTarget, FiCompass, FiMap, FiGlobe, FiLock, FiUnlock,
  FiShield, FiAlertCircle, FiInfo, FiHelpCircle, FiLifeBuoy
} from "react-icons/fi";
import { TbBrandOpenai, TbBrandGithub, TbBrandTwitter, TbBrandLinkedin, TbBrandDiscord } from "react-icons/tb";
import { SiGoogle, SiMicrosoft, SiApple, SiAmazon, SiMeta } from "react-icons/si";

// ============================================
// TYPES & INTERFACES
// ============================================

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  tokens?: number;
  model?: string;
  feedback?: "like" | "dislike" | null;
}

interface Session {
  id: string;
  title: string;
  lastMessage: string;
  date: string;
  messageCount: number;
  isPinned: boolean;
  model?: string;
}

interface Agent {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  gradient: string;
}

interface Suggestion {
  id: string;
  icon: string;
  text: string;
  agent: string;
  category: string;
  prompt: string;
}

// ============================================
// CONSTANTS & DATA
// ============================================

const API = "https://hundredxmind.onrender.com";

const AGENTS: Agent[] = [
  { id: "chat", name: "Chat Assistant", icon: "💬", description: "General conversation and assistance", color: "#6366f1", gradient: "from-indigo-600 to-purple-600" },
  { id: "code", name: "Code Generator", icon: "</>", description: "Write, debug, and optimize code", color: "#10b981", gradient: "from-emerald-500 to-teal-500" },
  { id: "image", name: "Image Creator", icon: "🎨", description: "Generate and edit images", color: "#ec4899", gradient: "from-pink-500 to-rose-500" },
  { id: "research", name: "Research Analyst", icon: "🔬", description: "Deep research and analysis", color: "#8b5cf6", gradient: "from-violet-500 to-purple-500" },
  { id: "search", name: "Web Search", icon: "🔍", description: "Real-time web search", color: "#f59e0b", gradient: "from-amber-500 to-orange-500" },
  { id: "file", name: "Document Analyzer", icon: "📄", description: "Process and analyze documents", color: "#6b7280", gradient: "from-gray-500 to-gray-600" },
  { id: "debug", name: "Debug Assistant", icon: "🐛", description: "Find and fix bugs", color: "#ef4444", gradient: "from-red-500 to-rose-500" },
];

const SUGGESTIONS: Suggestion[] = [
  { id: "1", icon: "💻", text: "Write a Python function to calculate fibonacci numbers", agent: "Code", category: "coding", prompt: "Write a Python function to calculate fibonacci numbers with memoization" },
  { id: "2", icon: "🔬", text: "Explain quantum computing in simple terms", agent: "Research", category: "science", prompt: "Explain quantum computing in simple, easy-to-understand terms" },
  { id: "3", icon: "🎨", text: "Generate an image of a futuristic cyberpunk city", agent: "Image", category: "creative", prompt: "Generate an image of a futuristic cyberpunk city at night" },
  { id: "4", icon: "🐛", text: "Debug this JavaScript error: TypeError: undefined is not a function", agent: "Debug", category: "coding", prompt: "Debug this JavaScript error and explain the fix: TypeError: undefined is not a function" },
  { id: "5", icon: "📄", text: "Summarize this technical document", agent: "File", category: "document", prompt: "Please summarize the key points from this document" },
  { id: "6", icon: "🔍", text: "Search for latest developments in AI and machine learning", agent: "Search", category: "research", prompt: "Search for the latest developments in artificial intelligence and machine learning" },
  { id: "7", icon: "⚡", text: "Create a REST API with FastAPI", agent: "Code", category: "coding", prompt: "Create a complete REST API using FastAPI with authentication and database" },
  { id: "8", icon: "🎭", text: "Write a creative story about a robot discovering emotions", agent: "Chat", category: "creative", prompt: "Write a short creative story about a robot who discovers emotions for the first time" },
];

// ============================================
// MAIN COMPONENT
// ============================================

export default function Home() {
  // State Management
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeAgent, setActiveAgent] = useState("chat");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [feedbackMessageId, setFeedbackMessageId] = useState<string | null>(null);
  const [pinnedSessions, setPinnedSessions] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [typingText, setTypingText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentPage, setCurrentPage] = useState("chat");
  
  // Refs
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Dummy sessions data
  const [sessions, setSessions] = useState<Session[]>([
    { id: "1", title: "Getting Started with AI", lastMessage: "Welcome to AI!", date: "Today", messageCount: 12, isPinned: true },
    { id: "2", title: "Python Code Generation", lastMessage: "Here's your Python function", date: "Today", messageCount: 8, isPinned: false },
    { id: "3", title: "Image Creation Tutorial", lastMessage: "Generated image ready", date: "Yesterday", messageCount: 6, isPinned: false },
    { id: "4", title: "Research Assistant", lastMessage: "Here's the research summary", date: "Yesterday", messageCount: 15, isPinned: true },
    { id: "5", title: "Debugging Help", lastMessage: "Found the bug in your code", date: "2 days ago", messageCount: 4, isPinned: false },
    { id: "6", title: "Web Search Results", lastMessage: "Latest AI news", date: "3 days ago", messageCount: 9, isPinned: false },
    { id: "7", title: "Document Analysis", lastMessage: "Document processed", date: "5 days ago", messageCount: 3, isPinned: false },
  ]);

  // Effects
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) setIsSidebarOpen(false);
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
        model: data.model,
      };
      setMessages(prev => [...prev, aiMessage]);
      setSessionId(data.session_id);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I apologize, but I'm having trouble connecting to my servers. Please ensure the backend is running and try again.",
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
    setSelectedFile(null);
  };

  const copyToClipboard = async (text: string, messageId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleFeedback = (messageId: string, type: "like" | "dislike") => {
    setFeedbackMessageId(messageId);
    setTimeout(() => setFeedbackMessageId(null), 2000);
    // TODO: Send feedback to backend
  };

  const togglePinSession = (sessionId: string) => {
    setPinnedSessions(prev => 
      prev.includes(sessionId) ? prev.filter(id => id !== sessionId) : [...prev, sessionId]
    );
    setSessions(prev => prev.map(session => 
      session.id === sessionId ? { ...session, isPinned: !session.isPinned } : session
    ));
  };

  const deleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  const startVoiceInput = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onresult = (event: any) => {
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
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

  const pinnedSessionsList = sessions.filter(s => s.isPinned);
  const recentSessions = sessions.filter(s => !s.isPinned);

  const currentAgent = AGENTS.find(a => a.id === activeAgent) || AGENTS[0];

  // ============================================
  // RENDER
  // ============================================
  
  return (
    <div 
      className="flex h-screen w-full overflow-hidden bg-gray-50 dark:bg-gray-900 transition-colors duration-300"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-500/20 backdrop-blur-sm"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-2xl border-2 border-dashed border-indigo-500">
              <div className="text-5xl mb-4">📁</div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Drop your file here</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">PDF, DOCX, TXT, JSON, CSV, PY, JS</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Selected Indicator */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-40 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 bg-indigo-600 text-white"
          >
            <span>📄</span>
            <span className="text-sm">{selectedFile.name}</span>
            <button onClick={() => setSelectedFile(null)} className="ml-2 hover:text-gray-200">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: isSidebarOpen ? 0 : -280 }}
        transition={{ type: "spring", damping: 20 }}
        className={`fixed lg:relative z-40 w-80 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-xl flex flex-col ${isSidebarOpen ? 'block' : 'hidden lg:block'}`}
      >
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
        <button
          onClick={newChat}
          className="mx-4 mt-4 py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <FiPlus size={18} /> New Conversation
        </button>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
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
        <div className="flex-1 overflow-y-auto">
          <div className="px-3">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 px-3 mb-2">MENU</p>
            <div className="space-y-1">
              {[
                { id: "chat", icon: <FiMessageSquare size={18} />, label: "Chat" },
                { id: "code", icon: <FiCode size={18} />, label: "Code Studio" },
                { id: "image", icon: <FiImage size={18} />, label: "Image Lab" },
                { id: "files", icon: <FiFolder size={18} />, label: "Documents" },
                { id: "search", icon: <FiSearch size={18} />, label: "Research" },
                { id: "analytics", icon: <FiGrid size={18} />, label: "Analytics" },
                { id: "settings", icon: <FiSettings size={18} />, label: "Settings" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    currentPage === item.id
                      ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  {item.icon}
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Pinned Chats */}
          {pinnedSessionsList.length > 0 && (
            <div className="px-3 mt-6">
              <div className="flex items-center justify-between px-3 mb-2">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500">PINNED</p>
                <FiStar size={12} className="text-yellow-500" />
              </div>
              <div className="space-y-1">
                {pinnedSessionsList.map((session) => (
                  <div key={session.id} className="group flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FiMessageSquare size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{session.title}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => togglePinSession(session.id)} className="p-1 hover:text-yellow-500">
                        <FiStar size={12} />
                      </button>
                      <button onClick={() => deleteSession(session.id)} className="p-1 hover:text-red-500">
                        <FiTrash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Chats */}
          {recentSessions.length > 0 && (
            <div className="px-3 mt-6 pb-6">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 px-3 mb-2">RECENT</p>
              <div className="space-y-1">
                {recentSessions.map((session) => (
                  <div key={session.id} className="group flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FiMessageSquare size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{session.title}</span>
                    </div>
                    <button onClick={() => deleteSession(session.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500">
                      <FiTrash2 size={12} />
                    </button>
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
              <p className="text-xs text-gray-400 dark:text-gray-500">Free Plan</p>
            </div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition">
              {isDarkMode ? <FiSun size={16} /> : <FiMoon size={16} />}
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <FiMenu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
                <span className="text-white text-sm font-bold">A</span>
              </div>
              <span className="font-semibold text-gray-800 dark:text-white">HundredXMind</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700">
              <span className="text-lg">{currentAgent.icon}</span>
              <span className="text-sm text-gray-600 dark:text-gray-300">{currentAgent.name}</span>
            </div>
            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition relative">
              <FiBell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
              <FiSettings size={18} />
            </button>
          </div>
        </header>

        {/* Messages Container */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 transition-colors duration-300"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-300px)] p-6">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center max-w-2xl"
              >
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-2xl animate-float">
                  <span className="text-white text-5xl">✨</span>
                </div>
                <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-3">Welcome to HundredXMind</h1>
                <p className="text-gray-500 dark:text-gray-400 mb-8">Your intelligent AI operating system. Ask me anything, generate code, create images, and more.</p>
                
                {/* Agent Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                  {AGENTS.map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => setActiveAgent(agent.id)}
                      className={`text-center p-3 rounded-xl transition-all ${activeAgent === agent.id ? 'bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-500' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md'}`}
                    >
                      <div className="text-2xl mb-1">{agent.icon}</div>
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300">{agent.name}</div>
                    </button>
                  ))}
                </div>

                {/* Suggestions Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SUGGESTIONS.slice(0, 6).map((suggestion, idx) => (
                    <motion.button
                      key={suggestion.id}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => setInput(suggestion.prompt)}
                      className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700 transition text-left group"
                    >
                      <span className="text-2xl">{suggestion.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">{suggestion.text}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{suggestion.agent}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
              {messages.map((msg, idx) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center flex-shrink-0 mr-3">
                      <span className="text-white text-xs font-bold">AI</span>
                    </div>
                  )}
                  <div className={`relative group max-w-[85%] ${msg.role === "user" ? "order-1" : "order-2"}`}>
                    <div
                      className={`rounded-2xl px-5 py-3 ${
                        msg.role === "user"
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                          : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 shadow-sm"
                      }`}
                    >
                      {msg.role === "assistant" && (
                        <div className="flex items-center gap-2 mb-2 text-xs text-gray-400">
                          <span>{currentAgent.icon}</span>
                          <span>{currentAgent.name}</span>
                        </div>
                      )}
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown
                          components={{
                            code({ className, children, ...props }) {
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
                                <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm" {...props}>
                                  {children}
                                </code>
                              );
                            },
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                      {msg.tokens && (
                        <div className="text-xs opacity-50 mt-2 flex items-center gap-2">
                          <span>🧠 {msg.tokens} tokens</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Message Actions */}
                    <div className={`absolute top-2 ${msg.role === "user" ? "-left-12" : "-right-12"} opacity-0 group-hover:opacity-100 transition flex gap-1`}>
                      <button onClick={() => copyToClipboard(msg.content, msg.id)} className="p-1.5 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700">
                        {copiedMessageId === msg.id ? <FiCheck size={12} className="text-green-500" /> : <FiCopy size={12} />}
                      </button>
                      {msg.role === "assistant" && (
                        <>
                          <button onClick={() => handleFeedback(msg.id, "like")} className="p-1.5 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700">
                            <FiHeart size={12} className={feedbackMessageId === msg.id ? "text-red-500 fill-red-500" : ""} />
                          </button>
                          <button onClick={() => handleFeedback(msg.id, "dislike")} className="p-1.5 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700">
                            <FiFlag size={12} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 ml-3">
                      <span className="text-gray-600 dark:text-gray-400 text-xs font-bold">U</span>
                    </div>
                  )}
                </motion.div>
              ))}
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center flex-shrink-0 mr-3">
                    <span className="text-white text-xs font-bold">AI</span>
                  </div>
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-3 shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Scroll to Bottom Button */}
        <AnimatePresence>
          {showScrollButton && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={scrollToBottom}
              className="fixed bottom-24 right-6 z-20 w-10 h-10 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition flex items-center justify-center"
            >
              <FiChevronDown size={20} />
            </motion.button>
          )}
        </AnimatePresence>

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
                    isRecording
                      ? "bg-red-500 text-white animate-pulse"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  <FiMic size={18} />
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all flex items-center justify-center"
                >
                  <FiPaperclip size={18} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.py,.js,.json,.csv,.md"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="w-12 h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all flex items-center justify-center"
                >
                  <FiSend size={18} />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 mt-3">
              <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                <span>AI Ready</span>
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500">
                {totalTokens > 0 && `${totalTokens.toLocaleString()} tokens used · `}
                HundredXMind AI-OS
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}