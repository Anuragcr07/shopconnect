"use client";

import { CheckCircle, XCircle, Info } from "lucide-react"; // npm install lucide-react
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
    success: <CheckCircle className="w-12 h-12 text-green-400" />,
    error: <XCircle className="w-12 h-12 text-red-400" />,
    info: <Info className="w-12 h-12 text-blue-400" />,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm p-6 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl text-center">
        <div className="flex justify-center mb-4">{icons[type]}</div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400 mb-6">{message}</p>
        <Button 
          onClick={onClose} 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
        >
          Close
        </Button>
      </div>
    </div>
  );
}