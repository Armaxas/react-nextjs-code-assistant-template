export interface SalesforceAuthData {
  auth_type: "username_password" | "oauth2" | "jwt" | "session_id";
  username?: string;
  password?: string;
  security_token?: string;
  client_id?: string;
  client_secret?: string;
  redirect_uri?: string;
  authorization_code?: string;
  refresh_token?: string;
  private_key?: string;
  audience?: string;
  session_id?: string;
  instance?: string;
  domain?: string;
  version?: string;
  sandbox?: boolean;
  timeout?: number;
}

export interface SalesforceConnection {
  success: boolean;
  connection_id: string;
  org_info?: Record<string, unknown>;
  user_info?: Record<string, unknown>;
  instance_url?: string;
  version?: string;
  timestamp: string;
  error?: string;
}

export interface SalesforceErrorDetail {
  error: string;
  message: string;
  action: string;
  connection_id: string;
  reconnect_info?: {
    org_name: string;
    instance_url: string;
    auth_type: string;
    last_used: string;
  };
  org_info?: Record<string, unknown>;
  user_info?: Record<string, unknown>;
}

export interface SalesforceErrorWithDetail extends Error {
  detail?: SalesforceErrorDetail;
}

export interface SalesforceObject {
  name: string;
  label: string;
  custom: boolean;
  fields?: Record<string, unknown>[];
  relationships?: Record<string, unknown>[];
}

export interface SOQLRequest {
  connection_id: string;
  natural_language_query: string;
  thread_id?: string;
  conversation_history?: Array<{ role: string; content: string }>;
  selectedModel?: string;
}

export interface SOQLResponse {
  success: boolean;
  soql_query?: string;
  explanation?: string;
  components?: Record<string, unknown>;
  analysis?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  optimization?: Record<string, unknown>;
  thread_id?: string;
  timestamp: string;
  error?: string;
}

export class SalesforceService {
  private baseUrl: string;
  private lastFailureTime: number = 0;
  private failureCount: number = 0;
  private maxRetries: number = 3;
  private backoffDelay: number = 1000; // Start with 1 second

  constructor() {
    this.baseUrl =
      process.env.NEXT_PUBLIC_CHAT_API_URL || "http://localhost:8000";
  }

