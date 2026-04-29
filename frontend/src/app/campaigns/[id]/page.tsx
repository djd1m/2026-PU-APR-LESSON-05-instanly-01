"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Loader2,
  Save,
  Send,
  MailOpen,
  MessageSquare,
  AlertTriangle,
  Upload,
  FileText,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://212.192.0.33:4000";

const ALL_DAYS = [
  { value: "monday", label: "Mon" },
  { value: "tuesday", label: "Tue" },
  { value: "wednesday", label: "Wed" },
  { value: "thursday", label: "Thu" },
  { value: "friday", label: "Fri" },
  { value: "saturday", label: "Sat" },
  { value: "sunday", label: "Sun" },
];

interface Campaign {
  id: string;
  name: string;
  status: "active" | "paused" | "draft" | "completed" | "error";
  sent: number;
  opens: number;
  replies: number;
  bounced: number;
  schedule?: {
    timezone: string;
    start_hour: number;
    end_hour: number;
    days: string[];
    max_per_day: number;
  };
  daily_limit?: number;
  sending_accounts?: string[];
  created_at?: string;
  updated_at?: string;
}

export default function CampaignDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Editable fields
  const [editName, setEditName] = useState("");
  const [editStartHour, setEditStartHour] = useState(9);
  const [editEndHour, setEditEndHour] = useState(18);
  const [editDays, setEditDays] = useState<Set<string>>(new Set());
  const [editDailyLimit, setEditDailyLimit] = useState(50);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const fetchCampaign = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`${API_URL}/api/v1/campaigns/${id}`, {
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (res.status === 404) {
          setError("Campaign not found");
          setLoading(false);
          return;
        }
        throw new Error("Failed to load campaign");
      }
      const json = await res.json();
      const data = json.data ?? json;

      const c: Campaign = {
        id: data.id,
        name: data.name || "Untitled",
        status: data.status || "draft",
        sent: data.sent ?? data.emails_sent ?? 0,
        opens: data.opens ?? data.emails_opened ?? 0,
        replies: data.replies ?? data.emails_replied ?? 0,
        bounced: data.bounced ?? data.emails_bounced ?? 0,
        schedule: data.schedule,
        daily_limit: data.daily_limit,
        sending_accounts: data.sending_accounts,
        created_at: data.created_at || data.createdAt,
        updated_at: data.updated_at || data.updatedAt,
      };

      setCampaign(c);
      setEditName(c.name);
      if (c.schedule) {
        setEditStartHour(c.schedule.start_hour ?? 9);
        setEditEndHour(c.schedule.end_hour ?? 18);
        setEditDays(new Set(c.schedule.days ?? []));
        setEditDailyLimit(c.schedule.max_per_day ?? c.daily_limit ?? 50);
      } else {
        setEditDailyLimit(c.daily_limit ?? 50);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load campaign");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  // Track changes
  useEffect(() => {
    if (!campaign) return;
    const nameChanged = editName !== campaign.name;
    const scheduleChanged =
      campaign.schedule &&
      (editStartHour !== campaign.schedule.start_hour ||
        editEndHour !== campaign.schedule.end_hour ||
        editDailyLimit !== (campaign.schedule.max_per_day ?? campaign.daily_limit) ||
        JSON.stringify(Array.from(editDays).sort()) !==
          JSON.stringify([...(campaign.schedule.days ?? [])].sort()));
    setHasChanges(nameChanged || !!scheduleChanged);
  }, [editName, editStartHour, editEndHour, editDays, editDailyLimit, campaign]);

  function toggleDay(day: string) {
    const next = new Set(editDays);
    if (next.has(day)) next.delete(day);
    else next.add(day);
    setEditDays(next);
  }

  async function handleAction(action: "start" | "pause" | "resume") {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/campaigns/${id}/${action}`, {
        method: "POST",
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
      await fetchCampaign();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/campaigns/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok && res.status !== 204) {
        throw new Error("Failed to delete campaign");
      }
      router.push("/campaigns");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
      setActionLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      // Try PATCH first, fall back to PUT
      const payload = {
        name: editName.trim(),
        schedule: {
          timezone: campaign?.schedule?.timezone || "Europe/Moscow",
          start_hour: editStartHour,
          end_hour: editEndHour,
          days: Array.from(editDays),
          max_per_day: editDailyLimit,
        },
        daily_limit: editDailyLimit,
      };

      let res = await fetch(`${API_URL}/api/v1/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (res.status === 404 || res.status === 405) {
        res = await fetch(`${API_URL}/api/v1/campaigns/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
      }

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

      await fetchCampaign();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-text-muted" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-bg-primary text-text-primary p-6">
        <button
          onClick={() => router.push("/campaigns")}
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Campaigns
        </button>
        <div className="text-center py-20">
          <p className="text-lg text-text-muted">{error || "Campaign not found"}</p>
        </div>
      </div>
    );
  }

  const statusActions = {
    draft: [{ action: "start" as const, label: "Start", icon: Play, color: "emerald" }],
    paused: [{ action: "resume" as const, label: "Resume", icon: RotateCcw, color: "emerald" }],
    active: [{ action: "pause" as const, label: "Pause", icon: Pause, color: "yellow" }],
    completed: [],
    error: [{ action: "start" as const, label: "Restart", icon: Play, color: "emerald" }],
  };

  const metrics = [
    { label: "Sent", value: campaign.sent, icon: Send, color: "text-blue-400" },
    { label: "Opened", value: campaign.opens, icon: MailOpen, color: "text-emerald-400" },
    { label: "Replied", value: campaign.replies, icon: MessageSquare, color: "text-purple-400" },
    { label: "Bounced", value: campaign.bounced, icon: AlertTriangle, color: "text-red-400" },
  ];

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* Header */}
      <div className="border-b border-border-default px-6 py-4">
        <button
          onClick={() => router.push("/campaigns")}
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Campaigns
        </button>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">{campaign.name}</h1>
            <span
              className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${
                campaign.status === "active"
                  ? "bg-emerald-500/20 text-emerald-300"
                  : campaign.status === "paused"
                  ? "bg-yellow-500/20 text-yellow-300"
                  : campaign.status === "draft"
                  ? "bg-gray-500/20 text-gray-300"
                  : campaign.status === "completed"
                  ? "bg-blue-500/20 text-blue-300"
                  : "bg-red-500/20 text-red-300"
              }`}
            >
              {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {statusActions[campaign.status]?.map((a) => (
              <button
                key={a.action}
                onClick={() => handleAction(a.action)}
                disabled={actionLoading}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${
                  a.color === "emerald"
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                    : "bg-yellow-600 hover:bg-yellow-500 text-white"
                }`}
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <a.icon className="h-4 w-4" />
                )}
                {a.label}
              </button>
            ))}
            <button
              onClick={() => setShowDelete(true)}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Metrics cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="rounded-2xl border border-border-default bg-bg-secondary p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <m.icon className={`h-4 w-4 ${m.color}`} />
                <span className="text-xs text-text-muted uppercase tracking-wider">
                  {m.label}
                </span>
              </div>
              <p className="text-2xl font-bold">{m.value.toLocaleString()}</p>
            </div>
          ))}
        </div>

        {/* Edit Name */}
        <div className="rounded-2xl border border-border-default bg-bg-secondary p-6">
          <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-4">
            Campaign Settings
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Campaign Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-xl border border-border-default bg-bg-primary px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
              />
            </div>

            {/* Schedule section */}
            {campaign.schedule && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Start Hour
                    </label>
                    <select
                      value={editStartHour}
                      onChange={(e) => setEditStartHour(Number(e.target.value))}
                      className="w-full rounded-xl border border-border-default bg-bg-primary px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>
                          {String(i).padStart(2, "0")}:00
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      End Hour
                    </label>
                    <select
                      value={editEndHour}
                      onChange={(e) => setEditEndHour(Number(e.target.value))}
                      className="w-full rounded-xl border border-border-default bg-bg-primary px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>
                          {String(i).padStart(2, "0")}:00
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Sending Days
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_DAYS.map((d) => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => toggleDay(d.value)}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                          editDays.has(d.value)
                            ? "bg-blue-600 text-white"
                            : "bg-bg-tertiary text-text-muted hover:text-text-primary"
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Daily Limit: {editDailyLimit} emails/day
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={1000}
                    value={editDailyLimit}
                    onChange={(e) => setEditDailyLimit(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-text-muted mt-1">
                    <span>1</span>
                    <span>1000</span>
                  </div>
                </div>
              </>
            )}

            {hasChanges && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border-default bg-bg-secondary p-6 hover:bg-bg-tertiary transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <Upload className="h-5 w-5 text-blue-400" />
              <h3 className="font-medium">Import Leads</h3>
            </div>
            <p className="text-sm text-text-muted mb-3">
              Upload a CSV file with leads for this campaign.
            </p>
            <span className="text-xs text-text-muted italic">
              Lead import available via API: POST /api/v1/campaigns/{id}/leads
            </span>
          </div>

          <div className="rounded-2xl border border-border-default bg-bg-secondary p-6 hover:bg-bg-tertiary transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="h-5 w-5 text-purple-400" />
              <h3 className="font-medium">Email Sequence</h3>
            </div>
            <p className="text-sm text-text-muted mb-3">
              Set up your email steps and follow-ups.
            </p>
            <span className="text-xs text-text-muted italic">
              Sequence editor available via API: /api/v1/campaigns/{id}/sequences
            </span>
          </div>
        </div>

        {/* Meta info */}
        <div className="text-xs text-text-muted space-y-1">
          {campaign.created_at && (
            <p>
              Created:{" "}
              {new Date(campaign.created_at).toLocaleString("ru-RU")}
            </p>
          )}
          {campaign.updated_at && (
            <p>
              Updated:{" "}
              {new Date(campaign.updated_at).toLocaleString("ru-RU")}
            </p>
          )}
          <p>ID: {campaign.id}</p>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="rounded-2xl border border-border-default bg-bg-secondary p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Campaign</h3>
            <p className="text-sm text-text-muted mb-6">
              Are you sure you want to delete &quot;{campaign.name}&quot;? This action
              cannot be undone.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setShowDelete(false)}
                className="rounded-xl px-4 py-2 text-sm font-medium border border-border-default hover:bg-bg-tertiary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-60"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
