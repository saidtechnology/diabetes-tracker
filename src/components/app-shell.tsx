"use client";

import { useSession, signOut } from "next-auth/react";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a href="/dashboard" className="font-semibold text-sm">Diabetes Tracker</a>
          {session?.user && (
            <span className="text-xs text-gray-400">
              {(session.user as unknown as { role: string })?.role === "DOCTOR" ? "Doctor" : "Patient"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          {session?.user && (
            <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-xs text-gray-500 hover:text-red-600">
              Logout
            </button>
          )}
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
