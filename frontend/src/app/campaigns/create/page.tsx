"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  ChevronLeft,
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

const STEPS = ["Name", "Accounts", "Schedule", "Review"];

interface Account {
  id: string;
  email: string;
  provider?: string;
  status?: string;
}

export default function CreateCampaignPage() {
  const router = useRouter();

  // Wizard state
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Name
  const [name, setName] = useState("");

  // Step 2: Sending accounts
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(
    new Set()
  );

  // Step 3: Schedule
  const [timezone] = useState("Europe/Moscow");
  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(18);
  const [days, setDays] = useState<Set<string>>(
    new Set(["monday", "tuesday", "wednesday", "thursday", "friday"])
  );
  const [dailyLimit, setDailyLimit] = useState(50);

  // Fetch accounts on step 2
  useEffect(() => {
    if (step === 1 && accounts.length === 0) {
      setAccountsLoading(true);
      fetch(`${API_URL}/api/v1/accounts`, { credentials: "include" })
        .then(async (res) => {
          if (!res.ok) {
            if (res.status === 401) {
              router.push("/login");
              return;
            }
            throw new Error("Failed to load accounts");
          }
          const json = await res.json();
          const data = Array.isArray(json) ? json : json.data ?? [];
          setAccounts(data);
        })
        .catch((err) => setError(err.message))
        .finally(() => setAccountsLoading(false));
    }
  }, [step, accounts.length, router]);

  function toggleAccount(id: string) {
    const next = new Set(selectedAccounts);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedAccounts(next);
  }

  function toggleDay(day: string) {
    const next = new Set(days);
    if (next.has(day)) next.delete(day);
    else next.add(day);
    setDays(next);
  }

  function canProceed(): boolean {
    switch (step) {
      case 0:
        return name.trim().length > 0;
      case 1:
        return selectedAccounts.size > 0;
      case 2:
        return days.size > 0 && startHour < endHour && dailyLimit >= 1;
      case 3:
        return true;
      default:
        return false;
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    const payload = {
      name: name.trim(),
      sending_accounts: Array.from(selectedAccounts),
      schedule: {
        timezone,
        start_hour: startHour,
        end_hour: endHour,
        days: Array.from(days),
        max_per_day: dailyLimit,
      },
      daily_limit: dailyLimit,
    };

    try {
      const res = await fetch(`${API_URL}/api/v1/campaigns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
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

      router.push("/campaigns");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create campaign");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* Header */}
      <div className="border-b border-border-default px-6 py-4">
        <button
          onClick={() => router.push("/campaigns")}
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Campaigns
        </button>
        <h1 className="text-xl font-semibold mt-2">Create Campaign</h1>
      </div>

      <div className="max-w-2xl mx-auto p-6">
        {/* Stepper */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  i < step
                    ? "bg-emerald-500 text-white"
                    : i === step
                    ? "bg-blue-600 text-white"
                    : "bg-bg-tertiary text-text-muted"
                }`}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={`text-sm hidden sm:inline ${
                  i === step ? "text-text-primary font-medium" : "text-text-muted"
                }`}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div
                  className={`hidden sm:block w-12 h-px mx-2 ${
                    i < step ? "bg-emerald-500" : "bg-border-default"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Step content */}
        <div className="rounded-2xl border border-border-default bg-bg-secondary p-6">
          {/* Step 1: Name */}
          {step === 0 && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Campaign Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Q2 Outreach - SaaS CTOs"
                className="w-full rounded-xl border border-border-default bg-bg-primary px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                autoFocus
              />
              <p className="mt-2 text-xs text-text-muted">
                A descriptive name to identify this campaign.
              </p>
            </div>
          )}

          {/* Step 2: Sending Accounts */}
          {step === 1 && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-4">
                Select Sending Accounts
              </label>
              {accountsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
                </div>
              ) : accounts.length === 0 ? (
                <div className="text-center py-8 text-text-muted">
                  <p className="mb-2">No sending accounts found.</p>
                  <p className="text-xs">
                    Add email accounts in the Accounts section first.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {accounts.map((acc) => (
                    <label
                      key={acc.id}
                      className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
                        selectedAccounts.has(acc.id)
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-border-default hover:bg-bg-tertiary"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedAccounts.has(acc.id)}
                        onChange={() => toggleAccount(acc.id)}
                        className="rounded border-border-default"
                      />
                      <div>
                        <p className="text-sm font-medium">{acc.email}</p>
                        {acc.provider && (
                          <p className="text-xs text-text-muted">
                            {acc.provider}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
              <p className="mt-3 text-xs text-text-muted">
                Selected: {selectedAccounts.size} account(s)
              </p>
            </div>
          )}

          {/* Step 3: Schedule */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Timezone */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Timezone
                </label>
                <div className="rounded-xl border border-border-default bg-bg-primary px-4 py-3 text-text-muted text-sm">
                  Europe/Moscow (MSK)
                </div>
              </div>

              {/* Hours */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Start Hour
                  </label>
                  <select
                    value={startHour}
                    onChange={(e) => setStartHour(Number(e.target.value))}
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
                    value={endHour}
                    onChange={(e) => setEndHour(Number(e.target.value))}
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
              {startHour >= endHour && (
                <p className="text-xs text-red-400">
                  End hour must be later than start hour.
                </p>
              )}

              {/* Days */}
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
                        days.has(d.value)
                          ? "bg-blue-600 text-white"
                          : "bg-bg-tertiary text-text-muted hover:text-text-primary"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Daily limit */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Daily Limit: {dailyLimit} emails/day
                </label>
                <input
                  type="range"
                  min={1}
                  max={1000}
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-xs text-text-muted mt-1">
                  <span>1</span>
                  <span>1000</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium mb-4">Review Campaign</h3>

              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-border-default">
                  <span className="text-text-muted text-sm">Name</span>
                  <span className="text-sm font-medium">{name}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border-default">
                  <span className="text-text-muted text-sm">Accounts</span>
                  <span className="text-sm font-medium">
                    {selectedAccounts.size} selected
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-border-default">
                  <span className="text-text-muted text-sm">Timezone</span>
                  <span className="text-sm font-medium">{timezone}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border-default">
                  <span className="text-text-muted text-sm">Hours</span>
                  <span className="text-sm font-medium">
                    {String(startHour).padStart(2, "0")}:00 -{" "}
                    {String(endHour).padStart(2, "0")}:00
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-border-default">
                  <span className="text-text-muted text-sm">Days</span>
                  <span className="text-sm font-medium">
                    {ALL_DAYS.filter((d) => days.has(d.value))
                      .map((d) => d.label)
                      .join(", ")}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-text-muted text-sm">Daily Limit</span>
                  <span className="text-sm font-medium">
                    {dailyLimit} emails/day
                  </span>
                </div>
              </div>

              {/* Selected accounts detail */}
              {accounts.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-text-muted mb-2">
                    Selected accounts:
                  </p>
                  <div className="space-y-1">
                    {accounts
                      .filter((a) => selectedAccounts.has(a.id))
                      .map((a) => (
                        <div
                          key={a.id}
                          className="text-sm text-text-secondary px-3 py-1.5 bg-bg-tertiary rounded-lg"
                        >
                          {a.email}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => (step === 0 ? router.push("/campaigns") : setStep(step - 1))}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary border border-border-default hover:bg-bg-tertiary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {step === 0 ? "Cancel" : "Back"}
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Create Campaign
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
