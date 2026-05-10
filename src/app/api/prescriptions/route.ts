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
    const patientId = searchParams.get("patientId");

    if (su.role === "DOCTOR" && patientId) {
      const link = await prisma.patientDoctorLink.findFirst({
        where: { doctorId: su.id, patientId, status: "ACCEPTED" },
      });
      if (!link) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      const prescriptions = await prisma.prescription.findMany({
        where: { doctorId: su.id, patientId },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(prescriptions);
    }

    if (su.role === "PATIENT") {
      const prescriptions = await prisma.prescription.findMany({
        where: { patientId: su.id },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(prescriptions);
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (error) {
    logger.error("Failed to fetch prescriptions", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const su = session?.user as unknown as { id: string; role: string } | undefined;
    if (!session || su?.role !== "DOCTOR") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { patientId, content, validUntil } = await request.json();
    if (!patientId || !content) return NextResponse.json({ error: "Patient ID and content are required" }, { status: 400 });

    const link = await prisma.patientDoctorLink.findFirst({
      where: { doctorId: su.id, patientId, status: "ACCEPTED" },
    });
    if (!link) return NextResponse.json({ error: "Patient not linked" }, { status: 403 });

    const prescription = await prisma.prescription.create({
      data: { doctorId: su.id, patientId, content, validUntil: validUntil ? new Date(validUntil) : null },
    });
    logger.info("Prescription created", { doctorId: su.id, patientId });

    return NextResponse.json(prescription, { status: 201 });
  } catch (error) {
    logger.error("Failed to create prescription", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
