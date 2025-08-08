"use client";
import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Product, ProductWithIncludes, CreateProductData } from "@/backend/services/products/products.types"; // Added CreateProductData
import type { ProductFilterOptions as ProductFilter } from "@/backend/services/products/products.types";
import { useFetchContext, ApiResponse } from "./FetchContext";
import { useUserContext } from "./UserContext"; // Import useUserContext
import { storage } from "@/app/lib/firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

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
  image_uploading: boolean;
  fetchProduct: (productId: string, options?: { include?: string }) => Promise<ApiResponse<ProductWithIncludes>>;
  fetchProducts: (options?: { filter?: ProductFilter; pagination?: PaginationOptions; include?: string }) => Promise<ApiResponse<{ data: ProductWithIncludes[]; total: number }>>;
  createProduct: (data: Omit<CreateProductData, 'providerUserId'> & { businessId: string }) => Promise<ApiResponse<ProductWithIncludes>>; // Updated createProduct data type
  updateProduct: (productId: string, data: Partial<Product>) => Promise<ApiResponse<ProductWithIncludes>>;
  deleteProduct: (productId: string) => Promise<ApiResponse<null>>;
  uploadImageCallback: (file: File | string, productId?: string) => Promise<{ url: string; imageId: string } | null>;
  cleanError_Product: () => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const { request } = useFetchContext();
  const { FUser } = useUserContext(); // Get FUser from UserContext
  const [product, setProduct] = useState<ProductWithIncludes | null>(null);
  const [products, setProducts] = useState<ProductWithIncludes[]>([]);
  const [total_product, setTotalProduct] = useState(0);
  const [product_loading, setProductLoading] = useState(false);
  const [image_uploading, setImageUploading] = useState(false);
  const [error_product, setErrorProduct] = useState<string | null>(null);

  const fetchProduct = useCallback(async (productId: string, options?: { include?: string }): Promise<ApiResponse<ProductWithIncludes>> => {
    setProductLoading(true);
    setErrorProduct(null);
    const url = `/api/products/${productId}` + (options?.include ? `?include=${options.include}` : "");
    const response = await request<ProductWithIncludes>("GET", url);
    
    if (response.error) {
      setErrorProduct(response.error);
      setProduct(null);
    } else {
      setProduct(response.result);
    }
    setProductLoading(false);
    return response;
  }, [request]);

  const fetchProducts = useCallback(
    async (options?: { filter?: ProductFilter; pagination?: PaginationOptions; include?: string }): Promise<ApiResponse<{ data: ProductWithIncludes[]; total: number }>> => {
      setProductLoading(true);
      setErrorProduct(null);
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
      const response = await request<{ data: ProductWithIncludes[]; total: number }>("GET", url);

      if (response.error) {
        setErrorProduct(response.error);
        setProducts([]);
        setTotalProduct(0);
      } else if (response.result) {
        setProducts(response.result.data || []);
        setTotalProduct(response.result.total || 0);
      }
      setProductLoading(false);
      return response;
    },
    [request]
  );

  const createProduct = useCallback(
    async (data: Omit<CreateProductData, 'providerUserId'> & { businessId: string }): Promise<ApiResponse<ProductWithIncludes>> => {
      setProductLoading(true);
      setErrorProduct(null);

      if (!data.businessId) {
        const errorMsg = "Business ID is required to create a product.";
        setErrorProduct(errorMsg);
        setProductLoading(false);
        return { error: errorMsg, result: null, statusCode: 400 };
      }

      const completeProductData: CreateProductData = {
        ...data, // This includes businessId and other product fields
        providerUserId: FUser?.uid || null, // Set providerUserId from FUser, or null if not available
      };

      const response = await request<ProductWithIncludes>("POST", "/api/products", completeProductData);

      if (response.error) {
        setErrorProduct(response.error);
      } else {
        setProduct(response.result);
        if (response.result) {
          setProducts(prevProducts => [response.result!, ...prevProducts.filter(p => p.productId !== response.result!.productId)]);
          setTotalProduct(prevTotal => prevTotal + 1);
        }
      }
      setProductLoading(false);
      return response;
    },
    [request, FUser]
  );

  const updateProduct = useCallback(async (productId: string, data: Partial<Product>): Promise<ApiResponse<ProductWithIncludes>> => {
    setProductLoading(true);
    setErrorProduct(null);
    const response = await request<ProductWithIncludes>("PUT", `/api/products/${productId}`, data);

    if (response.error) {
      setErrorProduct(response.error);
    } else {
      setProduct(response.result); // Optionally update current product or refetch list
    }
    setProductLoading(false);
    return response;
  }, [request]);

  const deleteProduct = useCallback(async (productId: string): Promise<ApiResponse<null>> => {
    setProductLoading(true);
    setErrorProduct(null);
    const response = await request<null>("DELETE", `/api/products/${productId}`);

    if (response.error) {
      setErrorProduct(response.error);
    } else {
      setProduct(null); // Clear current product if it was deleted
      // Optionally refetch products list
    }
    setProductLoading(false);
    return response;
  }, [request]);

  const cleanError_Product = useCallback(() => setErrorProduct(null), []);

  const uploadImageCallback = useCallback(async (file: File | string, productId?: string): Promise<{ url: string; imageId: string } | null> => {
    // If it's a string (URL), just return it with a generated imageId
    if (typeof file === 'string') {
      const imageId = `url_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      return { url: file, imageId };
    }
    
    // If it's a File, upload it to Firebase Storage
    if (!file) return null;
    
    setImageUploading(true);
    setErrorProduct(null);
    
    try {
      // Generate a unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const imageId = `${timestamp}_${randomString}`;
      const fileName = `${imageId}.${fileExtension}`;
      
      // Create storage reference
      const storageRef = ref(storage, `products/${fileName}`);
      
      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get download URL
      const url = await getDownloadURL(snapshot.ref);
      
      setImageUploading(false);
      return { url, imageId };
    } catch (error) {
      console.error('Error uploading image:', error);
      setErrorProduct('Failed to upload image. Please try again.');
      setImageUploading(false);
      return null;
    }
  }, []);

  return (
    <ProductContext.Provider
      value={{
        product,
        products,
        total_product,
        product_loading,
        image_uploading,
        error_product,
        fetchProduct,
        fetchProducts,
        createProduct,
        updateProduct,
        deleteProduct,
        uploadImageCallback,
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
