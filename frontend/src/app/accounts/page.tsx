"use client";

import { Plus } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { DataTable, Column } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { WarmupHealthIndicator } from "@/components/WarmupHealthIndicator";

interface Account {
  id: string;
  email: string;
  provider: string;
  status: "active" | "paused" | "error";
  warmup: number;
  sentToday: number;
  dailyLimit: number;
}

const mockAccounts: Account[] = [
  { id: "1", email: "sales@company.ru", provider: "Yandex", status: "active", warmup: 92, sentToday: 34, dailyLimit: 50 },
  { id: "2", email: "outreach@company.ru", provider: "Mail.ru", status: "active", warmup: 78, sentToday: 28, dailyLimit: 40 },
  { id: "3", email: "alex@company.ru", provider: "Yandex", status: "paused", warmup: 45, sentToday: 0, dailyLimit: 30 },
  { id: "4", email: "team@startup.io", provider: "Custom SMTP", status: "active", warmup: 88, sentToday: 42, dailyLimit: 60 },
  { id: "5", email: "hello@brand.ru", provider: "Mail.ru", status: "error", warmup: 12, sentToday: 0, dailyLimit: 25 },
];

const columns: Column<Account>[] = [
  { key: "email", label: "Email", sortable: true },
  { key: "provider", label: "Provider", sortable: true },
  {
    key: "status",
    label: "Status",
    render: (val) => <StatusBadge status={val as Account["status"]} />,
  },
  {
    key: "warmup",
    label: "Warmup Health",
    sortable: true,
    render: (val) => <WarmupHealthIndicator percentage={val as number} />,
  },
  {
    key: "sentToday",
    label: "Sent Today",
    sortable: true,
    render: (val, row) => (
      <span className="text-text-secondary">
        {val as number} / {row.dailyLimit}
      </span>
    ),
  },
];

export default function AccountsPage() {
  return (
    <div className="flex flex-col">
      <TopBar />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Email Accounts</h1>
          <button className="inline-flex items-center gap-2 rounded-xl px-4 py-2 font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors">
            <Plus className="h-4 w-4" />
            Add Account
          </button>
        </div>

        <DataTable columns={columns} data={mockAccounts} />
      </div>
    </div>
  );
}
