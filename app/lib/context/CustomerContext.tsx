"use client";
import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Customer, CustomerWithIncludes } from "@/backend/services/customers/customers.types";
import type { CustomerFilterOptions as CustomerFilter } from "@/backend/services/customers/customers.types";
import { useFetchContext, ApiResponse } from "./FetchContext"; // Import useFetchContext and ApiResponse

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface CustomerContextType {
  customer: CustomerWithIncludes | null;
  customers: CustomerWithIncludes[];
  total_customer: number;
  customer_loading: boolean;
  error_customer: string | null;
  fetchCustomer: (customerId: string, options?: { include?: string }) => Promise<ApiResponse<CustomerWithIncludes>>;
  fetchCustomers: (options?: { filter?: CustomerFilter; pagination?: PaginationOptions; include?: string }) => Promise<ApiResponse<{ data: CustomerWithIncludes[]; total: number }>>;
  createCustomer: (data: Partial<Customer>) => Promise<ApiResponse<CustomerWithIncludes>>;
  updateCustomer: (customerId: string, data: Partial<Customer>) => Promise<ApiResponse<CustomerWithIncludes>>;
  deleteCustomer: (customerId: string) => Promise<ApiResponse<null>>;
  cleanError_Customer: () => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider = ({ children }: { children: ReactNode }) => {
  const { request } = useFetchContext(); // Get request from FetchContext
  const [customer, setCustomer] = useState<CustomerWithIncludes | null>(null);
  const [customers, setCustomers] = useState<CustomerWithIncludes[]>([]);
  const [total_customer, setTotalCustomer] = useState(0);
  const [customer_loading, setCustomerLoading] = useState(false);
  const [error_customer, setErrorCustomer] = useState<string | null>(null);

  const fetchCustomer = useCallback(async (customerId: string, options?: { include?: string }): Promise<ApiResponse<CustomerWithIncludes>> => {
    setCustomerLoading(true);
    setErrorCustomer(null);
    const url = `/api/customers/${customerId}` + (options?.include ? `?include=${options.include}` : "");
    const response = await request<CustomerWithIncludes>("GET", url);
    
    if (response.error) {
      setErrorCustomer(response.error);
      setCustomer(null);
    } else {
      setCustomer(response.result);
    }
    setCustomerLoading(false);
    return response;
  }, [request]);

  const fetchCustomers = useCallback(
    async (options?: { filter?: CustomerFilter; pagination?: PaginationOptions; include?: string }): Promise<ApiResponse<{ data: CustomerWithIncludes[]; total: number }>> => {
      setCustomerLoading(true);
      setErrorCustomer(null);
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

      const url = `/api/customers${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await request<{ data: CustomerWithIncludes[]; total: number }>("GET", url);

      if (response.error) {
        setErrorCustomer(response.error);
        setCustomers([]);
        setTotalCustomer(0);
      } else if (response.result) {
        setCustomers(response.result.data || []);
        setTotalCustomer(response.result.total || 0);
      }
      setCustomerLoading(false);
      return response;
    },
    [request]
  );

  const createCustomer = useCallback(async (data: Partial<Customer>): Promise<ApiResponse<CustomerWithIncludes>> => {
    setCustomerLoading(true);
    setErrorCustomer(null);
    const response = await request<CustomerWithIncludes>("POST", "/api/customers", data);

    if (response.error) {
      setErrorCustomer(response.error);
    } else {
      setCustomer(response.result); // Optionally update current customer or refetch list
    }
    setCustomerLoading(false);
    return response;
  }, [request]);

  const updateCustomer = useCallback(async (customerId: string, data: Partial<Customer>): Promise<ApiResponse<CustomerWithIncludes>> => {
    setCustomerLoading(true);
    setErrorCustomer(null);
    const response = await request<CustomerWithIncludes>("PUT", `/api/customers/${customerId}`, data);

    if (response.error) {
      setErrorCustomer(response.error);
    } else {
      setCustomer(response.result); // Optionally update current customer or refetch list
    }
    setCustomerLoading(false);
    return response;
  }, [request]);

  const deleteCustomer = useCallback(async (customerId: string): Promise<ApiResponse<null>> => {
    setCustomerLoading(true);
    setErrorCustomer(null);
    const response = await request<null>("DELETE", `/api/customers/${customerId}`);

    if (response.error) {
      setErrorCustomer(response.error);
    } else {
      setCustomer(null); // Clear current customer if it was deleted
      // Optionally refetch customers list
    }
    setCustomerLoading(false);
    return response;
  }, [request]);

  const cleanError_Customer = useCallback(() => setErrorCustomer(null), []);

  return (
    <CustomerContext.Provider
      value={{
        customer,
        customers,
        total_customer,
        customer_loading,
        error_customer,
        fetchCustomer,
        fetchCustomers,
        createCustomer,
        updateCustomer,
        deleteCustomer,
        cleanError_Customer,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};

export function useCustomerContext() {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error("useCustomerContext must be used within a CustomerProvider");
  return ctx;
}
