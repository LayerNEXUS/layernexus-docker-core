import React, { useState } from "react";
import { PencilIcon, CheckIcon, CpuChipIcon } from "@heroicons/react/24/outline";

export default function SchemaCard({ schema, onSelect }) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <article
      onClick={() => {
        if (!isEditing) onSelect(schema);
      }}
      className="relative cursor-pointer bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg hover:border-cyan-500 transition-all"
    >
      {/* AI Icon */}
      {schema.ai_version && (
        <span 
            title="AI Generated"
            className="absolute top-2 right-2 p-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300 rounded-full">
            <CpuChipIcon className="w-4 h-4" />
        </span>
      )}

      {/* Name with inline edit */}
      <div className="mb-2 flex items-center gap-2">
          <>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white flex-1 line-clamp-1">
              {schema.name || "Untitled Schema"}
            </h2>
          </>
      </div>

      {/* Summary */}
      <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-3 mb-2">
        {schema.created_at}
      </p>

      {/* Summary */}
      <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-3 mb-2">
        {schema.summary}
      </p>

      {/* Tags */}
      {schema.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {schema.tags.map((tag) => (
            <span
              key={tag}
              className="bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-300 text-xs px-2 py-0.5 rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
