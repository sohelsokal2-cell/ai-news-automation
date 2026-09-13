"use client";

import { useEffect, useState } from "react";

export type AdItem = {
  id: number;
  name: string;
  imageUrl: string | null;
  linkUrl: string | null;
  html: string | null;
};

export function AdSlot({ slot, className = "" }: { slot: "header" | "sidebar" | "in-article" | "footer"; className?: string }) {
  const [ads, setAds] = useState<AdItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/ads?slot=${slot}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setAds(data.items ?? []);
        } else if (!cancelled) {
          setAds([]);
        }
      } catch {
        if (!cancelled) setAds([]);
      }
    })();
    return () => { cancelled = true; };
  }, [slot]);

  if (!ads || ads.length === 0) return null;
  const ad = ads[0];

  return (
    <div className={`ad-slot ad-slot-${slot} ${className}`.trim()} aria-label={`বিজ্ঞাপন: ${ad.name}`}>
      {ad.html ? (
        <div dangerouslySetInnerHTML={{ __html: ad.html }} />
      ) : ad.imageUrl ? (
        ad.linkUrl ? (
          <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer sponsored">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ad.imageUrl} alt={ad.name} className="mx-auto h-auto w-full object-contain" loading="lazy" />
          </a>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={ad.imageUrl} alt={ad.name} className="mx-auto h-auto w-full object-contain" loading="lazy" />
        )
      ) : null}
      <p className="mt-1 text-center text-[10px] tracking-widest text-gray-400">বিজ্ঞাপন</p>
    </div>
  );
}
