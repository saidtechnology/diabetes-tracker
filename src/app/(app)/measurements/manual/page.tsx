"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";

const MEAL_TYPES = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as const;
const MEAL_CONTEXTS = ["BEFORE_MEAL", "AFTER_MEAL"] as const;

export default function ManualEntryPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [form, setForm] = useState({ value: "", measuredAt: new Date().toISOString().slice(0, 16), mealContext: "BEFORE_MEAL", mealType: "BREAKFAST" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    const value = parseFloat(form.value);
    if (isNaN(value) || value < 10 || value > 600) { setError(t("measurements.invalidValue")); setLoading(false); return; }
    try {
      const res = await fetch("/api/measurements", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value, measuredAt: new Date(form.measuredAt).toISOString(), mealContext: form.mealContext, mealType: form.mealType, source: "MANUAL" }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || t("common.error")); return; }
      router.push("/dashboard"); router.refresh();
    } catch { setError(t("common.networkError")); } finally { setLoading(false); }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">{t("measurements.manual")}</h1>
      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t("measurements.glucoseValue")}</label>
          <input type="number" step="0.1" min="10" max="600" placeholder={t("measurements.valueHint")} value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-lg" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t("measurements.dateTime")}</label>
          <input type="datetime-local" value={form.measuredAt}
            onChange={(e) => setForm({ ...form, measuredAt: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t("measurements.when")}</label>
          <div className="flex gap-2">
            {MEAL_CONTEXTS.map((ctx) => (
              <button key={ctx} type="button"
                className={`flex-1 py-2 rounded-lg text-sm ${form.mealContext === ctx ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
                onClick={() => setForm({ ...form, mealContext: ctx })}>
                {ctx === "BEFORE_MEAL" ? t("patient.before") : t("patient.after")}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t("measurements.meal")}</label>
          <div className="grid grid-cols-2 gap-2">
            {MEAL_TYPES.map((meal) => (
              <button key={meal} type="button"
                className={`py-2 rounded-lg text-sm ${form.mealType === meal ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
                onClick={() => setForm({ ...form, mealType: meal })}>
                {meal.charAt(0) + meal.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
          {loading ? t("common.saving") : t("measurements.save")}
        </button>
      </form>
    </div>
  );
}
