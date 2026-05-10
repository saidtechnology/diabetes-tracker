import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    const su = session?.user as unknown as { id: string; role: string } | undefined;
    if (!session || su?.role !== "DOCTOR") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));

    await prisma.doctorCode.create({ data: { doctorId: su.id, code } });
    logger.info("Doctor code generated via API", { doctorId: su.id });
    return NextResponse.json({ code });
  } catch (error) {
    logger.error("Failed to generate doctor code", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
