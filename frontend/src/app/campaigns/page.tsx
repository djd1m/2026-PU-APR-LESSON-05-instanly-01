"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Play, Pause, RotateCcw, Trash2, Loader2, Inbox } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { DataTable, Column } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://212.192.0.33:4000";

interface Campaign {
  id: string;
  name: string;
  status: "active" | "paused" | "draft" | "completed" | "error";
  sent: number;
  opens: number;
  replies: number;
  bounced: number;
  created_at: string;
}

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`${API_URL}/api/v1/campaigns`, {
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error(`Failed to fetch campaigns: ${res.statusText}`);
      }
      const json = await res.json();
      const data = Array.isArray(json) ? json : json.data ?? [];
      setCampaigns(
        data.map((c: Record<string, unknown>) => ({
          id: c.id as string,
          name: (c.name as string) || "Untitled",
          status: (c.status as Campaign["status"]) || "draft",
          sent: (c.sent as number) ?? (c.emails_sent as number) ?? 0,
          opens: (c.opens as number) ?? (c.emails_opened as number) ?? 0,
          replies: (c.replies as number) ?? (c.emails_replied as number) ?? 0,
          bounced: (c.bounced as number) ?? (c.emails_bounced as number) ?? 0,
          created_at: (c.created_at as string) || (c.createdAt as string) || "",
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  async function handleAction(id: string, action: "start" | "pause" | "resume" | "delete") {
    if (action === "delete" && !confirm("Are you sure you want to delete this campaign?")) {
      return;
    }

    setActionLoading(id);
    try {
      const method = action === "delete" ? "DELETE" : "POST";
      const endpoint =
        action === "delete"
          ? `${API_URL}/api/v1/campaigns/${id}`
          : `${API_URL}/api/v1/campaigns/${id}/${action}`;

      const res = await fetch(endpoint, {
        method,
        credentials: "include",
      });

      if (!res.ok) {
        const body = await res.text();
        let msg: string;
        try {
          msg = JSON.parse(body).message || body;
        } catch {
          msg = body || res.statusText;
        }
        throw new Error(msg);
      }

      await fetchCampaigns();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  }

  const columns: Column<Campaign>[] = [
    {
      key: "name",
      label: "Campaign",
      sortable: true,
      render: (_val, row) => (
        <button
          onClick={() => router.push(`/campaigns/${row.id}`)}
          className="text-blue-400 hover:text-blue-300 hover:underline text-left font-medium"
        >
          {row.name}
        </button>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (val) => <StatusBadge status={val as Campaign["status"]} />,
    },
    { key: "sent", label: "Sent", sortable: true },
    { key: "opens", label: "Opens", sortable: true },
    { key: "replies", label: "Replies", sortable: true },
    { key: "bounced", label: "Bounced", sortable: true },
    {
      key: "created_at",
      label: "Created",
      sortable: true,
      render: (val) => {
        const d = val as string;
        if (!d) return "-";
        try {
          return new Date(d).toLocaleDateString("ru-RU");
        } catch {
          return d;
        }
      },
    },
    {
      key: "id",
      label: "Actions",
      render: (_val, row) => {
        const isLoading = actionLoading === row.id;
        return (
          <div className="flex items-center gap-1">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
            ) : (
              <>
                {(row.status === "draft" || row.status === "paused") && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction(row.id, row.status === "paused" ? "resume" : "start");
                    }}
                    title={row.status === "paused" ? "Resume" : "Start"}
                    className="rounded-lg p-1.5 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                  >
                    {row.status === "paused" ? (
                      <RotateCcw className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </button>
                )}
                {row.status === "active" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction(row.id, "pause");
                    }}
                    title="Pause"
                    className="rounded-lg p-1.5 text-yellow-400 hover:bg-yellow-500/20 transition-colors"
                  >
                    <Pause className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(row.id, "delete");
                  }}
                  title="Delete"
                  className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col">
      <TopBar />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Campaigns</h1>
          <button
            onClick={() => router.push("/campaigns/create")}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add New
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-text-muted" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted">
            <Inbox className="h-16 w-16 mb-4 opacity-40" />
            <p className="text-lg font-medium mb-2">No campaigns yet</p>
            <p className="text-sm mb-6">Create your first campaign to start sending emails</p>
            <button
              onClick={() => router.push("/campaigns/create")}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Campaign
            </button>
          </div>
        ) : (
          <DataTable columns={columns} data={campaigns} />
        )}
      </div>
    </div>
  );
}
