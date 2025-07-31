import React, { useState, useEffect } from "react";
import FileUploader from "../components/FileUploader";
import SchemaPreview from "../components/SchemaPreview";
import ERDPreview from "../components/MermaidRenderer";
import useSchemaStore from "../stores/useSchemaStore"; // Import global store
import "../index.css";
import { FolderCheck, TriangleAlert , X, FileX } from "lucide-react";
import { API_BASE_URL } from "../config";
import { Toaster } from 'react-hot-toast';

export default function App() {
  // Pull persisted fields from our store
  const {
    uploadResult,
    setUploadedFiles,
    setUploadResult,
  } = useSchemaStore();

  // Local states for fields not stored in Zustand (or UI preferences)
  const { view, setView } = useSchemaStore();
  const { uploadedFiles } = useSchemaStore();
  const [dialect, setDialect] = useState("postgres");
  const [loading, setLoading] = useState(false);
  const [setError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Destructure persisted values from the global store's uploadResult if available.
  const sql = uploadResult?.sql || "";
  const aiSQL = uploadResult?.aiSQL || null;
  const mermaidText = uploadResult?.mermaid || "";
  // const dbml = uploadResult?.dbml || "";
  const sessionId = uploadResult?.session_id || null;
  const [rejectedFiles, setRejectedFiles] = useState({});
  const [showRejectedPopup, setShowRejectedPopup] = useState(false);
  const rejected = Object.keys(uploadResult?.rejected_files || {});
  const validFiles = uploadedFiles.filter(f => !rejected.includes(f));

  // When a file is uploaded, update the global store
  const handleUploadSuccess = (result) => {
    // Clear previous store values if required
    setUploadedFiles([]); 
    // Clean reset + overwrite
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
    
      fetch(`${API_BASE_URL}/rejected-files/${sessionId}`)
        .then(async (res) => {
          const contentType = res.headers.get("content-type");
    
          if (!res.ok) {
            const text = await res.text(); // fallback if error
            throw new Error(`Failed to fetch: ${res.status} - ${text}`);
          }
    
          if (!contentType?.includes("application/json")) {
            const text = await res.text();
            throw new Error(`Not JSON: ${text}`);
          }
    
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

    <div className="min-h-screen bg-gray-900 text-white transition-colors duration-300">
      <Toaster position="top-left"
      toastOptions={{
        style: {
          background: "#1f2937", // Tailwind gray-800
          color: "#e5e7eb",       // Tailwind gray-200
          border: "1px solid #334155", // gray-700
          fontSize: "0.95rem",
          padding: "12px 16px",
        },}}
       />
      <main className="max-w-7xl mx-auto px-4 py-16 space-y-5">
        {/* Intro Header */}
        <header className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-200">
            Build Clean, Normalized Schemas from Any Raw Data
          </h1>
          <p className="text-lg text-gray-300">
            Upload your CSV or JSON files. LayerNEXUS instantly detects structure, generates clean SQL, and visualizes relationships.
            AI-assisted modeling is available for deeper refinement.
          </p>
        </header>

        {/* File Upload */}
        <section>
          <FileUploader
            onUploadSuccess={handleUploadSuccess}
            setLoading={setLoading}
            setError={setError}
            dialect={dialect}
          />

          {/* Unprocessed file */}
          {Object.keys(rejectedFiles).length > 0 && (
            <div className="bg-amber-50 border-l-4 border-amber-400 rounded-lg p-4 mt-6 shadow-sm" role="alert">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg 
                    className="h-5 w-5 text-amber-700 shrink-0" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-3 text-sm font-medium text-amber-700">
                    {Object.keys(rejectedFiles).length} file{Object.keys(rejectedFiles).length !== 1 ? 's' : ''} failed processing
                  </span>
                </div>
                <button
                  onClick={() => setShowRejectedPopup(!showRejectedPopup)}
                  className="ml-4 text-sm font-medium text-amber-700 hover:text-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                  aria-expanded={showRejectedPopup}
                  aria-controls="rejected-files-modal"
                >
                  View details →
                </button>
              </div>
            </div>
          )}

          {/* Rejected Files Modal */}
          {showRejectedPopup && (
            <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50">
              <div className="relative max-w-md mx-auto mt-20 p-6 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-emerald-400 flex items-center gap-2">
                    <TriangleAlert className="w-5 h-5" />
                    Unprocessed Files
                  </h3>
                  <button
                    onClick={() => setShowRejectedPopup(false)}
                    className="text-gray-400 hover:text-gray-200 focus:outline-none transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="prose-sm">
                  <p className="text-gray-300 mb-4 text-sm">
                    The following files contain validation issues or unsupported formats:
                  </p>
                  <ul className="divide-y divide-gray-700 max-h-96 overflow-y-auto">
                    {Object.entries(rejectedFiles).map(([filename, reason]) => (
                      <li key={filename} className="py-3">
                        <div className="font-medium text-gray-100 truncate flex items-center gap-2">
                          <FileX className="w-4 h-4 text-blue-400" />
                          {filename}
                        </div>
                        <div className="mt-1 text-xs text-amber-400 font-medium">{reason}</div>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => setShowRejectedPopup(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </section>

        {/* Uploaded File List */}
        {validFiles.length > 0 && (
          <section className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3 text-emerald-400 flex items-center gap-2">
              <FolderCheck className="w-5 h-5" />
              Uploaded Files
            </h3>
            <ul className="flex flex-wrap gap-3 text-sm text-gray-300">
            {validFiles.map((file, idx) => {
                const fileName = typeof file === 'string' ? file : file.name;
                const tableName = fileName.replace(/\.(csv|json)$/i, "");
                const isOverlap = overlapTableNames.includes(tableName);

                return (
                  <li
                    key={idx}
                    className="bg-gray-700/60 px-3 py-1.5 rounded-md border border-gray-600 flex items-center gap-2 max-w-[200px] truncate"
                  >
                    <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {/* Main icon */}
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M4 4v16h16V8l-6-4H4z" 
                      />
                      
                      {/* Alert badge with hover tooltip */}
                      {isOverlap && (
                        <g transform="translate(18 6)">
                          <circle 
                            r="5.5" 
                            fill="#facc15" 
                            stroke="#854d0e" 
                            strokeWidth="1"
                            className="cursor-pointer hover:opacity-90 transition-opacity"
                          />
                          <text
                            x="0"
                            y="0"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="#422006"
                            fontSize="8"
                            fontWeight="800"
                            className="font-sans cursor-pointer"
                          >
                            !
                          </text>
                        </g>
                      )}
                    </svg>
                    <span className="truncate">{fileName}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Loading State */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="flex items-center gap-4">
              <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              <p className="text-lg font-semibold text-blue-400">Generating schema...</p>
            </div>
          </div>
        )}

        {/* Schema + ERD Output */}
        {sql && mermaidText && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SchemaPreview
              view={view}
              sql={sql}
              aiSQL={aiSQL}
              dialect={dialect}
              setDialect={setDialect}
              setView={setView}
              aiLoading={aiLoading}
              setAiLoading={setAiLoading}
              // When SchemaPreview updates AI fields, update the store accordingly:
              setAiSQL={(newSQL) =>
                setUploadResult((prev) => ({ ...prev, aiSQL: newSQL }))
              }
              setDBML={(dbmlValue) =>
                setUploadResult((prev) => ({ ...prev, dbml: dbmlValue }))
              }
              setMermaidText={(mermaidValue) =>
                setUploadResult((prev) => ({ ...prev, mermaid: mermaidValue }))
              }
              setError={setError}
            />
            <ERDPreview mermaidText={mermaidText} />
          </section>
        )}
      </main>
    </div>
  );
}
