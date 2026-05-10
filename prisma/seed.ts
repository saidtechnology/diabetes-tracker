import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("password123", 12);

  const existingDoctor = await prisma.user.findUnique({ where: { email: "doctor@example.com" } });
  const existingPatient = await prisma.user.findUnique({ where: { email: "patient@example.com" } });

  if (existingDoctor || existingPatient) {
    console.log("Seed accounts already exist. Skipping.");
    await prisma.$disconnect();
    return;
  }

  const doctor = await prisma.user.create({
    data: {
      firstName: "Ahmed",
      lastName: "Alami",
      address: "123 Doctor Street, Casablanca",
      email: "doctor@example.com",
      phone: "+212600000001",
      passwordHash,
      role: "DOCTOR",
      phoneVerified: true,
    },
  });
  console.log("Doctor created:", doctor.email);

  const patient = await prisma.user.create({
    data: {
      firstName: "Fatima",
      lastName: "Benali",
      address: "456 Patient Avenue, Rabat",
      email: "patient@example.com",
      phone: "+212600000002",
      passwordHash,
      role: "PATIENT",
      phoneVerified: true,
    },
  });
  console.log("Patient created:", patient.email);

  const code = await prisma.doctorCode.create({
    data: {
      doctorId: doctor.id,
      code: "ABC123",
      isUsed: true,
      usedByPatientId: patient.id,
    },
  });
  console.log("Doctor code created:", code.code);

  const link = await prisma.patientDoctorLink.create({
    data: {
      patientId: patient.id,
      doctorId: doctor.id,
      status: "ACCEPTED",
    },
  });
  console.log("Patient linked to doctor");

  const now = new Date();
  const readings = [
    { value: 120, measuredAt: new Date(now.getTime() - 6 * 60 * 60 * 1000), mealContext: "AFTER_MEAL" as const, mealType: "BREAKFAST" as const },
    { value: 95, measuredAt: new Date(now.getTime() - 5 * 60 * 60 * 1000), mealContext: "BEFORE_MEAL" as const, mealType: "LUNCH" as const },
    { value: 145, measuredAt: new Date(now.getTime() - 3 * 60 * 60 * 1000), mealContext: "AFTER_MEAL" as const, mealType: "LUNCH" as const },
    { value: 110, measuredAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), mealContext: "BEFORE_MEAL" as const, mealType: "DINNER" as const },
    { value: 200, measuredAt: new Date(now.getTime() - 1 * 60 * 60 * 1000), mealContext: "AFTER_MEAL" as const, mealType: "DINNER" as const },
  ];

  for (const r of readings) {
    await prisma.glucoseReading.create({
      data: { patientId: patient.id, source: "MANUAL", ...r },
    });
  }
  console.log(`${readings.length} sample readings created`);

  console.log("\n--- Seed Complete ---");
  console.log("Doctor:   doctor@example.com / password123");
  console.log("Patient:  patient@example.com / password123");
  console.log("Doctor Code: ABC123");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
