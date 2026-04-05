"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen } from "lucide-react";

const navItems = [
  { href: "/", label: "홈", icon: LayoutDashboard },
  { href: "/shelf", label: "서재", icon: BookOpen },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* 데스크탑 사이드바 */}
      <aside
        className="hidden md:flex flex-col"
        style={{
          width: 200,
          height: "100vh",
          position: "sticky",
          top: 0,
          flexShrink: 0,
          borderRight: "1px solid var(--border)",
          backgroundColor: "var(--surface)",
        }}
      >
        {/* 앱 타이틀 */}
        <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid var(--border)" }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", lineHeight: 1.3 }}>
            Reading Garden
          </p>
          <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>독서 기록</p>
        </div>

        {/* 네비게이션 */}
        <nav style={{ padding: "8px" }}>
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 10px",
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: active ? 500 : 400,
                  color: active ? "var(--foreground)" : "var(--muted)",
                  backgroundColor: active ? "var(--background)" : "transparent",
                  textDecoration: "none",
                  marginBottom: 2,
                  transition: "background-color 0.12s ease, color 0.12s ease",
                }}
              >
                <Icon size={16} strokeWidth={1.8} />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

    </>
  );
}
