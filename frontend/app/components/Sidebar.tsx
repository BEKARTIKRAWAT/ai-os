"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { AGENTS, THEMES } from "../constants";

interface SidebarProps {
  showSidebar: boolean;
  isMobile: boolean;
  currentAgent: string;
  sessions: any[];
  sessionId: string | null;
  searchQuery: string;
  totalTokens: number;
  theme: string;
  onClose: () => void;
  onNewChat: () => void;
  onLoadHistory: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onSearchChange: (q: string) => void;
  onThemeClick: () => void;
  formatDate: (date: string) => string;
}

export default function Sidebar({
  showSidebar,
  isMobile,
  currentAgent,
  sessions,
  sessionId,
  searchQuery,
  totalTokens,
  theme,
  onClose,
  onNewChat,
  onLoadHistory,
  onDeleteSession,
  onSearchChange,
  onThemeClick,
  formatDate,
}: SidebarProps) {
  const [mounted, setMounted] = useState(false);
// Add this useEffect in Sidebar component for Android gesture detection
useEffect(() => {
  let touchStartX = 0;
  
  const handleTouchStart = (e: TouchEvent) => {
    touchStartX = e.touches[0].clientX;
  };
  
  const handleTouchEnd = (e: TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const swipeDistance = touchEndX - touchStartX;
    
    // Right swipe to open sidebar on Android
    if (swipeDistance > 80 && touchStartX < 50 && !showSidebar && isMobile) {
      onClose(); // This actually opens it - fix naming
    }
    
    // Left swipe to close
    if (swipeDistance < -80 && showSidebar && isMobile) {
      onClose();
    }
  };
  
  if (isMobile) {
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);
  }
  
  return () => {
    document.removeEventListener('touchstart', handleTouchStart);
    document.removeEventListener('touchend', handleTouchEnd);
  };
}, [isMobile, showSidebar, onClose]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const filteredSessions = sessions.filter(s =>
    s.last_message?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sidebarContent = (
    <div 
      className={`h-full flex flex-col transition-all duration-300 ${
        isMobile ? "w-72" : "w-72"
      }`}
      style={{ 
        background: "var(--bg-secondary)",
        borderRight: "1px solid var(--border)"
      }}
    >
      {/* Header - Responsive */}
      <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
            >
              A
            </div>
            <span className="font-semibold hidden sm:inline" style={{ color: "var(--text-primary)" }}>
              AI-OS
            </span>
          </div>
          {isMobile && (
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg"
              style={{ color: "var(--text-secondary)" }}
            >
              ✕
            </button>
          )}
        </div>

        {/* New Chat Button - Touch friendly */}
        <button
          onClick={onNewChat}
          className="w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-98"
          style={{ 
            background: "var(--accent)",
            color: "white",
            minHeight: "44px"
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-sm font-medium">New Chat</span>
        </button>
      </div>

      {/* Search - Responsive */}
      <div className="p-4">
        <div className="relative">
          <svg 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
            style={{ color: "var(--text-secondary)" }}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none transition-all"
            style={{ 
              background: "var(--bg-tertiary)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
              minHeight: "40px"
            }}
          />
        </div>
      </div>

      {/* Sessions List - Responsive scroll */}
      <div className="flex-1 overflow-y-auto px-4">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">💬</div>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              No conversations yet
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
              Start a new chat!
            </p>
          </div>
        ) : (
          <div className="space-y-1 pb-4">
            {filteredSessions.map((session) => (
              <div
                key={session.session_id}
                className={`group rounded-lg transition-all ${
                  sessionId === session.session_id ? "active" : ""
                }`}
                style={{
                  background: sessionId === session.session_id ? "var(--accent)" : "transparent",
                }}
              >
                <button
                  onClick={() => onLoadHistory(session.session_id)}
                  className="w-full text-left p-3 rounded-lg transition-all hover:opacity-80"
                  style={{ minHeight: "60px" }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium truncate"
                        style={{
                          color: sessionId === session.session_id ? "white" : "var(--text-primary)",
                        }}
                      >
                        {session.last_message || "New conversation"}
                      </p>
                      <p
                        className="text-xs mt-1"
                        style={{
                          color: sessionId === session.session_id ? "rgba(255,255,255,0.7)" : "var(--text-secondary)",
                        }}
                      >
                        {formatDate(session.last_time)} • {session.message_count} messages
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.session_id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
                      style={{ minWidth: "32px", minHeight: "32px" }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer - Responsive */}
      <div className="p-4 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: "var(--text-secondary)" }}>Tokens used</span>
            <span className="font-mono" style={{ color: "var(--accent)" }}>
              {totalTokens.toLocaleString()}
            </span>
          </div>
          
          <button
            onClick={onThemeClick}
            className="w-full flex items-center justify-between p-2 rounded-lg transition-all active:scale-98"
            style={{ 
              background: "var(--bg-tertiary)",
              minHeight: "44px"
            }}
          >
            <span className="text-sm" style={{ color: "var(--text-primary)" }}>
              {THEMES.find(t => t.id === theme)?.name || "Theme"}
            </span>
            <span className="text-xl">
              {THEMES.find(t => t.id === theme)?.icon || "🎨"}
            </span>
          </button>

          <Link
            href="/analytics"
            className="w-full flex items-center gap-2 p-2 rounded-lg transition-all active:scale-98"
            style={{ 
              background: "var(--bg-tertiary)",
              color: "var(--text-primary)",
              minHeight: "44px"
            }}
          >
            <span>📊</span>
            <span className="text-sm">Analytics</span>
          </Link>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {showSidebar && (
          <>
            <div 
              className="fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity"
              onClick={onClose}
            />
            <div className="fixed left-0 top-0 bottom-0 z-50 shadow-xl">
              {sidebarContent}
            </div>
          </>
        )}
      </>
    );
  }

  return (
    <div className={`${showSidebar ? "block" : "hidden"} lg:block`}>
      {sidebarContent}
    </div>
  );
}