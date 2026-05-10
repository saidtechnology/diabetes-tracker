"use client";

import { useTranslation } from "@/lib/i18n";

const locales = [
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "fr", label: "Français" },
] as const;

export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();

  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value as "en" | "ar" | "fr")}
      className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-500 focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none transition-all duration-200"
    >
      {locales.map((l) => (
        <option key={l.code} value={l.code}>{l.label}</option>
      ))}
    </select>
  );
}
