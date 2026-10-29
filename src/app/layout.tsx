import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Unbounded } from "next/font/google";
import { Backdrop } from "@/components/backdrop";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const unbounded = Unbounded({ variable: "--font-unbounded", subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Osagie & Co. — Your route to Austria & Germany",
    template: "%s · Osagie & Co.",
  },
  description:
    "Study and work routes from Nigeria to Austria and Germany. Free readiness check, 1-on-1 strategy sessions and a live client portal.",
  openGraph: {
    title: "Osagie & Co. Euro-Consulting",
    description: "Your route to Austria & Germany — engineered.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#04050a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-NG" className={`${geist.variable} ${geistMono.variable} ${unbounded.variable} h-full antialiased`}>
      <body className="relative min-h-full">
        <Backdrop />
        <div className="relative z-10 flex min-h-dvh flex-col">{children}</div>
      </body>
    </html>
  );
}
