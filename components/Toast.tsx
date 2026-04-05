"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Trash2, XCircle } from "lucide-react";

export type ToastData = { message: string; type: "success" | "delete" | "error" };

interface Props {
  toast: ToastData | null;
  onDismiss: () => void;
}

export default function Toast({ toast, onDismiss }: Props) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!toast) { setExiting(false); return; }
    setExiting(false);
    const exitTimer    = setTimeout(() => setExiting(true), 2700);
    const dismissTimer = setTimeout(onDismiss, 3000);
    return () => { clearTimeout(exitTimer); clearTimeout(dismissTimer); };
  }, [toast]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!toast) return null;

  const colorMap = {
    success: "var(--accent)",
    delete:  "#c0392b",
    error:   "#c0392b",
  };
  const color = colorMap[toast.type];

  const Icon =
    toast.type === "success" ? <CheckCircle size={15} color={color} /> :
    toast.type === "delete"  ? <Trash2      size={15} color={color} /> :
                               <XCircle     size={15} color={color} />;

  return (
    <div
      className={exiting ? "toast-exit" : "toast-enter"}
      style={{
        position: "fixed",
        bottom: 28,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 16px",
        borderRadius: 8,
        backgroundColor: "var(--surface)",
        border: `1px solid ${color}`,
        color: "var(--foreground)",
        fontSize: 13,
        boxShadow: "0 4px 16px rgba(0,0,0,0.45)",
        whiteSpace: "nowrap",
      }}
    >
      {Icon}
      {toast.message}
    </div>
  );
}
