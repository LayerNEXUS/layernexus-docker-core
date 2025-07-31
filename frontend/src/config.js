const rawBase = process.env.REACT_APP_API_BASE_URL || "";
export const API_BASE_URL = rawBase.replace(/\/+$/, ""); // strip trailing slashes