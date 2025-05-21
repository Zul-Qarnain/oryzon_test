"use client";
import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react"; // Added useEffect
import { User as DbUser, UserWithIncludes, CreateUserData } from "@/backend/services/users/users.types"; // Renamed User to DbUser, added CreateUserData
import type { UserFilterOptions as UserFilter } from "@/backend/services/users/users.types";
import { auth } from '@/app/lib/firebase'; // Firebase app instance
import {
  User as FirebaseUser, // Firebase Auth User
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  UserCredential
} from 'firebase/auth';
import { loginProviderEnum } from "@/db/schema"; // Import the enum

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
  createUser: (data: Partial<DbUser>) => Promise<UserWithIncludes | null>; // Changed User to DbUser
  updateUser: (userId: string, data: Partial<DbUser>) => Promise<UserWithIncludes | null>; // Changed User to DbUser
  deleteUser: (userId: string) => Promise<boolean>;
  cleanError_User: () => void;
  // Firebase Auth methods
  loginWithEmail: (email: string, password: string) => Promise<FirebaseUser | null>;
  signUpWithEmail: (email: string, password: string, businessName: string) => Promise<FirebaseUser | null>;
  loginWithGoogle: () => Promise<FirebaseUser | null>;
  signUpWithGoogle: (businessName: string) => Promise<FirebaseUser | null>;
  loginWithFacebook: () => Promise<FirebaseUser | null>;
  signUpWithFacebook: (businessName: string) => Promise<FirebaseUser | null>;
  logoutUser: () => Promise<void>;
  currentFirebaseUser: FirebaseUser | null; // To store the current Firebase auth user
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserWithIncludes | null>(null); // This is our backend user
  const [currentFirebaseUser, setCurrentFirebaseUser] = useState<FirebaseUser | null>(null); // Firebase auth user
  const [users, setUsers] = useState<UserWithIncludes[]>([]);
  const [total_user, setTotalUser] = useState(0);
  const [user_loading, setUserLoading] = useState(false);
  const [error_user, setErrorUser] = useState<string | null>(null);

  // Effect to listen for Firebase auth state changes
  useEffect(() => {
    setUserLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setCurrentFirebaseUser(fbUser);
      if (fbUser) {
        // User is signed in to Firebase.
        // Attempt to fetch/create user in our backend.
        // This logic will be more fleshed out with syncUserWithBackend.
        console.log("Firebase user detected:", fbUser.uid, fbUser.email);
        // Example: try to fetch existing user by email or providerId
        // await syncUserWithBackend(fbUser, 'LOGIN', fbUser.providerData[0]?.providerId || 'email');
      } else {
        // User is signed out from Firebase.
        setUser(null); // Clear our backend user state
      }
      setUserLoading(false);
    });
    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

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
  const createUser = useCallback(async (data: Partial<DbUser>) => { // Changed User to DbUser
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
  const updateUser = useCallback(async (userId: string, data: Partial<DbUser>) => { // Changed User to DbUser
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

  // Helper function to sync Firebase user with backend
  const syncUserWithBackend = async (
    firebaseUser: FirebaseUser,
    operation: 'LOGIN' | 'SIGNUP',
    provider: typeof loginProviderEnum.enumValues[number],
    businessName?: string
  ): Promise<UserWithIncludes | null> => {
    setUserLoading(true);
    setErrorUser(null);
    try {
      // Try to fetch user by providerUserId first (more reliable for OAuth)
      // Or by email if it's an email/password login
      let existingUser: UserWithIncludes | null = null;
      const userApiUrl = `/api/users?filter[providerUserId]=${firebaseUser.uid}&filter[loginProvider]=${provider}`;
      
      if (provider !== 'EMAIL') {
        const findRes = await fetch(userApiUrl);
        if (findRes.ok) {
          const findData: { data: UserWithIncludes[]; total: number } = await findRes.json();
          if (findData.total > 0 && findData.data[0]) {
            existingUser = findData.data[0];
          }
        }
      } else if (firebaseUser.email) {
         const findByEmailUrl = `/api/users?filter[email]=${firebaseUser.email}&filter[loginProvider]=EMAIL`;
         const findRes = await fetch(findByEmailUrl);
         if (findRes.ok) {
          const findData: { data: UserWithIncludes[]; total: number } = await findRes.json();
          if (findData.total > 0 && findData.data[0]) {
            existingUser = findData.data[0];
          }
        }
      }


      if (existingUser) {
        // User exists, update if necessary (e.g., last login, email verification status)
        // For now, just set the user state
        setUser(existingUser);
        setCurrentFirebaseUser(firebaseUser); // ensure currentFirebaseUser is also set
        return existingUser;
      } else if (operation === 'SIGNUP' || (operation === 'LOGIN' && provider !== 'EMAIL')) {
        // User does not exist, create them if it's a signup or a first-time OAuth login
        const userData: CreateUserData = {
          userId: firebaseUser.uid,
          name: firebaseUser.displayName || 'Default Name', // Use displayName if available
          phone: firebaseUser.phoneNumber || undefined, // phoneNumber might be null for some providers initially
          email: firebaseUser.email || undefined, // email might be null for some providers initially
          providerUserId: firebaseUser.uid,
          loginProvider: provider,
          businessName: businessName || firebaseUser.displayName || 'Default Business', // Use businessName if provided
        };
        if (provider === 'EMAIL' && !businessName) {
          throw new Error("Business name is required for email sign up.");
        }
        const createRes = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        });
        if (!createRes.ok) {
          const errData = await createRes.json().catch(() => ({}));
          throw new Error(typeof errData.message === "string" ? errData.message : "Failed to create user in backend");
        }
        const newDbUser: UserWithIncludes = await createRes.json();
        setUser(newDbUser);
        setCurrentFirebaseUser(firebaseUser);
        return newDbUser;
      } else if (operation === 'LOGIN' && provider === 'EMAIL' && !existingUser) {
        // Email login attempt but user not found in our DB
        throw new Error("User not found with this email. Please sign up or try a different login method.");
      }
      return null;
    } catch (err) {
      setErrorUser(err instanceof Error ? err.message : String(err));
      // If backend sync fails, sign out from Firebase to maintain consistency
      await signOut(auth).catch(e => console.error("Firebase signout failed during error handling:", e));
      setCurrentFirebaseUser(null);
      setUser(null);
      return null;
    } finally {
      setUserLoading(false);
    }
  };


  // Firebase Auth Methods Implementation
  const loginWithEmail = async (email: string, password: string): Promise<FirebaseUser | null> => {
    setUserLoading(true);
    setErrorUser(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await syncUserWithBackend(userCredential.user, 'LOGIN', 'EMAIL');
      return userCredential.user;
    } catch (err) {
      if (err instanceof Error) {
        setErrorUser(err.message);
      } else {
        setErrorUser("Failed to login with email");
      }
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
      if (err instanceof Error) {
        setErrorUser(err.message);
      } else {
        setErrorUser("Failed to sign up with email");
      }
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
      if (err instanceof Error) {
        setErrorUser(err.message);
      } else {
        setErrorUser(`Failed to sign in with ${providerName}`);
      }
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
      setUser(null); // Clear backend user
      setCurrentFirebaseUser(null); // Clear Firebase user
    } catch (err) {
      if (err instanceof Error) {
        setErrorUser(err.message);
      } else {
        setErrorUser("Logout failed");
      }
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
        // Firebase methods
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
