"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, AlertCircle, Building2, User } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SalesforceAuthData } from "@/services/salesforceService";

interface ProcessedSalesforceConnection {
  connectionId: string;
  name: string;
  orgName?: string;
  userName?: string;
  instanceUrl?: string;
  authType: string;
  isActive: boolean;
  lastUsed: string;
  createdAt: string;
  userId: string;
}

interface SalesforceReconnectDialogProps {
  connection: ProcessedSalesforceConnection | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReconnect: (connectionId: string, authData: SalesforceAuthData) => Promise<void>;
}

export function SalesforceReconnectDialog({
  connection,
  open,
  onOpenChange,
  onReconnect,
}: SalesforceReconnectDialogProps) {
  const [form, setForm] = useState<SalesforceAuthData>({
    auth_type: "username_password",
    sandbox: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open && connection) {
      setForm({
        auth_type: (connection.authType as "username_password" | "oauth2" | "jwt" | "session_id") || "username_password",
        sandbox: connection.instanceUrl?.includes("test.salesforce.com") || false,
      });
      setError(null);
    }
  }, [open, connection]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connection) return;

    try {
      setLoading(true);
      setError(null);

      // Validate required fields based on auth type
      if (form.auth_type === "username_password") {
        if (!form.username || !form.password) {
          throw new Error("Username and password are required");
        }
        if (!form.security_token) {
          throw new Error("Security token is required");
        }
      } else if (form.auth_type === "oauth2") {
        if (!form.client_id || !form.client_secret) {
          throw new Error("Client ID and Client Secret are required for OAuth2");
        }
      } else if (form.auth_type === "jwt") {
        if (!form.username || !form.client_id || !form.private_key) {
          throw new Error("Username, Client ID, and Private Key are required for JWT");
        }
      } else if (form.auth_type === "session_id") {
        if (!form.session_id || !form.instance) {
          throw new Error("Session ID and Instance URL are required");
        }
      }

      // Prepare auth data for submission - send password and security_token separately
      const authData = { ...form };
      
      // Backend expects separate password and security_token fields, don't combine them

      await onReconnect(connection.connectionId, authData);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reconnect");
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (updates: Partial<SalesforceAuthData>) => {
    setForm(prev => ({ ...prev, ...updates }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Reconnect to Salesforce
          </DialogTitle>
          <DialogDescription>
            Please enter your credentials to reconnect to this Salesforce org.
          </DialogDescription>
          {connection && (
            <div className="mt-2 space-y-1">
              <div className="font-medium">{connection.name}</div>
              {connection.orgName && (
                <div className="text-sm text-muted-foreground">
                  Org: {connection.orgName}
                </div>
              )}
              {connection.userName && (
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {connection.userName}
                </div>
              )}
            </div>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Authentication Type */}
          <div className="space-y-2">
            <Label htmlFor="auth_type">Authentication Type</Label>
            <Select
              value={form.auth_type}
              onValueChange={(value: "username_password" | "oauth2" | "jwt" | "session_id") =>
                updateForm({ auth_type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select authentication method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="username_password">Username & Password</SelectItem>
                <SelectItem value="oauth2">OAuth2</SelectItem>
                <SelectItem value="jwt">JWT (Server-to-Server)</SelectItem>
                <SelectItem value="session_id">Session ID</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sandbox Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="sandbox">Sandbox Environment</Label>
            <Switch
              id="sandbox"
              checked={form.sandbox}
              onCheckedChange={(checked) => updateForm({ sandbox: checked })}
            />
          </div>

          {/* Username/Password Fields */}
          {form.auth_type === "username_password" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="email"
                  value={form.username || ""}
                  onChange={(e) => updateForm({ username: e.target.value })}
                  placeholder="user@company.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password || ""}
                  onChange={(e) => updateForm({ password: e.target.value })}
                  placeholder="Your Salesforce password"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="security_token">Security Token</Label>
                <Input
                  id="security_token"
                  type="password"
                  value={form.security_token || ""}
                  onChange={(e) => updateForm({ security_token: e.target.value })}
                  placeholder="Your Salesforce security token"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Get your security token from Salesforce Setup → My Personal Information → Reset My Security Token
                </p>
              </div>
            </>
          )}

          {/* OAuth2 Fields */}
          {form.auth_type === "oauth2" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="client_id">Client ID</Label>
                <Input
                  id="client_id"
                  value={form.client_id || ""}
                  onChange={(e) => updateForm({ client_id: e.target.value })}
                  placeholder="Connected App Client ID"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_secret">Client Secret</Label>
                <Input
                  id="client_secret"
                  type="password"
                  value={form.client_secret || ""}
                  onChange={(e) => updateForm({ client_secret: e.target.value })}
                  placeholder="Connected App Client Secret"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="email"
                  value={form.username || ""}
                  onChange={(e) => updateForm({ username: e.target.value })}
                  placeholder="user@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password || ""}
                  onChange={(e) => updateForm({ password: e.target.value })}
                  placeholder="User password"
                />
              </div>
            </>
          )}

          {/* JWT Fields */}
          {form.auth_type === "jwt" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="email"
                  value={form.username || ""}
                  onChange={(e) => updateForm({ username: e.target.value })}
                  placeholder="user@company.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_id">Client ID (Consumer Key)</Label>
                <Input
                  id="client_id"
                  value={form.client_id || ""}
                  onChange={(e) => updateForm({ client_id: e.target.value })}
                  placeholder="Connected App Consumer Key"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="private_key">Private Key</Label>
                <textarea
                  id="private_key"
                  value={form.private_key || ""}
                  onChange={(e) => updateForm({ private_key: e.target.value })}
                  placeholder="-----BEGIN PRIVATE KEY-----
...
-----END PRIVATE KEY-----"
                  className="w-full p-2 border rounded-md font-mono text-xs"
                  rows={8}
                  required
                />
              </div>
            </>
          )}

          {/* Session ID Fields */}
          {form.auth_type === "session_id" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="session_id">Session ID</Label>
                <Input
                  id="session_id"
                  value={form.session_id || ""}
                  onChange={(e) => updateForm({ session_id: e.target.value })}
                  placeholder="Session ID from Salesforce"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instance">Instance URL</Label>
                <Input
                  id="instance"
                  value={form.instance || ""}
                  onChange={(e) => updateForm({ instance: e.target.value })}
                  placeholder="https://your-instance.salesforce.com"
                  required
                />
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Reconnecting...
                </>
              ) : (
                "Reconnect"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
