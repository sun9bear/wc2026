"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

interface ToastItem {
  id: number;
  text: string;
  type: "ok" | "err";
}
interface ToastCtxValue {
  toast: (text: string, type?: "ok" | "err") => void;
}

const ToastCtx = createContext<ToastCtxValue>({ toast: () => {} });

export function useToast(): ToastCtxValue {
  return useContext(ToastCtx);
}

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((text: string, type: "ok" | "err" = "ok") => {
    const id = nextId++;
    setToasts((t) => [...t, { id, text, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`fade-up max-w-sm rounded-md border px-4 py-2 text-center text-sm shadow-card ${
              t.type === "ok" ? "border-green bg-surface text-green" : "border-red bg-surface text-red"
            }`}
          >
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
