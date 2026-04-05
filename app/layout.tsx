import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reading Garden",
  description: "독서 기록을 잔디밭처럼 쌓아보세요",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
