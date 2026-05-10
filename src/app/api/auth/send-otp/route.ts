import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateOTP, generateEmailToken } from "@/lib/auth-utils";
import { sms } from "@/lib/sms";
import { email } from "@/lib/notification";
import { logger } from "@/lib/logger";
import { OTP_EXPIRY_MINUTES } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, email: userEmail } = body;
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    if (userEmail) {
      const token = generateEmailToken();
      await prisma.verificationCode.create({ data: { phone: `email:${userEmail}`, code: token, expiresAt } });
      await email.sendVerificationEmail(userEmail, token);
      logger.info("Verification email resent", { email: userEmail });
      return NextResponse.json({ message: "Verification email sent" });
    }

    if (!phone) return NextResponse.json({ error: "Phone is required" }, { status: 400 });

    const otp = generateOTP();
    await prisma.verificationCode.create({ data: { phone, code: otp, expiresAt } });
    await sms.sendOTP(phone, otp);
    logger.info("OTP resent", { phone });
    return NextResponse.json({ message: "Verification code sent" });
  } catch (error) {
    logger.error("Send verification failed", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
