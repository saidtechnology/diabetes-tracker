import { cookies } from "next/headers";

type Locale = "en" | "ar" | "fr";

const messages: Record<Locale, () => Promise<Record<string, unknown>>> = {
  en: () => import("../../messages/en.json").then((m) => m.default as Record<string, unknown>),
  ar: () => import("../../messages/ar.json").then((m) => m.default as Record<string, unknown>),
  fr: () => import("../../messages/fr.json").then((m) => m.default as Record<string, unknown>),
};

function getNestedValue(obj: unknown, path: string[]): string | undefined {
  let current = obj;
  for (const key of path) {
    if (current && typeof current === "object" && key in current) current = (current as Record<string, unknown>)[key];
    else return undefined;
  }
  return typeof current === "string" ? current : undefined;
}

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value as Locale | undefined;
  return locale || "en";
}

export async function createServerT(): Promise<(key: string, vars?: Record<string, string>) => string> {
  const locale = await getLocale();
  const data = await messages[locale]();
  const enData = await messages["en"]();

  return (key: string, vars?: Record<string, string>): string => {
    const parts = key.split(".");
    let result = getNestedValue(data, parts);
    if (!result) result = getNestedValue(enData, parts) ?? key;
    if (vars && result) {
      for (const [k, v] of Object.entries(vars)) result = result.replace(`{${k}}`, v);
    }
    return result;
  };
}

export async function serverT(key: string, vars?: Record<string, string>): Promise<string> {
  const t = await createServerT();
  return t(key, vars);
}
