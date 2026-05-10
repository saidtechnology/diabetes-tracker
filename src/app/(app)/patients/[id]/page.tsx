import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getGlucoseColor } from "@/lib/constants";
import { GlucoseChart } from "@/components/patient/glucose-chart";
import type { GlucoseReading } from "@/generated/prisma/client";

async function getPatientData(doctorId: string, patientId: string) {
  const link = await prisma.patientDoctorLink.findFirst({ where: { doctorId, patientId }, include: { patient: true } });
  if (!link) return null;
  const readings = await prisma.glucoseReading.findMany({ where: { patientId }, orderBy: { measuredAt: "desc" } });
  return { patient: link.patient, readings };
}

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const su = session?.user as unknown as { id: string; role: string } | undefined;
  if (!session || su?.role !== "DOCTOR") redirect("/login");
  const { id: patientId } = await params;
  const data = await getPatientData(su.id, patientId);
  if (!data) notFound();

  const { patient, readings } = data;
  const recent20 = readings.slice(0, 20);
  const latest10 = readings.slice(0, 10);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">{patient.firstName} {patient.lastName}</h1>
      <p className="text-sm text-gray-500">{patient.email} &middot; {patient.phone}</p>
      <GlucoseChart readings={recent20.map((r: GlucoseReading) => ({ id: r.id, value: r.value, measuredAt: r.measuredAt.toISOString(), mealContext: r.mealContext, mealType: r.mealType }))} />
      <div className="bg-white border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Readings</h2>
        {latest10.length === 0
          ? <p className="text-gray-400 text-sm">No readings recorded.</p>
          : <div className="space-y-2">{latest10.map((r: GlucoseReading) => (
              <div key={r.id} className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
                <div><p className="text-sm font-medium">{r.mealType} — {r.mealContext === "BEFORE_MEAL" ? "Before" : "After"}</p><p className="text-xs text-gray-400">{new Date(r.measuredAt).toLocaleString()}</p></div>
                <span className="font-mono font-bold text-lg" style={{ color: getGlucoseColor(r.value) }}>{r.value} mg/dL</span>
              </div>
            ))}</div>}
      </div>
      <a href="/patients" className="text-blue-600 text-sm hover:underline inline-block">Back to patients</a>
    </div>
  );
}
