import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateOTP } from "@/lib/auth-utils";
import { sms } from "@/lib/sms";
import { logger } from "@/lib/logger";
import { OTP_EXPIRY_MINUTES } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();
    if (!phone) return NextResponse.json({ error: "Phone is required" }, { status: 400 });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    await prisma.verificationCode.create({ data: { phone, code: otp, expiresAt } });
    await sms.sendOTP(phone, otp);
    logger.info("OTP resent", { phone });
    return NextResponse.json({ message: "Verification code sent" });
  } catch (error) {
    logger.error("Send OTP failed", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
