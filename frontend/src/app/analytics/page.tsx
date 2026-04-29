"use client";

import { Mail, MousePointerClick, Reply, AlertTriangle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TopBar } from "@/components/TopBar";

const kpis = [
  { label: "Total Sent", value: "24,832", icon: Mail, change: "+12% vs last month" },
  { label: "Open Rate", value: "38.4%", icon: MousePointerClick, change: "+2.1%" },
  { label: "Reply Rate", value: "4.2%", icon: Reply, change: "+0.3%" },
  { label: "Bounce Rate", value: "1.8%", icon: AlertTriangle, change: "-0.5%" },
];

const chartData = [
  { date: "Apr 1", sent: 420, opens: 168, replies: 18 },
  { date: "Apr 5", sent: 580, opens: 232, replies: 24 },
  { date: "Apr 10", sent: 640, opens: 268, replies: 28 },
  { date: "Apr 15", sent: 890, opens: 356, replies: 38 },
  { date: "Apr 20", sent: 1020, opens: 410, replies: 44 },
  { date: "Apr 25", sent: 1180, opens: 472, replies: 52 },
  { date: "Apr 29", sent: 1340, opens: 536, replies: 58 },
];

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col">
      <TopBar />
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">Analytics</h1>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-2xl border border-border-default bg-bg-secondary p-6"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-text-secondary text-sm">{kpi.label}</span>
                <kpi.icon className="w-5 h-5 text-text-muted" />
              </div>
              <p className="text-3xl font-bold">{kpi.value}</p>
              <p className="text-text-muted text-xs mt-1">{kpi.change}</p>
            </div>
          ))}
        </div>

        {/* Area Chart */}
        <div className="rounded-2xl border border-border-default bg-bg-secondary p-6">
          <h2 className="text-lg font-semibold mb-4">Sending Activity</h2>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradOpens" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradReplies" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d34" />
                <XAxis dataKey="date" stroke="#8b949e" fontSize={12} />
                <YAxis stroke="#8b949e" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#15171c",
                    border: "1px solid #2a2d34",
                    borderRadius: "12px",
                    color: "#e5e7eb",
                  }}
                />
                <Area type="monotone" dataKey="sent" stroke="#2563eb" fill="url(#gradSent)" strokeWidth={2} />
                <Area type="monotone" dataKey="opens" stroke="#22c55e" fill="url(#gradOpens)" strokeWidth={2} />
                <Area type="monotone" dataKey="replies" stroke="#7c3aed" fill="url(#gradReplies)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
