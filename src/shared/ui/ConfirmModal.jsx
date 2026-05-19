import { AlertTriangle, Trash2, Info, Loader2 } from "lucide-react";

const VARIANT_STYLES = {
  danger: {
    icon: Trash2,
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    buttonBg: "bg-red-600 hover:bg-red-700",
    buttonRing: "focus-visible:ring-red-500",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    buttonBg: "bg-amber-600 hover:bg-amber-700",
    buttonRing: "focus-visible:ring-amber-500",
  },
  info: {
    icon: Info,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    buttonBg: "bg-blue-600 hover:bg-blue-700",
    buttonRing: "focus-visible:ring-blue-500",
  },
};

function ConfirmModal({ open, title, message, onConfirm, onCancel, confirmLabel = "Eliminar", variant = "danger", loading = false }) {
  if (!open) return null;

  const styles = VARIANT_STYLES[variant] || VARIANT_STYLES.danger;
  const Icon = styles.icon;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-white shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-6 text-center">
          <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${styles.iconBg}`}>
            <Icon className={`h-6 w-6 ${styles.iconColor}`} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="mt-2 text-sm text-gray-600">{message}</p>
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="cursor-pointer rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${styles.buttonBg} ${styles.buttonRing} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando…
              </span>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
