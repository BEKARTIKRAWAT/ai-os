"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const API = "https://hundredxmind.up.railway.app";

const AGENT_META: Record<string, { icon: string; label: string; color: string; bg: string; gradient: string }> = {
  chat: { icon: "✦", label: "Chat Agent", color: "text-violet-600", bg: "bg-violet-50", gradient: "from-violet-500 to-purple-600" },
  code: { icon: "⌥", label: "Code Agent", color: "text-blue-600", bg: "bg-blue-50", gradient: "from-blue-500 to-cyan-600" },
  research: { icon: "◎", label: "Research Agent", color: "text-emerald-600", bg: "bg-emerald-50", gradient: "from-emerald-500 to-teal-600" },
  debug: { icon: "⚡", label: "Debug Agent", color: "text-red-600", bg: "bg-red-50", gradient: "from-red-500 to-rose-600" },
  file: { icon: "◈", label: "File Agent", color: "text-amber-600", bg: "bg-amber-50", gradient: "from-amber-500 to-orange-600" },
  search: { icon: "⊕", label: "Search Agent", color: "text-sky-600", bg: "bg-sky-50", gradient: "from-sky-500 to-blue-600" },
  image: { icon: "◉", label: "Image Agent", color: "text-pink-600", bg: "bg-pink-50", gradient: "from-pink-500 to-rose-600" },
};

export default function Analytics() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => { loadAnalytics(); }, []);

  const loadAnalytics = async () => {
    try {
      const res = await fetch(`${API}/analytics`);
      const data = await res.json();
      setAnalytics(data);
    } catch { }
    setLoading(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500 text-sm">Loading analytics...</p>
      </div>
    </div>
  );

  const maxCount = Math.max(...(analytics?.agent_stats?.map((a: any) => a.count) || [1]));
  const topAgent = analytics?.agent_stats?.sort((a: any, b: any) => b.count - a.count)[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">A</div>
              <span className="font-semibold text-gray-800">AI-OS</span>
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm text-gray-500">Analytics</span>
          </div>
          <Link href="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Chat
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-500">Real-time insights into your AI-OS usage and performance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Messages", value: analytics?.total_messages || 0, icon: "💬", color: "from-violet-500 to-purple-600", change: "+12%" },
            { label: "Active Sessions", value: analytics?.total_sessions || 0, icon: "🗂️", color: "from-blue-500 to-cyan-600", change: "+5%" },
            { label: "Tokens Used", value: (analytics?.total_tokens || 0).toLocaleString(), icon: "⚡", color: "from-emerald-500 to-teal-600", change: "+28%" },
            { label: "Agents Active", value: analytics?.agent_stats?.length || 0, icon: "🤖", color: "from-pink-500 to-rose-600", change: "All 7" },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center text-lg`}>
                  {stat.icon}
                </div>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{stat.change}</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Agent Usage Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Agent Usage</h2>
              <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">All time</span>
            </div>
            <div className="space-y-4">
              {analytics?.agent_stats
                ?.sort((a: any, b: any) => b.count - a.count)
                ?.map((agent: any, i: number) => {
                  const meta = AGENT_META[agent.agent] || AGENT_META.chat;
                  const pct = Math.round((agent.count / maxCount) * 100);
                  return (
                    <div key={i} className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${meta.bg} ${meta.color} flex-shrink-0`}>
                        {meta.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700">{meta.label}</span>
                          <span className="text-gray-400">{agent.count} msgs • {agent.total_tokens?.toLocaleString()} tokens</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${meta.gradient} rounded-full transition-all duration-1000`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-gray-500 w-10 text-right">{pct}%</span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Top Agent Card */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">🏆 Top Agent</h2>
              {topAgent && (() => {
                const meta = AGENT_META[topAgent.agent] || AGENT_META.chat;
                return (
                  <div className="text-center">
                    <div className={`w-20 h-20 bg-gradient-to-br ${meta.gradient} rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg`}>
                      {meta.icon}
                    </div>
                    <div className="text-xl font-bold text-gray-900">{meta.label}</div>
                    <div className="text-sm text-gray-500 mt-1">{topAgent.count} messages</div>
                    <div className="text-sm text-gray-400">{topAgent.total_tokens?.toLocaleString()} tokens</div>
                    <div className={`mt-4 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${meta.bg} ${meta.color}`}>
                      Most Used Agent
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="bg-gradient-to-br from-violet-500 to-pink-500 rounded-2xl p-6 text-white">
              <div className="text-4xl mb-3">🚀</div>
              <div className="font-semibold mb-1">AI-OS v1.0</div>
              <div className="text-violet-200 text-sm mb-3">Full Stack AI Platform</div>
              <div className="text-xs text-violet-200">7 Agents • MongoDB • FastAPI • Next.js</div>
            </div>
          </div>
        </div>

        {/* Agent Cards */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">All Agents Overview</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
            {Object.entries(AGENT_META).map(([key, meta]) => {
              const stat = analytics?.agent_stats?.find((a: any) => a.agent === key);
              return (
                <div key={key} className={`${meta.bg} rounded-xl p-4 text-center border border-opacity-50 hover:shadow-md transition-all`}>
                  <div className={`text-2xl mb-2 ${meta.color}`}>{meta.icon}</div>
                  <div className={`text-xs font-semibold ${meta.color} mb-1`}>{meta.label.replace(" Agent", "")}</div>
                  <div className="text-lg font-bold text-gray-800">{stat?.count || 0}</div>
                  <div className="text-xs text-gray-400">messages</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-400">
          Built by <span className="text-violet-600 font-medium">Kartik Rawat</span> •
          <a href="https://github.com/BEKARTIKRAWAT/ai-os" className="text-violet-600 hover:underline ml-1">GitHub</a> •
          <a href="https://bekartikrawatt.netlify.app" className="text-violet-600 hover:underline ml-1">Portfolio</a>
        </div>
      </main>
    </div>
  );
}