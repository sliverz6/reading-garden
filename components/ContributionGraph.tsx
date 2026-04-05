"use client";

import { useMemo, useState } from "react";
import type { RecordsData } from "@/lib/types";
import { getGrassLevel, toLocalDateStr } from "@/lib/types";

interface Props {
  records: RecordsData;
  selectedDate: string | null;
  onDateClick: (date: string) => void;
}

const NUM_WEEKS = 52;
const CELL = 11;
const GAP = 2;
const STEP = CELL + GAP;
const DAY_LABEL_W = 26;
const MONTH_LABEL_H = 15;

const SVG_W = DAY_LABEL_W + NUM_WEEKS * STEP - GAP;
const SVG_H = MONTH_LABEL_H + 7 * STEP - GAP;

const GRASS_COLORS = ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"];
const MONTHS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
const DAY_LABELS: (string | null)[] = [null, "월", null, "수", null, "금", null];

function formatTooltip(dateStr: string): { line1: string; line2: string } {
  const d = new Date(dateStr + "T00:00:00");
  const line1 = d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
  const line2 = d.toLocaleDateString("ko-KR", { weekday: "long" });
  return { line1, line2 };
}

// 셀 상태별 테두리
const STROKE_GRID    = "#21262d"; // 기본 그리드 선
const STROKE_TODAY   = "#58a6ff"; // 오늘
const STROKE_HOVER   = "rgba(255,255,255,0.65)"; // 호버
const STROKE_SELECTED = "#ffffff"; // 선택됨

export default function ContributionGraph({ records, selectedDate, onDateClick }: Props) {
  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisSunday = new Date(today);
    thisSunday.setDate(today.getDate() - today.getDay());

    const startSunday = new Date(thisSunday);
    startSunday.setDate(thisSunday.getDate() - 51 * 7);

    const weeks: (string | null)[][] = [];
    const cur = new Date(startSunday);

    for (let w = 0; w < NUM_WEEKS; w++) {
      const week: (string | null)[] = [];
      for (let d = 0; d < 7; d++) {
        week.push(cur > today ? null : toLocalDateStr(new Date(cur)));
        cur.setDate(cur.getDate() + 1);
      }
      weeks.push(week);
    }

    const monthLabels: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
      const firstDay = week.find((d) => d !== null);
      if (!firstDay) return;
      const month = new Date(firstDay).getMonth();
      if (month !== lastMonth) {
        monthLabels.push({ label: MONTHS[month], weekIndex: wi });
        lastMonth = month;
      }
    });
    if (monthLabels.length > 12) monthLabels.shift();

    return { weeks, monthLabels };
  }, []);

  const todayStr = toLocalDateStr();
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const tooltip = hoveredDate ? formatTooltip(hoveredDate) : null;

  return (
    <div
      style={{ width: "100%", position: "relative" }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
    >
      {/* 커서 추적 툴팁 */}
      {tooltip && (
        <div
          style={{
            position: "absolute",
            left: mousePos.x + 14,
            top: mousePos.y - 52,
            backgroundColor: "#1c2128",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "5px 10px",
            pointerEvents: "none",
            zIndex: 10,
            lineHeight: 1.5,
            whiteSpace: "nowrap",
          }}
        >
          <p style={{ fontSize: 12, color: "var(--foreground)", margin: 0 }}>{tooltip.line1}</p>
          <p style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>{tooltip.line2}</p>
        </div>
      )}
      <svg
        width="100%"
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        style={{ display: "block", overflow: "visible" }}
      >
        {/* 월 레이블 */}
        {monthLabels.map(({ label, weekIndex }) => (
          <text
            key={weekIndex}
            x={DAY_LABEL_W + weekIndex * STEP}
            y={MONTH_LABEL_H - 3}
            fontSize={9}
            fill="#8b949e"
          >
            {label}
          </text>
        ))}

        {/* 요일 레이블 */}
        {DAY_LABELS.map((day, i) =>
          day ? (
            <text
              key={i}
              x={DAY_LABEL_W - 3}
              y={MONTH_LABEL_H + i * STEP + CELL - 1}
              fontSize={8}
              fill="#8b949e"
              textAnchor="end"
            >
              {day}
            </text>
          ) : null
        )}

        {/* 셀 */}
        {weeks.map((week, wi) =>
          week.map((date, di) => {
            const x = DAY_LABEL_W + wi * STEP;
            const y = MONTH_LABEL_H + di * STEP;

            // 미래 날짜 — 그리드 자리만 표시
            if (!date) {
              return (
                <rect
                  key={`${wi}-${di}`}
                  x={x} y={y}
                  width={CELL} height={CELL}
                  rx={2}
                  fill="#0d1117"
                  stroke={STROKE_GRID}
                  strokeWidth={0.5}
                />
              );
            }

            const level = getGrassLevel(records[date]);
            const isToday    = date === todayStr;
            const isSelected = date === selectedDate;
            const isHovered  = hoveredDate === date;

            const stroke =
              isSelected ? STROKE_SELECTED :
              isHovered  ? STROKE_HOVER :
              isToday    ? STROKE_TODAY :
              STROKE_GRID;

            const strokeWidth =
              isSelected ? 1.5 :
              isHovered  ? 1.5 :
              isToday    ? 1.5 :
              0.5;

            return (
              <rect
                key={`${wi}-${di}`}
                x={x} y={y}
                width={CELL} height={CELL}
                rx={2}
                fill={GRASS_COLORS[level]}
                stroke={stroke}
                strokeWidth={strokeWidth}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHoveredDate(date)}
                onMouseLeave={() => setHoveredDate(null)}
                onClick={() => onDateClick(date)}
              />
            );
          })
        )}
      </svg>

      {/* 범례 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          marginTop: 6,
          marginLeft: DAY_LABEL_W,
          color: "#8b949e",
          fontSize: 11,
        }}
      >
        <span>Less</span>
        {GRASS_COLORS.map((color, i) => (
          <div
            key={i}
            style={{ width: CELL, height: CELL, borderRadius: 2, backgroundColor: color, flexShrink: 0 }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
