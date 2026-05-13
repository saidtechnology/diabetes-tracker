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
      className="input-field !w-auto !inline-flex !py-1.5 !px-2 text-xs"
    >
      {locales.map((l) => (
        <option key={l.code} value={l.code}>{l.label}</option>
      ))}
    </select>
  );
}
