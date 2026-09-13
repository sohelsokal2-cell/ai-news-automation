import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { loadNav } from "@/lib/queries";
import { ContactForm } from "@/components/ContactForm";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const cats = await loadNav();
  return (
    <>
      <SiteHeader categories={cats} />
      <main className="mx-auto max-w-xl px-4 py-12 sm:px-6">
        <h1 className="font-serif text-4xl font-black">যোগাযোগ</h1>
        <p className="mt-3 text-[#4a3b2a]">সম্পাদকীয় পরামর্শ, সংশোধন বা সূত্র সম্পর্কে লিখুন।</p>
        <ContactForm />
      </main>
      <SiteFooter />
    </>
  );
}
