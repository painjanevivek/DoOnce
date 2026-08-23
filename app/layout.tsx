import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DoOnce | Browser workflow automation",
  description: "Demonstrate a browser task once and turn it into an editable, reusable workflow.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,700,900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
