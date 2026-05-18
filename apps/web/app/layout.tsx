import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Grapeee",
  description: "Open-source Roblox Studio agent built on a Rojo-derived runtime.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

