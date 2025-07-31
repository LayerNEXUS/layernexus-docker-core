import { useEffect, useState } from "react";
import { FolderArchive} from "lucide-react";
import useSchemaStore from "../stores/useSchemaStore";

export default function HistoricalFileList({ onReprocess }) {
  const { files, refreshFiles } = useSchemaStore();
  const [selected, setSelected] = useState([]);
  
  useEffect(() => {
    refreshFiles(); // fetch on mount
  }, []);


  const toggleSelect = (file) => {
    setSelected((prev) =>
      prev.includes(file) ? prev.filter((f) => f !== file) : [...prev, file]
    );
  };

  const handleReprocess = () => {
    if (selected.length === 0) return;
    onReprocess(selected);
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-4 shadow h-full flex flex-col">
      <h3 className="text-sm font-semibold mb-3 text-gray-800 dark:text-white flex items-center gap-2 ">
        <FolderArchive className="w-4 h-4" />
        Historical Files
      </h3>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-500 dark:hover:scrollbar-thumb-gray-500">
        {files.length === 0 ? (
          <p className="text-xs text-gray-400">No previous uploads.</p>
        ) : (
          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 ">
            {files.map((file) => (
              <li key={file} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selected.includes(file)}
                  onChange={() => toggleSelect(file)}
                />
                <span className="truncate">{file}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        onClick={handleReprocess}
        disabled={selected.length === 0}
        className="mt-3 px-3 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
      >
        Reprocess Selected
      </button>
    </div>
  );
}
