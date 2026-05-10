import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getGlucoseColor } from "@/lib/constants";

export default async function PatientsPage() {
  const session = await getServerSession(authOptions);
  const su = session?.user as unknown as { id: string; role: string } | undefined;
  if (!session || su?.role !== "DOCTOR") redirect("/login");

  const links = await prisma.patientDoctorLink.findMany({
    where: { doctorId: su.id },
    include: { patient: { include: { glucoseReadings: { orderBy: { measuredAt: "desc" }, take: 1 } } } },
    orderBy: { linkedAt: "desc" },
  });

  if (links.length === 0) return (
    <div className="max-w-4xl mx-auto p-6"><h1 className="text-2xl font-bold mb-4">My Patients</h1><p className="text-gray-400">No patients linked yet.</p>
      <a href="/dashboard" className="text-blue-600 text-sm hover:underline mt-2 inline-block">Back to Dashboard</a></div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">My Patients</h1>
      <div className="space-y-3">
        {links.map((link: { id: string; patient: { id: string; firstName: string; lastName: string; glucoseReadings: { value: number; measuredAt: Date }[] }; linkedAt: Date }) => {
          const last = link.patient.glucoseReadings[0];
          return (
            <a key={link.id} href={`/patients/${link.patient.id}`} className="block bg-white border rounded-xl p-4 hover:shadow-sm transition">
              <div className="flex justify-between items-center">
                <div><p className="font-medium">{link.patient.firstName} {link.patient.lastName}</p><p className="text-xs text-gray-400">Linked {new Date(link.linkedAt).toLocaleDateString()}</p></div>
                {last && <div className="text-right"><p className="font-mono font-bold" style={{ color: getGlucoseColor(last.value) }}>{last.value} mg/dL</p><p className="text-xs text-gray-400">{new Date(last.measuredAt).toLocaleDateString()}</p></div>}
              </div>
            </a>
          );
        })}
      </div>
      <a href="/dashboard" className="text-blue-600 text-sm hover:underline inline-block">Back to Dashboard</a>
    </div>
  );
}
