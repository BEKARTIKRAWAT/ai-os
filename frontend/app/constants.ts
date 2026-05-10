export const API = "https://hundredxmind.onrender.com";

export interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  agent?: string;
  tokens?: number;
  timestamp?: Date;
}

export interface Session {
  session_id: string;
  last_message: string;
  last_time: string;
  message_count: number;
}

export const AGENTS = {
  chat: { label: "Chat", icon: "💬", color: "#3B82F6" },
  code: { label: "Code", icon: "</>", color: "#10B981" },
  research: { label: "Research", icon: "🔬", color: "#8B5CF6" },
  debug: { label: "Debug", icon: "🐛", color: "#EF4444" },
  search: { label: "Search", icon: "🔍", color: "#F59E0B" },
  image: { label: "Image", icon: "🎨", color: "#EC4899" },
  file: { label: "File", icon: "📄", color: "#6B7280" }
};

export const SUGGESTIONS = [
  { text: "Write a Python function to sort a list", agent: "code", icon: "💻" },
  { text: "Explain quantum computing simply", agent: "research", icon: "⚛️" },
  { text: "Search for latest AI news", agent: "search", icon: "🌐" },
  { text: "Generate an image of a futuristic city", agent: "image", icon: "🎨" }
];

export const THEMES = [
  { id: "light", name: "Light", icon: "☀️", desc: "Bright and clean" },
  { id: "dark", name: "Dark", icon: "🌙", desc: "Easy on eyes" },
  { id: "purple", name: "Purple Haze", icon: "🟣", desc: "Deep purple" },
  { id: "ocean", name: "Ocean", icon: "🌊", desc: "Calm blue" },
  { id: "sunset", name: "Sunset", icon: "🌅", desc: "Warm orange" },
  { id: "forest", name: "Forest", icon: "🌲", desc: "Nature green" }
];

export const THEME_STYLES: Record<string, any> = {
  light: { "--bg-primary": "#ffffff", "--bg-secondary": "#f3f4f6", "--bg-tertiary": "#e5e7eb", "--text-primary": "#111827", "--text-secondary": "#6b7280", "--accent": "#3B82F6", "--accent-2": "#2563EB", "--border": "#e5e7eb", "--header": "#ffffff" },
  dark: { "--bg-primary": "#0f0f0f", "--bg-secondary": "#1a1a1a", "--bg-tertiary": "#2a2a2a", "--text-primary": "#f3f4f6", "--text-secondary": "#9ca3af", "--accent": "#3B82F6", "--accent-2": "#60A5FA", "--border": "#2a2a2a", "--header": "#1a1a1a" },
  purple: { "--bg-primary": "#0a0a1a", "--bg-secondary": "#1a1a3a", "--bg-tertiary": "#2a2a4a", "--text-primary": "#f0f0ff", "--text-secondary": "#b0b0d0", "--accent": "#a855f7", "--accent-2": "#c084fc", "--border": "#2a2a4a", "--header": "#1a1a3a" },
  ocean: { "--bg-primary": "#0a2a3a", "--bg-secondary": "#0a3a4a", "--bg-tertiary": "#0a4a5a", "--text-primary": "#e0f0f0", "--text-secondary": "#80c0d0", "--accent": "#06b6d4", "--accent-2": "#22d3ee", "--border": "#0a4a5a", "--header": "#0a3a4a" },
  sunset: { "--bg-primary": "#2a1a0a", "--bg-secondary": "#3a2a1a", "--bg-tertiary": "#4a3a2a", "--text-primary": "#fff0e0", "--text-secondary": "#e0b080", "--accent": "#f97316", "--accent-2": "#fb923c", "--border": "#4a3a2a", "--header": "#3a2a1a" },
  forest: { "--bg-primary": "#0a1a0a", "--bg-secondary": "#1a2a1a", "--bg-tertiary": "#2a3a2a", "--text-primary": "#e0f0e0", "--text-secondary": "#80c080", "--accent": "#22c55e", "--accent-2": "#4ade80", "--border": "#2a3a2a", "--header": "#1a2a1a" }
};