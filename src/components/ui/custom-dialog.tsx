import React from "react";
import { AlertTriangle, Info, CheckCircle2, X } from "lucide-react";

interface CustomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error" | "confirm";
  confirmText?: string;
  cancelText?: string;
}

export function CustomDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = "info",
  confirmText = "Aceptar",
  cancelText = "Cancelar",
}: CustomDialogProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-10 h-10 text-emerald-400" />;
      case "warning":
      case "confirm":
        return <AlertTriangle className="w-10 h-10 text-amber-400" />;
      case "error":
        return <AlertTriangle className="w-10 h-10 text-rose-500" />;
      default:
        return <Info className="w-10 h-10 text-sky-400" />;
    }
  };

  const isConfirmation = type === "confirm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Dialog Body */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl animate-scale-in text-center z-10">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-foreground transition-all cursor-pointer border border-border/20"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-950 flex items-center justify-center mb-4 border border-slate-850 shadow-inner">
          {getIcon()}
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-foreground tracking-wide mb-2">
          {title}
        </h3>

        {/* Message */}
        <p className="text-sm text-slate-300 leading-relaxed mb-6 whitespace-pre-line">
          {message}
        </p>

        {/* Buttons */}
        <div className={`flex gap-3 ${isConfirmation ? "flex-row" : "flex-col"}`}>
          {isConfirmation && (
            <button
              onClick={onClose}
              className="flex-1 py-3 text-sm font-semibold rounded-full btn-premium-secondary border border-border/40 hover:border-slate-600 transition-all cursor-pointer"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={() => {
              if (onConfirm) onConfirm();
              onClose();
            }}
            className={`py-3 text-sm font-semibold rounded-full cursor-pointer transition-all ${
              type === "error" || confirmText === "Eliminar"
                ? (isConfirmation ? "flex-1 btn-premium-red" : "w-full btn-premium-red")
                : (isConfirmation ? "flex-1 btn-premium" : "w-full btn-premium")
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
