"use client";

import { Flame } from "lucide-react";

interface WarmupHealthIndicatorProps {
  percentage: number;
}

function getColor(pct: number): string {
  if (pct >= 70) return "text-emerald-400";
  if (pct >= 40) return "text-yellow-400";
  return "text-red-400";
}

export function WarmupHealthIndicator({ percentage }: WarmupHealthIndicatorProps) {
  const color = getColor(percentage);

  return (
    <div className="inline-flex items-center gap-1.5">
      <Flame className={`h-4 w-4 ${color}`} />
      <span className={`text-sm font-medium ${color}`}>{percentage}%</span>
    </div>
  );
}
