export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

export async function apiClient(endpoint, options = {}) {
  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: "include", // Ensure HTTP-Only cookies are sent
  });

  const isJson = response.headers
    .get("content-type")
    ?.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (!response.ok || data?.error) {
    const errorMessage =
      data?.error || response.statusText || "API request failed";
    throw new ApiError(errorMessage, response.status, data);
  }

  return data;
}
