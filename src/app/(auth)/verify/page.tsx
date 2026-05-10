"use client";

import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") || "";
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [doctorCode, setDoctorCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function handleOtpChange(index: number, value: string) {
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otp]; newOtp[index] = value; setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const code = otp.join("");
    if (code.length !== 6) { setError("Please enter the complete 6-digit code"); setLoading(false); return; }
    try {
      const res = await fetch("/api/auth/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code, doctorCode: doctorCode.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      router.push("/login");
    } catch { setError("Network error"); } finally { setLoading(false); }
  }

  if (!phone) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">No phone number provided.</p></div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6 bg-white p-8 rounded-xl shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Verify Your Phone</h1>
          <p className="text-sm text-gray-500 mt-1">Enter the 6-digit code sent to {phone}</p>
        </div>
        {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
        <div className="flex justify-center gap-2">
          {otp.map((digit, i) => (
            <input key={i} ref={(el) => { inputRefs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1} value={digit}
              onChange={(e) => handleOtpChange(i, e.target.value)} onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-12 h-12 text-center text-lg border rounded-lg" />
          ))}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Doctor&apos;s Code (optional)</label>
          <input type="text" maxLength={6} placeholder="e.g. ABC123" value={doctorCode}
            onChange={(e) => setDoctorCode(e.target.value.toUpperCase())}
            className="w-full border rounded-lg px-3 py-2 text-sm text-center uppercase tracking-widest" />
          <p className="text-xs text-gray-400 mt-1">Enter the code your doctor gave you</p>
        </div>
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
          {loading ? "Verifying..." : "Verify & Continue"}
        </button>
        <button type="button" onClick={async () => { await fetch("/api/auth/send-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone }) }); }}
          className="w-full text-sm text-blue-600 hover:underline">Resend code</button>
      </form>
    </div>
  );
}
