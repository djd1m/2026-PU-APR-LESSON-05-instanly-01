"use client";

import { ChevronDown, Zap } from "lucide-react";

export function TopBar() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border-default bg-bg-secondary px-6">
      <div className="flex items-center gap-3">
        {/* Org Selector */}
        <button className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-text-primary hover:bg-bg-tertiary">
          <span className="font-medium">My Organization</span>
          <ChevronDown className="h-4 w-4 text-text-muted" />
        </button>
      </div>

      <div className="flex items-center gap-4">
        {/* Credits */}
        <div className="flex items-center gap-1.5 text-sm text-text-secondary">
          <Zap className="h-4 w-4 text-status-warning" />
          <span>1,250 credits</span>
        </div>

        {/* Plan Badge */}
        <span className="inline-flex items-center rounded-md bg-brand-primary/20 px-2.5 py-1 text-xs font-semibold text-brand-primary">
          Pro Plan
        </span>
      </div>
    </header>
  );
}
