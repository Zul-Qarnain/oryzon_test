"use client";
import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Business, BusinessWithRelations, CreateBusinessPayload, UpdateBusinessPayload } from "@/backend/services/businesses/businesses.types";
// Assuming BusinessFilterOptions might be needed later, similar to ChannelFilterOptions
// For now, we can define a placeholder or omit if not immediately used.
// import type { BusinessFilterOptions as BusinessFilter } from "@/backend/services/businesses/businesses.types"; 
import { useFetchContext, ApiResponse } from "./FetchContext";
import { useUserContext } from "./UserContext"; 

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

// Placeholder for BusinessFilter if you define it in businesses.types.ts
export interface BusinessFilter {
  userId?: string;
  providerUserId?: string;
  // Add other filterable fields for businesses here
}

export interface BusinessContextType {
  business: BusinessWithRelations | null;
  businesses: BusinessWithRelations[];
  totalBusinesses: number;
  businessLoading: boolean;
  businessError: string | null;
  fetchBusiness: (businessId: string, options?: { include?: string }) => Promise<ApiResponse<BusinessWithRelations>>;
  fetchBusinesses: (options?: { filter?: BusinessFilter; pagination?: PaginationOptions; include?: string }) => Promise<ApiResponse<BusinessWithRelations[]>>;
  createBusiness: (data: CreateBusinessPayload) => Promise<ApiResponse<BusinessWithRelations>>;
  updateBusiness: (businessId: string, data: UpdateBusinessPayload) => Promise<ApiResponse<BusinessWithRelations>>;
  deleteBusiness: (businessId: string) => Promise<ApiResponse<null>>;
  cleanErrorBusiness: () => void;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider = ({ 
  children, 
  business: initialBusiness = null 
}: { 
  children: ReactNode;
  business?: BusinessWithRelations | null;
}) => {
  const { request } = useFetchContext();
  const { FUser } = useUserContext(); 
  const [business, setBusiness] = useState<BusinessWithRelations | null>(initialBusiness);
  const [businesses, setBusinesses] = useState<BusinessWithRelations[]>([]);
  const [totalBusinesses, setTotalBusinesses] = useState(0);
  const [businessLoading, setBusinessLoading] = useState(false);
  const [businessError, setBusinessError] = useState<string | null>(null);

  const fetchBusiness = useCallback(async (businessId: string, options?: { include?: string }): Promise<ApiResponse<BusinessWithRelations>> => {
    setBusinessLoading(true);
    setBusinessError(null);
    const url = `/api/businesses/${businessId}` + (options?.include ? `?include=${options.include}` : "");
    const response = await request<BusinessWithRelations>("GET", url);

    if (response.error) {
      setBusinessError(response.error);
      setBusiness(null);
    } else {
      setBusiness(response.result);
    }
    setBusinessLoading(false);
    return response;
  }, [request]);

  const fetchBusinesses = useCallback(
    async (options?: { filter?: BusinessFilter; pagination?: PaginationOptions; include?: string }): Promise<ApiResponse<BusinessWithRelations[]>> => {
      setBusinessLoading(true);
      setBusinessError(null);
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

      // Ensure FUser.uid is used for filtering if no specific userId/providerUserId is in filter
      // This depends on your API's design for listing businesses.
      // Typically, an API might default to the authenticated user's businesses.
      // If your GET /api/businesses requires userId or providerUserId, ensure it's added.
      // For example, if !options?.filter?.userId and !options?.filter?.providerUserId and FUser?.uid
      // params.append("providerUserId", FUser.uid); // Or "userId" depending on your API

      const url = `/api/businesses${params.toString() ? `?${params.toString()}` : ""}`;
      console.log("Fetching businesses with URL:", url); // Debugging line
      const response = await request<BusinessWithRelations[]>('GET', url);

      if (response.error) {
        setBusinessError(response.error);
        setBusinesses([]);
        setTotalBusinesses(0);
      } else  {
        setBusinesses(response.result || []);
      }
      setBusinessLoading(false);
      return response;
    },
    [request] // Added FUser to dependencies if used for default filtering
  );

  const createBusiness = useCallback(
    async (data: CreateBusinessPayload): Promise<ApiResponse<BusinessWithRelations>> => {
      setBusinessLoading(true);
      setBusinessError(null);
      
      // Ensure userId is present, and optionally add providerUserId from FUser if not in payload
      const payload: CreateBusinessPayload = {
        ...data,
        providerUserId: data.providerUserId === undefined ? (FUser?.uid || null) : data.providerUserId,
      };
      
      if (!payload.userId) {
         const errorMsg = "User ID is required to create a business.";
         setBusinessError(errorMsg);
         setBusinessLoading(false);
         return { error: errorMsg, result: null, statusCode: 400 };
      }


      const response = await request<BusinessWithRelations>("POST", "/api/businesses", payload);

      if (response.error) {
        setBusinessError(response.error);
      } else {
        // Optionally set current business or refetch list
        if (response.result) {
          setBusinesses(prevBusinesses => [response.result!, ...prevBusinesses.filter(b => b.businessId !== response.result!.businessId)]);
          setTotalBusinesses(prevTotal => prevTotal + 1);
        }
      }
      setBusinessLoading(false);
      return response;
    },
    [request, FUser]
  );

  const updateBusiness = useCallback(async (businessId: string, data: UpdateBusinessPayload): Promise<ApiResponse<BusinessWithRelations>> => {
    setBusinessLoading(true);
    setBusinessError(null);
    const response = await request<BusinessWithRelations>("PUT", `/api/businesses/${businessId}`, data);

    if (response.error) {
      setBusinessError(response.error);
    } else {
      setBusiness(response.result); // Update current business
      // Update in the list of businesses
      if (response.result) {
        setBusinesses(prevBusinesses => 
          prevBusinesses.map(b => b.businessId === businessId ? response.result! : b)
        );
      }
    }
    setBusinessLoading(false);
    return response;
  }, [request]);

  const deleteBusiness = useCallback(async (businessId: string): Promise<ApiResponse<null>> => {
    setBusinessLoading(true);
    setBusinessError(null);
    const response = await request<null>("DELETE", `/api/businesses/${businessId}`);

    if (response.error) {
      setBusinessError(response.error);
    } else {
      setBusiness(null); // Clear current business if it was deleted
      setBusinesses(prevBusinesses => prevBusinesses.filter(b => b.businessId !== businessId));
      setTotalBusinesses(prevTotal => prevTotal -1);
    }
    setBusinessLoading(false);
    return response;
  }, [request]);

  const cleanErrorBusiness = useCallback(() => setBusinessError(null), []);

  return (
    <BusinessContext.Provider
      value={{
        business,
        businesses,
        totalBusinesses,
        businessLoading,
        businessError,
        fetchBusiness,
        fetchBusinesses,
        createBusiness,
        updateBusiness,
        deleteBusiness,
        cleanErrorBusiness,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
};

export function useBusinessContext() {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error("useBusinessContext must be used within a BusinessProvider");
  return ctx;
}
