"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type Lang = "bn" | "en";

type LangState = { lang: Lang; setLang: (l: Lang) => void };

const LangContext = createContext<LangState>({ lang: "bn", setLang: () => {} });

export function LangScope({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("bn");
  const value = useMemo(() => ({ lang, setLang }), [lang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangState {
  return useContext(LangContext);
}