  private shouldSkipRequest(): boolean {
    if (this.failureCount === 0) return false;
    
    const now = Date.now();
    const timeSinceLastFailure = now - this.lastFailureTime;
    const backoffTime = Math.min(this.backoffDelay * Math.pow(2, this.failureCount - 1), 30000); // Max 30 seconds
    
    return timeSinceLastFailure < backoffTime;
  }

  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
  }

  private recordSuccess(): void {
    this.failureCount = 0;
    this.lastFailureTime = 0;
  }

  async connectToSalesforce(
    authData: SalesforceAuthData
  ): Promise<SalesforceConnection> {
    // Check if we should skip this request due to recent failures
    if (this.shouldSkipRequest()) {
      const waitTime = Math.min(this.backoffDelay * Math.pow(2, this.failureCount - 1), 30000);
      throw new Error(`Backend temporarily unavailable. Please wait ${Math.ceil(waitTime / 1000)} seconds before retrying.`);
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/salesforce/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(authData),
      });

      if (!response.ok) {
        this.recordFailure();
        const errorMessage = response.status === 500 
          ? `Backend server error (${response.status}). The server may be experiencing issues.`
          : `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      this.recordSuccess();
      return await response.json();
    } catch (error) {
      if (error instanceof Error && !error.message.includes('Backend temporarily unavailable')) {
        console.error("Error connecting to Salesforce:", error.message);
      }
      throw error;
    }
  }

  async reconnectSalesforce(
    connectionId: string,
    authData: SalesforceAuthData
  ): Promise<SalesforceConnection> {
    // Check if we should skip this request due to recent failures
    if (this.shouldSkipRequest()) {
      const waitTime = Math.min(this.backoffDelay * Math.pow(2, this.failureCount - 1), 30000);
      throw new Error(`Backend temporarily unavailable. Please wait ${Math.ceil(waitTime / 1000)} seconds before retrying.`);
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/salesforce/${connectionId}/reconnect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(authData),
      });

      if (!response.ok) {
        this.recordFailure();
        const errorMessage = response.status === 500 
          ? `Backend server error (${response.status}). The server may be experiencing issues.`
          : `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      this.recordSuccess();
      return await response.json();
    } catch (error) {
      if (error instanceof Error && !error.message.includes('Backend temporarily unavailable')) {
        console.error("Error reconnecting to Salesforce:", error.message);
      }
      throw error;
    }
  }

  async getConnectionStatus(
    connectionId: string
  ): Promise<Record<string, unknown>> {
    // Check if we should skip this request due to recent failures
    if (this.shouldSkipRequest()) {
      const waitTime = Math.min(this.backoffDelay * Math.pow(2, this.failureCount - 1), 30000);
      throw new Error(`Backend temporarily unavailable. Please wait ${Math.ceil(waitTime / 1000)} seconds before retrying.`);
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/api/salesforce/${connectionId}/status`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        this.recordFailure();
        
        // For 404 errors, try to parse the detailed error response from backend
        if (response.status === 404) {
          try {
            const errorDetail = await response.json();
            console.log("🔍 Service - Received 404 error response:", errorDetail);
            
            if (errorDetail.detail && typeof errorDetail.detail === 'object') {
              console.log("🔍 Service - Creating structured error with detail:", errorDetail.detail);
              // Backend returned structured error with reconnection info
              const structuredError: SalesforceErrorWithDetail = new Error(errorDetail.detail.message || "Connection not found");
              // Attach the full error detail for the frontend to use
              structuredError.detail = errorDetail.detail;
              console.log("🔍 Service - Throwing structured error:", structuredError);
              throw structuredError;
            } else {
              console.log("🔍 Service - 404 response does not contain structured detail");
            }
          } catch (parseError) {
            // Check if this is our structured error being re-thrown
            if (parseError instanceof Error && (parseError as SalesforceErrorWithDetail).detail) {
              // This is our structured error, re-throw it
              throw parseError;
            }
            // If parsing actually failed, fall back to generic error
            console.warn("Failed to parse 404 error response:", parseError);
          }
        }
        
        const errorMessage = response.status === 500 
          ? `Backend server error (${response.status}). The server may be experiencing issues.`
          : `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      this.recordSuccess();
      return await response.json();
    } catch (error) {
      if (error instanceof Error && !error.message.includes('Backend temporarily unavailable')) {
        console.error("Error getting connection status:", error.message);
      }
      throw error;
    }
  }

  async getSalesforceObjects(
    connectionId: string,
    objectType: string = "all",
    includeFields: boolean = false,
    includeRelationships: boolean = false
  ): Promise<{ objects: SalesforceObject[] }> {
    // Check if we should skip this request due to recent failures
    if (this.shouldSkipRequest()) {
      const waitTime = Math.min(this.backoffDelay * Math.pow(2, this.failureCount - 1), 30000);
      throw new Error(`Backend temporarily unavailable. Please wait ${Math.ceil(waitTime / 1000)} seconds before retrying.`);
    }

    try {
      const params = new URLSearchParams({
        object_type: objectType,
        include_fields: includeFields.toString(),
        include_relationships: includeRelationships.toString(),
      });

      const response = await fetch(
        `${this.baseUrl}/api/salesforce/${connectionId}/objects?${params}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        this.recordFailure();
        const errorMessage = response.status === 500 
          ? `Backend server error (${response.status}). The server may be experiencing issues.`
          : `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      this.recordSuccess();
      return await response.json();
    } catch (error) {
      if (error instanceof Error && !error.message.includes('Backend temporarily unavailable')) {
        console.error("Error getting Salesforce objects:", error.message);
      }
      throw error;
    }
  }

  async getObjectDetails(
    connectionId: string,
    objectName: string,
    includeFields: boolean = true,
    includeRelationships: boolean = true,
    includeRecordTypes: boolean = false,
    includeValidationRules: boolean = false
  ): Promise<SalesforceObject> {
    try {
      const params = new URLSearchParams({
        include_fields: includeFields.toString(),
        include_relationships: includeRelationships.toString(),
        include_record_types: includeRecordTypes.toString(),
        include_validation_rules: includeValidationRules.toString(),
      });

      const response = await fetch(
        `${this.baseUrl}/api/salesforce/${connectionId}/objects/${objectName}?${params}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting object details:", error);
      throw error;
    }
  }

  async generateSOQL(request: SOQLRequest): Promise<SOQLResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/salesforce/soql/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error generating SOQL:", error);
      throw error;
    }
  }

  async generateSOQLStream(
    request: SOQLRequest,
    onChunk: (done: boolean, value: Uint8Array) => void
  ): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/salesforce/soql/generate/stream`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("ReadableStream not supported in this browser.");
      }

      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (value) {
          onChunk(done, value);
        }
        if (done) {
          reader.releaseLock();
          break;
        }
      }
    } catch (error) {
      console.error("Error in SOQL streaming:", error);
      throw error;
    }
  }

  async validateSOQL(
    connectionId: string,
    soqlQuery: string,
    executeQuery: boolean = false
  ): Promise<Record<string, unknown>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/salesforce/soql/validate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify({
            connection_id: connectionId,
            soql_query: soqlQuery,
            execute_query: executeQuery,
            limit_results: 5,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error validating SOQL:", error);
      throw error;
    }
  }

  async exportMetadata(
    connectionId: string,
    exportType: string,
    objectNames?: string[],
    format: string = "json",
    includeSystemFields: boolean = false
  ): Promise<Record<string, unknown>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/salesforce/${connectionId}/metadata/export`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify({
            connection_id: connectionId,
            export_type: exportType,
            object_names: objectNames,
            format: format,
            include_system_fields: includeSystemFields,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error exporting metadata:", error);
      throw error;
    }
  }

  // Get all objects in the org
  async getObjects(
    connectionId: string
  ): Promise<{ objects: SalesforceObject[] }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/salesforce/${connectionId}/objects`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting objects:", error);
      throw error;
    }
  }

  // Get fields for a specific object
  async getObjectFields(
    connectionId: string,
    objectName: string
  ): Promise<{ fields: Record<string, unknown>[] }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/salesforce/${connectionId}/objects/${objectName}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting object fields:", error);
      throw error;
    }
  }

  async resetChat(
    connectionId: string,
    threadId: string
  ): Promise<Record<string, unknown>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/salesforce/reset-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify({
            connection_id: connectionId,
            thread_id: threadId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error resetting chat:", error);
      throw error;
    }
  }

  async disconnectSalesforce(
    connectionId: string
  ): Promise<Record<string, unknown>> {
    // Check if we should skip this request due to recent failures
    if (this.shouldSkipRequest()) {
      const waitTime = Math.min(this.backoffDelay * Math.pow(2, this.failureCount - 1), 30000);
      throw new Error(`Backend temporarily unavailable. Please wait ${Math.ceil(waitTime / 1000)} seconds before retrying.`);
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/api/salesforce/${connectionId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        this.recordFailure();
        const errorMessage = response.status === 500 
          ? `Backend server error (${response.status}). The server may be experiencing issues.`
          : `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      this.recordSuccess();
      return await response.json();
    } catch (error) {
      if (error instanceof Error && !error.message.includes('Backend temporarily unavailable')) {
        console.error("Error disconnecting Salesforce:", error.message);
      }
      throw error;
    }
  }

  // Method to manually reset the failure state (useful for testing or user-initiated retry)
  resetFailureState(): void {
    this.recordSuccess();
  }

  // Method to get current failure state (useful for debugging)
  getFailureState(): { failureCount: number; lastFailureTime: number; shouldSkip: boolean } {
    return {
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      shouldSkip: this.shouldSkipRequest()
    };
  }
}

export const salesforceService = new SalesforceService();
