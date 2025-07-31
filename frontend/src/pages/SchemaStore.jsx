import React, { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import useUserSummary from "../stores/useUserSummary";
import { API_BASE_URL } from "../config";
import SchemaCard from "../components/SchemaCard"; // or wherever you placed it
import { PencilIcon, CheckIcon } from "@heroicons/react/24/outline";
import { fetchWithAuth } from "../utils/fetchWithAuth";

export default function SchemaStore() {
  const { summary, setSummary, refreshSummary } = useUserSummary();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSchema, setSelectedSchema] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(selectedSchema?.name || "");

  useEffect(() => {
    refreshSummary();
  }, [refreshSummary]);

  const schemas = summary.schemas || [];

  const filteredSchemas = schemas.filter((s) => {
    const searchable = [
      s.name || "",
      s.summary || "",
      s.sql || "",
      ...(s.tags || []),
    ].join(" ").toLowerCase();

    return searchable.includes(searchTerm.toLowerCase());
  });

const handleDelete = async () => {
  if (!selectedSchema) return;
  setIsDeleting(true);

  try {
    await fetchWithAuth(
      `${API_BASE_URL}/schema-store/${selectedSchema.id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }
    );

    // ✅  update grid immediately
    setSummary({
      ...summary,
      schemas: schemas.filter((s) => s.id !== selectedSchema.id),
    });

    // ✅  close the modal
    setSelectedSchema(null);
  } catch (err) {
    console.error("Failed to delete schema", err);
  } finally {
    setIsDeleting(false);
  }
};

useEffect(() => {
  if (!selectedSchema) return;
  // Only reset if a NEW schema is selected (by ID)
  setEditedName(selectedSchema.name || "");
  setIsEditingName(false);
}, [selectedSchema?.id]);

  const handleUpdateName = async () => {
  try {
    // update on the server
    await fetchWithAuth(
      `${API_BASE_URL}/schemas/${selectedSchema.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editedName }),
      }
    );

    // ✅ immediately patch local modal state
    setSelectedSchema((prev) => ({ ...prev, name: editedName }));

    // ✅ patch the card list so the grid redraws
    const updatedSchemas = summary.schemas.map((s) =>
      s.id === selectedSchema.id ? { ...s, name: editedName } : s
    );
    setSummary({ ...summary, schemas: updatedSchemas });
  } catch (err) {
    console.error("Failed to update name", err);
  } finally {
    setIsEditingName(false);
  }
};

  return (
    <main className="h-screen p-6 flex flex-col flex-1 overflow-hidden">
      <div className="flex flex-col flex-1">
        {/* Header */}
        <header className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Schema Store</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm py-2">
            Browse and manage your saved schemas
          </p>
        </header>

        {/* Search Input */}
        <input
          type="search"
          placeholder="Search schemas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />

        {/* Grid */}
        {filteredSchemas.length > 0 ? (
          <div className="py-4 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-500 dark:hover:scrollbar-thumb-gray-500">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSchemas.map((schema) => (
              <SchemaCard
                key={schema.id}
                schema={schema}
                onSelect={setSelectedSchema}
              />
            ))}
          </div>
          </div>
        ) : (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-12">No schemas found</p>
        )}

        {/* Modal */}
        {selectedSchema && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div
              className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl p-6 max-w-3xl w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
        <div className="flex items-center justify-between gap-2 mb-4">
          {isEditingName ? (
            <>
              <input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUpdateName();
                  else if (e.key === "Escape") setIsEditingName(false);
                }}
                onBlur={handleUpdateName}
                autoFocus
                className="flex-1 text-lg font-semibold px-2 py-1 rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
              />
              <button
                onClick={handleUpdateName}
                className="text-green-600 hover:text-green-800"
              >
                <CheckIcon className="w-5 h-5" />
              </button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold flex-1">
                {selectedSchema.name || "Untitled Schema"}
              </h2>
              <button
                onClick={() => setIsEditingName(true)}
                className="text-gray-500 hover:text-cyan-500"
                title="Edit name"
              >
                <PencilIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setSelectedSchema(null)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                ✕
              </button>
            </>
          )}
        </div>


              <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                Created: {new Date(selectedSchema.created_at).toLocaleDateString()}
              </div>

              {selectedSchema.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedSchema.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <pre className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 overflow-auto text-sm text-gray-800 dark:text-gray-200 max-h-96 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-500 dark:hover:scrollbar-thumb-gray-500">
                {selectedSchema.sql || selectedSchema.summary}
              </pre>

              <div className="flex justify-end gap-4 mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 ">
                <button
                  className="px-4 py-2 text-sm text-gray-500 dark:text-gray-300 hover:text-white dark:hover:text-white"
                  onClick={() => setSelectedSchema(null)}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting ? "Deleting..." : "Delete Schema"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
