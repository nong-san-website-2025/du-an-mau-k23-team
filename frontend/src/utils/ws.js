export const getWSBaseUrl = () => {
  const apiUrl = process.env.REACT_APP_API_URL;

  // If an API URL is provided via env, derive WS base from it.
  if (apiUrl) {
    const url = new URL(apiUrl);
    const protocol = url.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${url.host}`;
  }

  // Fallback to current window location (no hardcoded IP required).
  // Useful in development when frontend and backend share the same host or
  // when REACT_APP_API_URL is intentionally left unset.
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}`;
  }

  throw new Error("Missing REACT_APP_API_URL and window is not available");
};
