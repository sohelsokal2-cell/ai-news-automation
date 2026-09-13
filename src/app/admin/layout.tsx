import type { ReactNode } from "react";
import Link from "next/link";
import LogoutButton from "./logout-button";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
          <Link href="/admin" className="text-lg font-bold text-[#8d1a1a]">
            সংবাদচক্র Admin
          </Link>
          <nav className="flex flex-1 gap-4 text-sm">
            <Link href="/admin/sources" className="hover:text-[#8d1a1a]">
              Sources
            </Link>
            <Link href="/admin/articles" className="hover:text-[#8d1a1a]">
              Articles
            </Link>
            <Link href="/admin/queue" className="hover:text-[#8d1a1a]">
              Queue
            </Link>
            <Link href="/admin/ads" className="hover:text-[#8d1a1a]">
              Ads
            </Link>
            <Link href="/" className="text-gray-400 hover:text-[#8d1a1a]">
              View Site
            </Link>
          </nav>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
