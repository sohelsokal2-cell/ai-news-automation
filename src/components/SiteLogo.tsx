"use client";

import Image from "next/image";
import { useState } from "react";

// Tries PNG logo files first (your attached logo), falls back to the SVG placeholder.
const CANDIDATES = ["/images/logo.png", "/images/logo.jpg", "/images/logo.svg"];

export function SiteLogo({
  size = 56,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const [idx, setIdx] = useState(0);
  const src = CANDIDATES[Math.min(idx, CANDIDATES.length - 1)];
  return (
    <Image
      src={src}
      alt="সংবাদচক্র"
      width={size}
      height={size}
      className={className || `h-14 w-14 rounded-full border border-[#c9a44a] object-cover`}
      onError={() => setIdx((i) => Math.min(i + 1, CANDIDATES.length - 1))}
      unoptimized
      priority
    />
  );
}
