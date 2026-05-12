"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import enMessages from "../../messages/en.json";
import arMessages from "../../messages/ar.json";
import frMessages from "../../messages/fr.json";

type Locale = "en" | "ar" | "fr";
type MessagesData = Record<string, unknown>;

const allMessages: Record<Locale, MessagesData> = {
  en: enMessages as MessagesData,
  ar: arMessages as MessagesData,
  fr: frMessages as MessagesData,
};

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

  function getCookie(name: string): string | null {
    if (typeof document === "undefined") return null;
    return document.cookie.split("; ").find((r) => r.startsWith(`${name}=`))?.split("=")[1] ?? null;
  }

  useEffect(() => {
    const saved = (typeof window !== "undefined" ? (localStorage.getItem("locale") as Locale | null) : null) || getCookie("locale") as Locale | null;
    setLocaleState(saved || "en");
    setReady(true);
  }, []);

  function setLocaleCookie(l: Locale) {
    if (typeof document !== "undefined") document.cookie = `locale=${l};path=/;max-age=31536000;SameSite=Lax`;
  }

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    if (typeof window !== "undefined") {
      localStorage.setItem("locale", l);
      setLocaleCookie(l);
    }
  }, []);

  const t = useCallback((key: string, vars?: Record<string, string>): string => {
    const current = allMessages[locale];
    const fallback = allMessages["en"];
    const parts = key.split(".");
    let result = getNestedValue(current, parts);
    if (!result) result = getNestedValue(fallback, parts) ?? key;
    if (vars && result) for (const [k, v] of Object.entries(vars)) result = result.replace(`{${k}}`, v);
    return result;
  }, [locale]);

  const dir = locale === "ar" ? "rtl" : "ltr";

  if (!ready) return <div dir="ltr" className="min-h-screen flex items-center justify-center text-sm text-gray-400">Loading...</div>;

  return <I18nContext.Provider value={{ locale, setLocale, t, dir }}><div dir={dir}>{children}</div></I18nContext.Provider>;
}

export function useTranslation() { return useContext(I18nContext); }
