import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { en } from "./i18n/en";
import { ar } from "./i18n/ar";
import { shop } from "./i18n/sections/shop";
import { checkout } from "./i18n/sections/checkout";
import { pages } from "./i18n/sections/pages";
import { components } from "./i18n/sections/components";

export type Lang = "en" | "ar";

const sections = { shop, checkout, pages, components };

const dicts: Record<Lang, Record<string, unknown>> = {
  en: { ...en, shop: sections.shop.en, checkout: sections.checkout.en, pages: sections.pages.en, components: sections.components.en },
  ar: { ...ar, shop: sections.shop.ar, checkout: sections.checkout.ar, pages: sections.pages.ar, components: sections.components.ar },
};

const STORAGE_KEY = "sw-lang";

function lookup(dict: Record<string, unknown> | undefined, key: string): string | undefined {
  if (!dict) return undefined;
  let cur: unknown = dict;
  for (const part of key.split(".")) {
    if (cur && typeof cur === "object" && part in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof cur === "string" ? cur : undefined;
}

type Ctx = {
  lang: Lang;
  dir: "ltr" | "rtl";
  isRTL: boolean;
  setLang: (l: Lang) => void;
  /** t("nav.home") or t("some.key", "English fallback") */
  t: (key: string, fallback?: string) => string;
  /** Pick between two inline strings without a dictionary key. */
  tt: (enText: string, arText: string) => string;
};

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // English is always the default on first render (and for SSR).
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "ar" || saved === "en") setLangState(saved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const el = document.documentElement;
    el.lang = lang;
    el.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key: string, fallback?: string) =>
      lookup(dicts[lang], key) ?? lookup(dicts.en, key) ?? fallback ?? key,
    [lang],
  );

  const tt = useCallback((enText: string, arText: string) => (lang === "ar" ? arText : enText), [lang]);

  const value = useMemo<Ctx>(
    () => ({ lang, dir: lang === "ar" ? "rtl" : "ltr", isRTL: lang === "ar", setLang, t, tt }),
    [lang, setLang, t, tt],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Safe fallback so components can render outside the provider (e.g. tests).
    return {
      lang: "en",
      dir: "ltr",
      isRTL: false,
      setLang: () => {},
      t: (key: string, fallback?: string) => lookup(dicts.en, key) ?? fallback ?? key,
      tt: (enText: string) => enText,
    };
  }
  return ctx;
}
