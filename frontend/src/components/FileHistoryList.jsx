import React, { useState } from "react";

export default function FileHistoryList({ historyFiles = [], onSubmit }) {
  const [selected, setSelected] = useState([]);

  const toggleFile = (filename) => {
    setSelected((prev) =>
      prev.includes(filename)
        ? prev.filter((f) => f !== filename)
        : [...prev, filename]
    );
  };

  const handleSubmit = () => {
    if (selected.length > 0) onSubmit(selected);
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
      <h3 className="text-md font-semibold text-gray-800 dark:text-gray-100 mb-2">
        Upload History
      </h3>

      {historyFiles.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No history yet.</p>
      ) : (
        <ul className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
          {historyFiles.map((filename) => (
            <li key={filename} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selected.includes(filename)}
                onChange={() => toggleFile(filename)}
                className="accent-blue-600 dark:accent-blue-400"
              />
              <span className="truncate text-gray-700 dark:text-gray-300">{filename}</span>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={handleSubmit}
        disabled={selected.length === 0}
        className={`mt-4 w-full text-sm px-3 py-2 rounded-md font-medium transition ${
          selected.length === 0
            ? "bg-gray-300 text-gray-600 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        Reuse Selected Files
      </button>
    </div>
  );
}
