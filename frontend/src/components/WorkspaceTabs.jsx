import React, { useState } from "react";
import UploaderPanel from "./UploaderPanel";
import ERDPanel from "./ERDPanel";
import useSchemaStore from "../stores/useSchemaStore";
import { Upload, Network } from "lucide-react";

export default function WorkspaceTabs() {
  const [tab, setTab] = useState("upload");
  const { uploadResult } = useSchemaStore();
  const hasUpload = uploadResult?.sql || false;

const TabButton = ({ id, label, icon }) => (
  <button
    onClick={() => setTab(id)}
    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-t-md border-b-2 ${
      tab === id
        ? "bg-white dark:bg-gray-900 text-gray-600 dark:text-white border-indigo-500"
        : "bg-gray-100 dark:bg-gray-800 text-gray-500 border-transparent hover:text-blue-600"
    }`}
  >
    {icon && <span>{icon}</span>}
    <span>{label}</span>
  </button>
);

  return (
    <div className="flex flex-col flex-1">
      <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700">
        <TabButton id="upload" label="Upload" icon={<Upload className="w-4 h-4" />} />
        {hasUpload &&         
        <TabButton id="erd" label="ERD" icon={<Network className="w-4 h-4" />} />}
      </div>

      <div className="flex-1 overflow-y-auto mt-2">
        {tab === "upload" && <UploaderPanel />}
        {tab === "erd" && hasUpload && <ERDPanel />}
      </div>
    </div>
  );
}
