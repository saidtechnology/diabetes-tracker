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
          <span className="text-3xl mb-2 block" role="img" aria-label="blood drop">🩸</span>
          <h1 className="text-xl font-bold text-on-surface">{t("auth.login")}</h1>
          <p className="text-sm text-on-surface-dim mt-1">🩸 Diabetes Tracker</p>
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
