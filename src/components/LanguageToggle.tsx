"use client";

import { useLang } from "@/components/LangContext";

export type { Lang } from "@/components/LangContext";

export function LanguageToggle() {
  const { lang, setLang } = useLang();

  return (
    <span className="inline-flex gap-1 text-[11px] font-semibold">
      <button
        type="button"
        onClick={() => setLang("bn")}
        className={`rounded px-1.5 py-0.5 ${lang === "bn" ? "bg-[#8d1a1a] text-[#fff4dc]" : "text-[#5c4a34] hover:bg-[#c9b48a]/30"}`}
      >
        বাংলা
      </button>
      <button
        type="button"
        onClick={() => setLang("en")}
        className={`rounded px-1.5 py-0.5 ${lang === "en" ? "bg-[#8d1a1a] text-[#fff4dc]" : "text-[#5c4a34] hover:bg-[#c9b48a]/30"}`}
      >
        EN
      </button>
    </span>
  );
}
