export async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem("token");
  const isFormData = options.body instanceof FormData;

  // Initial request config
  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
    ...(isFormData ? {} : { "Content-Type": "application/json" })
  };

  let config = {
    ...options,
    headers,
    credentials: "include"
  };

  // Unified response handler
  const handleResponse = async (response) => {
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return response.headers.get("content-type")?.includes("application/json")
      ? response.json()
      : response.text();
  };

  try {
    // First attempt
    let response = await fetch(url, config);
    
    // Successful response (non-401)
    if (response.status !== 401) {
      return isFormData ? response : handleResponse(response);
    }

    // Token refresh flow
    const refreshResponse = await fetch("/api/auth/refresh-token", {
      method: "POST",
      credentials: "include"
    });
    
    if (!refreshResponse.ok) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      throw new Error("Session expired");
    }

    const { access_token } = await refreshResponse.json();
    localStorage.setItem("token", access_token);

    // Retry with new token
    config = {
      ...options,
      headers: {
        ...headers,
        Authorization: `Bearer ${access_token}`
      },
      credentials: "include"
    };

    const retryResponse = await fetch(url, config);
    return isFormData ? retryResponse : handleResponse(retryResponse);

  } catch (error) {
    if (error.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    throw error;
  }
}