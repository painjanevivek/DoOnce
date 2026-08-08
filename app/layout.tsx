import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DoOnce | Browser workflow automation",
  description: "Demonstrate a browser task once and turn it into an editable, reusable workflow.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
