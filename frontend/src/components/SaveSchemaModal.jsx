import React, { useState, useEffect } from "react";

export default function SaveSchemaModal({
  isOpen,
  onClose,
  onSave,
  initialName = "",
  initialTags = [],
  mode = "edit", // "create" or "edit"
}) {
  const [schemaName, setSchemaName] = useState(initialName);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState(initialTags);

  useEffect(() => {
    setSchemaName(initialName);
    setTags(initialTags);
  }, [initialName, initialTags]);

  const handleAddTag = (e) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
        setTagInput("");
      }
    }
  };

  const handleRemoveTag = (tagToRemove) =>
    setTags(tags.filter((tag) => tag !== tagToRemove));

  const handleConfirm = () => {
    onSave({ name: schemaName.trim(), tags });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-300 dark:border-gray-700 w-full max-w-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          {mode === "edit" ? "Edit Schema Metadata" : "Save Schema Details"}
        </h2>

        {/* Schema Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Schema Name
          </label>
          <input
            type="text"
            value={schemaName}
            onChange={(e) => setSchemaName(e.target.value)}
            placeholder="e.g. CompanyA Orders Cleanup"
            className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-cyan-500"
          />
        </div>

        {/* Tags */}
        <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Tags
        </label>

        {/* Tag Blocks */}
        <div
          className="flex flex-wrap items-center gap-2 px-2 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg min-h-[44px]"
          onClick={() => document.getElementById("tag-input").focus()}
        >
          {tags.map((tag) => (
            <span
              key={tag}
              className="bg-cyan-700 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1"
            >
              #{tag}
              <button
                className="ml-1 text-white hover:text-red-300"
                onClick={() => handleRemoveTag(tag)}
              >
                ×
              </button>
            </span>
          ))}

          {/* Tag Input */}
          <input
            id="tag-input"
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && tagInput.trim()) {
                e.preventDefault();
                const newTag = tagInput.trim();
                if (!tags.includes(newTag)) {
                  setTags([...tags, newTag]);
                }
                setTagInput("");
              } else if (e.key === "Backspace" && tagInput === "") {
                // backspace to delete last tag
                setTags((prev) => prev.slice(0, -1));
              }
            }}
            className="flex-1 min-w-[100px] px-1 py-0.5 text-sm bg-transparent text-gray-900 dark:text-white focus:outline-none"
            placeholder="Type and press Enter..."
          />
        </div>
      </div>


        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-500 dark:text-gray-300 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg"
          >
            {mode === "edit" ? "Update Schema" : "Save Schema"}
          </button>
        </div>
      </div>
    </div>
  );
}
