"use client";
import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Order, OrderWithIncludes, CreateOrderData, CreateOrderItemData, UpdateOrderData } from "@/backend/services/orders/orders.types"; // Consolidated imports
import type { OrderFilterOptions as OrderFilter } from "@/backend/services/orders/orders.types";
import { useFetchContext, ApiResponse } from "./FetchContext";
import { useUserContext } from "./UserContext";

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
  fetchOrder: (orderId: string, options?: { include?: string }) => Promise<ApiResponse<OrderWithIncludes>>;
  fetchOrders: (options?: { filter?: OrderFilter; pagination?: PaginationOptions; include?: string }) => Promise<ApiResponse<{ data: OrderWithIncludes[]; total: number }>>;
  createOrder: (data: Omit<CreateOrderData, 'providerUserId'> & { businessId: string; customerId: string; channelId: string; totalAmount: string; currency: string; orderItems: CreateOrderItemData[] }) => Promise<ApiResponse<OrderWithIncludes>>;
  updateOrder: (orderId: string, data: UpdateOrderData) => Promise<ApiResponse<OrderWithIncludes>>; // Changed to UpdateOrderData
  deleteOrder: (orderId: string) => Promise<ApiResponse<null>>;
  cleanError_Order: () => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider = ({ 
  children, 
  order: initialOrder = null 
}: { 
  children: ReactNode;
  order?: OrderWithIncludes | null;
}) => {
  const { request } = useFetchContext();
  const { FUser } = useUserContext(); // Get FUser from UserContext
  const [order, setOrder] = useState<OrderWithIncludes | null>(initialOrder);
  const [orders, setOrders] = useState<OrderWithIncludes[]>([]);
  const [total_order, setTotalOrder] = useState(0);
  const [order_loading, setOrderLoading] = useState(false);
  const [error_order, setErrorOrder] = useState<string | null>(null);

  const fetchOrder = useCallback(async (orderId: string, options?: { include?: string }): Promise<ApiResponse<OrderWithIncludes>> => {
    setOrderLoading(true);
    setErrorOrder(null);
    const url = `/api/orders/${orderId}` + (options?.include ? `?include=${options.include}` : "");
    const response = await request<OrderWithIncludes>("GET", url);

    if (response.error) {
      setErrorOrder(response.error);
      setOrder(null);
    } else {
      setOrder(response.result);
    }
    setOrderLoading(false);
    return response;
  }, [request]);

  const fetchOrders = useCallback(
    async (options?: { filter?: OrderFilter; pagination?: PaginationOptions; include?: string }): Promise<ApiResponse<{ data: OrderWithIncludes[]; total: number }>> => {
      setOrderLoading(true);
      setErrorOrder(null);
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
      console.log("Fetching orders with URL:", url); // Debugging line
      const response = await request<{ data: OrderWithIncludes[]; total: number }>("GET", url);

      if (response.error) {
        setErrorOrder(response.error);
        setOrders([]);
        setTotalOrder(0);
      } else if (response.result) {
        setOrders(response.result.data || []);
        setTotalOrder(response.result.total || 0);
      }
      setOrderLoading(false);
      return response;
    },
    [request]
  );

  const createOrder = useCallback(
    async (data: Omit<CreateOrderData, 'providerUserId'> & { businessId: string; customerId: string; channelId: string; totalAmount: string; currency: string; orderItems: CreateOrderItemData[] }): Promise<ApiResponse<OrderWithIncludes>> => {
      setOrderLoading(true);
      setErrorOrder(null);

      if (!data.businessId || !data.customerId || !data.channelId || !data.totalAmount || !data.currency || !data.orderItems || data.orderItems.length === 0) {
        const errorMsg = "businessId, customerId, channelId, totalAmount, currency, and at least one orderItem are required.";
        setErrorOrder(errorMsg);
        setOrderLoading(false);
        return { error: errorMsg, result: null, statusCode: 400 };
      }

      const completeOrderData: CreateOrderData = {
        ...data,
        providerUserId: FUser?.uid || null, // Set providerUserId from FUser, or null if not available
      };

      const response = await request<OrderWithIncludes>("POST", "/api/orders", completeOrderData);

      if (response.error) {
        setErrorOrder(response.error);
      } else {
        setOrder(response.result);
        if (response.result) {
          setOrders(prevOrders => [response.result!, ...prevOrders.filter(o => o.orderId !== response.result!.orderId)]);
          setTotalOrder(prevTotal => prevTotal + 1);
        }
      }
      setOrderLoading(false);
      return response;
    },
    [request, FUser]
  );

  const updateOrder = useCallback(async (orderId: string, data: UpdateOrderData): Promise<ApiResponse<OrderWithIncludes>> => {
    setOrderLoading(true);
    setErrorOrder(null);
    const response = await request<OrderWithIncludes>("PUT", `/api/orders/${orderId}`, data);

    if (response.error) {
      setErrorOrder(response.error);
    } else {
      setOrder(response.result); // Optionally update current order or refetch list
    }
    setOrderLoading(false);
    return response;
  }, [request]);

  const deleteOrder = useCallback(async (orderId: string): Promise<ApiResponse<null>> => {
    setOrderLoading(true);
    setErrorOrder(null);
    const response = await request<null>("DELETE", `/api/orders/${orderId}`);

    if (response.error) {
      setErrorOrder(response.error);
    } else {
      setOrder(null); // Clear current order if it was deleted
      // Optionally refetch orders list
    }
    setOrderLoading(false);
    return response;
  }, [request]);

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
