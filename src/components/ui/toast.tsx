import React, { useEffect } from "react";

type ToastProps = {
  open: boolean;
  title?: string;
  message?: string;
  variant?: "success" | "error" | "info" | "warning";
  onClose?: () => void;
  duration?: number;
};

const colorFor = (v?: ToastProps["variant"]) => {
  switch (v) {
    case "success":
      return "bg-success text-success-foreground";
    case "error":
      return "bg-destructive text-white";
    case "warning":
      return "bg-warning text-warning-foreground";
    case "info":
    default:
      return "bg-primary text-primary-foreground";
  }
};

const Toast: React.FC<ToastProps> = ({
  open,
  title,
  message,
  variant = "info",
  onClose,
  duration = 3000,
}) => {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      onClose?.();
    }, duration);
    return () => clearTimeout(t);
  }, [open, duration, onClose]);

  if (!open) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{ position: "fixed", top: 16, right: 16, zIndex: 9999 }}
      className={`rounded-md shadow-lg ${colorFor(variant)} px-4 py-2`}
    >
      <div className="flex items-center gap-2">
        {title && <strong>{title}</strong>}
      </div>
      {message && <div className="text-sm opacity-90">{message}</div>}
    </div>
  );
};

export { Toast };
export default Toast;
