import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "D-Money - Digital Financial Services",
  description: "D-Money Web Application - Manage your digital wallet",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
