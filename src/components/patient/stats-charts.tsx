"use client";

import { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { GLUCOSE_THRESHOLDS, GLUCOSE_COLORS, getGlucoseColor } from "@/lib/constants";

type StatsData = {
  hba1c: { id: string; value: number; measuredAt: string }[];
  triglycerides: { id: string; value: number; measuredAt: string }[];
  glucose: { id: string; value: number; measuredAt: string; mealContext: string; mealType: string }[];
};

export function StatsCharts({ patientId }: { patientId?: string }) {
  const [data, setData] = useState<StatsData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = patientId ? `/api/measurements/stats?patientId=${patientId}` : "/api/measurements/stats";
    fetch(url)
      .then((res) => { if (!res.ok) throw new Error("Failed to load"); return res.json(); })
      .then((d: StatsData) => setData(d))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [patientId]);

  if (loading) return <div className="bg-white border rounded-xl p-6 text-center text-gray-400 text-sm">Loading stats...</div>;
  if (error) return <div className="bg-white border rounded-xl p-6 text-center text-red-400 text-sm">{error}</div>;
  if (!data) return null;

  const fmt = (iso: string) => new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-6">
      {data.hba1c.length > 0 && (
        <div className="bg-white border rounded-xl p-6">
          <h2 className="text-sm font-medium text-gray-500 mb-4">HbA1c (Last 3 Months)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.hba1c.map((r) => ({ label: fmt(r.measuredAt), value: r.value }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis domain={[4, 12]} tick={{ fontSize: 11 }} label={{ value: "%", angle: -90, position: "insideLeft", style: { fontSize: 11, fill: "#999" } }} />
              <Tooltip contentStyle={{ fontSize: 13 }} formatter={(value) => [`${value}%`, "HbA1c"]} />
              <ReferenceLine y={7} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "Target 7%", fontSize: 10, fill: "#f59e0b" }} />
              <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {data.triglycerides.length > 0 && (
        <div className="bg-white border rounded-xl p-6">
          <h2 className="text-sm font-medium text-gray-500 mb-4">Triglycerides (Last 3 Months)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.triglycerides.map((r) => ({ label: fmt(r.measuredAt), value: r.value }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} label={{ value: "mg/dL", angle: -90, position: "insideLeft", style: { fontSize: 11, fill: "#999" } }} />
              <Tooltip contentStyle={{ fontSize: 13 }} formatter={(value) => [`${value} mg/dL`, "Triglycerides"]} />
              <ReferenceLine y={150} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "High 150", fontSize: 10, fill: "#f59e0b" }} />
              <Bar dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {data.glucose.length > 0 && (
        <div className="bg-white border rounded-xl p-6">
          <h2 className="text-sm font-medium text-gray-500 mb-4">Glucose Trend (Last 3 Months)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={[...data.glucose].sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime()).map((r) => ({ time: fmtTime(r.measuredAt), value: r.value }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis domain={[30, 350]} tick={{ fontSize: 11 }} label={{ value: "mg/dL", angle: -90, position: "insideLeft", style: { fontSize: 11, fill: "#999" } }} />
              <Tooltip contentStyle={{ fontSize: 13 }} formatter={(value) => [`${value} mg/dL`, "Glucose"]} />
              <ReferenceLine y={GLUCOSE_THRESHOLDS.LOW} stroke={GLUCOSE_COLORS.LOW} strokeDasharray="4 4" label={{ value: "Low", fontSize: 10, fill: GLUCOSE_COLORS.LOW }} />
              <ReferenceLine y={GLUCOSE_THRESHOLDS.HIGH} stroke={GLUCOSE_COLORS.HIGH} strokeDasharray="4 4" label={{ value: "High", fontSize: 10, fill: GLUCOSE_COLORS.HIGH }} />
              <ReferenceLine y={GLUCOSE_THRESHOLDS.DANGEROUS} stroke={GLUCOSE_COLORS.DANGEROUS} strokeDasharray="4 4" label={{ value: "Danger", fontSize: 10, fill: GLUCOSE_COLORS.DANGEROUS }} />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={(props: { cx?: number; cy?: number; payload?: { value: number } }) => {
                const { cx, cy, payload } = props;
                if (cx == null || cy == null || !payload) return null;
                return <circle cx={cx} cy={cy} r={4} fill={getGlucoseColor(payload.value)} stroke="white" strokeWidth={2} />;
              }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
