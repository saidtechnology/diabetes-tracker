export const GLUCOSE_THRESHOLDS = { LOW: 70, HIGH: 140, DANGEROUS: 250 } as const;

export const GLUCOSE_COLORS = {
  LOW: "#FFD700", NORMAL: "#90EE90", HIGH: "#FF6B6B", DANGEROUS: "#8B0000",
} as const;

export function getGlucoseColor(value: number): string {
  if (value < GLUCOSE_THRESHOLDS.LOW) return GLUCOSE_COLORS.LOW;
  if (value <= GLUCOSE_THRESHOLDS.HIGH) return GLUCOSE_COLORS.NORMAL;
  if (value <= GLUCOSE_THRESHOLDS.DANGEROUS) return GLUCOSE_COLORS.HIGH;
  return GLUCOSE_COLORS.DANGEROUS;
}

export const DOCTOR_CODE_LENGTH = 6;
export const OTP_LENGTH = 6;
export const OTP_EXPIRY_MINUTES = 10;
export const OCR_RETRY_LIMIT = 3;
export const DANGEROUS_CONSECUTIVE_THRESHOLD = 3;
export const DANGEROUS_CONSECUTIVE_WINDOW_HOURS = 24;
