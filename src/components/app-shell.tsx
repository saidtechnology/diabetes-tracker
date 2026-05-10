"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { PendingBadge } from "@/components/pending-badge";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/patients", label: "Patients", doctorOnly: true },
  { href: "/measurements", label: "Readings", patientOnly: true },
  { href: "/settings", label: "Settings" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const role = session?.user ? (session.user as unknown as { role: string })?.role : null;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/60 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <a href="/dashboard" className="font-semibold text-sm tracking-tight text-primary-700">
            Diabetes Tracker
          </a>
          {role && (
            <div className="hidden sm:flex items-center gap-1">
              {navItems
                .filter((item) => (item.doctorOnly && role !== "DOCTOR") || (item.patientOnly && role !== "PATIENT") ? false : true)
                .map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-primary-100 text-primary-700"
                          : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                      }`}
                    >
                      {item.label}
                    </a>
                  );
                })}
              <PendingBadge />
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {role && (
            <span className="hidden sm:inline text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              {role === "DOCTOR" ? "Doctor" : "Patient"}
            </span>
          )}
          <LanguageSwitcher />
          {role && (
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-xs text-slate-400 hover:text-rose-500 transition-colors duration-200 px-2 py-1 rounded-lg hover:bg-rose-50"
            >
              Logout
            </button>
          )}
        </div>
      </nav>
      <main className="animate-fade-in">{children}</main>
    </div>
  );
}
