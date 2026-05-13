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
      <span className="badge-error min-w-[18px] h-[18px] text-[10px] absolute -top-2 -right-2 shadow-sm">
        {pendingCount > 9 ? "9+" : pendingCount}
      </span>
    </a>
  );
}
