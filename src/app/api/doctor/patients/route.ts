import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const su = session?.user as unknown as { id: string; role: string } | undefined;
    if (!session || su?.role !== "DOCTOR") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const links = await prisma.patientDoctorLink.findMany({
      where: { doctorId: su.id },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
      },
      orderBy: { linkedAt: "desc" },
    });

    const pendingCount = links.filter((l) => l.status === "PENDING").length;

    return NextResponse.json({ patients: links, pendingCount });
  } catch (error) {
    logger.error("Failed to fetch patients", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const su = session?.user as unknown as { id: string; role: string } | undefined;
    if (!session || su?.role !== "DOCTOR") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { linkId, action } = await request.json();
    if (!linkId || !["accept", "reject", "remove"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const link = await prisma.patientDoctorLink.findFirst({ where: { id: linkId, doctorId: su.id } });
    if (!link) return NextResponse.json({ error: "Link not found" }, { status: 404 });

    if (action === "remove") {
      await prisma.patientDoctorLink.delete({ where: { id: linkId } });
      logger.info("Patient unlinked by doctor", { doctorId: su.id, patientId: link.patientId });
    } else {
      await prisma.patientDoctorLink.update({
        where: { id: linkId },
        data: { status: action === "accept" ? "ACCEPTED" : "REJECTED" },
      });
      logger.info(`Patient link ${action}ed`, { doctorId: su.id, patientId: link.patientId });
    }

    return NextResponse.json({ message: `Patient ${action === "remove" ? "removed" : action + "ed"}` });
  } catch (error) {
    logger.error("Failed to update patient link", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
