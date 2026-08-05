import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DoOnce | Safe workflow control",
  description: "Reviewable browser workflow automation that stops when it is uncertain.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
