import Link from "next/link";
import { formatBnDate } from "@/lib/queries";
import type { Category } from "@/db/schema";
import { SiteLogo } from "@/components/SiteLogo";

const NAV = [
  { href: "/", label: "প্রচ্ছদ" },
  { href: "/category/politics", label: "রাজনীতি" },
  { href: "/category/sports", label: "খেলা" },
  { href: "/category/international", label: "আন্তর্জাতিক" },
  { href: "/category/business", label: "অর্থনীতি" },
  { href: "/category/technology", label: "প্রযুক্তি" },
  { href: "/category/entertainment", label: "বিনোদন" },
  { href: "/category/health", label: "স্বাস্থ্য" },
  { href: "/about", label: "আমাদের কথা" },
  { href: "/contact", label: "যোগাযোগ" },
];

export function SiteHeader({ categories }: { categories?: Category[] }) {
  const items = categories?.length
    ? [
        { href: "/", label: "প্রচ্ছদ" },
        ...categories.map((c) => ({ href: `/category/${c.slug}`, label: c.nameBn })),
        { href: "/about", label: "আমাদের কথা" },
        { href: "/contact", label: "যোগাযোগ" },
      ]
    : NAV;
  const today = formatBnDate(new Date());

  return (
    <header className="masthead-shadow bg-[#fff8ea]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 text-[12px] text-[#5c4a34] sm:px-6">
        <p>{today} · ঢাকা</p>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#8d1a1a] px-2 py-0.5 text-[11px] font-semibold text-[#fff4dc]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#c9a44a]" />
            স্বয়ংক্রিয় প্রকাশনা সক্রিয়
          </span>
        </div>
      </div>
      <div className="crimson-rule" />
      <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-6 text-center sm:px-6">
        <div className="flex items-center gap-3">
          <SiteLogo size={56} />
          <div>
            <p className="text-[11px] tracking-[0.35em] text-[#8d1a1a]">BANGLA NEWS CYCLE</p>
            <h1 className="font-serif text-5xl font-black tracking-tight text-[#8d1a1a] sm:text-6xl">সংবাদচক্র</h1>
          </div>
        </div>
        <p className="mt-2 max-w-xl text-sm text-[#5c4a34]">
          যাচাইকৃত সূত্র · এআই পাইপলাইন · রুল ইঞ্জিনে স্বয়ংক্রিয় প্রকাশ
        </p>
      </div>
      <nav className="border-y border-[#c9b48a] bg-[#8d1a1a] text-[#fff4dc]">
        <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 py-2 text-sm font-medium sm:justify-center sm:gap-5">
          {items.map((item) => (
            <li key={item.href} className="shrink-0">
              <Link href={item.href} className="block rounded px-2 py-1 hover:bg-white/10">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t-4 border-[#8d1a1a] bg-[#1c140c] text-[#f3ead3]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6">
        <div>
          <div className="flex items-center gap-2">
            <SiteLogo size={40} className="h-10 w-10 rounded-full object-cover" />
            <strong className="text-2xl">সংবাদচক্র</strong>
          </div>
          <p className="mt-3 text-sm leading-7 text-[#d9c7a4]">
            বাংলা সংবাদের স্বয়ংক্রিয় চক্র। কালেক্টর থেকে রুল ইঞ্জিন পর্যন্ত প্রতিটি ধাপ লগ হয়, আর চূড়ান্ত প্রকাশের সিদ্ধান্ত নেয় নির্ধারিত নিয়ম।
          </p>
        </div>
        <div>
          <h2 className="text-sm tracking-[0.2em] text-[#c9a44a]">বিভাগ</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/category/international">আন্তর্জাতিক</Link></li>
            <li><Link href="/category/politics">রাজনীতি</Link></li>
            <li><Link href="/category/sports">খেলা</Link></li>
            <li><Link href="/about">সম্পাদকীয় নীতি</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm tracking-[0.2em] text-[#c9a44a]">স্বচ্ছতা</h2>
          <p className="mt-3 text-sm leading-7 text-[#d9c7a4]">
            এআই স্বাধীনভাবে প্রকাশ করে না। দৈর্ঘ্য, বিভাগ ও সূত্র-যাচাইসহ রুল ইঞ্জিনের পরীক্ষা পাস করলে তবেই খবর প্রকাশ হয়। সম্পাদক সর্বোচ্চ কর্তৃপক্ষ।
          </p>
        </div>
      </div>
      <p className="border-t border-white/10 px-4 py-4 text-center text-xs text-[#d9c7a4]">
        © {new Date().getFullYear()} সংবাদচক্র · উৎসের স্বত্ব সংরক্ষিত · ওয়াটারমার্ক অপসারণ করা হয় না
      </p>
    </footer>
  );
}

export function BreakingTicker({ titles }: { titles: string[] }) {
  const line = titles.length ? titles : ["সংবাদচক্র লাইভ: যাচাইকৃত খবর স্বয়ংক্রিয়ভাবে প্রকাশিত হচ্ছে"];
  const text = [...line, ...line].join("  •  ");
  return (
    <div className="overflow-hidden border-b border-[#c9b48a] bg-[#5c1010] text-[#fff4dc]">
      <div className="mx-auto flex max-w-6xl items-stretch">
        <span className="bg-[#c9a44a] px-3 py-2 text-xs font-black tracking-wide text-[#1c140c]">ব্রেকিং</span>
        <div className="relative flex-1 overflow-hidden py-2">
          <div className="ticker whitespace-nowrap text-sm">{text}</div>
        </div>
      </div>
    </div>
  );
}
