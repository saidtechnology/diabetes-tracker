"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

const MEAL_TYPES = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as const;
const MEAL_CONTEXTS = ["BEFORE_MEAL", "AFTER_MEAL"] as const;
const MAX_RETRIES = 3;
type Step = "start" | "capture" | "confirm" | "manual" | "saving";

export default function CameraEntryPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [step, setStep] = useState<Step>("start");
  const [retries, setRetries] = useState(0);
  const [extractedValue, setExtractedValue] = useState<number | null>(null);
  const [extractedTime, setExtractedTime] = useState("");
  const [error, setError] = useState("");
  const isSaving = step === "saving";
  const [manualForm, setManualForm] = useState({ value: "", measuredAt: new Date().toISOString().slice(0, 16), mealContext: "BEFORE_MEAL", mealType: "BREAKFAST" });

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setStep("capture"); setError("");
    } catch { setError("Camera access denied."); setStep("manual"); }
  }

  function stopCamera() {
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
  }

  async function captureImage() {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current, canvas = canvasRef.current;
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL("image/jpeg", 0.8);
    setStep("saving"); setError("");

    try {
      const res = await fetch("/api/ocr/parse", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: imageData }) });
      const data = await res.json();
      if (data.value) {
        setExtractedValue(data.value); setExtractedTime(data.time || new Date().toISOString().slice(0, 16));
        setStep("confirm"); stopCamera();
      } else {
        const newRetries = retries + 1; setRetries(newRetries);
        if (newRetries >= MAX_RETRIES) { setError("Could not read meter after 3 attempts."); setStep("manual"); stopCamera(); }
        else { setError(`Retry ${newRetries}/${MAX_RETRIES}`); setStep("capture"); }
      }
    } catch { setError("OCR failed."); setStep("capture"); }
  }

  async function confirmReading() {
    if (!extractedValue) return; setStep("saving");
    try {
      const res = await fetch("/api/measurements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value: extractedValue, measuredAt: new Date(extractedTime).toISOString(), mealContext: "BEFORE_MEAL", mealType: "BREAKFAST", source: "OCR" }) });
      if (!res.ok) throw new Error("Save failed");
      router.push("/dashboard"); router.refresh();
    } catch { setError("Failed to save."); setStep("manual"); }
  }

  async function submitManual(e: React.FormEvent) {
    e.preventDefault(); setError(""); setStep("saving");
    const value = parseFloat(manualForm.value);
    if (isNaN(value) || value < 10 || value > 600) { setError("Invalid value (10-600 mg/dL)"); setStep("manual"); return; }
    try {
      const res = await fetch("/api/measurements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value, measuredAt: new Date(manualForm.measuredAt).toISOString(), mealContext: manualForm.mealContext, mealType: manualForm.mealType, source: "MANUAL" }) });
      if (!res.ok) throw new Error("Save failed");
      router.push("/dashboard"); router.refresh();
    } catch { setError("Failed to save"); setStep("manual"); }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Scan Glucose Meter</h1>
      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-4">{error}</p>}

      {step === "start" && (
        <div className="text-center space-y-4">
          <p className="text-gray-500 text-sm">Take a photo of your glucose meter display.</p>
          <button onClick={startCamera} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700">Open Camera</button>
          <button onClick={() => setStep("manual")} className="block w-full text-sm text-gray-500 hover:underline mt-2">Enter manually instead</button>
        </div>
      )}

      {step === "capture" && (
        <div className="space-y-4">
          <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg border" />
          <canvas ref={canvasRef} className="hidden" />
          <button onClick={captureImage} className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700">Capture Photo</button>
          <button onClick={() => { stopCamera(); setStep("manual"); }} className="w-full text-sm text-gray-500 hover:underline">Switch to manual entry</button>
        </div>
      )}

      {step === "confirm" && (
        <div className="space-y-4 bg-white border rounded-xl p-6">
          <h2 className="font-semibold">Confirm Reading</h2>
          <p className="text-3xl font-mono text-center">{extractedValue} mg/dL</p>
          <p className="text-sm text-gray-500 text-center">{extractedTime ? new Date(extractedTime).toLocaleString() : "Time not detected"}</p>
          <div className="flex gap-3">
            <button onClick={confirmReading} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700">Confirm</button>
            <button onClick={() => { stopCamera(); setStep("manual"); }} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-200">Edit Manually</button>
          </div>
        </div>
      )}

      {step === "manual" && (
        <form onSubmit={submitManual} className="space-y-4">
          <p className="text-sm text-gray-500">Enter the reading manually:</p>
          <input type="number" step="0.1" placeholder="Blood glucose (mg/dL)" value={manualForm.value}
            onChange={(e) => setManualForm({ ...manualForm, value: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-lg" required />
          <input type="datetime-local" value={manualForm.measuredAt}
            onChange={(e) => setManualForm({ ...manualForm, measuredAt: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
          <div className="flex gap-2">
            {MEAL_CONTEXTS.map((ctx) => (
              <button key={ctx} type="button"
                className={`flex-1 py-2 rounded-lg text-sm ${manualForm.mealContext === ctx ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
                onClick={() => setManualForm({ ...manualForm, mealContext: ctx })}>{ctx === "BEFORE_MEAL" ? "Before" : "After"}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {MEAL_TYPES.map((meal) => (
              <button key={meal} type="button"
                className={`py-2 rounded-lg text-sm ${manualForm.mealType === meal ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
                onClick={() => setManualForm({ ...manualForm, mealType: meal })}>{meal.charAt(0) + meal.slice(1).toLowerCase()}</button>
            ))}
          </div>
          <button type="submit" disabled={isSaving} className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">Save Reading</button>
        </form>
      )}
    </div>
  );
}
