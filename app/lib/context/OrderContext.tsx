import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Order, OrderWithIncludes } from "@/backend/services/orders/orders.types";
import type { OrderFilterOptions as OrderFilter } from "@/backend/services/orders/orders.types";

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface OrderContextType {
  order: OrderWithIncludes | null;
  orders: OrderWithIncludes[];
  total_order: number;
  order_loading: boolean;
  error_order: string | null;
  fetchOrder: (orderId: string, options?: { include?: string }) => Promise<void>;
  fetchOrders: (options?: { filter?: OrderFilter; pagination?: PaginationOptions; include?: string }) => Promise<void>;
  createOrder: (data: Partial<Order>) => Promise<OrderWithIncludes | null>;
  updateOrder: (orderId: string, data: Partial<Order>) => Promise<OrderWithIncludes | null>;
  deleteOrder: (orderId: string) => Promise<boolean>;
  cleanError_Order: () => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const [order, setOrder] = useState<OrderWithIncludes | null>(null);
  const [orders, setOrders] = useState<OrderWithIncludes[]>([]);
  const [total_order, setTotalOrder] = useState(0);
  const [order_loading, setOrderLoading] = useState(false);
  const [error_order, setErrorOrder] = useState<string | null>(null);

  const fetchOrder = useCallback(async (orderId: string, options?: { include?: string }) => {
    setOrderLoading(true);
    setErrorOrder(null);
    try {
      const url = `/api/orders/${orderId}` + (options?.include ? `?include=${options.include}` : "");
      const res = await fetch(url);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(typeof errData.message === "string" ? errData.message : "Failed to fetch order");
      }
      const data: OrderWithIncludes = await res.json();
      setOrder(data);
    } catch (err) {
      setErrorOrder(err instanceof Error ? err.message : String(err));
      setOrder(null);
    } finally {
      setOrderLoading(false);
    }
  }, []);

  const fetchOrders = useCallback(
    async (options?: { filter?: OrderFilter; pagination?: PaginationOptions; include?: string }) => {
      setOrderLoading(true);
      setErrorOrder(null);
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

        const url = `/api/orders${params.toString() ? `?${params.toString()}` : ""}`;
        const res = await fetch(url);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(typeof errData.message === "string" ? errData.message : "Failed to fetch orders");
        }
        const data: { data: OrderWithIncludes[]; total: number } = await res.json();
        setOrders(data.data || []);
        setTotalOrder(data.total || 0);
      } catch (err) {
        setErrorOrder(err instanceof Error ? err.message : String(err));
        setOrders([]);
        setTotalOrder(0);
      } finally {
        setOrderLoading(false);
      }
    },
    []
  );

  const createOrder = useCallback(async (data: Partial<Order>) => {
    setOrderLoading(true);
    setErrorOrder(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(typeof errData.message === "string" ? errData.message : "Failed to create order");
      }
      const order: OrderWithIncludes = await res.json();
      setOrder(order);
      return order;
    } catch (err) {
      setErrorOrder(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setOrderLoading(false);
    }
  }, []);

  const updateOrder = useCallback(async (orderId: string, data: Partial<Order>) => {
    setOrderLoading(true);
    setErrorOrder(null);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(typeof errData.message === "string" ? errData.message : "Failed to update order");
      }
      const updated: OrderWithIncludes = await res.json();
      setOrder(updated);
      return updated;
    } catch (err) {
      setErrorOrder(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setOrderLoading(false);
    }
  }, []);

  const deleteOrder = useCallback(async (orderId: string) => {
    setOrderLoading(true);
    setErrorOrder(null);
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(typeof errData.message === "string" ? errData.message : "Failed to delete order");
      }
      setOrder(null);
      return true;
    } catch (err) {
      setErrorOrder(err instanceof Error ? err.message : String(err));
      return false;
    } finally {
      setOrderLoading(false);
    }
  }, []);

  const cleanError_Order = useCallback(() => setErrorOrder(null), []);

  return (
    <OrderContext.Provider
      value={{
        order,
        orders,
        total_order,
        order_loading,
        error_order,
        fetchOrder,
        fetchOrders,
        createOrder,
        updateOrder,
        deleteOrder,
        cleanError_Order,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export function useOrderContext() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrderContext must be used within an OrderProvider");
  return ctx;
}
