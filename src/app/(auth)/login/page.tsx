"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) { setError(t("auth.invalidCredentials")); return; }
      router.push("/");
      router.refresh();
    } catch { setError(t("common.networkError")); } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 bg-white p-8 rounded-xl shadow-sm">
        <h1 className="text-2xl font-bold text-center">{t("auth.login")}</h1>
        {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
        <input className="w-full border rounded-lg px-3 py-2 text-sm" type="email" placeholder={t("auth.email")} value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="w-full border rounded-lg px-3 py-2 text-sm" type="password" placeholder={t("auth.password")} value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
          {loading ? t("common.loading") : t("auth.login")}
        </button>
        <p className="text-sm text-center text-gray-500">
          {t("auth.noAccount")} <Link href="/register" className="text-blue-600 hover:underline">{t("auth.registerNow")}</Link>
        </p>
      </form>
    </div>
  );
}
