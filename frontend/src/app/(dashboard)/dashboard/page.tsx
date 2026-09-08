"use client";

import { useAuth } from "@/lib/auth-context";

export default function DashboardHomePage() {
  const { user } = useAuth();

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h1 className="text-lg font-semibold text-gray-900">Welcome{user?.name ? `, ${user.name}` : ""}</h1>
      <p className="mt-2 text-sm text-gray-500">
        This overview will show combined stats for ACE Training and MultiSkills once the Reviews and Reports
        modules are built (see the build plan, phases 6–10).
      </p>
    </div>
  );
}
