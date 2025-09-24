"use client";

import { urls } from "@/constants/constants";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useMemo,
} from "react";

type User = {
  _id: string;
  email: string;
};

type UserContextType = {
  userSession: User | null;
  userLoading: boolean;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserSession = ({ children }: { children: ReactNode }) => {
  const [userSession, setUserSession] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(urls.userSession);
        if (!res.ok) throw new Error("Failed to fetch user");

        const data = await res.json();
        setUserSession(data);
      } catch (error) {
        setUserSession(null);
        console.log("Error setting user context:", error);
      } finally {
        setUserLoading(false);
      }
    };

    fetchUser();
  }, []);

  const contextValue = useMemo<UserContextType>(
    () => ({
      userSession,
      userLoading,
    }),
    [userSession, userLoading]
  );
  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
};

export const useUserSession = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserSession must be used within a UserSession");
  }
  return context;
};
