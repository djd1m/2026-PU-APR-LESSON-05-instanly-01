"use client";

import { Mail, Send, Reply, UserCheck } from "lucide-react";
import { TopBar } from "@/components/TopBar";

const kpiCards = [
  { label: "Active Campaigns", value: "12", icon: Mail, change: "+3 this week" },
  { label: "Emails Sent", value: "8,432", icon: Send, change: "+1,204 today" },
  { label: "Reply Rate", value: "4.2%", icon: Reply, change: "+0.3% vs last week" },
  { label: "Active Accounts", value: "24", icon: UserCheck, change: "2 warming up" },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col">
      <TopBar />
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-border-default bg-bg-secondary p-6"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-text-secondary text-sm">{card.label}</span>
                <card.icon className="w-5 h-5 text-text-muted" />
              </div>
              <p className="text-3xl font-bold">{card.value}</p>
              <p className="text-text-muted text-xs mt-1">{card.change}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
