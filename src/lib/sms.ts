import { logger } from "./logger";

type SmsProvider = { sendSms: (to: string, body: string) => Promise<{ success: boolean }> };

const twilioProvider: SmsProvider = {
  sendSms: async (to: string, body: string) => {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const from = process.env.TWILIO_PHONE_NUMBER;
      if (!accountSid || !authToken || !from) {
        logger.warn("Twilio not configured, using mock", { to });
        return mockProvider.sendSms(to, body);
      }
      const twilio = await import("twilio");
      const client = twilio.default(accountSid, authToken);
      await client.messages.create({ body, from, to });
      logger.info("SMS sent via Twilio", { to });
      return { success: true };
    } catch (error) {
      logger.error("Twilio SMS failed", { error, to });
      return { success: false };
    }
  },
};

const mockProvider: SmsProvider = {
  sendSms: async (to: string, body: string) => {
    logger.info("Mock SMS", { to, body });
    return { success: true };
  },
};

function getProvider(): SmsProvider {
  return process.env.TWILIO_ACCOUNT_SID ? twilioProvider : mockProvider;
}

export const sms = {
  sendOTP: async (phone: string, code: string) => {
    const body = `Your verification code is: ${code}. It expires in 10 minutes.`;
    return getProvider().sendSms(phone, body);
  },
  sendNotification: async (phone: string, message: string) => {
    return getProvider().sendSms(phone, message);
  },
};
