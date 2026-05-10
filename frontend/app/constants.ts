export const API = "https://hundredxmind.onrender.com";

export const THEMES = [
  { id: "light", name: "Light", icon: "☀️", desc: "Clean & Minimal" },
  { id: "dark", name: "Dark", icon: "🌙", desc: "Easy on Eyes" },
  { id: "ocean", name: "Ocean", icon: "🌊", desc: "Deep Blue" },
  { id: "forest", name: "Forest", icon: "🌿", desc: "Nature Green" },
  { id: "sunset", name: "Sunset", icon: "🌅", desc: "Purple Dusk" },
];

export const AGENTS: Record<string, { icon: string; label: string; desc: string }> = {
  chat: { icon: "✦", label: "AI-OS", desc: "General Assistant" },
  code: { icon: "⌥", label: "Code", desc: "Write & Execute Code" },
  research: { icon: "◎", label: "Research", desc: "Deep Analysis" },
  debug: { icon: "⚡", label: "Debug", desc: "Fix Errors Fast" },
  file: { icon: "◈", label: "File", desc: "Analyze Documents" },
  search: { icon: "⊕", label: "Search", desc: "Real-time Web" },
  image: { icon: "◉", label: "Image", desc: "AI Art Generation" },
};

export const SUGGESTIONS = [
  { icon: "💻", text: "Write a REST API with authentication in Python", agent: "code" },
  { icon: "🌐", text: "Latest breakthroughs in AI today?", agent: "search" },
  { icon: "🎨", text: "Generate a cyberpunk city at night", agent: "image" },
  { icon: "🔍", text: "Explain large language models architecture", agent: "research" },
];

export type Message = {
  id: string;
  role: string;
  content: string;
  agent?: string;
  tokens?: number;
  fileInfo?: any;
  image_base64?: string;
  timestamp: Date;
  isError?: boolean;
};

export type Session = {
  session_id: string;
  last_message: string;
  message_count: number;
  last_time: string;
};