import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createServerT } from "@/lib/server-i18n";

export default async function MeasurementsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const su = session.user as unknown as { role: string };
  if (su.role !== "PATIENT") redirect("/dashboard");
  const t = await createServerT();

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">{t("measurements.manual")}</h1>
      <div className="grid gap-4">
        <a href="/measurements/manual" className="block bg-white border rounded-xl p-6 hover:shadow-sm transition">
          <h2 className="font-semibold">{t("patient.addReading")}</h2>
          <p className="text-sm text-gray-500 mt-1">{t("measurements.valueHint")}</p>
        </a>
        <a href="/measurements/camera" className="block bg-white border rounded-xl p-6 hover:shadow-sm transition">
          <h2 className="font-semibold">{t("measurements.camera")}</h2>
          <p className="text-sm text-gray-500 mt-1">{t("measurements.scanHint")}</p>
        </a>
      </div>
      <a href="/dashboard" className="text-sm text-blue-600 hover:underline inline-block">{t("doctor.backToDashboard")}</a>
    </div>
  );
}
