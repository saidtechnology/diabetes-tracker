import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const { email: userEmail, token } = await request.json();
    if (!userEmail || !token) return NextResponse.json({ error: "Email and token are required" }, { status: 400 });

    const verification = await prisma.verificationCode.findFirst({
      where: { phone: `email:${userEmail}`, code: token, verified: false, expiresAt: { gte: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    if (!verification) return NextResponse.json({ error: "Invalid or expired link" }, { status: 400 });

    await prisma.verificationCode.update({ where: { id: verification.id }, data: { verified: true } });
    await prisma.user.updateMany({ where: { email: userEmail }, data: { phoneVerified: true } });

    logger.info("Email verified", { email: userEmail });
    return NextResponse.json({ message: "Email verified successfully" });
  } catch (error) {
    logger.error("Email verification failed", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
