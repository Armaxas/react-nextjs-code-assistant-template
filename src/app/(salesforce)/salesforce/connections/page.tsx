"use client";

import { useRouter } from "next/navigation";
import { SalesforceConnectionManager } from "@/components/salesforce/SalesforceConnectionManager";
import { ProcessedSalesforceConnection } from "@/actions/salesforce-connection-actions";
import { updateConnectionLastUsed } from "@/actions/salesforce-connection-actions";
import { useSession } from "next-auth/react";

export default function SalesforceConnectionsPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const handleConnectionSelect = async (connection: ProcessedSalesforceConnection) => {
    if (!session?.user?.email) return;

    try {
      // Update last used timestamp
      await updateConnectionLastUsed(connection.connectionId, session.user.email);
      
      // Navigate to the main Salesforce page with the connection ID
      router.push(`/salesforce?connectionId=${connection.connectionId}`);
    } catch (error) {
      console.error("Error selecting connection:", error);
      // Still navigate even if update fails
      router.push(`/salesforce?connectionId=${connection.connectionId}`);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <SalesforceConnectionManager onConnectionSelect={handleConnectionSelect} />
    </div>
  );
}
