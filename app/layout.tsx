import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NovaSTEM — Every opportunity, one map of the sky",
  description:
    "Scholarships, internships, research, and competitions — discovered, verified, and matched to you.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
