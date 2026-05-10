import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { generateDoctorCode } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { email } from "@/lib/notification";
import { createServerT } from "@/lib/server-i18n";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const su = session.user as unknown as { id: string; role: string };
  const t = await createServerT();

  if (su.role === "DOCTOR") {
    let code = await prisma.doctorCode.findFirst({ where: { doctorId: su.id, isUsed: false } });
    if (!code) {
      const newCode = generateDoctorCode();
      code = await prisma.doctorCode.create({ data: { doctorId: su.id, code: newCode } });
      logger.info("Doctor code generated", { doctorId: su.id, code: newCode });
    }

    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">{t("doctor.settings")}</h1>
        <div className="bg-white border rounded-xl p-6">
          <h2 className="text-sm font-medium text-gray-500 mb-2">{t("doctor.yourCode")}</h2>
          <p className="text-4xl font-mono tracking-[0.3em] text-blue-600 text-center py-4">{code.code}</p>
          <p className="text-sm text-gray-500 text-center">{t("doctor.codeHint")}</p>
        </div>
        <form action={async () => { "use server"; const c = generateDoctorCode(); await prisma.doctorCode.create({ data: { doctorId: su.id, code: c } }); }}>
          <button type="submit" className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200">{t("doctor.generateNewCode")}</button>
        </form>
        <a href="/dashboard" className="text-blue-600 text-sm hover:underline inline-block">{t("doctor.backToDashboard")}</a>
      </div>
    );
  }

  const link = await prisma.patientDoctorLink.findFirst({ where: { patientId: su.id }, include: { doctor: true } });

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">{t("patient.settings")}</h1>
      <div className="bg-white border rounded-xl p-6">
        <h2 className="text-sm font-medium text-gray-500 mb-2">{t("auth.doctorCode")}</h2>
        {link
          ? <p className="text-lg">Dr. {link.doctor.firstName} {link.doctor.lastName}</p>
          : <div><p className="text-gray-400 text-sm mb-3">{t("doctor.noPatients")}</p>
              <form action={async (formData: FormData) => { "use server"; const code = formData.get("code") as string; if (!code || code.length !== 6) return; const cr = await prisma.doctorCode.findUnique({ where: { code } }); if (!cr || cr.isUsed) return; await prisma.doctorCode.update({ where: { id: cr.id }, data: { isUsed: true, usedByPatientId: su.id } }); await prisma.patientDoctorLink.create({ data: { patientId: su.id, doctorId: cr.doctorId } }); const doctor = await prisma.user.findUnique({ where: { id: cr.doctorId } }); if (doctor) await email.sendPatientLinked(doctor.email, "Patient"); }}
                className="flex gap-2">
                <input name="code" maxLength={6} placeholder={t("auth.doctorCode")} className="border rounded-lg px-3 py-2 text-sm uppercase tracking-widest flex-1" required />
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">{t("auth.verify")}</button>
              </form></div>}
      </div>
      <a href="/dashboard" className="text-blue-600 text-sm hover:underline inline-block">{t("doctor.backToDashboard")}</a>
    </div>
  );
}
