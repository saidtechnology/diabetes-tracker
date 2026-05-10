"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export function PendingBadge() {
  const { data: session } = useSession();
  const role = session?.user ? (session.user as unknown as { role: string })?.role : null;
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (role !== "DOCTOR") return;
    fetch("/api/doctor/patients")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => { if (data) setPendingCount(data.pendingCount); })
      .catch(() => {});
  }, [role]);

  if (role !== "DOCTOR" || pendingCount === 0) return null;

  return (
    <a href="/patients" className="relative ml-1" title="Pending requests">
      <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-0.5 shadow-sm">
        {pendingCount > 9 ? "9+" : pendingCount}
      </span>
    </a>
  );
}
