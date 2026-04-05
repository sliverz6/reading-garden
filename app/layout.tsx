import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

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
      <body>
        <div style={{ display: "flex", alignItems: "flex-start" }}>
          <Sidebar />
          <div style={{ flex: 1, minWidth: 0 }}>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
