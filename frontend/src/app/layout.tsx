import type { Metadata } from "next";
import "./globals.css";
import { Header, Footer } from "@/components/layout";
import { Agentation } from "agentation";

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
      <body className="bg-background min-h-screen font-sans antialiased">
        <div className="relative flex min-h-screen flex-col">
          <Header />
          <main className="flex-1 w-full py-6">
            <div className="page-container">{children}</div>
          </main>
          <Footer />
        </div>
        {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
    </html>
  );
}
