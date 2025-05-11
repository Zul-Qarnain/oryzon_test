import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { User, UserWithIncludes } from "@/backend/services/users/users.types";
import type { UserFilterOptions as UserFilter } from "@/backend/services/users/users.types";

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface UserContextType {
  user: UserWithIncludes | null;
  users: UserWithIncludes[];
  total_user: number;
  user_loading: boolean;
  error_user: string | null;
  fetchUser: (userId: string, options?: { include?: string }) => Promise<void>;
  fetchUsers: (options?: { filter?: UserFilter; pagination?: PaginationOptions; include?: string }) => Promise<void>;
  createUser: (data: Partial<User>) => Promise<UserWithIncludes | null>;
  updateUser: (userId: string, data: Partial<User>) => Promise<UserWithIncludes | null>;
  deleteUser: (userId: string) => Promise<boolean>;
  cleanError_User: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserWithIncludes | null>(null);
  const [users, setUsers] = useState<UserWithIncludes[]>([]);
  const [total_user, setTotalUser] = useState(0);
  const [user_loading, setUserLoading] = useState(false);
  const [error_user, setErrorUser] = useState<string | null>(null);

  // Fetch a single user by ID
  const fetchUser = useCallback(async (userId: string, options?: { include?: string }) => {
    setUserLoading(true);
    setErrorUser(null);
    try {
      const url = `/api/users/${userId}` + (options?.include ? `?include=${options.include}` : "");
      const res = await fetch(url);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(typeof errData.message === "string" ? errData.message : "Failed to fetch user");
      }
      const data: UserWithIncludes = await res.json();
      setUser(data);
    } catch (err) {
      setErrorUser(err instanceof Error ? err.message : String(err));
      setUser(null);
    } finally {
      setUserLoading(false);
    }
  }, []);

  // Fetch users with optional filter, pagination, and includes
  const fetchUsers = useCallback(
    async (options?: { filter?: UserFilter; pagination?: PaginationOptions; include?: string }) => {
      setUserLoading(true);
      setErrorUser(null);
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

        const url = `/api/users${params.toString() ? `?${params.toString()}` : ""}`;
        const res = await fetch(url);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(typeof errData.message === "string" ? errData.message : "Failed to fetch users");
        }
        const data: { data: UserWithIncludes[]; total: number } = await res.json();
        setUsers(data.data || []);
        setTotalUser(data.total || 0);
      } catch (err) {
        setErrorUser(err instanceof Error ? err.message : String(err));
        setUsers([]);
        setTotalUser(0);
      } finally {
        setUserLoading(false);
      }
    },
    []
  );

  // Create a new user
  const createUser = useCallback(async (data: Partial<User>) => {
    setUserLoading(true);
    setErrorUser(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(typeof errData.message === "string" ? errData.message : "Failed to create user");
      }
      const user: UserWithIncludes = await res.json();
      setUser(user);
      return user;
    } catch (err) {
      setErrorUser(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setUserLoading(false);
    }
  }, []);

  // Update a user
  const updateUser = useCallback(async (userId: string, data: Partial<User>) => {
    setUserLoading(true);
    setErrorUser(null);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(typeof errData.message === "string" ? errData.message : "Failed to update user");
      }
      const updated: UserWithIncludes = await res.json();
      setUser(updated);
      return updated;
    } catch (err) {
      setErrorUser(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setUserLoading(false);
    }
  }, []);

  // Delete a user
  const deleteUser = useCallback(async (userId: string) => {
    setUserLoading(true);
    setErrorUser(null);
    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(typeof errData.message === "string" ? errData.message : "Failed to delete user");
      }
      setUser(null);
      return true;
    } catch (err) {
      setErrorUser(err instanceof Error ? err.message : String(err));
      return false;
    } finally {
      setUserLoading(false);
    }
  }, []);

  const cleanError_User = useCallback(() => setErrorUser(null), []);

  return (
    <UserContext.Provider
      value={{
        user,
        users,
        total_user,
        user_loading,
        error_user,
        fetchUser,
        fetchUsers,
        createUser,
        updateUser,
        deleteUser,
        cleanError_User,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export function useUserContext() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUserContext must be used within a UserProvider");
  return ctx;
}
