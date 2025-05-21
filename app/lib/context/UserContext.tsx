"use client";
import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { User as DbUser, UserWithIncludes, CreateUserData } from "@/backend/services/users/users.types";
import type { UserFilterOptions as UserFilter } from "@/backend/services/users/users.types";
import { auth } from '@/app/lib/firebase';
import { useFetchContext, ApiResponse } from "./FetchContext"; // Import useFetchContext and ApiResponse
import {
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  UserCredential,
  getIdToken
} from 'firebase/auth';
import { loginProviderEnum } from "@/db/schema";

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
  fetchUser: (userId: string, options?: { include?: string }) => Promise<ApiResponse<UserWithIncludes>>;
  fetchUsers: (options?: { filter?: UserFilter; pagination?: PaginationOptions; include?: string }) => Promise<ApiResponse<{ data: UserWithIncludes[]; total: number }>>;
  createUser: (data: Partial<DbUser>) => Promise<ApiResponse<UserWithIncludes>>;
  updateUser: (userId: string, data: Partial<DbUser>) => Promise<ApiResponse<UserWithIncludes>>;
  deleteUser: (userId: string) => Promise<ApiResponse<null>>; // Null for successful deletion with 204
  cleanError_User: () => void;
  loginWithEmail: (email: string, password: string) => Promise<FirebaseUser | null>;
  signUpWithEmail: (email: string, password: string, businessName: string) => Promise<FirebaseUser | null>;
  loginWithGoogle: () => Promise<FirebaseUser | null>;
  signUpWithGoogle: (businessName: string) => Promise<FirebaseUser | null>;
  loginWithFacebook: () => Promise<FirebaseUser | null>;
  signUpWithFacebook: (businessName: string) => Promise<FirebaseUser | null>;
  logoutUser: () => Promise<void>;
  currentFirebaseUser: FirebaseUser | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { request, setFirebaseToken } = useFetchContext(); // Get request and setFirebaseToken from FetchContext
  const [user, setUser] = useState<UserWithIncludes | null>(null);
  const [currentFirebaseUser, setCurrentFirebaseUser] = useState<FirebaseUser | null>(null);
  const [users, setUsers] = useState<UserWithIncludes[]>([]);
  const [total_user, setTotalUser] = useState(0);
  const [user_loading, setUserLoading] = useState(false); // This can be driven by FetchContext's loading if preferred
  const [error_user, setErrorUser] = useState<string | null>(null);

  useEffect(() => {
    setUserLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setCurrentFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const token = await getIdToken(fbUser);
          setFirebaseToken(token); // Set token in FetchContext
          // Optionally, sync user with backend here or let components trigger it
          console.log("Firebase user detected, token set:", fbUser.uid);
          // Example: await syncUserWithBackend(fbUser, 'LOGIN', fbUser.providerData[0]?.providerId as any || 'EMAIL');
        } catch (error) {
          console.error("Error getting Firebase token:", error);
          setFirebaseToken(null);
          setUser(null);
        }
      } else {
        setFirebaseToken(null); // Clear token in FetchContext
        setUser(null);
      }
      setUserLoading(false);
    });
    return () => unsubscribe();
  }, [setFirebaseToken]);

  const fetchUser = useCallback(async (userId: string, options?: { include?: string }): Promise<ApiResponse<UserWithIncludes>> => {
    setUserLoading(true);
    setErrorUser(null);
    const includeQuery = options?.include ? `?include=${options.include}` : "";
    const response = await request<UserWithIncludes>("GET", `/api/users/${userId}${includeQuery}`);
    if (response.error) {
      setErrorUser(response.error);
      setUser(null);
    } else {
      setUser(response.result);
    }
    setUserLoading(false);
    return response;
  }, [request]);

  const fetchUsers = useCallback(async (options?: { filter?: UserFilter; pagination?: PaginationOptions; include?: string }): Promise<ApiResponse<{ data: UserWithIncludes[]; total: number }>> => {
    setUserLoading(true);
    setErrorUser(null);
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
    
    const response = await request<{ data: UserWithIncludes[]; total: number }>("GET", url);

    if (response.error) {
      setErrorUser(response.error);
      setUsers([]);
      setTotalUser(0);
    } else if (response.result) {
      setUsers(response.result.data || []);
      setTotalUser(response.result.total || 0);
    }
    setUserLoading(false);
    return response;
  }, [request]);

  const createUser = useCallback(async (data: Partial<DbUser>): Promise<ApiResponse<UserWithIncludes>> => {
    setUserLoading(true);
    setErrorUser(null);
    const response = await request<UserWithIncludes>("POST", "/api/users", data);
    if (response.error) {
      setErrorUser(response.error);
    } else {
      setUser(response.result); // Set the created user as the current user
    }
    setUserLoading(false);
    return response;
  }, [request]);

  const updateUser = useCallback(async (userId: string, data: Partial<DbUser>): Promise<ApiResponse<UserWithIncludes>> => {
    setUserLoading(true);
    setErrorUser(null);
    const response = await request<UserWithIncludes>("PUT", `/api/users/${userId}`, data);
    if (response.error) {
      setErrorUser(response.error);
    } else {
      setUser(response.result); // Update current user if it's the one being updated
    }
    setUserLoading(false);
    return response;
  }, [request]);

  const deleteUser = useCallback(async (userId: string): Promise<ApiResponse<null>> => {
    setUserLoading(true);
    setErrorUser(null);
    const response = await request<null>("DELETE", `/api/users/${userId}`);
    if (response.error) {
      setErrorUser(response.error);
    } else {
      setUser(null); // Clear user if the current user was deleted
    }
    setUserLoading(false);
    return response;
  }, [request]);

  const cleanError_User = useCallback(() => setErrorUser(null), []);

  const syncUserWithBackend = async (
    firebaseUser: FirebaseUser,
    operation: 'LOGIN' | 'SIGNUP',
    provider: typeof loginProviderEnum.enumValues[number],
    businessName?: string
  ): Promise<UserWithIncludes | null> => {
    setUserLoading(true);
    setErrorUser(null);
    try {
      let filterParams = `filter[providerUserId]=${firebaseUser.uid}&filter[loginProvider]=${provider}`;
      if (provider === 'EMAIL' && firebaseUser.email) {
        filterParams = `filter[email]=${firebaseUser.email}&filter[loginProvider]=EMAIL`;
      }
      
      const findResp = await request<{ data: UserWithIncludes[]; total: number }>("GET", `/api/users?${filterParams}`);

      let existingUser: UserWithIncludes | null = null;
      if (findResp.result && findResp.result.total > 0 && findResp.result.data[0]) {
        existingUser = findResp.result.data[0];
      } else if (findResp.error && findResp.statusCode !== 404) { // Allow 404 for user not found
         throw new Error(findResp.error || "Failed to check existing user");
      }


      if (existingUser) {
        setUser(existingUser);
        setCurrentFirebaseUser(firebaseUser);
        return existingUser;
      } else if (operation === 'SIGNUP' || (operation === 'LOGIN' && provider !== 'EMAIL')) {
        const userData: CreateUserData = {
          name: firebaseUser.displayName || 'Default Name',
          phone: firebaseUser.phoneNumber || undefined,
          email: firebaseUser.email || undefined,
          providerUserId: firebaseUser.uid,
          loginProvider: provider,
          businessName: businessName || firebaseUser.displayName || 'Default Business',
        };
        if (provider === 'EMAIL' && !businessName) {
          throw new Error("Business name is required for email sign up.");
        }
        
        const createResp = await request<UserWithIncludes>("POST", "/api/users", userData);

        if (createResp.error || !createResp.result) {
          throw new Error(createResp.error || "Failed to create user in backend");
        }
        setUser(createResp.result);
        setCurrentFirebaseUser(firebaseUser);
        return createResp.result;
      } else if (operation === 'LOGIN' && provider === 'EMAIL' && !existingUser) {
        throw new Error("User not found with this email. Please sign up or try a different login method.");
      }
      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setErrorUser(message);
      await signOut(auth).catch(e => console.error("Firebase signout failed during error handling:", e));
      setCurrentFirebaseUser(null);
      setFirebaseToken(null);
      setUser(null);
      return null;
    } finally {
      setUserLoading(false);
    }
  };

  const loginWithEmail = async (email: string, password: string): Promise<FirebaseUser | null> => {
    setUserLoading(true);
    setErrorUser(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await syncUserWithBackend(userCredential.user, 'LOGIN', 'EMAIL');
      return userCredential.user;
    } catch (err) {
      setErrorUser(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setUserLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string, businessName: string): Promise<FirebaseUser | null> => {
    setUserLoading(true);
    setErrorUser(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await syncUserWithBackend(userCredential.user, 'SIGNUP', 'EMAIL', businessName);
      return userCredential.user;
    } catch (err) {
      setErrorUser(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setUserLoading(false);
    }
  };

  const handleOAuthSignIn = async (providerInstance: GoogleAuthProvider | FacebookAuthProvider, providerName: typeof loginProviderEnum.enumValues[number], operation: 'LOGIN' | 'SIGNUP', businessName?: string): Promise<FirebaseUser | null> => {
    setUserLoading(true);
    setErrorUser(null);
    try {
      const result: UserCredential = await signInWithPopup(auth, providerInstance);
      await syncUserWithBackend(result.user, operation, providerName, businessName);
      return result.user;
    } catch (err) {
      setErrorUser(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setUserLoading(false);
    }
  };

  const loginWithGoogle = () => handleOAuthSignIn(new GoogleAuthProvider(), 'GOOGLE', 'LOGIN');
  const signUpWithGoogle = (businessName: string) => handleOAuthSignIn(new GoogleAuthProvider(), 'GOOGLE', 'SIGNUP', businessName);
  const loginWithFacebook = () => handleOAuthSignIn(new FacebookAuthProvider(), 'FACEBOOK', 'LOGIN');
  const signUpWithFacebook = (businessName: string) => handleOAuthSignIn(new FacebookAuthProvider(), 'FACEBOOK', 'SIGNUP', businessName);

  const logoutUser = async () => {
    setUserLoading(true);
    setErrorUser(null);
    try {
      await signOut(auth);
      setUser(null);
      setCurrentFirebaseUser(null);
      setFirebaseToken(null); // Clear token in FetchContext
    } catch (err) {
      setErrorUser(err instanceof Error ? err.message : String(err));
    } finally {
      setUserLoading(false);
    }
  };

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
        loginWithEmail,
        signUpWithEmail,
        loginWithGoogle,
        signUpWithGoogle,
        loginWithFacebook,
        signUpWithFacebook,
        logoutUser,
        currentFirebaseUser,
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
