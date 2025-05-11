import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Product, ProductWithIncludes } from "@/backend/services/products/products.types";
import type { ProductFilterOptions as ProductFilter } from "@/backend/services/products/products.types";

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface ProductContextType {
  product: ProductWithIncludes | null;
  products: ProductWithIncludes[];
  total_product: number;
  product_loading: boolean;
  error_product: string | null;
  fetchProduct: (productId: string, options?: { include?: string }) => Promise<void>;
  fetchProducts: (options?: { filter?: ProductFilter; pagination?: PaginationOptions; include?: string }) => Promise<void>;
  createProduct: (data: Partial<Product>) => Promise<ProductWithIncludes | null>;
  updateProduct: (productId: string, data: Partial<Product>) => Promise<ProductWithIncludes | null>;
  deleteProduct: (productId: string) => Promise<boolean>;
  cleanError_Product: () => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [product, setProduct] = useState<ProductWithIncludes | null>(null);
  const [products, setProducts] = useState<ProductWithIncludes[]>([]);
  const [total_product, setTotalProduct] = useState(0);
  const [product_loading, setProductLoading] = useState(false);
  const [error_product, setErrorProduct] = useState<string | null>(null);

  const fetchProduct = useCallback(async (productId: string, options?: { include?: string }) => {
    setProductLoading(true);
    setErrorProduct(null);
    try {
      const url = `/api/products/${productId}` + (options?.include ? `?include=${options.include}` : "");
      const res = await fetch(url);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(typeof errData.message === "string" ? errData.message : "Failed to fetch product");
      }
      const data: ProductWithIncludes = await res.json();
      setProduct(data);
    } catch (err) {
      setErrorProduct(err instanceof Error ? err.message : String(err));
      setProduct(null);
    } finally {
      setProductLoading(false);
    }
  }, []);

  const fetchProducts = useCallback(
    async (options?: { filter?: ProductFilter; pagination?: PaginationOptions; include?: string }) => {
      setProductLoading(true);
      setErrorProduct(null);
      try {
        const params = new URLSearchParams();
        if (options?.filter) {
          Object.entries(options.filter).forEach(([key, value]) => {
            if (value !== undefined && value !== null) params.append(key, String(value));
          });
        }
        if (options?.pagination) {
          if (options.pagination.limit !== undefined) params.append("limit", String(options.pagination.limit));
          if (options.pagination.offset !== undefined) params.append("offset", String(options.pagination.offset));
        }
        if (options?.include) params.append("include", options.include);

        const url = `/api/products${params.toString() ? `?${params.toString()}` : ""}`;
        const res = await fetch(url);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(typeof errData.message === "string" ? errData.message : "Failed to fetch products");
        }
        const data: { data: ProductWithIncludes[]; total: number } = await res.json();
        setProducts(data.data || []);
        setTotalProduct(data.total || 0);
      } catch (err) {
        setErrorProduct(err instanceof Error ? err.message : String(err));
        setProducts([]);
        setTotalProduct(0);
      } finally {
        setProductLoading(false);
      }
    },
    []
  );

  const createProduct = useCallback(async (data: Partial<Product>) => {
    setProductLoading(true);
    setErrorProduct(null);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(typeof errData.message === "string" ? errData.message : "Failed to create product");
      }
      const product: ProductWithIncludes = await res.json();
      setProduct(product);
      return product;
    } catch (err) {
      setErrorProduct(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setProductLoading(false);
    }
  }, []);

  const updateProduct = useCallback(async (productId: string, data: Partial<Product>) => {
    setProductLoading(true);
    setErrorProduct(null);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(typeof errData.message === "string" ? errData.message : "Failed to update product");
      }
      const updated: ProductWithIncludes = await res.json();
      setProduct(updated);
      return updated;
    } catch (err) {
      setErrorProduct(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setProductLoading(false);
    }
  }, []);

  const deleteProduct = useCallback(async (productId: string) => {
    setProductLoading(true);
    setErrorProduct(null);
    try {
      const res = await fetch(`/api/products/${productId}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(typeof errData.message === "string" ? errData.message : "Failed to delete product");
      }
      setProduct(null);
      return true;
    } catch (err) {
      setErrorProduct(err instanceof Error ? err.message : String(err));
      return false;
    } finally {
      setProductLoading(false);
    }
  }, []);

  const cleanError_Product = useCallback(() => setErrorProduct(null), []);

  return (
    <ProductContext.Provider
      value={{
        product,
        products,
        total_product,
        product_loading,
        error_product,
        fetchProduct,
        fetchProducts,
        createProduct,
        updateProduct,
        deleteProduct,
        cleanError_Product,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export function useProductContext() {
  const ctx = useContext(ProductContext);
  if (!ctx) throw new Error("useProductContext must be used within a ProductProvider");
  return ctx;
}
