"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { saveSalesforceConnection } from "@/actions/salesforce-connection-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Lock,
  Key,
  Cloud,
  Shield,
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  salesforceService,
  SalesforceAuthData,
} from "@/services/salesforceService";

interface SalesforceConnectionProps {
  onConnection: (authData: SalesforceAuthData) => void;
  saveToDatabase?: boolean; // New prop to enable database persistence
}

interface ConnectionForm {
  connectionName?: string; // Add connection name
  auth_type: "username_password" | "oauth2" | "jwt" | "session_id";
  username?: string;
  password?: string;
  security_token?: string;
  client_id?: string;
  client_secret?: string;
  private_key?: string;
  audience?: string;
  session_id?: string;
  instance?: string;
  domain?: string;
  sandbox?: boolean;
}

export default function SalesforceConnection({
  onConnection,
  saveToDatabase = false,
}: SalesforceConnectionProps) {
  const { data: session } = useSession();
  const [form, setForm] = useState<ConnectionForm>({
    auth_type: "username_password",
    sandbox: false,
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleInputChange = (
    field: keyof ConnectionForm,
    value: string | boolean
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
    setSuccess(null);
  };

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      setSuccess(null);

      // Validate required fields based on method
      if (form.auth_type === "username_password") {
        if (!form.username || !form.password) {
          throw new Error("Username and password are required");
        }
      } else if (form.auth_type === "oauth2") {
        if (!form.client_id || !form.client_secret) {
          throw new Error("Client ID and Client Secret are required");
        }
      } else if (form.auth_type === "jwt") {
        if (!form.username || !form.client_id || !form.private_key) {
          throw new Error("Username, Client ID, and Private Key are required");
        }
      } else if (form.auth_type === "session_id") {
        if (!form.session_id || !form.instance) {
          throw new Error("Session ID and Instance URL are required");
        }
      }

      const response = await salesforceService.connectToSalesforce(form);

      setSuccess(
        `Successfully connected to Salesforce! Connection ID: ${response.connection_id}`
      );

      // Save to database if enabled and user is authenticated
      if (saveToDatabase && session?.user?.email && response.success) {
        try {
          const connectionName = form.connectionName || 
            `${response.org_info?.Name || "Salesforce Org"} - ${new Date().toLocaleDateString()}`;

          await saveSalesforceConnection({
            userId: session.user.email,
            connectionId: response.connection_id,
            name: connectionName,
            authType: form.auth_type,
            instanceUrl: response.instance_url,
            orgId: response.org_info?.Id as string,
            orgName: response.org_info?.Name as string,
            userName: response.user_info?.Username as string,
            userEmail: response.user_info?.Email as string,
            version: response.version,
            isActive: true,
            lastUsed: new Date().toISOString(),
            orgInfo: response.org_info,
            userInfo: response.user_info,
          });
        } catch (dbError) {
          console.error("Failed to save connection to database:", dbError);
          // Don't block the connection flow if database save fails
        }
      }

      onConnection(form);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to connect to Salesforce";
      setError(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleResetBackend = () => {
    salesforceService.resetFailureState();
    setError(null);
    setSuccess("Backend connection reset. You can try connecting again.");
  };

  const renderAuthMethodForm = () => {
    switch (form.auth_type) {
      case "username_password":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  type="email"
                  placeholder="user@company.com"
                  value={form.username || ""}
                  onChange={(e) =>
                    handleInputChange("username", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Your password"
                  value={form.password || ""}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="security_token">Security Token</Label>
              <Input
                id="security_token"
                type="password"
                placeholder="Security token (if required)"
                value={form.security_token || ""}
                onChange={(e) =>
                  handleInputChange("security_token", e.target.value)
                }
              />
              <p className="text-xs text-muted-foreground">
                Required if your IP is not trusted
              </p>
            </div>
          </div>
        );

      case "oauth2":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_id">Client ID *</Label>
                <Input
                  id="client_id"
                  placeholder="OAuth2 Client ID"
                  value={form.client_id || ""}
                  onChange={(e) =>
                    handleInputChange("client_id", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_secret">Client Secret *</Label>
                <Input
                  id="client_secret"
                  type="password"
                  placeholder="OAuth2 Client Secret"
                  value={form.client_secret || ""}
                  onChange={(e) =>
                    handleInputChange("client_secret", e.target.value)
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="email"
                placeholder="user@company.com (for flow-based auth)"
                value={form.username || ""}
                onChange={(e) => handleInputChange("username", e.target.value)}
              />
            </div>
          </div>
        );

      case "jwt":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  type="email"
                  placeholder="user@company.com"
                  value={form.username || ""}
                  onChange={(e) =>
                    handleInputChange("username", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_id">Client ID *</Label>
                <Input
                  id="client_id"
                  placeholder="Connected App Client ID"
                  value={form.client_id || ""}
                  onChange={(e) =>
                    handleInputChange("client_id", e.target.value)
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="private_key">Private Key *</Label>
              <textarea
                id="private_key"
                className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="-----BEGIN PRIVATE KEY-----
...
-----END PRIVATE KEY-----"
                value={form.private_key || ""}
                onChange={(e) =>
                  handleInputChange("private_key", e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="audience">JWT Audience</Label>
              <Input
                id="audience"
                placeholder="https://login.salesforce.com (default)"
                value={form.audience || ""}
                onChange={(e) => handleInputChange("audience", e.target.value)}
              />
            </div>
          </div>
        );

      case "session_id":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="session_id">Session ID *</Label>
              <Input
                id="session_id"
                type="password"
                placeholder="Salesforce Session ID"
                value={form.session_id || ""}
                onChange={(e) =>
                  handleInputChange("session_id", e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instance">Instance URL *</Label>
              <Input
                id="instance"
                placeholder="https://yourinstance.salesforce.com"
                value={form.instance || ""}
                onChange={(e) => handleInputChange("instance", e.target.value)}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "username_password":
        return <Lock className="w-4 h-4" />;
      case "oauth2":
        return <Key className="w-4 h-4" />;
      case "jwt":
        return <Shield className="w-4 h-4" />;
      case "session_id":
        return <Cloud className="w-4 h-4" />;
      default:
        return <Lock className="w-4 h-4" />;
    }
  };

  const getMethodDescription = (method: string) => {
    switch (method) {
      case "username_password":
        return "Standard username and password authentication";
      case "oauth2":
        return "OAuth2 flow with connected app credentials";
      case "jwt":
        return "JWT bearer token flow for server-to-server auth";
      case "session_id":
        return "Use existing session ID from browser/other source";
      default:
        return "";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Cloud className="w-5 h-5" />
          <span>Connect to Salesforce</span>
        </CardTitle>
        <CardDescription>
          Choose your preferred authentication method to connect to your
          Salesforce org
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Authentication Method Selection */}
        <div className="space-y-3">
          <Label>Authentication Method</Label>
          <Select
            value={form.auth_type}
            onValueChange={(value: string) =>
              handleInputChange("auth_type", value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select authentication method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="username_password">
                <div className="flex items-center space-x-2">
                  {getMethodIcon("username_password")}
                  <span>Username & Password</span>
                </div>
              </SelectItem>
              <SelectItem value="oauth2">
                <div className="flex items-center space-x-2">
                  {getMethodIcon("oauth2")}
                  <span>OAuth2</span>
                </div>
              </SelectItem>
              <SelectItem value="jwt">
                <div className="flex items-center space-x-2">
                  {getMethodIcon("jwt")}
                  <span>JWT Bearer</span>
                </div>
              </SelectItem>
              <SelectItem value="session_id">
                <div className="flex items-center space-x-2">
                  {getMethodIcon("session_id")}
                  <span>Session ID</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            {getMethodDescription(form.auth_type)}
          </p>
        </div>

        {/* Connection Name (only show if saving to database) */}
        {saveToDatabase && (
          <div className="space-y-2">
            <Label htmlFor="connectionName">Connection Name (Optional)</Label>
            <Input
              id="connectionName"
              type="text"
              placeholder="My Salesforce Org"
              value={form.connectionName || ""}
              onChange={(e) => handleInputChange("connectionName", e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Give this connection a memorable name for easy identification
            </p>
          </div>
        )}

        {/* Environment Selection */}
        <div className="space-y-3">
          <Label>Environment</Label>
          <div className="flex space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="production"
                name="environment"
                title="Production Environment"
                checked={!form.sandbox}
                onChange={() => {
                  handleInputChange("sandbox", false);
                  handleInputChange("domain", "login");
                }}
                className="h-4 w-4"
              />
              <Label htmlFor="production" className="text-sm font-normal">
                Production
              </Label>
              <Badge variant="secondary">login.salesforce.com</Badge>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="sandbox"
                name="environment"
                title="Sandbox Environment"
                checked={form.sandbox}
                onChange={() => {
                  handleInputChange("sandbox", true);
                  handleInputChange("domain", "test");
                }}
                className="h-4 w-4"
              />
              <Label htmlFor="sandbox" className="text-sm font-normal">
                Sandbox
              </Label>
              <Badge variant="outline">test.salesforce.com</Badge>
            </div>
          </div>
        </div>

        {/* Custom Domain */}
        <div className="space-y-2">
          <Label htmlFor="domain">Custom Domain (Optional)</Label>
          <Input
            id="domain"
            placeholder={form.sandbox ? "test" : "login"}
            value={form.domain || ""}
            onChange={(e) => handleInputChange("domain", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Leave blank to use default domain ({form.sandbox ? "test" : "login"}
            .salesforce.com)
          </p>
        </div>

        {/* Method-specific Form */}
        <div className="space-y-4">
          <div className="border-t pt-4">
            <h4 className="font-medium mb-4 flex items-center space-x-2">
              {getMethodIcon(form.auth_type)}
              <span>
                {form.auth_type === "username_password" &&
                  "Username & Password"}
                {form.auth_type === "oauth2" && "OAuth2 Credentials"}
                {form.auth_type === "jwt" && "JWT Configuration"}
                {form.auth_type === "session_id" && "Session Details"}
              </span>
            </h4>
            {renderAuthMethodForm()}
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Reset Button for Backend Issues */}
        {error && (error.includes("Backend temporarily unavailable") || error.includes("Backend server error")) && (
          <Button
            onClick={handleResetBackend}
            variant="outline"
            size="sm"
            className="w-full mt-2"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset Connection & Try Again
          </Button>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Connect Button */}
        <Button
          onClick={handleConnect}
          disabled={isConnecting}
          className="w-full"
          size="lg"
        >
          {isConnecting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Cloud className="w-4 h-4 mr-2" />
              Connect to Salesforce
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
