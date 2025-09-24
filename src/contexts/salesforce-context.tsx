"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  salesforceService,
  SalesforceConnection,
  SalesforceAuthData,
  SalesforceErrorWithDetail,
} from "@/services/salesforceService";

interface SalesforceContextType {
  connection: SalesforceConnection | null;
  connectionId: string | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  connect: (authData: SalesforceAuthData) => Promise<void>;
  connectWithId: (connectionId: string) => Promise<void>;
  reconnectWithCredentials: (connectionId: string, authData: SalesforceAuthData) => Promise<void>;
  disconnect: () => Promise<void>;
  checkConnection: () => Promise<void>;
}

const SalesforceContext = createContext<SalesforceContextType | undefined>(
  undefined
);

export function SalesforceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [connection, setConnection] = useState<SalesforceConnection | null>(
    null
  );
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastErrorTime, setLastErrorTime] = useState<number | null>(null);

  const isConnected = connection?.success === true && connectionId !== null;

  // Load saved connection from localStorage on mount
  useEffect(() => {
    const savedConnectionId = localStorage.getItem("salesforce_connection_id");
    const savedConnection = localStorage.getItem("salesforce_connection");

    if (savedConnectionId && savedConnection) {
      try {
        setConnectionId(savedConnectionId);
        setConnection(JSON.parse(savedConnection));
      } catch {
        // Clear invalid data
        localStorage.removeItem("salesforce_connection_id");
        localStorage.removeItem("salesforce_connection");
      }
    }
  }, []);

  const connect = async (authData: SalesforceAuthData) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await salesforceService.connectToSalesforce(authData);

      if (result.success) {
        setConnection(result);
        setConnectionId(result.connection_id);

        // Save to localStorage
        localStorage.setItem("salesforce_connection_id", result.connection_id);
        localStorage.setItem("salesforce_connection", JSON.stringify(result));
      } else {
        throw new Error(result.error || "Failed to connect to Salesforce");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to connect";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const connectWithId = async (existingConnectionId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log("🔗 Attempting to connect with connection ID:", existingConnectionId);

      // Try to get the connection status to see if it's still valid
      const status = await salesforceService.getConnectionStatus(existingConnectionId);
      
      console.log("✅ Connection status response:", status);
      
      if (status) {
        // Connection is valid, set it up
        setConnectionId(existingConnectionId);
        setConnection({
          success: true,
          connection_id: existingConnectionId,
          org_info: (status.org_info as Record<string, unknown>) || ({} as Record<string, unknown>),
          user_info: (status.user_info as Record<string, unknown>) || ({} as Record<string, unknown>),
          instance_url: status.instance_url as string,
          version: status.version as string,
          timestamp: new Date().toISOString(),
        });

        // Save to localStorage
        localStorage.setItem("salesforce_connection_id", existingConnectionId);
        localStorage.setItem("salesforce_connection", JSON.stringify({
          success: true,
          connection_id: existingConnectionId,
          org_info: (status.org_info as Record<string, unknown>) || ({} as Record<string, unknown>),
          user_info: (status.user_info as Record<string, unknown>) || ({} as Record<string, unknown>),
          instance_url: status.instance_url,
          version: status.version,
          timestamp: new Date().toISOString(),
        }));

        console.log("🎉 Successfully connected with ID:", existingConnectionId);
      } else {
        console.log("❌ Connection status returned falsy value");
        throw new Error("Connection not found or invalid");
      }
    } catch (err) {
      const error = err as SalesforceErrorWithDetail;
      
      // Clear any existing connection state since there's an error
      setConnection(null);
      setConnectionId(null);
      localStorage.removeItem("salesforce_connection_id");
      localStorage.removeItem("salesforce_connection");
      
      // Check if this is a structured error with reconnection info
      if (error.detail && error.detail.action === "reconnect_required") {
        console.log("📋 Connection expired, reconnection required:", error.detail);
        console.log("🔍 Context - Structured error detected, re-throwing for page to handle");
        
        // Set a more helpful error message that includes reconnection info
        const reconnectInfo = error.detail.reconnect_info;
        const orgName = reconnectInfo?.org_name || "Unknown Organization";
        const lastUsed = reconnectInfo?.last_used 
          ? new Date(reconnectInfo.last_used).toLocaleDateString()
          : "Unknown";
        
        setError(`Your connection to ${orgName} has expired (last used: ${lastUsed}). Please reconnect with your credentials to continue.`);
        
        // Re-throw the structured error so the page can detect it
        throw error;
      } else {
        const errorMessage = error.message || "Failed to connect with existing connection";
        
        // If it's a 404 or connection not found error, provide a more helpful message
        if (errorMessage.includes("404") || errorMessage.includes("Connection not found") || errorMessage.includes("status: 500")) {
          setError("This connection is no longer valid on the server. Please create a new connection or reconnect with your credentials.");
        } else {
          setError(errorMessage);
        }
      }
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (connectionId) {
        await salesforceService.disconnectSalesforce(connectionId);
      }

      // Clear state and localStorage
      setConnection(null);
      setConnectionId(null);
      localStorage.removeItem("salesforce_connection_id");
      localStorage.removeItem("salesforce_connection");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to disconnect";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [connectionId]);

  const checkConnection = useCallback(async () => {
    if (!connectionId) return;

    // Prevent repeated calls if backend is down (wait at least 30 seconds between retries)
    if (lastErrorTime && Date.now() - lastErrorTime < 30000) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const status = await salesforceService.getConnectionStatus(connectionId);

      if (status.is_active) {
        // Update connection info with latest status
        setConnection((prev) => (prev ? { ...prev, ...status } : null));
        setLastErrorTime(null); // Clear error time on success
      } else {
        // Connection is no longer active, clear it
        await disconnect();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to check connection";
      setError(errorMessage);
      setLastErrorTime(Date.now()); // Record error time

      // Only disconnect if it's an authentication error, not a network error
      if (
        errorMessage.includes("401") ||
        errorMessage.includes("Unauthorized")
      ) {
        await disconnect();
      }
    } finally {
      setIsLoading(false);
    }
  }, [connectionId, disconnect, lastErrorTime]);

  const reconnectWithCredentials = async (connectionId: string, authData: SalesforceAuthData) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log("🔄 Reconnecting to Salesforce with connection ID:", connectionId);

      // Use the new reconnect endpoint
      const result = await salesforceService.reconnectSalesforce(connectionId, authData);

      if (result.success) {
        setConnectionId(connectionId);
        setConnection(result);

        // Save to localStorage
        localStorage.setItem("salesforce_connection_id", connectionId);
        localStorage.setItem("salesforce_connection", JSON.stringify(result));

        console.log("🎉 Successfully reconnected with ID:", connectionId);
      } else {
        throw new Error(result.error || "Failed to reconnect to Salesforce");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to reconnect with credentials";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const value: SalesforceContextType = {
    connection,
    connectionId,
    isConnected,
    isLoading,
    error,
    connect,
    connectWithId,
    reconnectWithCredentials,
    disconnect,
    checkConnection,
  };

  return (
    <SalesforceContext.Provider value={value}>
      {children}
    </SalesforceContext.Provider>
  );
}

export function useSalesforce() {
  const context = useContext(SalesforceContext);
  if (context === undefined) {
    throw new Error("useSalesforce must be used within a SalesforceProvider");
  }
  return context;
}
