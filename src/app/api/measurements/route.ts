import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { email } from "@/lib/notification";
import { DANGEROUS_CONSECUTIVE_THRESHOLD, DANGEROUS_CONSECUTIVE_WINDOW_HOURS, GLUCOSE_THRESHOLDS } from "@/lib/constants";

async function checkDangerPattern(patientId: string) {
  try {
    const cutoff = new Date(); cutoff.setHours(cutoff.getHours() - DANGEROUS_CONSECUTIVE_WINDOW_HOURS);
    const recent = await prisma.glucoseReading.findMany({
      where: { patientId, value: { gt: GLUCOSE_THRESHOLDS.DANGEROUS }, measuredAt: { gte: cutoff } },
      orderBy: { measuredAt: "desc" }, take: DANGEROUS_CONSECUTIVE_THRESHOLD,
    });
    if (recent.length < DANGEROUS_CONSECUTIVE_THRESHOLD) return;
    const link = await prisma.patientDoctorLink.findFirst({ where: { patientId }, include: { doctor: true } });
    if (link && !link.notified) {
      await email.sendDangerAlert(link.doctor.email, `${recent.length} consecutive readings > ${GLUCOSE_THRESHOLDS.DANGEROUS} mg/dL in the last ${DANGEROUS_CONSECUTIVE_WINDOW_HOURS} hours.`);
      await prisma.patientDoctorLink.update({ where: { id: link.id }, data: { notified: true } });
      logger.info("Danger alert sent to doctor", { patientId, doctorId: link.doctorId, readings: recent.length });
    }
  } catch (error) { logger.error("Danger pattern check failed", { error, patientId }); }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as unknown as { id: string }).id;
    const { value, measuredAt, mealContext, mealType, source } = await request.json();
    if (!value || !measuredAt || !mealContext || !mealType) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const reading = await prisma.glucoseReading.create({
      data: { patientId: userId, value: parseFloat(value), measuredAt: new Date(measuredAt), mealContext, mealType, source: source || "MANUAL" },
    });
    logger.info("Glucose reading saved", { patientId: userId, value, mealType, mealContext });

    if (parseFloat(value) > GLUCOSE_THRESHOLDS.DANGEROUS) await checkDangerPattern(userId);
    return NextResponse.json(reading, { status: 201 });
  } catch (error) { logger.error("Failed to save reading", { error }); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const su = session.user as unknown as { id: string; role: string };
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const patientId = searchParams.get("patientId");
    let where: Record<string, unknown> = {};

    if (su.role === "DOCTOR" && patientId) {
      const link = await prisma.patientDoctorLink.findFirst({ where: { doctorId: su.id, patientId } });
      if (!link) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      where = { patientId };
    } else if (su.role === "PATIENT") {
      where = { patientId: su.id };
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (date) {
      const start = new Date(date); start.setHours(0, 0, 0, 0);
      const end = new Date(start); end.setDate(end.getDate() + 1);
      where = { ...where, measuredAt: { gte: start, lt: end } };
    }
    const readings = await prisma.glucoseReading.findMany({ where, orderBy: { measuredAt: "desc" } });
    return NextResponse.json(readings);
  } catch (error) { logger.error("Failed to fetch readings", { error }); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}
