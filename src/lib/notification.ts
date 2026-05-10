import { logger } from "./logger";

type EmailPayload = { to: string; subject: string; text: string };

const resendProvider = {
  send: async (payload: EmailPayload) => {
    try {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        logger.warn("Resend not configured, using mock", { to: payload.to });
        return mockProvider.send(payload);
      }
      const { Resend } = await import("resend");
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: "Diabetes Tracker <noreply@diabetes-tracker.app>",
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
      });
      logger.info("Email sent via Resend", { to: payload.to });
    } catch (error) {
      logger.error("Resend email failed", { error, to: payload.to });
    }
  },
};

const mockProvider = {
  send: async (payload: EmailPayload) => {
    logger.info("Mock email", { to: payload.to, subject: payload.subject });
  },
};

function getProvider() {
  return process.env.RESEND_API_KEY ? resendProvider : mockProvider;
}

export const email = {
  sendPatientLinked: async (doctorEmail: string, patientName: string) => {
    await getProvider().send({
      to: doctorEmail,
      subject: "New patient linked to your account",
      text: `A new patient has been linked.\n\nPatient: ${patientName}\n\nView readings in your dashboard.`,
    });
  },
  sendDangerAlert: async (doctorEmail: string, details: string) => {
    await getProvider().send({
      to: doctorEmail,
      subject: "Alert: Dangerous glucose readings detected",
      text: `Your patient has consecutive dangerously high readings.\n\n${details}\n\nCheck your dashboard immediately.`,
    });
  },
};
