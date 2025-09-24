"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import SalesforceExplorer from "@/components/salesforce/SalesforceExplorer";
import { SalesforceConnectionManager } from "@/components/salesforce/SalesforceConnectionManager";
import { SalesforceReconnectDialog } from "@/components/salesforce/SalesforceReconnectDialog";
import { useSalesforce } from "@/contexts/salesforce-context";
import { 
  getUserSalesforceConnections, 
  getSalesforceConnection,
  updateConnectionLastUsed,
  type ProcessedSalesforceConnection 
} from "@/actions/salesforce-connection-actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { SalesforceAuthData, SalesforceErrorWithDetail } from "@/services/salesforceService";

export default function SalesforcePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { connectWithId, reconnectWithCredentials } = useSalesforce();
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<
    ProcessedSalesforceConnection[]
  >([]);
  const [selectedConnection, setSelectedConnection] =
    useState<ProcessedSalesforceConnection | null>(null);
  const [showConnectionManager, setShowConnectionManager] = useState(false);
  const [connectingToSalesforce, setConnectingToSalesforce] = useState(false);
  const [showReconnectDialog, setShowReconnectDialog] = useState(false);
  const [connectionToReconnect, setConnectionToReconnect] = 
    useState<ProcessedSalesforceConnection | null>(null);

  // Extract connectionId to avoid useSearchParams causing infinite re-renders
  const connectionId = searchParams.get("connectionId");

  useEffect(() => {
    const initializeConnections = async () => {
      if (!session?.user?.email) {
        setLoading(false);
        return;
      }

      try {
        // Check if a specific connection is requested
        if (connectionId) {
          // Load specific connection but don't auto-connect
          const result = await getSalesforceConnection(
            connectionId,
            session.user.email
          );
          if (result.success && result.connection) {
            setConnections([result.connection]);
            // Show connection manager - let user decide to connect
            setShowConnectionManager(true);
            setLoading(false);
            return;
          }
        }

        // Load all connections
        const result = await getUserSalesforceConnections(session.user.email);
        if (result.success && result.connections) {
          setConnections(result.connections);

          // Always show connection manager - let user choose which connection to use
          setShowConnectionManager(true);
        } else {
          // No connections, show connection manager
          setShowConnectionManager(true);
        }
      } catch (error) {
        console.error("Error loading connections:", error);
        setShowConnectionManager(true);
      } finally {
        setLoading(false);
      }
    };

    initializeConnections();
  }, [session?.user?.email, connectionId]);

  const handleConnectionSelect = async (
    connection: ProcessedSalesforceConnection
  ) => {
    try {
      setConnectingToSalesforce(true);
      
      // Try to connect with the existing connection ID FIRST
      await connectWithId(connection.connectionId);
      
      // Only set selectedConnection AFTER successful connection
      setSelectedConnection(connection);
      
      // Update last used timestamp
      if (session?.user?.email) {
        await updateConnectionLastUsed(connection.connectionId, session.user.email);
      }
      
      setShowConnectionManager(false);
    } catch (error) {
      console.error("Error connecting to Salesforce:", error);
      
      // Check if this is a structured error requiring reconnection
      const structuredError = error as SalesforceErrorWithDetail;
      if (structuredError.detail && structuredError.detail.action === "reconnect_required") {
        console.log("🔄 Connection requires reconnection, showing dialog");
        console.log("🔍 Manual connection - Error detail:", structuredError.detail);
        console.log("🔍 Manual connection - Setting connectionToReconnect:", connection);
        console.log("🔍 Manual connection - Setting showReconnectDialog to true");
        
        // Show the reconnect dialog for this connection
        setConnectionToReconnect(connection);
        setShowReconnectDialog(true);
      } else {
        console.log("❌ Manual connection - Error is not a structured reconnect error:", structuredError);
      }
    } finally {
      // Always reset connecting state
      setConnectingToSalesforce(false);
    }
  };

  const handleReconnect = async (connectionId: string, authData: SalesforceAuthData) => {
    try {
      setConnectingToSalesforce(true);
      
      // Use the reconnect endpoint
      await reconnectWithCredentials(connectionId, authData);
      
      // Update last used timestamp
      if (session?.user?.email) {
        await updateConnectionLastUsed(connectionId, session.user.email);
      }
      
      // Close dialogs
      setShowReconnectDialog(false);
      setConnectionToReconnect(null);
      setShowConnectionManager(false);
      
      // Set the selected connection to show the explorer
      const reconnectedConnection = connectionToReconnect;
      if (reconnectedConnection) {
        setSelectedConnection(reconnectedConnection);
      }
      
      // Reload connections to update their status
      loadConnections();
    } catch (error) {
      console.error("Error reconnecting to Salesforce:", error);
      throw error; // Let the dialog handle the error display
    } finally {
      setConnectingToSalesforce(false);
    }
  };

  const loadConnections = async () => {
    if (!session?.user?.email) {
      setLoading(false);
      return;
    }

    try {
      const result = await getUserSalesforceConnections(session.user.email);
      if (result.success && result.connections) {
        setConnections(result.connections);
      }
    } catch (error) {
      console.error("Error loading connections:", error);
    }
  };

  const handleBackToConnections = () => {
    setSelectedConnection(null);
    setShowConnectionManager(true);
    // Remove connectionId from URL
    router.replace("/salesforce");
  };

  if (loading || connectingToSalesforce) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">
          {loading ? "Loading..." : "Connecting to Salesforce..."}
        </span>
      </div>
    );
  }

  // Show connection manager if no connection is selected or explicitly requested
  if (
    showConnectionManager ||
    (!selectedConnection && connections.length !== 1)
  ) {
    return (
      <div className="container mx-auto py-6">
        <SalesforceConnectionManager
          onConnectionSelect={handleConnectionSelect}
        />
        
        {/* Reconnect Dialog */}
        <SalesforceReconnectDialog
          connection={connectionToReconnect}
          open={showReconnectDialog}
          onOpenChange={setShowReconnectDialog}
          onReconnect={handleReconnect}
        />
      </div>
    );
  }

  // Show Salesforce Explorer with selected connection
  if (selectedConnection) {
    return (
      <div className="space-y-4">
        {/* Connection Header */}
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToConnections}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Connections
              </Button>
              <div>
                <h2 className="font-semibold">{selectedConnection.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedConnection.orgName} • {selectedConnection.userName}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">Connection ID</p>
              <p className="text-sm text-muted-foreground font-mono">
                {selectedConnection.connectionId}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Salesforce Explorer */}
        <SalesforceExplorer />
      </div>
    );
  }

  // Fallback - should not reach here
  return (
    <div className="container mx-auto py-6">
      <SalesforceConnectionManager
        onConnectionSelect={handleConnectionSelect}
      />
      
      {/* Reconnect Dialog */}
      <SalesforceReconnectDialog
        connection={connectionToReconnect}
        open={showReconnectDialog}
        onOpenChange={setShowReconnectDialog}
        onReconnect={handleReconnect}
      />
    </div>
  );
}
