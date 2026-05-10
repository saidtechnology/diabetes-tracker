"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type PatientLink = {
  id: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  linkedAt: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
};

export default function PatientsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const role = session?.user ? (session.user as unknown as { role: string })?.role : null;
  const [links, setLinks] = useState<PatientLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (role !== "DOCTOR") return;
    fetch("/api/doctor/patients")
      .then((res) => { if (!res.ok) throw new Error("Failed"); return res.json(); })
      .then((data) => setLinks(data.patients))
      .catch(() => setError("Could not load patients"))
      .finally(() => setLoading(false));
  }, [role]);

  async function handleAction(linkId: string, action: "accept" | "reject" | "remove") {
    const res = await fetch("/api/doctor/patients", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ linkId, action }),
    });
    if (!res.ok) return;
    if (action === "remove") {
      setLinks((prev) => prev.filter((l) => l.id !== linkId));
    } else {
      setLinks((prev) => prev.map((l) => l.id === linkId ? { ...l, status: action === "accept" ? "ACCEPTED" : "REJECTED" } : l));
    }
  }

  if (role !== "DOCTOR") return <div className="max-w-4xl mx-auto p-6"><p className="text-gray-500">Redirecting...</p></div>;

  if (loading) return <div className="max-w-4xl mx-auto p-6"><p className="text-gray-400">Loading...</p></div>;
  if (error) return <div className="max-w-4xl mx-auto p-6"><p className="text-red-400">{error}</p></div>;

  const pending = links.filter((l) => l.status === "PENDING");
  const accepted = links.filter((l) => l.status === "ACCEPTED");
  const rejected = links.filter((l) => l.status === "REJECTED");

  if (links.length === 0) return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">My Patients</h1>
      <p className="text-gray-400">No patients yet.</p>
      <a href="/dashboard" className="text-blue-600 text-sm hover:underline mt-2 inline-block">Back to Dashboard</a>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">My Patients</h1>

      {pending.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-amber-600 mb-3">Pending Requests ({pending.length})</h2>
          <div className="space-y-3">
            {pending.map((link) => (
              <div key={link.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{link.patient.firstName} {link.patient.lastName}</p>
                    <p className="text-xs text-gray-400">{link.patient.email} &middot; {link.patient.phone}</p>
                    <p className="text-xs text-gray-400">Requested {new Date(link.linkedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleAction(link.id, "accept")} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-700">Accept</button>
                    <button onClick={() => handleAction(link.id, "reject")} className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-200">Reject</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {accepted.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-gray-500 mb-3">Accepted Patients ({accepted.length})</h2>
          <div className="space-y-3">
            {accepted.map((link) => (
              <div key={link.id} className="bg-white border rounded-xl p-4 hover:shadow-sm transition cursor-pointer" onClick={() => router.push(`/patients/${link.patient.id}`)}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{link.patient.firstName} {link.patient.lastName}</p>
                    <p className="text-xs text-gray-400">{link.patient.email} &middot; {link.patient.phone}</p>
                    <p className="text-xs text-gray-400">Accepted {new Date(link.linkedAt).toLocaleDateString()}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleAction(link.id, "remove"); }} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {rejected.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-gray-400 mb-3">Rejected ({rejected.length})</h2>
          <div className="space-y-2">
            {rejected.map((link) => (
              <div key={link.id} className="bg-gray-50 border rounded-xl p-3 opacity-60">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">{link.patient.firstName} {link.patient.lastName}</p>
                    <p className="text-xs text-gray-400">Rejected</p>
                  </div>
                  <button onClick={() => handleAction(link.id, "remove")} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <a href="/dashboard" className="text-blue-600 text-sm hover:underline inline-block">Back to Dashboard</a>
    </div>
  );
}
