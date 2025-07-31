import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { uploadFiles } from "../services/api";
import { toast } from "react-hot-toast";
import {
  CloudArrowUpIcon,
  DocumentIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

export default function FileUploader({ onUploadSuccess, setLoading, dialect }) {


  const onDrop = useCallback(async (acceptedFiles) => {
    const formData = new FormData();
    acceptedFiles.forEach(file => formData.append("files", file));
    formData.append("dialect", dialect);
    formData.append("use_llm", "true");

    try {
      setLoading(true);
      const response = await uploadFiles(formData);
      const filenames = acceptedFiles.map(f => f.name);

      onUploadSuccess({ ...response, filenames });
    } catch (error) {

      let message = "Upload failed. Please check your file and try again.";

      if (error?.response?.status === 422) {
        try {
          const detail = await error.response.json();
          message = detail?.detail || message;
        } catch {
          // fallback to default message
        }
      }

      toast.error(message); 
    } finally {
      setLoading(false);
    }
  }, [onUploadSuccess, setLoading, dialect]);

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    multiple: true,
    accept: {
      "text/csv": [".csv"],
      "application/json": [".json"],
      // "application/vnd.ms-excel": [".xls", ".xlsx"]
    },
  });

  return (
    <div
      {...getRootProps()}
      className={`w-full bg-white rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors duration-200 cursor-pointer 
      ${
        isDragActive
          ? "border-blue-500 bg-blue-50 dark:bg-gray-700"
          : "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50"
      }`}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center justify-center space-y-2">
        <div className="text-sm text-gray-700 dark:text-gray-200">
          {isDragActive ? (
            "Drop files to upload"
          ) : (
            <>
              <span className="font-semibold text-blue-400">Drag & drop</span> your CSV/JSON files here,
              or <span className="underline text-blue-300">click to upload</span>
            </>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Support .csv, .json
          </p>
        </div>
      </div>
    </div>
  );
}
