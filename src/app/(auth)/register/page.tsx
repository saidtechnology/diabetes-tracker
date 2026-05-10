"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 bg-white p-8 rounded-xl shadow-sm">
        <h1 className="text-2xl font-bold text-center">{t("auth.register")}</h1>
        {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
        <div className="flex gap-3">
          <input className="w-1/2 border rounded-lg px-3 py-2 text-sm" placeholder={t("auth.firstName")} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
          <input className="w-1/2 border rounded-lg px-3 py-2 text-sm" placeholder={t("auth.lastName")} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
        </div>
        <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder={t("auth.address")} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
        <input className="w-full border rounded-lg px-3 py-2 text-sm" type="email" placeholder={t("auth.emailPlaceholder")} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input className="w-full border rounded-lg px-3 py-2 text-sm" type="tel" placeholder={t("auth.phonePlaceholder")} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
        <input className="w-full border rounded-lg px-3 py-2 text-sm" type="password" placeholder={t("auth.passwordMin")} minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <div className="flex gap-3">
          <button type="button" className={`flex-1 py-2 rounded-lg text-sm font-medium ${form.role === "PATIENT" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`} onClick={() => setForm({ ...form, role: "PATIENT" })}>{t("auth.iAmPatient")}</button>
          <button type="button" className={`flex-1 py-2 rounded-lg text-sm font-medium ${form.role === "DOCTOR" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`} onClick={() => setForm({ ...form, role: "DOCTOR" })}>{t("auth.iAmDoctor")}</button>
        </div>
        <div className="border-t pt-4">
          <p className="text-sm font-medium mb-2">{t("auth.verifyMethod")}</p>
          <div className="flex gap-3">
            <button type="button" className={`flex-1 py-2 rounded-lg text-sm ${verifyMethod === "phone" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`} onClick={() => setVerifyMethod("phone")}>{t("auth.verifyByPhone")}</button>
            <button type="button" className={`flex-1 py-2 rounded-lg text-sm ${verifyMethod === "email" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`} onClick={() => setVerifyMethod("email")}>{t("auth.verifyByEmail")}</button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
          {loading ? t("common.loading") : t("auth.register")}
        </button>
        <p className="text-sm text-center text-gray-500">
          {t("auth.hasAccount")} <Link href="/login" className="text-blue-600 hover:underline">{t("auth.loginNow")}</Link>
        </p>
      </form>
    </div>
  );
}
