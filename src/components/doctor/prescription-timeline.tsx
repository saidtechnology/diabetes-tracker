"use client";

import { useState, useEffect } from "react";

type Prescription = {
  id: string;
  content: string;
  createdAt: string;
  validUntil: string | null;
};

export function PrescriptionTimeline({ doctorId, patientId }: { doctorId: string; patientId: string }) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [content, setContent] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/prescriptions?patientId=${patientId}`)
      .then((res) => { if (!res.ok) throw new Error("Failed to load"); return res.json(); })
      .then(setPrescriptions)
      .catch(() => setError("Failed to load prescriptions"))
      .finally(() => setLoading(false));
  }, [patientId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, content: content.trim(), validUntil: validUntil || null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setPrescriptions((prev) => [data, ...prev]);
      setContent("");
      setValidUntil("");
    } catch {
      setError("Failed to create prescription");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white border rounded-xl p-6 space-y-4">
      <h2 className="text-lg font-semibold">Prescriptions</h2>

      <form onSubmit={handleCreate} className="space-y-3 bg-gray-50 p-4 rounded-lg">
        <textarea
          placeholder="Write a new prescription..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm min-h-[80px]"
          required
        />
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="text-xs text-gray-500 block mb-1">Valid until (optional)</label>
            <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <button type="submit" disabled={saving || !content.trim()} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 mt-auto">
            {saving ? "Saving..." : "Create Prescription"}
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      {loading ? (
        <p className="text-sm text-gray-400 text-center">Loading...</p>
      ) : prescriptions.length === 0 ? (
        <p className="text-sm text-gray-400 text-center">No prescriptions yet.</p>
      ) : (
        <div className="space-y-3">
          {prescriptions.map((p) => (
            <div key={p.id} className="border-l-2 border-blue-300 pl-4 py-2">
              <p className="text-sm whitespace-pre-wrap">{p.content}</p>
              <div className="flex gap-3 mt-1">
                <span className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</span>
                {p.validUntil && (
                  <span className={`text-xs ${new Date(p.validUntil) < new Date() ? "text-red-500" : "text-gray-400"}`}>
                    {new Date(p.validUntil) < new Date() ? "Expired" : `Valid until ${new Date(p.validUntil).toLocaleDateString()}`}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
