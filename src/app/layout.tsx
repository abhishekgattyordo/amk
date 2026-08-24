import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AMK ERP - Enterprise Manufacturing Software",
  description: "Enterprise Manufacturing ERP for Paper Carton and Corrugated Box Manufacturing",
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
