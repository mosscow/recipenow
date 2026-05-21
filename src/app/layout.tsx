import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RecipeNow",
  description: "Your personal recipe collection",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const admin = await isAdmin();
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-amber-50 font-sans">
        <header className="bg-white border-b border-amber-200 px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-amber-700 tracking-tight">
            RecipeNow
          </Link>
          <nav className="flex gap-4 text-sm font-medium">
            <Link href="/recipes/new" className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors">
              + New Recipe
            </Link>
            <Link href="/upload" className="border border-amber-600 text-amber-700 px-4 py-2 rounded-lg hover:bg-amber-50 transition-colors">
              Bulk Upload
            </Link>
            {admin ? (
              <Link href="/admin/login" className="text-sm text-amber-700 hover:underline px-2 py-2">
                Admin ✓
              </Link>
            ) : (
              <Link href="/admin/login" className="text-sm text-zinc-400 hover:text-amber-600 px-2 py-2">
                Admin
              </Link>
            )}
          </nav>
        </header>
        <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
