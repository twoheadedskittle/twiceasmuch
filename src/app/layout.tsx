import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import { site } from "@/config/site";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-voice",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: site.name,
  description: site.description,
  openGraph: { title: site.name, description: site.description, type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#140c0d",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={bricolage.variable}>
      <body>{children}</body>
    </html>
  );
}
