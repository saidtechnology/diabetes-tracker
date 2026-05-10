"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

type Locale = "en" | "ar" | "fr";
type MessagesData = Record<string, unknown>;
const cache: Record<Locale, MessagesData> = { en: {}, ar: {}, fr: {} };

async function loadMessages(locale: Locale): Promise<MessagesData> {
  if (Object.keys(cache[locale]).length > 0) return cache[locale];
  let data: { default: MessagesData };
  if (locale === "ar") data = await import("../../messages/ar.json");
  else if (locale === "fr") data = await import("../../messages/fr.json");
  else data = await import("../../messages/en.json");
  cache[locale] = data.default;
  return cache[locale];
}

type I18nContextType = { locale: Locale; setLocale: (l: Locale) => void; t: (key: string, vars?: Record<string, string>) => string; dir: "ltr" | "rtl" };
const I18nContext = createContext<I18nContextType>({ locale: "en", setLocale: () => {}, t: (k: string) => k, dir: "ltr" });

function getNestedValue(obj: unknown, path: string[]): string | undefined {
  let current = obj;
  for (const key of path) {
    if (current && typeof current === "object" && key in current) current = (current as Record<string, unknown>)[key];
    else return undefined;
  }
  return typeof current === "string" ? current : undefined;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? (localStorage.getItem("locale") as Locale | null) : null;
    const initial = saved || "en";
    loadMessages(initial).then(() => { setLocaleState(initial); setReady(true); });
  }, []);

  const setLocale = useCallback((l: Locale) => {
    loadMessages(l).then(() => { setLocaleState(l); if (typeof window !== "undefined") localStorage.setItem("locale", l); });
  }, []);

  const t = useCallback((key: string, vars?: Record<string, string>): string => {
    const parts = key.split(".");
    let result = getNestedValue(cache[locale], parts);
    if (!result) result = getNestedValue(cache["en"], parts) ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) result = result.replace(`{${k}}`, v);
    return result;
  }, [locale]);

  const dir = locale === "ar" ? "rtl" : "ltr";

  if (!ready) return <div dir="ltr" className="min-h-screen flex items-center justify-center text-sm text-gray-400">Loading...</div>;

  return <I18nContext.Provider value={{ locale, setLocale, t, dir }}><div dir={dir}>{children}</div></I18nContext.Provider>;
}

export function useTranslation() { return useContext(I18nContext); }
