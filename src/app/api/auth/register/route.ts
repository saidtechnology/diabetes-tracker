import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, generateOTP, generateEmailToken } from "@/lib/auth-utils";
import { sms } from "@/lib/sms";
import { email } from "@/lib/notification";
import { logger } from "@/lib/logger";
import { OTP_EXPIRY_MINUTES } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const { firstName, lastName, address, email: userEmail, phone, password, role, verifyMethod } = await request.json();
    if (!firstName || !lastName || !address || !userEmail || !phone || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const existing = await prisma.user.findFirst({ where: { OR: [{ email: userEmail }, { phone }] } });
    if (existing) {
      return NextResponse.json({ error: `This ${existing.email === userEmail ? "email" : "phone"} is already registered` }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const userRole = ["PATIENT", "DOCTOR"].includes(role) ? role : "PATIENT";

    await prisma.user.create({ data: { firstName, lastName, address, email: userEmail, phone, passwordHash, role: userRole } });

    if (verifyMethod === "email") {
      const token = generateEmailToken();
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
      await prisma.verificationCode.create({ data: { phone: `email:${userEmail}`, code: token, expiresAt } });
      await email.sendVerificationEmail(userEmail, token);
      logger.info("User registered, email verification sent", { email: userEmail, role: userRole });
    } else {
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
      await prisma.verificationCode.create({ data: { phone, code: otp, expiresAt } });
      await sms.sendOTP(phone, otp);
      logger.info("User registered, OTP sent", { email: userEmail, phone, role: userRole });
    }

    return NextResponse.json({ message: "Registration successful. Verification sent." }, { status: 201 });
  } catch (error) {
    logger.error("Registration failed", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
