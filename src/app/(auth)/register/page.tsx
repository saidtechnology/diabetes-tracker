"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "", lastName: "", address: "", email: "", phone: "", password: "", role: "PATIENT",
  });
  const [verifyMethod, setVerifyMethod] = useState<"phone" | "email">("phone");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, verifyMethod }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      if (verifyMethod === "email") {
        router.push(`/verify?email=${encodeURIComponent(form.email)}&method=email`);
      } else {
        router.push(`/verify?phone=${encodeURIComponent(form.phone)}&method=phone`);
      }
    } catch { setError(t("common.networkError")); } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-dim px-4 py-8">
      <div className="w-full max-w-md animate-scale-in">
        <div className="text-center mb-8">
          <span className="text-3xl mb-2 block" role="img" aria-label="blood drop">🩸</span>
          <h1 className="text-xl font-bold text-on-surface">{t("auth.register")}</h1>
          <p className="text-sm text-on-surface-dim mt-1">🩸 Diabetes Tracker</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && <p className="text-xs text-error-500 bg-error-50 p-3 rounded-xl">{error}</p>}

          <div className="flex gap-3">
            <div className="flex-1">
              <Input label={t("auth.firstName")} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required placeholder={t("auth.firstNamePlaceholder")} />
            </div>
            <div className="flex-1">
              <Input label={t("auth.lastName")} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required placeholder={t("auth.lastNamePlaceholder")} />
            </div>
          </div>

          <Input label={t("auth.address")} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required placeholder={t("auth.addressPlaceholder")} />

          <Input label={t("auth.emailPlaceholder")} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required placeholder="email@example.com" />

          <Input label={t("auth.phonePlaceholder")} type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required placeholder="+212600000000" />

          <Input label={t("auth.passwordMin")} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required placeholder="••••••" minLength={6} />

          {/* Role Toggle */}
          <div>
            <p className="label mb-2">{t("auth.iAmPatient")}{" / "}{t("auth.iAmDoctor")}</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setForm({ ...form, role: "PATIENT" })}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${form.role === "PATIENT" ? "bg-primary-600 text-on-primary shadow-sm" : "bg-surface-container text-on-surface-dim hover:bg-surface-container-high"}`}>
                {t("auth.iAmPatient")}
              </button>
              <button type="button" onClick={() => setForm({ ...form, role: "DOCTOR" })}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${form.role === "DOCTOR" ? "bg-secondary-600 text-on-secondary shadow-sm" : "bg-surface-container text-on-surface-dim hover:bg-surface-container-high"}`}>
                {t("auth.iAmDoctor")}
              </button>
            </div>
          </div>

          {/* Verification Method */}
          <div>
            <p className="label mb-2">{t("auth.verifyMethod")}</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setVerifyMethod("phone")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${verifyMethod === "phone" ? "bg-primary-600 text-on-primary shadow-sm" : "bg-surface-container text-on-surface-dim hover:bg-surface-container-high"}`}>
                {t("auth.verifyByPhone")}
              </button>
              <button type="button" onClick={() => setVerifyMethod("email")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${verifyMethod === "email" ? "bg-primary-600 text-on-primary shadow-sm" : "bg-surface-container text-on-surface-dim hover:bg-surface-container-high"}`}>
                {t("auth.verifyByEmail")}
              </button>
            </div>
          </div>

          <Button type="submit" loading={loading} className="w-full">
            {t("auth.register")}
          </Button>

          <p className="text-xs text-center text-on-surface-dim">
            {t("auth.hasAccount")}{" "}
            <Link href="/login" className="text-primary-600 font-medium hover:text-primary-700">
              {t("auth.loginNow")}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
