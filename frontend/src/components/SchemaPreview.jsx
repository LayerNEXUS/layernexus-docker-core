import React, { useState } from "react";
import { Copy, Download, Code2, Sparkles, Bot, HashIcon } from "lucide-react";
import { API_BASE_URL } from "../config";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { v4 as uuidv4 } from "uuid";
import useSchemaStore from "../stores/useSchemaStore";
import toast from 'react-hot-toast';
import SaveSchemaModal from "./SaveSchemaModal"; // adjust the path if needed
import { useLicenseStore } from "../stores/licenseStore";
import useOpenAIStatus from "../services/useOpenAIStatus";  

export default function SchemaPreview({
  view,
  sql,
  dialect,
  setDialect,
  setView,
  aiLoading,
  setAiLoading
}) {
  const {aiSQL, setAiSQL, setMermaidText, uploadResult, setLastSchemaMeta, lastSavedSchemaId, updateSchemaMeta} = useSchemaStore()
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [existingSchema, setExistingSchema] = useState({ name: "", tags: [] });
  const openaiStatus = useOpenAIStatus(); 
  const content =
  view === "original"
    ? sql
    : aiSQL || "-- AI hasn’t returned anything yet --";
  
  const [error, setError] = useState("");
  const { status } = useLicenseStore();
  const isLicenseValid = status === "valid";
  
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    alert("Copied SQL to clipboard!");
  };

  const handleExport = () => {
    const blob = new Blob([content], { type: "text/sql" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "schema.sql";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAIReview = async () => {
    try {
      setAiLoading(true);
      setError("");

      const data = await fetchWithAuth(`${API_BASE_URL}/fix-with-ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql, dialect: dialect || "postgres" }),
      });

      if (data.error) {
        toast.error(data.error);
        return;
      }

      if (!data.sql) {
        setError("AI response format invalid");
        return;
      }      
      setAiSQL(data.sql); // This updates the AI SQL content
      setView("ai");
      setMermaidText(data.mermaid);

      // ✅ Save cleaned schema to DB
      const aiSessionId = uuidv4(); // new ID for AI version
      const originalSessionId = uploadResult.session_id; // this should be stored from upload
      const sourceSchema = uploadResult.source_schema || null;
      
      await fetchWithAuth(`${API_BASE_URL}/schemas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: aiSessionId,
          parent_session_id: originalSessionId,
          sql_output: data.sql,
          dbml_output: data.dbml,
          mermaid_output: data.mermaid,
          source_schema: sourceSchema,
          is_ai_version: true,
          name: "", // optional
          tags: [], // optional
        }),
      });
      
      setLastSchemaMeta({
        session_id: aiSessionId,
        name: "",
        tags: [],
        is_ai_version: true,
      });
      

    } catch (err) {
      toast.error("AI cleanup failed. Please try again.");
      console.error("AI cleanup failed:", err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleUpdateSchema = async ({ name, tags }) => {
    if (!lastSavedSchemaId) return;

    try {
      await fetchWithAuth(`${API_BASE_URL}/schemas/${lastSavedSchemaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, tags }),
      });

      toast.success("Schema updated!");
      updateSchemaMeta({ name, tags }); // ✅ persist into Zustand
    } catch (err) {
      console.error("Failed to update schema", err);
      toast.error("Update failed.");
    }
  };

  if (!content.trim()) {
    return (
      <div className="flex-1 flex items-center justify-center italic text-sm text-gray-400">
        🗂️ No schema to display. Upload or reprocess a file.
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col text-gray-500 dark:text-gray-400">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setView("original")}
            className={`px-2.5 py-1.5 rounded-md flex items-center gap-1.5 text-sm ${
              view === "original"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            }`}
          >
            <Code2 className="w-4 h-4" /> Original
          </button>

          {aiSQL && (
            <button
              onClick={() => setView("ai")}
              className={`px-2.5 py-1.5 rounded-md flex items-center gap-1.5 text-sm ${
                view === "ai"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
              }`}
            >
              <Sparkles className="w-4 h-4" /> AI Cleaned
            </button>
          )}
        </div>

        <select
          value={dialect}
          onChange={(e) => setDialect(e.target.value)}
          className="pl-3 pr-8 py-1.5 rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-sm"
        >
          <option value="postgres">PostgreSQL</option>
          <option value="mysql">MySQL</option>
          <option value="sqlite">SQLite</option>
          <option value="oracle">Oracle</option>
          <option value="sqlserver">SQL Server</option>
        </select>

        <button
          onClick={handleCopy}
          className="px-2.5 py-1.5 border rounded-md text-sm flex items-center gap-1 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600"
        >
          <Copy className="w-4 h-4" /> Copy
        </button>

        <button
          onClick={handleExport}
          className="px-2.5 py-1.5 border rounded-md text-sm flex items-center gap-1 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600"
        >
          <Download className="w-4 h-4" /> Export
        </button>
         
        {aiSQL && (
          <>
            <button
              onClick={() => setShowSaveModal(true)}
              className="flex items-center gap-1 text-sm text-cyan-500 hover:text-cyan-300"
              title="Add name or tags"
            >
            <HashIcon className="w-4 h-4" />
              Edit Tags
            </button>

            <SaveSchemaModal
              isOpen={showSaveModal}
              onClose={() => setShowSaveModal(false)}
              onSave={handleUpdateSchema}
              mode="edit"
              initialName={existingSchema.name}
              initialTags={existingSchema.tags}
            />
          </>
        )}

        <button
          onClick={handleAIReview}
          disabled={
            aiLoading || 
            !isLicenseValid || 
            openaiStatus !== "available"  // ⛔ disable if no key
          }
          className="ml-auto px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md flex items-center gap-1.5 text-sm disabled:opacity-50"
          title={
            !isLicenseValid
              ? "AI is disabled due to inactive or offline license."
              : openaiStatus !== "available"
              ? "OpenAI key is missing or invalid. Please contact admin."
              : ""
          }
        >
          <Bot className="w-4 h-4" />
          {aiLoading ? "Running..." : "Run AI"}
        </button>
      </div>

      {error && (
        <p className="text-red-500 text-sm mb-2">
          ⚠️ {error}
        </p>
      )}

      {/* SQL content preview */}
      <div className="flex-1 w-full overflow-y-auto border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-900 p-4 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-500 dark:hover:scrollbar-thumb-gray-500">
        <pre className="whitespace-pre-wrap break-words text-sm font-mono w-full">
          {content}
        </pre>
      </div>
      {aiLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="flex items-center gap-4">
              <div className="animate-spin h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full"></div>
              <p className="text-lg font-semibold text-purple-400">LayerNEXUS - Build perfect data models in seconds.</p>
            </div>
          </div>
        )}
    </div>
  );
}
