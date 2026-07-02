"use client";

import { CheckCircle, XCircle, Info } from "lucide-react";
import Button from "./Button";

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: "success" | "error" | "info";
}

export default function StatusModal({ isOpen, onClose, title, message, type }: StatusModalProps) {
  if (!isOpen) return null;

  const icons = {
    success: <CheckCircle className="size-12 text-emerald-500" />,
    error: <XCircle className="size-12 text-rose-500" />,
    info: <Info className="size-12 text-indigo-500" />,
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" aria-labelledby="status-title" aria-describedby="status-desc" className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-2xl">
        <div className="flex justify-center mb-4">{icons[type]}</div>
        <h3 id="status-title" className="mb-2 text-xl font-extrabold text-slate-950">{title}</h3>
        <p id="status-desc" className="mb-6 text-sm leading-6 text-slate-600">{message}</p>
        <Button onClick={onClose} className="w-full">Close</Button>
      </div>
    </div>
  );
}
