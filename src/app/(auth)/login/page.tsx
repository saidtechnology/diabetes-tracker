"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
    <div className="min-h-screen flex items-center justify-center bg-surface-dim px-4">
      <div className="w-full max-w-sm animate-scale-in">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-on-surface">{t("auth.login")}</h1>
          <p className="text-sm text-on-surface-dim mt-1">Diabetes Tracker</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-5">
          {error && <p className="text-xs text-error-500 bg-error-50 p-3 rounded-xl">{error}</p>}

          <Input label={t("auth.email")} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="patient@example.com" />

          <Input label={t("auth.password")} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••" />

          <Button type="submit" loading={loading} className="w-full">
            {t("auth.login")}
          </Button>

          <p className="text-xs text-center text-on-surface-dim">
            {t("auth.noAccount")}{" "}
            <Link href="/register" className="text-primary-600 font-medium hover:text-primary-700">
              {t("auth.registerNow")}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
