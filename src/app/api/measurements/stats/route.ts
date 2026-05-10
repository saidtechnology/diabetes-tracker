import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const su = session.user as unknown as { id: string; role: string };
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId") || su.id;

    if (su.role === "DOCTOR") {
      const link = await prisma.patientDoctorLink.findFirst({
        where: { doctorId: su.id, patientId, status: "ACCEPTED" },
      });
      if (!link) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const [hba1cReadings, triglycerideReadings, recentReadings] = await Promise.all([
      prisma.glucoseReading.findMany({
        where: { patientId, readingType: "HBA1C", measuredAt: { gte: threeMonthsAgo } },
        orderBy: { measuredAt: "asc" },
      }),
      prisma.glucoseReading.findMany({
        where: { patientId, readingType: "TRIGLYCERIDE", measuredAt: { gte: threeMonthsAgo } },
        orderBy: { measuredAt: "asc" },
      }),
      prisma.glucoseReading.findMany({
        where: { patientId, readingType: "GLUCOSE", measuredAt: { gte: threeMonthsAgo } },
        orderBy: { measuredAt: "asc" },
      }),
    ]);

    return NextResponse.json({ hba1c: hba1cReadings, triglycerides: triglycerideReadings, glucose: recentReadings });
  } catch (error) {
    logger.error("Failed to fetch stats", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
