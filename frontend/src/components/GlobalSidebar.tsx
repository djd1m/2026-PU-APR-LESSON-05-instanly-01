"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Rocket,
  AtSign,
  Inbox,
  BarChart3,
  Sparkles,
  Settings,
  User,
} from "lucide-react";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/campaigns", icon: Rocket, label: "Campaigns" },
  { href: "/accounts", icon: AtSign, label: "Accounts" },
  { href: "/unibox", icon: Inbox, label: "Unibox" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/ai", icon: Sparkles, label: "AI" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function GlobalSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-16 flex-col items-center border-r border-border-default bg-bg-secondary py-4">
      {/* Logo */}
      <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary font-bold text-white text-sm">
        CM
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col items-center gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                isActive
                  ? "bg-brand-primary/20 text-brand-primary"
                  : "text-text-muted hover:bg-bg-tertiary hover:text-text-primary"
              }`}
            >
              <item.icon className="h-5 w-5" />
            </Link>
          );
        })}
      </nav>

      {/* Profile Avatar */}
      <div className="mt-auto flex h-9 w-9 items-center justify-center rounded-full bg-bg-tertiary">
        <User className="h-4 w-4 text-text-secondary" />
      </div>
    </aside>
  );
}
