import React, { useState } from "react";
import useSchemaStore from "../stores/useSchemaStore";
import SchemaPreview from "./SchemaPreview";

export default function SchemaPanel() {
  const { uploadResult, setUploadResult } = useSchemaStore();
  const [view, setView] = useState("original");
  const [dialect, setDialect] = useState("postgres");
  const [aiLoading, setAiLoading] = useState(false);
  const sql = uploadResult?.sql || "";
  const aiSQL = uploadResult?.aiSQL || null;
  const [setError] = useState("");

  return (
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
  );
}
