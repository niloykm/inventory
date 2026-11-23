/**
 * API Client Instance
 * Handles all HTTP requests with automatic bearer token injection
 */

import { API_BASE_URL } from "./config/api-endpoints";

class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  /**
   * Get authentication token from localStorage
   */
  getToken() {
    if (typeof window !== "undefined") {
      return localStorage.getItem("inventory_auth_token");
    }
    return null;
  }

  /**
   * Build headers with bearer token
   */
  buildHeaders(token, isFormData = false) {
    const headers = {};

    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    const authToken = token || this.getToken();
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    // Try to include client IP hint for better audit logging
    // This helps when the app is behind a proxy or running locally
    if (typeof window !== "undefined") {
      // Get client IP from a stored value (can be set by an IP detection service)
      const clientIp = sessionStorage.getItem("client_ip");
      if (clientIp && clientIp !== "unknown") {
        headers["X-Client-IP"] = clientIp;
      }
    }

    return headers;
  }

  /**
   * Resolve base URL (supports relative paths like /api/v1 in browser)
   */
  resolveBaseURL() {
    let finalBaseURL = this.baseURL;
    if (typeof window !== "undefined" && finalBaseURL.startsWith("/")) {
      finalBaseURL = window.location.origin + finalBaseURL;
    }
    return finalBaseURL;
  }

  /**
   * Handle API response
   */
  async handleResponse(response, endpoint = "") {
    console.log(
      "[ApiClient] Response status:",
      response.status,
      response.statusText
    );

    // Handle 204 No Content
    if (response.status === 204) {
      console.log("[ApiClient] 204 No Content - returning empty object");
      return {};
    }

    // Parse response body first so server error messages are preserved
    const parsed = await response.json().catch(() => ({}));
    console.log("[ApiClient] Parsed response:", parsed);

    // Handle 401 Unauthorized
    if (response.status === 401) {
      const isAuthEndpoint =
        endpoint.startsWith("/auth/login") ||
        endpoint.startsWith("/auth/register") ||
        endpoint.startsWith("/auth/me");

      const serverMsg =
        parsed?.detail ||
        parsed?.message ||
        (isAuthEndpoint ? "Invalid credentials" : "Session expired");

      if (!isAuthEndpoint && typeof window !== "undefined") {
        console.log(
          "[ApiClient] 401 Unauthorized - clearing auth and redirecting"
        );
        localStorage.removeItem("inventory_auth_token");
        localStorage.removeItem("inventory_user");
        if (
          window.location.pathname !== "/login" &&
          window.location.pathname !== "/register"
        ) {
          window.location.href = "/login";
        }
      }

      throw new Error(serverMsg);
    }

    // If server returns the wrapper { success: boolean, data: ... }, unwrap it
    if (parsed && typeof parsed === "object" && parsed.success !== undefined) {
      if (!parsed.success) {
        const errMsg =
          parsed.detail || parsed.message || `HTTP ${response.status}`;
        console.log("[ApiClient] Server returned success=false:", errMsg);
        throw new Error(errMsg);
      }
      console.log("[ApiClient] Unwrapping success response:", parsed);
      // Return the entire response to preserve pagination, stats, etc.
      // This allows components to access response.data, response.pagination, etc.
      return parsed;
    }

    if (!response.ok) {
      const errMsg =
        parsed.detail || parsed.message || `HTTP ${response.status}`;
      console.log("[ApiClient] Response not OK:", errMsg);
      throw new Error(errMsg);
    }

    console.log("[ApiClient] Returning parsed response as-is");
    return parsed;
  }

  /**
   * GET request
   */
  async get(endpoint, params = {}, token = null) {
    const finalBaseURL = this.resolveBaseURL();

    const url = new URL(`${finalBaseURL}${endpoint}`);
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    const headers = this.buildHeaders(token);
    headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
    headers["Pragma"] = "no-cache";
    headers["Expires"] = "0";

    const response = await fetch(url.toString(), {
      method: "GET",
      headers,
      credentials: "include", // Include cookies
      cache: "no-store", // Disable fetch cache
    });

    return this.handleResponse(response, endpoint);
  }

  /**
   * POST request
   */
  async post(endpoint, body = {}, token = null, isFormData = false) {
    const finalBaseURL = this.resolveBaseURL();

    const headers = this.buildHeaders(token, isFormData);
    headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
    headers["Pragma"] = "no-cache";

    const response = await fetch(`${finalBaseURL}${endpoint}`, {
      method: "POST",
      headers,
      credentials: "include", // Include cookies
      body: isFormData ? body : JSON.stringify(body),
      cache: "no-store", // Disable fetch cache
    });

    return this.handleResponse(response, endpoint);
  }

  /**
   * PUT request
   */
  async put(endpoint, body = {}, token = null) {
    const finalBaseURL = this.resolveBaseURL();
    const headers = this.buildHeaders(token);
    headers["Cache-Control"] = "no-cache, no-store, must-revalidate";

    const response = await fetch(`${finalBaseURL}${endpoint}`, {
      method: "PUT",
      headers,
      credentials: "include", // Include cookies
      body: JSON.stringify(body),
      cache: "no-store",
    });

    return this.handleResponse(response, endpoint);
  }

  /**
   * PATCH request
   */
  async patch(endpoint, body = {}, token = null) {
    const finalBaseURL = this.resolveBaseURL();
    const headers = this.buildHeaders(token);
    headers["Cache-Control"] = "no-cache, no-store, must-revalidate";

    const response = await fetch(`${finalBaseURL}${endpoint}`, {
      method: "PATCH",
      headers,
      credentials: "include", // Include cookies
      body: JSON.stringify(body),
      cache: "no-store",
    });

    return this.handleResponse(response, endpoint);
  }

  /**
   * DELETE request
   */
  async delete(endpoint, token = null) {
    const finalBaseURL = this.resolveBaseURL();
    const headers = this.buildHeaders(token);
    headers["Cache-Control"] = "no-cache, no-store, must-revalidate";

    const response = await fetch(`${finalBaseURL}${endpoint}`, {
      method: "DELETE",
      headers,
      credentials: "include", // Include cookies
      cache: "no-store",
    });

    return this.handleResponse(response, endpoint);
  }

  /**
   * Upload file
   */
  async upload(endpoint, formData, token = null) {
    return this.post(endpoint, formData, token, true);
  }

  /**
   * Download file (returns blob)
   */
  async download(endpoint, params = {}, token = null) {
    let finalBaseURL = this.baseURL;
    
    // Handle relative baseURL (like /api/v1) for URL constructor
    if (typeof window !== "undefined" && finalBaseURL.startsWith("/")) {
      finalBaseURL = window.location.origin + finalBaseURL;
    }

    const url = new URL(`${finalBaseURL}${endpoint}`);
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    const authToken = token || this.getToken();
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      credentials: "include", // Include cookies
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    return response.blob();
  }
}

// Create and export singleton instance
const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
