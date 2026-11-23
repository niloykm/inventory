"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import apiClient from "./api-client";
import { useAuth } from "./auth-context";

const CategoriesContext = createContext(undefined);

export function CategoriesProvider({ children }) {
  const { token } = useAuth();
  const [categories, setCategories] = useState([]);
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCategories = useCallback(async () => {
    if (!token) return;
    if (
      typeof window !== "undefined" &&
      (window.location.pathname === "/login" ||
        window.location.pathname === "/register" ||
        window.location.pathname === "/logout")
    ) {
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.get("/categories?flat=true", {}, token);
      const data = res.categories || res.data || res;
      setCategories(Array.isArray(data) ? data : data || []);
    } catch (err) {
      if (err?.name !== "AbortError" && err?.message !== "Failed to fetch") {
        console.error("[CategoriesProvider] failed to load categories:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadTree = useCallback(async () => {
    if (!token) return;
    if (
      typeof window !== "undefined" &&
      (window.location.pathname === "/login" ||
        window.location.pathname === "/register" ||
        window.location.pathname === "/logout")
    ) {
      return;
    }
    try {
      const res = await apiClient.get("/categories/tree", {}, token);
      const data = res.category_tree || res.data || res;
      setTree(Array.isArray(data) ? data : data || []);
    } catch (err) {
      if (err?.name !== "AbortError" && err?.message !== "Failed to fetch") {
        console.error("[CategoriesProvider] failed to load tree:", err);
      }
    }
  }, [token]);

  useEffect(() => {
    // Load when token becomes available
    if (!token) return;
    loadCategories();
    loadTree();
  }, [token, loadCategories, loadTree]);

  const refresh = useCallback(async () => {
    await Promise.all([loadCategories(), loadTree()]);
  }, [loadCategories, loadTree]);

  const createCategory = useCallback(
    async (payload) => {
      if (!token) throw new Error("Not authenticated");
      const res = await apiClient.post("/categories", payload, token);
      // refresh lists after create
      await refresh();
      return res;
    },
    [token, refresh]
  );

  const updateCategory = useCallback(
    async (id, payload) => {
      if (!token) throw new Error("Not authenticated");
      const res = await apiClient.put(`/categories/${id}`, payload, token);
      await refresh();
      return res;
    },
    [token, refresh]
  );

  const deleteCategory = useCallback(
    async (id) => {
      if (!token) throw new Error("Not authenticated");
      const res = await apiClient.delete(`/categories/${id}`, token);
      await refresh();
      return res;
    },
    [token, refresh]
  );

  return (
    <CategoriesContext.Provider
      value={{
        categories,
        tree,
        loading,
        refresh,
        createCategory,
        updateCategory,
        deleteCategory,
      }}
    >
      {children}
    </CategoriesContext.Provider>
  );
}

export const useCategories = () => {
  const ctx = useContext(CategoriesContext);
  if (!ctx)
    throw new Error("useCategories must be used within CategoriesProvider");
  return ctx;
};
