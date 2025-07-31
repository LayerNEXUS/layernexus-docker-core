import useSchemaStore from "../stores/useSchemaStore";

// UploadedFileList.jsx
export default function UploadedFileList() {
  const { uploadedFiles } = useSchemaStore();
    return <ul>
    {uploadedFiles.map((file, idx) => (
      <li key={idx} className="truncate text-sm text-gray-700 dark:text-gray-200">
        {file}
      </li>
    ))}
  </ul>;
  }