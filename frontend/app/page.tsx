"use client";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const agentColors: Record<string, string> = {
  chat: "bg-gray-700",
  code: "bg-purple-900",
  research: "bg-green-900",
  debug: "bg-red-900",
  file: "bg-yellow-900",
  search: "bg-blue-900",
  image: "bg-pink-900",
};

const agentIcons: Record<string, string> = {
  chat: "🤖",
  code: "💻",
  research: "🔍",
  debug: "🐛",
  file: "📁",
  search: "🌐",
  image: "🎨",
};

const agentLabels: Record<string, string> = {
  chat: "AI-OS",
  code: "Code Agent",
  research: "Research Agent",
  debug: "Debug Agent",
  file: "File Agent",
  search: "Web Search Agent",
  image: "Image Agent",
};

export default function Home() {
  const [messages, setMessages] = useState<{ role: string, content: string, agent?: string, tokens?: number, fileInfo?: any, image_base64?: string, image_type?: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentAgent, setCurrentAgent] = useState("chat");
  const [isListening, setIsListening] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const res = await fetch("https://hundredxmind.up.railway.app/sessions");
      const data = await res.json();
      setSessions(data.sessions);
    } catch (error) {
      console.log("Sessions load error:", error);
    }
  };

  const loadHistory = async (sid: string) => {
    try {
      const res = await fetch(`https://hundredxmind.up.railway.app/history/${sid}`);
      const data = await res.json();
      setMessages(data.history.map((m: any) => ({
        role: m.role === "assistant" ? "ai" : m.role,
        content: m.content,
        agent: m.agent,
        tokens: m.tokens
      })));
      setSessionId(sid);
      setShowSidebar(false);
    } catch (error) {
      console.log("History load error:", error);
    }
  };

  const deleteSession = async (sid: string) => {
    try {
      await fetch(`https://hundredxmind.up.railway.app/session/${sid}`, { method: "DELETE" });
      loadSessions();
      if (sessionId === sid) {
        setMessages([]);
        setSessionId(null);
      }
    } catch (error) {
      console.log("Delete error:", error);
    }
  };

  const startVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser voice support nahi karta!");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      setInput(event.results[0][0].transcript);
    };
    recognition.start();
  };

  const handleFile = (file: File) => {
    setSelectedFile(file);
  };

  const sendMessage = async () => {
    if ((!input.trim() && !selectedFile) || loading) return;

    setLoading(true);

    if (selectedFile) {
      const userMessage = {
        role: "user",
        content: `📁 File upload: **${selectedFile.name}** ${input ? `\n\nQuestion: ${input}` : ""}`
      };
      setMessages(prev => [...prev, userMessage]);

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("question", input);

      try {
        const res = await fetch("https://hundredxmind.up.railway.app/analyze-file", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        setCurrentAgent("file");
        setMessages(prev => [...prev, {
          role: "ai",
          content: data.response,
          agent: "file",
          tokens: data.tokens_used,
          fileInfo: data.file_info
        }]);
      } catch (error) {
        setMessages(prev => [...prev, {
          role: "ai",
          content: "❌ File analyze nahi ho saki!",
          agent: "file"
        }]);
      }

      setSelectedFile(null);
      setInput("");
      setLoading(false);
      return;
    }

    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");

    try {
      const res = await fetch("https://hundredxmind.up.railway.app/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          history: messages.map(m => ({
            role: m.role === "ai" ? "assistant" : m.role,
            content: m.content
          })),
          session_id: sessionId
        }),
      });

      const data = await res.json();
      setCurrentAgent(data.agent_used || "chat");
      if (data.session_id) setSessionId(data.session_id);
      setMessages(prev => [...prev, {
        role: "ai",
        content: data.response,
        agent: data.agent_used,
        tokens: data.tokens_used,
        image_base64: data.image_base64,
        image_type: data.image_type
      }]);
      loadSessions();
    } catch (error) {
      setMessages(prev => [...prev, {
        role: "ai",
        content: "❌ Error: Backend se connect nahi ho pa raha!",
        agent: "chat"
      }]);
    }

    setLoading(false);
  };

  return (
    <main
      className="flex h-screen bg-gray-900 text-white"
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
    >
      {dragOver && (
        <div className="absolute inset-0 bg-blue-600 bg-opacity-30 z-50 flex items-center justify-center border-4 border-blue-500 border-dashed">
          <div className="text-4xl font-bold">📁 File Drop Karo!</div>
        </div>
      )}

      {/* Sidebar */}
      {showSidebar && (
        <div className="w-72 bg-gray-800 border-r border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <span className="font-bold">💬 Chat History</span>
            <button onClick={() => setShowSidebar(false)} className="text-gray-400 hover:text-white">✕</button>
          </div>
          <button
            onClick={() => { setMessages([]); setSessionId(null); setShowSidebar(false); }}
            className="m-3 p-2 bg-blue-600 rounded-lg text-sm font-bold hover:bg-blue-700"
          >
            + New Chat
          </button>
          <div className="flex-1 overflow-y-auto">
            {sessions.map((session, i) => (
              <div key={i} className="p-3 border-b border-gray-700 hover:bg-gray-700 cursor-pointer group">
                <div className="flex justify-between items-start">
                  <div onClick={() => loadHistory(session.session_id)} className="flex-1">
                    <p className="text-xs text-gray-300 truncate">{session.last_message}</p>
                    <p className="text-xs text-gray-500 mt-1">{session.message_count} messages</p>
                  </div>
                  <button
                    onClick={() => deleteSession(session.session_id)}
                    className="text-red-400 hover:text-red-300 text-xs ml-2 opacity-0 group-hover:opacity-100"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Chat */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gray-800 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="text-gray-400 hover:text-white text-xl"
            >
              ☰
            </button>
            <div className="text-2xl font-bold tracking-widest">🤖 AI-OS</div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">Active Agent:</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${agentColors[currentAgent]}`}>
              {agentIcons[currentAgent]} {agentLabels[currentAgent]}
            </span>
          </div>
          <button
            onClick={() => { setMessages([]); setSessionId(null); loadSessions(); }}
            className="text-gray-400 hover:text-white text-sm px-3 py-1 rounded-lg hover:bg-gray-700"
          >
            🗑 Clear
          </button>

          <a
            href="/analytics"
            className="text-gray-400 hover:text-white text-sm px-3 py-1 rounded-lg hover:bg-gray-700"
          >
            📊 Analytics
          </a>


        </div>

        {/* Agent Info Bar */}
        <div className="flex gap-2 p-2 bg-gray-800 border-b border-gray-700 overflow-x-auto">
          {Object.keys(agentLabels).map(agent => (
            <div key={agent} className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs ${agentColors[agent]} opacity-70 whitespace-nowrap`}>
              {agentIcons[agent]} {agentLabels[agent]}
            </div>
          ))}
          <span className="text-gray-500 text-xs flex items-center ml-2 whitespace-nowrap">← Auto-selected</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center mt-16 space-y-4">
              <div className="text-5xl">🤖</div>
              <div className="text-xl font-bold">AI-OS mein aapka swagat hai!</div>
              <div className="text-gray-400 text-sm space-y-1">
                <p>💻 Code likhne ke liye: "Write a Python function..."</p>
                <p>🐛 Debug karne ke liye: "Fix this error..."</p>
                <p>🔍 Research ke liye: "Explain how..."</p>
                <p>📁 File analyze ke liye: File drag & drop karo!</p>
                <p>🎤 Voice ke liye: Mic button dabao!</p>
                <p>🎨 Image ke liye: "Generate image of..."</p>
                <p>🌐 Web search ke liye: "Latest news about..."</p>
              </div>
              <div className="mt-4 border-2 border-dashed border-gray-600 rounded-xl p-8 text-gray-500">
                📁 Yahan file drag & drop karo ya neeche 📎 click karo
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-3xl p-4 rounded-2xl text-sm leading-relaxed ${msg.role === "user"
                ? "bg-blue-600 rounded-br-none"
                : `${agentColors[msg.agent || "chat"]} rounded-bl-none`
                }`}>
                <div className="text-xs mb-2 opacity-60 flex justify-between">
                  <span>{msg.role === "user" ? "👤 You" : `${agentIcons[msg.agent || "chat"]} ${agentLabels[msg.agent || "chat"]}`}</span>
                  <span className="flex gap-2">
                    {msg.fileInfo && <span>📄 {msg.fileInfo.name} • {(msg.fileInfo.size / 1024).toFixed(1)}KB</span>}
                    {msg.tokens && <span>{msg.tokens} tokens</span>}
                  </span>
                </div>

                {msg.image_base64 && (
                  <div className="mb-3">
                    <img
                      src={`data:image/jpeg;base64,${msg.image_base64}`}
                      alt="Generated Image"
                      className="rounded-xl max-w-full w-full"
                    />
                  </div>
                )}

                {msg.role === "ai" ? (
                  <ReactMarkdown
                    components={{
                      code({ className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || "");
                        const codeString = String(children).replace(/\n$/, "");

                        if (match) {
                          return (
                            <div className="my-2">
                              <div className="flex justify-between items-center bg-gray-900 px-3 py-1 rounded-t-lg">
                                <span className="text-xs text-gray-400">{match[1]}</span>
                                <button
                                  onClick={async () => {
                                    const res = await fetch("https://hundredxmind.up.railway.app/execute-code", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ code: codeString, language: match[1] })
                                    });
                                    const data = await res.json();
                                    const output = data.output || data.error || "No output";
                                    alert(`Output:\n${output}`);
                                  }}
                                  className="text-xs bg-green-600 hover:bg-green-500 px-2 py-1 rounded text-white"
                                >
                                  ▶ Run
                                </button>
                              </div>
                              <SyntaxHighlighter
                                style={oneDark as any}
                                language={match[1]}
                                PreTag="div"
                                customStyle={{ borderRadius: "0 0 8px 8px", margin: 0 }}
                              >
                                {codeString}
                              </SyntaxHighlighter>
                            </div>
                          );
                        }
                        return (
                          <code className="bg-black px-1 rounded text-green-400" {...props}>
                            {children}
                          </code>
                        );
                      },
                      p: ({ children }) => <p className="mb-2">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                      h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-lg font-bold mb-2">{children}</h2>,
                      h3: ({ children }) => <h3 className="font-bold mb-1">{children}</h3>,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  <div className="whitespace-pre-wrap">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-700 p-4 rounded-2xl rounded-bl-none">
                <div className="flex gap-1 items-center">
                  <span className="text-xs text-gray-400 mr-2">AI-OS thinking</span>
                  <span className="animate-bounce">●</span>
                  <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>●</span>
                  <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>●</span>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Selected File Preview */}
        {selectedFile && (
          <div className="px-4 py-2 bg-yellow-900 border-t border-yellow-700 flex items-center justify-between">
            <span className="text-sm">📁 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
            <button onClick={() => setSelectedFile(null)} className="text-yellow-300 hover:text-white text-xs">✕ Remove</button>
          </div>
        )}

        {/* Input */}
        <div className="p-4 bg-gray-800 border-t border-gray-700 flex gap-2">
          <button
            onClick={() => {
              const inp = document.createElement('input');
              inp.type = 'file';
              inp.accept = '.pdf,.txt,.py,.js,.ts,.json,.csv,.md,.html,.css';
              inp.onchange = (e: any) => {
                const file = e.target.files[0];
                if (file) handleFile(file);
              };
              inp.click();
            }}
            className="px-4 rounded-xl bg-gray-600 hover:bg-gray-500 font-bold transition-colors"
          >
            📎
          </button>
          <button
            onClick={startVoice}
            className={`px-4 rounded-xl font-bold transition-colors ${isListening ? "bg-red-600 animate-pulse" : "bg-gray-600 hover:bg-gray-500"
              }`}
          >
            🎤
          </button>
          <input
            className="flex-1 bg-gray-700 rounded-xl p-3 outline-none text-sm focus:ring-2 focus:ring-blue-500"
            placeholder={selectedFile ? "File ke baare mein kuch pucho... (optional)" : "Kuch bhi pucho — Code, Debug, Research, Chat..."}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="bg-blue-600 px-6 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </main>
  );
}