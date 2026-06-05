import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarShell } from "@/components/SidebarShell";
import {
  GOVERNANCE_READ_ONLY_NOTICE,
  isGovernanceReadOnly,
} from "@/lib/governance";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Company Memory | HumeStone",
  description: "HumeStone Company Memory dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const governanceReadOnly = isGovernanceReadOnly();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="ob1-graphite-bg min-h-screen flex bg-bg-primary text-text-primary"
        data-ob1-governance-read-only={governanceReadOnly ? "true" : "false"}
      >
        <div className="ob1-brand-signature hidden md:block" aria-hidden="true">
          HumeStone
        </div>
        <SidebarShell governanceReadOnly={governanceReadOnly} />
        <main className="flex-1 md:ml-56 min-h-screen pt-12 md:pt-0">
          {governanceReadOnly && (
            <div className="mx-auto max-w-7xl px-4 pt-4 md:px-8">
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                {GOVERNANCE_READ_ONLY_NOTICE}
              </div>
            </div>
          )}
          <div className="mx-auto max-w-7xl px-4 py-4 md:px-8 md:py-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
