"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  getUserSalesforceConnections,
  deleteSalesforceConnection,
  updateConnectionName,
  ProcessedSalesforceConnection,
} from "@/actions/salesforce-connection-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Cloud,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  Power,
  Clock,
  Building2,
  User,
  Loader2,
  RefreshCw,
} from "lucide-react";
import SalesforceConnection from "@/components/salesforce/SalesforceConnection";

interface SalesforceConnectionManagerProps {
  onConnectionSelect: (connection: ProcessedSalesforceConnection) => void;
  isConnecting?: boolean;
}

export function SalesforceConnectionManager({
  onConnectionSelect,
  isConnecting = false,
}: SalesforceConnectionManagerProps) {
  const { data: session } = useSession();
  const [connections, setConnections] = useState<
    ProcessedSalesforceConnection[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingConnection, setEditingConnection] =
    useState<ProcessedSalesforceConnection | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteConnection, setDeleteConnection] =
    useState<ProcessedSalesforceConnection | null>(null);

  const loadConnections = React.useCallback(async () => {
    if (!session?.user?.email) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getUserSalesforceConnections(session.user.email);
      if (result.success && result.connections) {
        setConnections(result.connections);
      } else {
        setError(result.error || "Failed to load connections");
      }
    } catch (err) {
      setError("Failed to load connections");
      console.error("Error loading connections:", err);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.email]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  const handleCreateConnection = () => {
    setShowCreateDialog(true);
  };

  const handleConnectionCreated = () => {
    setShowCreateDialog(false);
    loadConnections(); // Reload the list
  };

  const handleEditName = async () => {
    if (!editingConnection || !editName.trim() || !session?.user?.email) return;

    try {
      const result = await updateConnectionName(
        editingConnection.connectionId,
        session.user.email,
        editName.trim()
      );

      if (result.success) {
        setEditingConnection(null);
        setEditName("");
        loadConnections();
      } else {
        setError(result.error || "Failed to update connection name");
      }
    } catch (err) {
      setError("Failed to update connection name");
      console.error("Error updating connection name:", err);
    }
  };

  const handleDeleteConnection = async () => {
    if (!deleteConnection || !session?.user?.email) return;

    try {
      const result = await deleteSalesforceConnection(
        deleteConnection.connectionId,
        session.user.email
      );

      if (result.success) {
        setDeleteConnection(null);
        loadConnections();
      } else {
        setError(result.error || "Failed to delete connection");
      }
    } catch (err) {
      setError("Failed to delete connection");
      console.error("Error deleting connection:", err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading connections...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Salesforce Connections
          </h2>
          <p className="text-muted-foreground">
            Manage your Salesforce org connections
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadConnections}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleCreateConnection}>
            <Plus className="h-4 w-4 mr-2" />
            New Connection
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Connections Grid */}
      {connections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Cloud className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No connections found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first Salesforce connection to get started
            </p>
            <Button onClick={handleCreateConnection}>
              <Plus className="h-4 w-4 mr-2" />
              Create Connection
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {connections.map((connection) => (
            <Card
              key={connection.connectionId}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg truncate">
                    {connection.name}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={connection.isActive ? "default" : "secondary"}
                    >
                      {connection.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingConnection(connection);
                            setEditName(connection.name);
                          }}
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteConnection(connection)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Connection Details */}
                <div className="space-y-2 text-sm">
                  {connection.orgName && (
                    <div className="flex items-center">
                      <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="truncate">{connection.orgName}</span>
                    </div>
                  )}
                  {connection.userName && (
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="truncate">{connection.userName}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Last used: {formatDate(connection.lastUsed)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Power className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Auth: {connection.authType.replace("_", " ")}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  className="w-full"
                  onClick={() => onConnectionSelect(connection)}
                  variant={connection.isActive ? "default" : "outline"}
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : connection.isActive ? (
                    "Use Connection"
                  ) : (
                    "Reconnect & Use"
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Connection Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Salesforce Connection</DialogTitle>
            <DialogDescription>
              Configure a new connection to your Salesforce org
            </DialogDescription>
          </DialogHeader>
          <SalesforceConnection
            onConnection={handleConnectionCreated}
            saveToDatabase={true}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Name Dialog */}
      <Dialog
        open={!!editingConnection}
        onOpenChange={() => {
          setEditingConnection(null);
          setEditName("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Connection</DialogTitle>
            <DialogDescription>
              Enter a new name for this connection
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Connection name"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleEditName();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingConnection(null);
                setEditName("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEditName} disabled={!editName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConnection}
        onOpenChange={() => setDeleteConnection(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Connection</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the connection &quot;
              {deleteConnection?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConnection(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConnection}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
