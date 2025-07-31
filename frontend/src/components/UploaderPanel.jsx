import { API_BASE_URL } from "../config";
import React, { useState, useEffect } from "react";
import FileUploader from "./FileUploader";
import useSchemaStore from "../stores/useSchemaStore";
import ToastRejected from "./ToastRejected";
import useSidebarStore from "../stores/useSidebarStore"; // or however you manage collapsed
import HistoricalFileList from "../components/HistoricalFileList"
import { fetchWithAuth } from "../utils/fetchWithAuth";
import SchemaPreview from "../components/SchemaPreview";
import { FolderCheck, TriangleAlert , X, FileX } from "lucide-react";
import toast from 'react-hot-toast';

export default function UploaderPanel() {
    // ✅ Zustand store: shared or reused across components
    const {
      uploadResult,
      setUploadResult,
      uploadedFiles,
      setUploadedFiles,
      view,
      setView,
      mermaidText,
      setMermaidText,
      setAiSQL,
      refreshFiles
    } = useSchemaStore();

    const snapshot = useSchemaStore.getState();
    const { collapsed } = useSidebarStore();
    const [rejectedFiles, setRejectedFiles] = useState({});

    // ✅ Local state: only needed within this component
    const [dialect, setDialect] = useState("postgres");
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [error, setError] = useState("");
    const [showRejectedPopup, setShowRejectedPopup] = useState(false);

    // ✅ Derived data
    const hasUploaded = uploadResult?.filenames?.length > 0;
    const sql = uploadResult?.sql || "";
    const sessionId = uploadResult?.session_id || null;


    const handleUploadSuccess = (result) => {
      setUploadedFiles(result.filenames || []);
      setUploadResult({
        session_id: result.session_id || null,
        sql: result.sql || "",
        mermaid: result.mermaid || "",
        filenames: result.filenames || [],
        aiSQL: null, 
      });

      setAiSQL(""); // clear standalone key
      setMermaidText(result.mermaid || ""); // update mermaid view
      setView("original");
      refreshFiles();
    };

    const handleReprocess = async (filenames) => {
      try {
        setLoading(true);

        const res = await fetchWithAuth(`${API_BASE_URL}/reprocess`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filenames }),
        });

        // ✅ This assumes fetchWithAuth returns parsed JSON
        const result = res; // or `await res.json()` if needed

        setUploadedFiles(result.filenames || []);
        setUploadResult({
          session_id: result.session_id || null,
          sql: result.sql || "",
          mermaid: result.mermaid || "",
          filenames: result.filenames || [],
          aiSQL: null,
        });

        setAiSQL("");
        setMermaidText(result.mermaid || "");
        setView("original");
      } catch (err) {
        console.error("❌ Reprocess failed", err);
        toast.error("Reprocessing failed. See console for details.");
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
  if (!sessionId) return;

  const loadRejectedFiles = async () => {
    try {
      const data = await fetchWithAuth(`${API_BASE_URL}/rejected-files/${sessionId}`);
      setRejectedFiles(data.rejected_files || {});
    } catch (err) {
      console.error("⚠️ Failed to fetch rejected files:", err);
    }
  };

  loadRejectedFiles();
}, [sessionId]);

  const rejectedCount = Object.keys(rejectedFiles || {}).length;

  return (
  
  <div className="space-y-6">
    {/* Top: Drag and drop uploader */}
    <FileUploader
      onUploadSuccess={handleUploadSuccess}
      setLoading={setLoading}
      setError={setError}
      dialect={dialect}
    />

    {/* Bottom split: History (left) + Schema Preview (right) */}
    <div className="flex gap-4 h-[calc(100vh-300px)]">
      {/* Historical Panel */}
      <div className="w-1/4">
        <HistoricalFileList onReprocess={handleReprocess}/>
      </div>

      {/* Schema Workspace (placeholder for now) */}
      <div className="flex-1 border bg-white dark:bg-gray-900 rounded-lg border-gray-300 dark:border-gray-700  p-4 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <SchemaPreview classname="h-full flex flex-col"
            view={view}
            sql={sql}
            dialect={dialect}
            setDialect={setDialect}
            setView={setView}
            aiLoading={aiLoading}
            setAiLoading={setAiLoading}
            setMermaidText={(mermaidValue) =>
              setUploadResult((prev) => ({ ...prev, mermaid: mermaidValue }))
            }
            setError={setError}
            />
      </div>
    </div>

    {/* Rejected File Toast */}
    <ToastRejected
      count={rejectedCount}
      onClick={() => setShowRejectedPopup(true)}
      collapsed={collapsed}
    />

    {showRejectedPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start pt-20">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full border border-gray-300 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                  <TriangleAlert className="w-5 h-5" /> Unprocessed Files
                </h3>
              </div>
              <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
                {Object.entries(rejectedFiles).map(([filename, reason]) => (
                  <li key={filename} className="py-3">
                    <div className="font-medium text-gray-800 dark:text-gray-100 truncate flex items-center gap-2">
                      <FileX className="w-4 h-4 text-blue-500" /> {filename}
                    </div>
                    <div className="mt-1 text-xs text-amber-700 dark:text-amber-400 font-medium">{reason}</div>
                  </li>
                ))}
              </ul>
              <div className="mt-6 text-right">
                <button onClick={() => setShowRejectedPopup(false)} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-sm text-gray-900 dark:text-white rounded-md">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      {/* Loading State */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="flex items-center gap-4">
              <div className="animate-spin h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full"></div>
              <p className="text-lg font-semibold text-purple-400">Generating schema...</p>
            </div>
          </div>
      )}
  </div>
);
}
