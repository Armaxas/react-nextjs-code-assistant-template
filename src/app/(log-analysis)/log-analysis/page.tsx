"use client";

import { SalesforceConnectionManager } from "@/components/salesforce/SalesforceConnectionManager";
import { LogAnalysisInterface } from "@/components/log-analysis/LogAnalysisInterface";
import { SalesforceReconnectDialog } from "@/components/salesforce/SalesforceReconnectDialog";
import { useState } from "react";
import { useSalesforce } from "@/contexts/salesforce-context";
import { useSession } from "next-auth/react";
import { updateConnectionLastUsed } from "@/actions/salesforce-connection-actions";
import type { ProcessedSalesforceConnection } from "@/actions/salesforce-connection-actions";
import type {
  SalesforceErrorWithDetail,
  SalesforceAuthData,
} from "@/services/salesforceService";
import { Bug } from "lucide-react";

export default function LogAnalysisPage() {
  const { data: session } = useSession();
  const { connectWithId, reconnectWithCredentials } = useSalesforce();
  const [connectionData, setConnectionData] =
    useState<ProcessedSalesforceConnection | null>(null);
  const [connectingToSalesforce, setConnectingToSalesforce] = useState(false);
  const [showReconnectDialog, setShowReconnectDialog] = useState(false);
  const [connectionToReconnect, setConnectionToReconnect] =
    useState<ProcessedSalesforceConnection | null>(null);

  const handleConnectionSelect = async (
    connection: ProcessedSalesforceConnection
  ) => {
    try {
      setConnectingToSalesforce(true);

      // Try to connect with the existing connection ID FIRST to validate it
      console.log(
        "🔄 Testing connection before proceeding to log analysis:",
        connection.connectionId
      );
      await connectWithId(connection.connectionId);

      // Only proceed to log analysis AFTER successful connection validation
      setConnectionData(connection);

      // Update last used timestamp
      if (session?.user?.email) {
        await updateConnectionLastUsed(
          connection.connectionId,
          session.user.email
        );
      }

      console.log(
        "✅ Connection validated successfully, proceeding to log analysis"
      );
    } catch (error) {
      console.error("❌ Error validating Salesforce connection:", error);

      // Check if this is a structured error requiring reconnection
      const structuredError = error as SalesforceErrorWithDetail;
      if (
        structuredError.detail &&
        structuredError.detail.action === "reconnect_required"
      ) {
        console.log("🔄 Connection requires reconnection, showing dialog");

        // Show the reconnect dialog for this connection
        setConnectionToReconnect(connection);
        setShowReconnectDialog(true);
      } else {
        console.log(
          "❌ Connection validation failed with non-reconnect error:",
          structuredError
        );
        // Handle other types of errors here if needed
      }
    } finally {
      setConnectingToSalesforce(false);
    }
  };

  const handleDisconnect = () => {
    setConnectionData(null);
  };

  const handleReconnect = async (
    connectionId: string,
    authData: SalesforceAuthData
  ) => {
    try {
      setConnectingToSalesforce(true);

      // Use the reconnect endpoint
      console.log("🔄 Reconnecting to Salesforce for log analysis");
      await reconnectWithCredentials(connectionId, authData);

      // Update last used timestamp
      if (session?.user?.email) {
        await updateConnectionLastUsed(connectionId, session.user.email);
      }

      // Close dialogs and set the connection data
      setShowReconnectDialog(false);
      const reconnectedConnection = connectionToReconnect;
      setConnectionToReconnect(null);

      // Set the selected connection to proceed to log analysis
      if (reconnectedConnection) {
        setConnectionData(reconnectedConnection);
        console.log("✅ Successfully reconnected, proceeding to log analysis");
      }
    } catch (err) {
      console.error("❌ Failed to reconnect for log analysis:", err);
      // Let the reconnect dialog handle the error display
      throw err;
    } finally {
      setConnectingToSalesforce(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full max-w-full overflow-hidden">
      {!connectionData ? (
        <>
          {/* Header Bar - Following Code Intelligence Hub pattern */}
          <div className="sticky top-0 left-0 right-0 z-10 w-full bg-black/20 backdrop-blur-lg border-b border-gray-800/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between px-4 md:px-6 py-4 space-y-3 md:space-y-0">
              <div className="flex items-center space-x-3 min-w-0 overflow-hidden">
                <div className="flex items-center space-x-2 min-w-0 overflow-hidden">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Bug className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 overflow-hidden">
                    <h1 className="text-xl font-bold text-white truncate">
                      Log Analysis
                    </h1>
                    <p className="text-sm text-gray-400 hidden sm:block truncate">
                      AI-powered Salesforce error debugging
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 w-full min-w-0 flex flex-col overflow-hidden">
            <div className="flex-1 p-3 md:p-6 w-full overflow-hidden">
              <div className="h-full w-full max-w-full flex flex-col overflow-hidden">
                <div className="p-4 flex-1 overflow-auto flex flex-col">
                  <div className="flex-1">
                    <SalesforceConnectionManager
                      onConnectionSelect={handleConnectionSelect}
                      isConnecting={connectingToSalesforce}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <LogAnalysisInterface
          connectionData={{
            success: true,
            connection_id: connectionData.connectionId,
            org_info: connectionData.orgInfo,
            user_info: connectionData.userInfo,
            instance_url: connectionData.instanceUrl,
            version: connectionData.version,
            timestamp: connectionData.createdAt,
          }}
          onDisconnect={handleDisconnect}
        />
      )}

      {/* Reconnect Dialog */}
      {showReconnectDialog && connectionToReconnect && (
        <SalesforceReconnectDialog
          connection={connectionToReconnect}
          open={showReconnectDialog}
          onOpenChange={setShowReconnectDialog}
          onReconnect={handleReconnect}
        />
      )}
    </div>
  );
}
