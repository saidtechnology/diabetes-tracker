import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { GlucoseChart } from "@/components/patient/glucose-chart";
import type { GlucoseReading } from "@/generated/prisma/client";
import { createServerT } from "@/lib/server-i18n";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const su = session.user as unknown as { id: string; role: string };
  const t = await createServerT();

  if (su.role === "DOCTOR") {
    const doctorCode = await prisma.doctorCode.findFirst({ where: { doctorId: su.id, isUsed: false } });
    const patientCount = await prisma.patientDoctorLink.count({ where: { doctorId: su.id } });

    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">{t("doctor.dashboard")}</h1>
        <div className="bg-white border rounded-xl p-6">
          <h2 className="text-sm font-medium text-gray-500 mb-2">{t("doctor.yourCode")}</h2>
          <p className="text-3xl font-mono tracking-widest text-blue-600">{doctorCode?.code ?? t("doctor.generateNewCode")}</p>
          <p className="text-xs text-gray-400 mt-2">{t("doctor.codeHint")}</p>
        </div>
        <div className="bg-white border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-2">{t("doctor.linkedPatients")}</h2>
          <p className="text-3xl font-bold">{patientCount}</p>
          <p className="text-sm text-gray-500">{t("doctor.totalPatients")}</p>
        </div>
        <div className="flex gap-3">
          <a href="/patients" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">{t("doctor.viewPatients")}</a>
          <a href="/settings" className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200">{t("doctor.settings")}</a>
        </div>
      </div>
    );
  }

  const recentReadings = await prisma.glucoseReading.findMany({ where: { patientId: su.id }, orderBy: { measuredAt: "desc" }, take: 20 });
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayReadings = await prisma.glucoseReading.count({ where: { patientId: su.id, measuredAt: { gte: today } } });

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">{t("patient.dashboard")}</h1>
      <div className="bg-white border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-2">{t("patient.todayReadings")}</h2>
        <p className="text-3xl font-bold">{todayReadings}</p>
        <p className="text-sm text-gray-500">{t("patient.measurementsToday")}</p>
      </div>
      <GlucoseChart readings={recentReadings.map((r: GlucoseReading) => ({ id: r.id, value: r.value, measuredAt: r.measuredAt.toISOString(), mealContext: r.mealContext, mealType: r.mealType }))} />
      <div className="flex gap-3">
        <a href="/measurements/manual" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">{t("patient.addReading")}</a>
        <a href="/measurements/camera" className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200">{t("patient.scanMeter")}</a>
        <a href="/settings" className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200">{t("patient.settings")}</a>
      </div>
    </div>
  );
}
