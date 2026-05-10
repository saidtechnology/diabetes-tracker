"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import { getFirebaseApp } from "@/lib/firebase";
import { getAuth, signInWithPhoneNumber, RecaptchaVerifier, type ConfirmationResult } from "firebase/auth";

export default function VerifyPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const identifier = searchParams.get("phone") || searchParams.get("email") || "";
  const method = (searchParams.get("method") || "phone") as "phone" | "email";
  const tokenFromUrl = searchParams.get("token") || "";
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
    return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">{t("common.noPhone")}</p></div>;
  }

  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md text-center bg-white p-8 rounded-xl shadow-sm">
          <div className="text-4xl mb-4">&#10003;</div>
          <h1 className="text-2xl font-bold text-green-600">{t("common.success")}</h1>
          <p className="text-gray-500 mt-2">{method === "email" ? t("auth.emailVerified") : t("auth.phoneVerified")}</p>
        </div>
      </div>
    );
  }

  const title = method === "email" ? t("auth.verifyEmailTitle") : t("auth.verifyPhoneTitle");
  const description = method === "email" ? t("auth.checkInbox") : t("auth.enterPhoneCode");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-xl shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
        {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

        {method === "email" ? (
          <div className="space-y-4">
            {!tokenFromUrl && !emailSent && (
              <button onClick={handleEmailSend} disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
                {loading ? t("common.saving") : t("auth.sendEmailCode")}
              </button>
            )}
            {emailSent && <p className="text-sm text-green-600 text-center">{t("auth.emailCodeSent").replace("{email}", identifier)}</p>}
            {tokenFromUrl && loading && <p className="text-sm text-gray-500 text-center">{t("common.verifying")}</p>}
          </div>
        ) : (
          <div className="space-y-6">
            {firebaseReady && !firebaseSent && (
              <div className="space-y-3">
                <div ref={recaptchaRef} />
                <button onClick={handleFirebaseSend} disabled={loading} className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">
                  {loading ? t("common.loading") : t("auth.sendOtp") + " (Firebase)"}
                </button>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span>{t("auth.or")}</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
              </div>
            )}
            <form onSubmit={firebaseSent ? handleFirebaseVerify : handleOtpSubmit} className="space-y-6">
              <div className="flex justify-center gap-2">
                {otp.map((digit, i) => (
                  <input key={i} ref={(el) => { inputRefs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1} value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)} onKeyDown={(e) => handleKeyDown(i, e)}
                    className="w-12 h-12 text-center text-lg border rounded-lg" />
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("auth.doctorCode")} ({t("common.optional")})</label>
                <input type="text" maxLength={6} placeholder="e.g. ABC123" value={doctorCode}
                  onChange={(e) => setDoctorCode(e.target.value.toUpperCase())}
                  className="w-full border rounded-lg px-3 py-2 text-sm text-center uppercase tracking-widest" />
                <p className="text-xs text-gray-400 mt-1">{t("auth.doctorCodeHint")}</p>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
                {loading ? t("common.verifying") : t("auth.verify")}
              </button>
            </form>
            <button type="button" onClick={async () => {
              await fetch("/api/auth/send-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: identifier }) });
            }} className="w-full text-sm text-blue-600 hover:underline">{t("auth.resend")}</button>
          </div>
        )}
      </div>
    </div>
  );
}
