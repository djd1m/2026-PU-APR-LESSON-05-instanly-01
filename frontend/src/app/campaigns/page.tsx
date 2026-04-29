"use client";

import { Plus } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { DataTable, Column } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";

interface Campaign {
  id: string;
  name: string;
  status: "active" | "paused" | "draft" | "completed" | "error";
  sent: number;
  opens: number;
  replies: number;
  createdAt: string;
}

const mockCampaigns: Campaign[] = [
  { id: "1", name: "Q2 Outreach - SaaS CTOs", status: "active", sent: 1240, opens: 312, replies: 48, createdAt: "2026-04-15" },
  { id: "2", name: "Partnership Proposal", status: "paused", sent: 560, opens: 134, replies: 12, createdAt: "2026-04-10" },
  { id: "3", name: "Product Launch Announce", status: "draft", sent: 0, opens: 0, replies: 0, createdAt: "2026-04-28" },
  { id: "4", name: "Re-engagement Flow", status: "completed", sent: 3200, opens: 890, replies: 156, createdAt: "2026-03-20" },
  { id: "5", name: "Cold Outreach - EU Market", status: "error", sent: 89, opens: 12, replies: 2, createdAt: "2026-04-22" },
];

const columns: Column<Campaign>[] = [
  { key: "name", label: "Campaign", sortable: true },
  {
    key: "status",
    label: "Status",
    render: (val) => <StatusBadge status={val as Campaign["status"]} />,
  },
  { key: "sent", label: "Sent", sortable: true },
  { key: "opens", label: "Opens", sortable: true },
  { key: "replies", label: "Replies", sortable: true },
  { key: "createdAt", label: "Created", sortable: true },
];

export default function CampaignsPage() {
  return (
    <div className="flex flex-col">
      <TopBar />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Campaigns</h1>
          <button className="inline-flex items-center gap-2 rounded-xl px-4 py-2 font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors">
            <Plus className="h-4 w-4" />
            Add New
          </button>
        </div>

        <DataTable columns={columns} data={mockCampaigns} />
      </div>
    </div>
  );
}
