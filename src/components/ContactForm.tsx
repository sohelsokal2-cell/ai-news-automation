"use client";

import { FormEvent, useState } from "react";

export function ContactForm() {
  const [status, setStatus] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("যোগাযোগ ব্যবস্থা শীঘ্রই চালু হবে।");
    event.currentTarget.reset();
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-3">
      <input name="name" required placeholder="নাম" className="w-full border border-[#c9b48a] bg-white px-3 py-2" />
      <input name="email" type="email" required placeholder="ইমেইল" className="w-full border border-[#c9b48a] bg-white px-3 py-2" />
      <input name="subject" placeholder="বিষয়" className="w-full border border-[#c9b48a] bg-white px-3 py-2" />
      <textarea name="message" required rows={5} placeholder="বার্তা" className="w-full border border-[#c9b48a] bg-white px-3 py-2" />
      <button className="bg-[#8d1a1a] px-5 py-2 text-sm font-semibold text-[#fff4dc]">পাঠান</button>
      {status ? <p className="text-sm text-[#5c1010]">{status}</p> : null}
    </form>
  );
}
