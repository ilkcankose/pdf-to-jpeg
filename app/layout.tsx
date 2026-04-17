import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PDF → JPEG (her sayfa <500KB)",
  description: "PDF sayfalarını otomatik olarak 500 KB altında JPEG'e dönüştür.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
