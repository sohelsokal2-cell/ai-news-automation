import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { loadNav } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const cats = await loadNav();
  return (
    <>
      <SiteHeader categories={cats} />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="text-xs tracking-[0.3em] text-[#8d1a1a]">EDITORIAL CHARTER</p>
        <h1 className="mt-2 font-serif text-4xl font-black">সংবাদচক্র কীভাবে খবর প্রকাশ করে</h1>
        <div className="prose-bn mt-6">
          <p>
            সংবাদচক্র একটি স্বয়ংক্রিয় বাংলা সংবাদ ইঞ্জিন। আরএসএস ও কনফিগার করা বিশ্বস্ত সূত্র থেকে খবর সংগ্রহ হয়, এআই ভূমিকাগুলো যাচাই করে, আর চূড়ান্ত প্রকাশের সিদ্ধান্ত নেয় নির্ধারিত রুল ইঞ্জিন।
          </p>
          <p>
            এআই স্বাধীনভাবে প্রকাশ করে না। তথ্য যাচাইকারীর ক্রিটিক্যাল ত্রুটি থাকলে স্কোর যতই উচ্চ হোক, খবর আটকে যায়। ছবির ওয়াটারমার্ক সরানো হয় না, কপিরাইট অনুমান করা হয় না।
          </p>
          <p>
            সম্পাদক সর্বোচ্চ কর্তৃপক্ষ। প্রকাশের পরও সম্পাদনা, অপ্রকাশ, পুনঃপ্রকাশ, বিভাগ ও ছবি পরিবর্তন করা যায়।
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
