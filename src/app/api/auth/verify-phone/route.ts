import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { email } from "@/lib/notification";

export async function POST(request: Request) {
  try {
    const { phone, code, doctorCode } = await request.json();
    if (!phone || !code) return NextResponse.json({ error: "Phone and code are required" }, { status: 400 });

    const verification = await prisma.verificationCode.findFirst({
      where: { phone, code, verified: false, expiresAt: { gte: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    if (!verification) return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });

    await prisma.verificationCode.update({ where: { id: verification.id }, data: { verified: true } });
    await prisma.user.updateMany({ where: { phone }, data: { phoneVerified: true } });

    let doctorLinked = false;
    let doctorId: string | null = null;

    if (doctorCode) {
      const codeRecord = await prisma.doctorCode.findUnique({ where: { code: doctorCode } });
      if (codeRecord && !codeRecord.isUsed) {
        const user = await prisma.user.findUnique({ where: { phone } });
        if (user) {
          await prisma.doctorCode.update({ where: { id: codeRecord.id }, data: { isUsed: true, usedByPatientId: user.id } });
          await prisma.patientDoctorLink.create({ data: { patientId: user.id, doctorId: codeRecord.doctorId } });
          doctorId = codeRecord.doctorId;
          doctorLinked = true;

          const doctor = await prisma.user.findUnique({ where: { id: codeRecord.doctorId } });
          if (doctor) await email.sendPatientLinked(doctor.email, `${user.firstName} ${user.lastName}`);

          logger.info("Patient linked to doctor and notified", { patientId: user.id, doctorId: codeRecord.doctorId });
        }
      }
    }

    logger.info("Phone verified", { phone, doctorLinked });
    return NextResponse.json({ message: "Phone verified successfully", doctorLinked, doctorId });
  } catch (error) {
    logger.error("Phone verification failed", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
