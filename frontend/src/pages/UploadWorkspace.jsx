import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../config";
import { Toaster } from 'react-hot-toast';
import { FolderCheck, TriangleAlert , X, FileX } from "lucide-react";
import FileUploader from "../components/FileUploader";
import SchemaPreview from "../components/SchemaPreview";
import ERDPreview from "../components/MermaidRender";
import useSchemaStore from "../stores/useSchemaStore";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import useSidebarStore from "../stores/useSidebarStore";
import FileHistoryList from "../components/FileHistoryList";

export default function UploadPage() {
  const {
    uploadResult,
    setUploadedFiles,
    setUploadResult,
    uploadedFiles,
    view,
    setView
  } = useSchemaStore();

  const [dialect, setDialect] = useState("postgres");
  const [loading, setLoading] = useState(false);
  const [setError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [rejectedFiles, setRejectedFiles] = useState({});
  const [showRejectedPopup, setShowRejectedPopup] = useState(false);
  const { collapsed } = useSidebarStore();

  const sql = uploadResult?.sql || "";
  const aiSQL = uploadResult?.aiSQL || null;
  const mermaidText = uploadResult?.mermaid || "";
  const sessionId = uploadResult?.session_id || null;

  const rejected = Object.keys(uploadResult?.rejected_files || {});
  const validFiles = uploadedFiles.filter(f => !rejected.includes(f));

  const handleUploadSuccess = (result) => {
    setUploadedFiles([]); 
    setUploadResult({
      session_id: result.session_id || null,
      sql: result.sql || "",
      mermaid: result.mermaid || "",
      dbml: result.dbml || "",
      filenames: result.filenames || [],
      aiSQL: null, 
    });
    setView("original");
  };

  useEffect(() => {
    if (!sessionId) return;

    fetchWithAuth(`${API_BASE_URL}/rejected-files/${sessionId}`)
      .then(async (res) => {
        const contentType = res.headers.get("content-type");
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status} - ${await res.text()}`);
        if (!contentType?.includes("application/json")) throw new Error(`Not JSON: ${await res.text()}`);
        return res.json();
      })
      .then((data) => {
        setRejectedFiles(data.rejected_files || {});
      })
      .catch((err) => {
        console.error("⚠️ Failed to fetch rejected files:", err);
      });
  }, [sessionId]);

  const extractOverlapTables = (overlaps) => {
    const overlappingTables = new Set();
    overlaps?.forEach(([t1, t2, score]) => {
      if (score > 0.7) {
        overlappingTables.add(t1);
        overlappingTables.add(t2);
      }
    });
    return Array.from(overlappingTables);
  };

  const overlapTableNames = extractOverlapTables(uploadResult?.overlaps || []);

  return (
    <div className="flex h-screen w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      <Toaster position="top-left" toastOptions={{
        style: {
          background: "#1f2937",
          color: "#e5e7eb",
          border: "1px solid #334155",
          fontSize: "0.95rem",
          padding: "12px 16px",
        },
      }} />



      {/* Main content */}
      <main className="flex-1 overflow-hidden p-6">
        <h1 className="text-2xl font-semibold">Build Clean, Normalized Schemas from Any Raw Data</h1>

        <FileUploader
          onUploadSuccess={handleUploadSuccess}
          setLoading={setLoading}
          setError={setError}
          dialect={dialect}
        />

      {Object.keys(rejectedFiles).length > 0 && (
        <div className={`fixed bottom-4 left-60 transition-all duration-300 ${ collapsed ? "left-20" : "left-60" } z-50 bg-amber-100 dark:bg-amber-900/80 text-amber-900 dark:text-amber-100 border border-amber-400 dark:border-amber-700 px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm min-w-[240px] max-w-sm`}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm">
              <TriangleAlert className="w-5 h-5" />
              <span>{Object.keys(rejectedFiles).length} file(s) failed</span>
            </div>
            <button
              onClick={() => setShowRejectedPopup(true)}
              className="text-xs underline underline-offset-2"
            >
              View →
            </button>
          </div>
        </div>
      )}

        {showRejectedPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start pt-20">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full border border-gray-300 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <TriangleAlert className="w-5 h-5" /> Unprocessed Files
                </h3>
                <button onClick={() => setShowRejectedPopup(false)} className="text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white">
                  <X className="w-6 h-6" />
                </button>
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

        {sql && mermaidText && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SchemaPreview classname="h-full flex flex-col"
              view={view}
              sql={sql}
              aiSQL={aiSQL}
              dialect={dialect}
              setDialect={setDialect}
              setView={setView}
              aiLoading={aiLoading}
              setAiLoading={setAiLoading}
              setAiSQL={(newSQL) => setUploadResult((prev) => ({ ...prev, aiSQL: newSQL }))}
              setDBML={(dbmlValue) => setUploadResult((prev) => ({ ...prev, dbml: dbmlValue }))}
              setMermaidText={(mermaidValue) => setUploadResult((prev) => ({ ...prev, mermaid: mermaidValue }))}
              setError={setError}
            />
            <ERDPreview mermaidText={mermaidText} />
          </section>
        )}
      </main>
    </div>
  );
}
