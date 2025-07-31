import { TriangleAlert } from "lucide-react";

export default function ToastRejected({ count, onClick, collapsed }) {
  if (count === 0) return null;

  return (
    <div
      className={`fixed bottom-4 ${
        collapsed ? "left-20" : "left-60"
      } z-50 bg-amber-100 dark:bg-amber-900/80 text-amber-900 dark:text-amber-100 
      border border-amber-400 dark:border-amber-700 px-4 py-3 rounded-lg shadow-lg 
      backdrop-blur-sm min-w-[240px] max-w-sm transition-all duration-300`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm">
          <TriangleAlert className="w-5 h-5" />
          <span>{count} file(s) failed</span>
        </div>
        <button
          onClick={onClick}
          className="text-xs underline underline-offset-2"
        >
          View →
        </button>
      </div>
    </div>
  );
}
