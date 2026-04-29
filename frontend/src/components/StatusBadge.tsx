"use client";

type Status = "active" | "paused" | "draft" | "completed" | "error";

const statusStyles: Record<Status, string> = {
  active: "bg-emerald-500/20 text-emerald-300",
  paused: "bg-yellow-500/20 text-yellow-300",
  draft: "bg-gray-500/20 text-gray-300",
  completed: "bg-blue-500/20 text-blue-300",
  error: "bg-red-500/20 text-red-300",
};

const statusLabels: Record<Status, string> = {
  active: "Active",
  paused: "Paused",
  draft: "Draft",
  completed: "Completed",
  error: "Error",
};

interface StatusBadgeProps {
  status: Status;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
