"use client";

import { useAuth } from "@/lib/auth-context";

export function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-end gap-4 border-b border-gray-200 bg-white px-6 py-3">
      <span className="text-sm text-gray-600">{user?.name || user?.email}</span>
      <button onClick={logout} className="text-sm font-medium text-brand-pink hover:underline">
        Sign out
      </button>
    </header>
  );
}
