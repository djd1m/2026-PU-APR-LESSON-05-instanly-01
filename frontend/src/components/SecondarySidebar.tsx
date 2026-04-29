"use client";

import { Search } from "lucide-react";

interface Section {
  title: string;
  items: { label: string; href: string; active?: boolean }[];
}

interface SecondarySidebarProps {
  title: string;
  sections: Section[];
}

export function SecondarySidebar({ title, sections }: SecondarySidebarProps) {
  return (
    <aside className="h-screen w-72 border-r border-border-default bg-bg-secondary p-4 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <input
          type="text"
          placeholder="Search..."
          className="w-full rounded-xl border border-border-default bg-bg-input py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-primary focus:outline-none"
        />
      </div>

      {/* Sections */}
      {sections.map((section) => (
        <div key={section.title} className="mb-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-muted">
            {section.title}
          </p>
          <ul className="space-y-0.5">
            {section.items.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                    item.active
                      ? "bg-brand-primary/20 text-brand-primary"
                      : "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
                  }`}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </aside>
  );
}
