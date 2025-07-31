// src/hooks/useOpenAIStatus.js
import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config";
import { fetchWithAuth } from "../utils/fetchWithAuth";

export default function useOpenAIStatus() {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    async function checkKey() {
      try {
        const res = await fetchWithAuth(`${API_BASE_URL}/admin/openai-key`);
        setStatus(res.openai_api_key ? "available" : "missing");
      } catch (err) {
        setStatus("missing");
      }
    }
    checkKey();
  }, []);

  return status;
}
