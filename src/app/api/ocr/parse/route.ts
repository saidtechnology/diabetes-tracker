import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const { image } = await request.json();
    if (!image) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    let Tesseract: typeof import("tesseract.js");
    try { Tesseract = await import("tesseract.js"); } catch {
      return NextResponse.json({ value: null, time: null });
    }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const { data } = await Tesseract.recognize(buffer, "eng");
    const text = data.text.trim();

    const valueMatch = text.match(/\b(\d{2,3}(?:\.\d)?)\s*(?:mg\/dL|mg|dL)?\b/i);
    const timeMatch = text.match(/\b(\d{1,2}:\d{2})\b/);

    const value = valueMatch ? parseFloat(valueMatch[1]) : null;
    const result = { value: (value !== null && value >= 10 && value <= 600) ? value : null, time: timeMatch ? timeMatch[1] : null };
    logger.info("OCR result", result);
    return NextResponse.json(result);
  } catch (error) {
    logger.error("OCR parsing failed", { error });
    return NextResponse.json({ value: null, time: null });
  }
}
