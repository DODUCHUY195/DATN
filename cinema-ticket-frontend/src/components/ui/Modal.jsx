import { X } from "lucide-react";

export default function Modal({
  open,
  title,
  subtitle,
  children,
  footer,
  onClose,
  width = "max-w-2xl",
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`w-full ${width} overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6 dark:border-slate-800">
          <div>
            <h3 className="text-xl font-semibold text-slate-950 dark:text-white">
              {title}
            </h3>
            {subtitle ? (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            // className="btn-ghost h-10 w-10 rounded-2xl"
          >
            {/* <X size={18} /> */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-6">{children}</div>
        {footer ? (
          <div className="border-t border-slate-200 p-6 dark:border-slate-800">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
