"use client";

import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  ctaLabel?: string;
  onCta?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, ctaLabel, onCta, icon }: EmptyStateProps) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center text-center px-6">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-bg-tertiary">
        {icon ?? <Inbox className="h-8 w-8 text-text-muted" />}
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      <p className="max-w-sm text-sm text-text-secondary mb-6">{description}</p>
      {ctaLabel && (
        <button
          onClick={onCta}
          className="rounded-xl px-4 py-2 font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
