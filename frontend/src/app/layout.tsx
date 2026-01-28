import type { Metadata } from "next";
import "./globals.css";
import { Header, Footer } from "@/components/layout";

export const metadata: Metadata = {
  title: "GPMDB - Global Paleomagnetic Database",
  description: "The Global Paleomagnetic Database contains published paleomagnetic poles and directions.",
  keywords: ["paleomagnetic", "database", "geology", "poles", "earth science", "IGCP 648"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
