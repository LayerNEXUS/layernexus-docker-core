import { useState } from "react";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/solid";

export default function HelpButton() {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
    {open && (
    <div
        className="flex flex-col gap-2 mb-2 opacity-0 translate-y-2 animate-fade-up"
    >
        <a
        href="https://github.com/layernexus/self-hosted"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-white text-gray-900 hover:bg-gray-100 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 px-4 py-2 rounded-lg shadow-md text-sm transition"
        >
        📖 Documentation
        </a>
        <a
        href="mailto:support@layernexus.com"
        className="bg-white text-gray-900 hover:bg-gray-100 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 px-4 py-2 rounded-lg shadow-md text-sm transition"
        >
        💬 Contact Support
        </a>
    </div>
    )}

      <button
        onClick={() => setOpen(!open)}
        className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-full shadow-lg transition duration-300"
        title="Need help?"
      >
        <QuestionMarkCircleIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
