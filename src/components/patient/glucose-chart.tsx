"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { GLUCOSE_THRESHOLDS, GLUCOSE_COLORS, getGlucoseColor } from "@/lib/constants";

type Reading = { id: string; value: number; measuredAt: string; mealContext: string; mealType: string };

export function GlucoseChart({ readings }: { readings: Reading[] }) {
  if (readings.length === 0) return <div className="bg-white border rounded-xl p-6 text-center text-gray-400 text-sm">No readings to display</div>;

  const data = [...readings]
    .sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime())
    .map((r) => ({ time: new Date(r.measuredAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), value: r.value }));

  const CustomDot = (props: { cx?: number; cy?: number; payload?: { value: number } }) => {
    const { cx, cy, payload } = props;
    if (cx == null || cy == null || !payload) return null;
    return <circle cx={cx} cy={cy} r={6} fill={getGlucoseColor(payload.value)} stroke="white" strokeWidth={2} />;
  };

  return (
    <div className="bg-white border rounded-xl p-6">
      <h2 className="text-sm font-medium text-gray-500 mb-4">Glucose Trend</h2>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="time" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis domain={[30, 350]} tick={{ fontSize: 11 }} label={{ value: "mg/dL", angle: -90, position: "insideLeft", style: { fontSize: 11, fill: "#999" } }} />
          <Tooltip contentStyle={{ fontSize: 13 }} formatter={(value) => [`${value} mg/dL`, "Glucose"]} />
          <ReferenceLine y={GLUCOSE_THRESHOLDS.LOW} stroke={GLUCOSE_COLORS.LOW} strokeDasharray="4 4" label={{ value: "Low", fontSize: 10, fill: GLUCOSE_COLORS.LOW }} />
          <ReferenceLine y={GLUCOSE_THRESHOLDS.HIGH} stroke={GLUCOSE_COLORS.HIGH} strokeDasharray="4 4" label={{ value: "High", fontSize: 10, fill: GLUCOSE_COLORS.HIGH }} />
          <ReferenceLine y={GLUCOSE_THRESHOLDS.DANGEROUS} stroke={GLUCOSE_COLORS.DANGEROUS} strokeDasharray="4 4" label={{ value: "Danger", fontSize: 10, fill: GLUCOSE_COLORS.DANGEROUS }} />
          <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={<CustomDot />} connectNulls />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-4 mt-4 text-xs">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: GLUCOSE_COLORS.LOW }} />Low (&lt;70)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: GLUCOSE_COLORS.NORMAL }} />Normal (70-140)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: GLUCOSE_COLORS.HIGH }} />High (140-250)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: GLUCOSE_COLORS.DANGEROUS }} />Danger (&gt;250)</span>
      </div>
    </div>
  );
}
