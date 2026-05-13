"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import { getFirebaseApp } from "@/lib/firebase";
import { getAuth, signInWithPhoneNumber, RecaptchaVerifier, type ConfirmationResult } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function VerifyPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const identifierParam = searchParams.get("phone") || searchParams.get("email") || "";
  const method = (searchParams.get("method") || "phone") as "phone" | "email";
  const tokenFromUrl = searchParams.get("token") || "";
  const [manualIdentifier, setManualIdentifier] = useState(identifierParam);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [doctorCode, setDoctorCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [firebaseSent, setFirebaseSent] = useState(false);
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const identifier = manualIdentifier || identifierParam;

  useEffect(() => {
    if (method === "email" && tokenFromUrl) {
      handleEmailVerify(tokenFromUrl);
    }
  }, []);

  useEffect(() => {
    if (method === "phone" && getFirebaseApp()) {
      setFirebaseReady(true);
    }
  }, [method]);

  async function handleEmailVerify(token: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: identifier, token }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setVerified(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch { setError(t("common.networkError")); } finally { setLoading(false); }
  }

  async function handleEmailSend() {
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: identifier }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setEmailSent(true);
    } catch { setError(t("common.networkError")); } finally { setLoading(false); }
  }

  function handleOtpChange(index: number, value: string) {
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otp]; newOtp[index] = value; setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const code = otp.join("");
    if (code.length !== 6) { setError(t("auth.invalidCode")); setLoading(false); return; }
    try {
      const res = await fetch("/api/auth/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: identifier, code, doctorCode: doctorCode.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setVerified(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch { setError(t("common.networkError")); } finally { setLoading(false); }
  }

  async function handleFirebaseSend() {
    setError("");
    const app = getFirebaseApp();
    if (!app) { setError("Firebase not configured"); return; }
    setLoading(true);
    try {
      const auth = getAuth(app);
      if (!recaptchaRef.current) return;
      const verifier = new RecaptchaVerifier(auth, recaptchaRef.current, { size: "invisible" });
      const confirmation = await signInWithPhoneNumber(auth, identifier, verifier);
      confirmationRef.current = confirmation;
      setFirebaseSent(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Firebase SMS failed");
    } finally { setLoading(false); }
  }

  async function handleFirebaseVerify() {
    setError(""); setLoading(true);
    const code = otp.join("");
    if (code.length !== 6 || !confirmationRef.current) { setError(t("auth.invalidCode")); setLoading(false); return; }
    try {
      const result = await confirmationRef.current.confirm(code);
      const idToken = await result.user.getIdToken();
      const res = await fetch("/api/auth/firebase-verify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, phone: identifier }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setVerified(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch { setError(t("auth.invalidCode")); } finally { setLoading(false); }
  }

  if (!identifier && method !== "email") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-dim px-4">
        <div className="w-full max-w-sm animate-scale-in">
          <div className="text-center mb-8">
            <div className="mx-auto w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-on-surface">{t("auth.verifyPhoneTitle")}</h1>
            <p className="text-sm text-on-surface-dim mt-1">{t("auth.enterPhoneNumber")}</p>
          </div>
          <div className="card space-y-4">
            <Input type="tel" value={manualIdentifier} onChange={(e) => setManualIdentifier(e.target.value)} placeholder={t("auth.phonePlaceholder")} />
            <Button onClick={() => setManualIdentifier(manualIdentifier)} disabled={!manualIdentifier} className="w-full">
              {t("common.continue")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-dim px-4">
        <div className="w-full max-w-sm text-center animate-scale-in">
          <div className="card">
            <div className="mx-auto w-14 h-14 bg-success-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-success-700">{t("common.success")}</h1>
            <p className="text-sm text-on-surface-dim mt-2">{method === "email" ? t("auth.emailVerified") : t("auth.phoneVerified")}</p>
          </div>
        </div>
      </div>
    );
  }

  const title = method === "email" ? t("auth.verifyEmailTitle") : t("auth.verifyPhoneTitle");
  const description = method === "email" ? t("auth.checkInbox") : t("auth.enterPhoneCode");

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-dim px-4">
      <div className="w-full max-w-sm animate-scale-in">
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-on-surface">{title}</h1>
          <p className="text-sm text-on-surface-dim mt-1">{description}</p>
        </div>

        <div className="card">
          {error && <p className="text-xs text-error-500 bg-error-50 p-3 rounded-xl mb-4">{error}</p>}

          {method === "email" ? (
            <div className="space-y-4">
              {!tokenFromUrl && !emailSent && (
                <Button onClick={handleEmailSend} loading={loading} className="w-full">
                  {t("auth.sendEmailCode")}
                </Button>
              )}
              {emailSent && <p className="text-xs text-success-600 text-center">{t("auth.emailCodeSent").replace("{email}", identifier)}</p>}
              {tokenFromUrl && loading && <p className="text-xs text-on-surface-dim text-center">{t("common.verifying")}</p>}
            </div>
          ) : (
            <div className="space-y-5">
              {firebaseReady && !firebaseSent && (
                <div className="space-y-3">
                  <div ref={recaptchaRef} />
                  <Button onClick={handleFirebaseSend} loading={loading} variant="outline" className="w-full">
                    {t("auth.sendOtp")} (Firebase)
                  </Button>
                  <div className="flex items-center gap-2 text-xs text-on-surface-muted">
                    <div className="flex-1 h-px bg-outline" />
                    <span>{t("auth.or")}</span>
                    <div className="flex-1 h-px bg-outline" />
                  </div>
                </div>
              )}

              <form onSubmit={firebaseSent ? handleFirebaseVerify : handleOtpSubmit} className="space-y-5">
                <div className="flex justify-center gap-2">
                  {otp.map((digit, i) => (
                    <input key={i} ref={(el) => { inputRefs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1} value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)} onKeyDown={(e) => handleKeyDown(i, e)}
                      className="w-11 h-12 text-center text-lg font-semibold border border-outline rounded-xl input-field !w-11 !px-0" />
                  ))}
                </div>

                <div>
                  <p className="label">{t("auth.doctorCode")} <span className="text-on-surface-muted font-normal">({t("common.optional")})</span></p>
                  <input type="text" maxLength={6} placeholder="e.g. ABC123" value={doctorCode}
                    onChange={(e) => setDoctorCode(e.target.value.toUpperCase())}
                    className="input-field text-center uppercase tracking-widest" />
                  <p className="text-xs text-on-surface-muted mt-1.5">{t("auth.doctorCodeHint")}</p>
                </div>

                <Button type="submit" loading={loading} className="w-full">
                  {t("auth.verify")}
                </Button>
              </form>

              <button type="button" onClick={async () => {
                await fetch("/api/auth/send-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: identifier }) });
                setError(t("auth.codeSent"));
              }} className="w-full text-xs text-primary-600 font-medium hover:text-primary-700 transition-colors">
                {t("auth.resend")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
