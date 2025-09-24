/**
 * GitHub Context Provider for pre-fetching and caching GitHub data
 */
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback, // Import useCallback
} from "react";
import { GitHubRepo } from "@/actions/github-actions";

interface GitHubContextType {
  isAuthenticated: boolean | null;
  repositories: GitHubRepo[];
  isLoading: boolean;
  error: string | null;
  refreshRepositories: () => Promise<void>;
}

const GitHubContext = createContext<GitHubContextType>({
  isAuthenticated: null,
  repositories: [],
  isLoading: true,
  error: null,
  refreshRepositories: async () => {},
});

export const useGitHub = () => useContext(GitHubContext);

interface GitHubProviderProps {
  children: ReactNode;
}

export const GitHubProvider = ({ children }: GitHubProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [repositories, setRepositories] = useState<GitHubRepo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load repositories and authentication status
  const refreshRepositories = useCallback(async () => {
    setIsLoading(true);
    try {
      // Check authentication status via API
      const authResponse = await fetch("/api/github/auth");
      const authData = await authResponse.json();
      const authenticated = authData.isAuthenticated;

      setIsAuthenticated(authenticated);

      if (authenticated) {
        // Fetch repositories via API
        const reposResponse = await fetch("/api/github/repos");
        const reposData = await reposResponse.json();

        if (reposData.status === "success") {
          setRepositories(reposData.repositories);
        } else {
          throw new Error(reposData.message || "Failed to fetch repositories");
        }
      }
    } catch (err) {
      console.error("Error loading GitHub data:", err);
      setError("Failed to load GitHub repositories");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Pre-fetch repositories when component mounts
  useEffect(() => {
    refreshRepositories();
  }, [refreshRepositories]);

  const value = {
    isAuthenticated,
    repositories,
    isLoading,
    error,
    refreshRepositories,
  };

  return (
    <GitHubContext.Provider value={value}>{children}</GitHubContext.Provider>
  );
};
