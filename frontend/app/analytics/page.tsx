"use client";
import { useState, useEffect } from "react";

const agentColors: Record<string, string> = {
  chat: "#6B7280",
  code: "#7C3AED",
  research: "#059669",
  debug: "#DC2626",
  file: "#D97706",
  search: "#2563EB",
  image: "#DB2777",
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

export default function Analytics() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/analytics");
      const data = await res.json();
      setAnalytics(data);
    } catch (error) {
      console.log("Analytics load error:", error);
    }
    setLoading(false);
  };

  if (loading) return (
    <div className="flex h-screen bg-gray-900 text-white items-center justify-center">
      <div className="text-2xl animate-pulse">📊 Loading Analytics...</div>
    </div>
  );

  const maxCount = Math.max(...(analytics?.agent_stats?.map((a: any) => a.count) || [1]));

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">📊 AI-OS Analytics</h1>
          <p className="text-gray-400 mt-1">Real-time usage statistics</p>
        </div>
        <a href="/" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl text-sm font-bold">
          ← Back to AI-OS
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <div className="text-4xl mb-2">💬</div>
          <div className="text-3xl font-bold">{analytics?.total_messages || 0}</div>
          <div className="text-gray-400 text-sm mt-1">Total Messages</div>
        </div>
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <div className="text-4xl mb-2">🗂️</div>
          <div className="text-3xl font-bold">{analytics?.total_sessions || 0}</div>
          <div className="text-gray-400 text-sm mt-1">Total Sessions</div>
        </div>
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <div className="text-4xl mb-2">⚡</div>
          <div className="text-3xl font-bold">{analytics?.total_tokens?.toLocaleString() || 0}</div>
          <div className="text-gray-400 text-sm mt-1">Total Tokens Used</div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 mb-8">
        <h2 className="text-xl font-bold mb-6">🤖 Agent Usage</h2>
        <div className="space-y-4">
          {analytics?.agent_stats
            ?.sort((a: any, b: any) => b.count - a.count)
            ?.map((agent: any, i: number) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">
                    {agentIcons[agent.agent] || "🤖"} {agent.agent || "unknown"}
                  </span>
                  <span className="text-sm text-gray-400">{agent.count} messages • {agent.total_tokens} tokens</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${(agent.count / maxCount) * 100}%`,
                      backgroundColor: agentColors[agent.agent] || "#6B7280"
                    }}
                  />
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold mb-4">🏆 Most Used Agent</h2>
        {analytics?.agent_stats?.length > 0 && (() => {
          const top = [...analytics.agent_stats].sort((a: any, b: any) => b.count - a.count)[0];
          return (
            <div className="flex items-center gap-4">
              <div className="text-6xl">{agentIcons[top.agent] || "🤖"}</div>
              <div>
                <div className="text-2xl font-bold capitalize">{top.agent} Agent</div>
                <div className="text-gray-400">{top.count} messages • {top.total_tokens} tokens used</div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}