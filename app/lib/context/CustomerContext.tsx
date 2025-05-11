import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Customer, CustomerWithIncludes } from "@/backend/services/customers/customers.types";
import type { CustomerFilterOptions as CustomerFilter } from "@/backend/services/customers/customers.types";

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
  fetchCustomer: (customerId: string, options?: { include?: string }) => Promise<void>;
  fetchCustomers: (options?: { filter?: CustomerFilter; pagination?: PaginationOptions; include?: string }) => Promise<void>;
  createCustomer: (data: Partial<Customer>) => Promise<CustomerWithIncludes | null>;
  updateCustomer: (customerId: string, data: Partial<Customer>) => Promise<CustomerWithIncludes | null>;
  deleteCustomer: (customerId: string) => Promise<boolean>;
  cleanError_Customer: () => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider = ({ children }: { children: ReactNode }) => {
  const [customer, setCustomer] = useState<CustomerWithIncludes | null>(null);
  const [customers, setCustomers] = useState<CustomerWithIncludes[]>([]);
  const [total_customer, setTotalCustomer] = useState(0);
  const [customer_loading, setCustomerLoading] = useState(false);
  const [error_customer, setErrorCustomer] = useState<string | null>(null);

  const fetchCustomer = useCallback(async (customerId: string, options?: { include?: string }) => {
    setCustomerLoading(true);
    setErrorCustomer(null);
    try {
      const url = `/api/customers/${customerId}` + (options?.include ? `?include=${options.include}` : "");
      const res = await fetch(url);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(typeof errData.message === "string" ? errData.message : "Failed to fetch customer");
      }
      const data: CustomerWithIncludes = await res.json();
      setCustomer(data);
    } catch (err) {
      setErrorCustomer(err instanceof Error ? err.message : String(err));
      setCustomer(null);
    } finally {
      setCustomerLoading(false);
    }
  }, []);

  const fetchCustomers = useCallback(
    async (options?: { filter?: CustomerFilter; pagination?: PaginationOptions; include?: string }) => {
      setCustomerLoading(true);
      setErrorCustomer(null);
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

        const url = `/api/customers${params.toString() ? `?${params.toString()}` : ""}`;
        const res = await fetch(url);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(typeof errData.message === "string" ? errData.message : "Failed to fetch customers");
        }
        const data: { data: CustomerWithIncludes[]; total: number } = await res.json();
        setCustomers(data.data || []);
        setTotalCustomer(data.total || 0);
      } catch (err) {
        setErrorCustomer(err instanceof Error ? err.message : String(err));
        setCustomers([]);
        setTotalCustomer(0);
      } finally {
        setCustomerLoading(false);
      }
    },
    []
  );

  const createCustomer = useCallback(async (data: Partial<Customer>) => {
    setCustomerLoading(true);
    setErrorCustomer(null);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(typeof errData.message === "string" ? errData.message : "Failed to create customer");
      }
      const customer: CustomerWithIncludes = await res.json();
      setCustomer(customer);
      return customer;
    } catch (err) {
      setErrorCustomer(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setCustomerLoading(false);
    }
  }, []);

  const updateCustomer = useCallback(async (customerId: string, data: Partial<Customer>) => {
    setCustomerLoading(true);
    setErrorCustomer(null);
    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(typeof errData.message === "string" ? errData.message : "Failed to update customer");
      }
      const updated: CustomerWithIncludes = await res.json();
      setCustomer(updated);
      return updated;
    } catch (err) {
      setErrorCustomer(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setCustomerLoading(false);
    }
  }, []);

  const deleteCustomer = useCallback(async (customerId: string) => {
    setCustomerLoading(true);
    setErrorCustomer(null);
    try {
      const res = await fetch(`/api/customers/${customerId}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(typeof errData.message === "string" ? errData.message : "Failed to delete customer");
      }
      setCustomer(null);
      return true;
    } catch (err) {
      setErrorCustomer(err instanceof Error ? err.message : String(err));
      return false;
    } finally {
      setCustomerLoading(false);
    }
  }, []);

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
