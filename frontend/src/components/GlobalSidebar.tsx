"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  Rocket,
  AtSign,
  Inbox,
  BarChart3,
  Sparkles,
  Settings,
  User,
  LogOut,
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
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const parsed = JSON.parse(raw);
        setUserEmail(parsed.email || "");
      }
    } catch {
      // ignore
    }
  }, []);

  // Close popup on click outside
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

  const handleLogout = async () => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/v1/auth/logout`,
        {
          method: "POST",
          credentials: "include",
        }
      );
    } catch {
      // proceed even if backend is unreachable
    }
    localStorage.removeItem("user");
    router.push("/login");
  };

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

      {/* Profile Avatar + Popup */}
      <div className="relative mt-auto" ref={menuRef}>
        <button
          onClick={() => setShowMenu((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-tertiary transition-colors hover:bg-bg-tertiary/80"
        >
          <User className="h-4 w-4 text-text-secondary" />
        </button>

        {showMenu && (
          <div className="absolute bottom-12 left-0 w-56 rounded-xl border border-[#2a2d34] bg-[#15171c] p-2 shadow-xl">
            {/* User email */}
            {userEmail && (
              <div className="truncate px-3 py-2 text-xs text-gray-400">
                {userEmail}
              </div>
            )}

            {/* Settings link */}
            <Link
              href="/settings"
              onClick={() => setShowMenu(false)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-[#2a2d34]"
            >
              <Settings className="h-4 w-4" />
              Настройки
            </Link>

            {/* Divider */}
            <div className="my-1 border-t border-[#2a2d34]" />

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 transition-colors hover:bg-[#2a2d34]"
            >
              <LogOut className="h-4 w-4" />
              Выйти
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
