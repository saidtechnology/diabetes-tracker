import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyFirebaseToken } from "@/lib/firebase-admin";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const { idToken, phone } = await request.json();
    if (!idToken || !phone) {
      return NextResponse.json({ error: "ID token and phone are required" }, { status: 400 });
    }

    const decoded = await verifyFirebaseToken(idToken);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid Firebase token" }, { status: 401 });
    }

    await prisma.user.updateMany({ where: { phone }, data: { phoneVerified: true } });
    logger.info("Phone verified via Firebase", { phone });
    return NextResponse.json({ message: "Phone verified successfully" });
  } catch (error) {
    logger.error("Firebase verification failed", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
