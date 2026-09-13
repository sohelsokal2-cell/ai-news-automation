import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="text-center">
        <p className="text-xs tracking-[0.3em] text-[#8d1a1a]">৪০৪</p>
        <h1 className="mt-2 font-serif text-4xl font-black">খবরটি পাওয়া যায়নি</h1>
        <Link href="/" className="mt-4 inline-block text-[#8d1a1a]">
          প্রচ্ছদে ফিরুন
        </Link>
      </div>
    </main>
  );
}
