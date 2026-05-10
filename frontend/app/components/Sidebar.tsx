"use client";
import { AGENTS, THEMES, Session } from "../constants";

type SidebarProps = {
  showSidebar: boolean;
  isMobile: boolean;
  currentAgent: string;
  sessions: Session[];
  sessionId: string | null;
  searchQuery: string;
  totalTokens: number;
  theme: string;
  onClose: () => void;
  onNewChat: () => void;
  onLoadHistory: (sid: string) => void;
  onDeleteSession: (sid: string) => void;
  onSearchChange: (q: string) => void;
  onThemeClick: () => void;
  formatDate: (s: string) => string;
};

export default function Sidebar({
  showSidebar, isMobile, currentAgent, sessions, sessionId,
  searchQuery, totalTokens, theme, onClose, onNewChat,
  onLoadHistory, onDeleteSession, onSearchChange, onThemeClick, formatDate
}: SidebarProps) {
  const currentTheme = THEMES.find(t => t.id === theme) || THEMES[0];
  const filtered = sessions.filter(s => s.last_message?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <aside
      className={`${isMobile ? "absolute z-40 h-full" : "relative"} ${showSidebar ? "w-72" : "w-0"} transition-all duration-300 overflow-hidden flex-shrink-0 flex flex-col border-r`}
      style={{ background: "var(--sidebar)", borderColor: "var(--border)" }}
    >
      <div className="flex flex-col h-full p-4 w-72 overflow-hidden">
        {/* Logo */}
        <div className="flex items-center justify-between px-2 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-base shadow-lg" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>A</div>
            <div>
              <div className="font-bold text-sm">AI-OS</div>
              <div className="text-xs" style={{ color: "var(--text-secondary)" }}>7 Specialized Agents</div>
            </div>
          </div>
          {isMobile && (
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl" style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>✕</button>
          )}
        </div>

        {/* New Chat */}
        <button
          onClick={onNewChat}
          className="flex items-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-medium text-white mb-4 transition-all hover:opacity-90 active:scale-95"
          style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          New Chat
        </button>

        {/* Agents */}
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-widest px-2 mb-3" style={{ color: "var(--text-secondary)" }}>Agents</p>
          <div className="space-y-0.5">
            {Object.entries(AGENTS).map(([key, val]) => (
              <div key={key} className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all cursor-default"
                style={{ background: currentAgent === key ? "var(--accent)" + "20" : "transparent", color: currentAgent === key ? "var(--accent)" : "var(--text-secondary)" }}>
                <span className="text-base">{val.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{val.label}</div>
                  <div className="text-xs truncate opacity-60">{val.desc}</div>
                </div>
                {currentAgent === key && <div className="w-2 h-2 rounded-full animate-pulse flex-shrink-0" style={{ background: "var(--accent)" }}></div>}
              </div>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "var(--text-secondary)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs rounded-xl outline-none"
            style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
          />
        </div>

        {/* History */}
        <div className="flex-1 overflow-y-auto scrollbar-hide space-y-0.5">
          <p className="text-xs font-bold uppercase tracking-widest px-2 mb-2" style={{ color: "var(--text-secondary)" }}>History</p>
          {filtered.length === 0 && <div className="text-center py-6 text-xs" style={{ color: "var(--text-secondary)" }}>No conversations yet</div>}
          {filtered.map((s, i) => (
            <div key={i} onClick={() => onLoadHistory(s.session_id)}
              className="group flex items-start gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all active:scale-95"
              style={{ background: sessionId === s.session_id ? "var(--bg-tertiary)" : "transparent" }}>
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs flex-shrink-0 mt-0.5"
                style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>✦</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs truncate" style={{ color: "var(--text-primary)" }}>{s.last_message}</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{formatDate(s.last_time)}</span>
                  <span style={{ color: "var(--border)" }}>•</span>
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{s.message_count} msgs</span>
                </div>
              </div>
              <button onClick={e => { e.stopPropagation(); onDeleteSession(s.session_id); }}
                className="opacity-0 group-hover:opacity-100 text-xs transition-all flex-shrink-0"
                style={{ color: "var(--text-secondary)" }}>✕</button>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="pt-3 mt-2 space-y-1" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between px-3 py-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
            <span>Tokens used</span>
            <span className="font-semibold">{totalTokens.toLocaleString()}</span>
          </div>
          <button onClick={onThemeClick} className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs transition-all active:scale-95"
            style={{ color: "var(--text-secondary)", background: "var(--bg-tertiary)" }}>
            <span>{currentTheme.icon}</span><span>{currentTheme.name} Theme</span><span className="ml-auto">↗</span>
          </button>
          <a href="/analytics" className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all"
            style={{ color: "var(--text-secondary)" }}>{"📊"} Analytics</a>
        </div>
      </div>
    </aside>
  );
}