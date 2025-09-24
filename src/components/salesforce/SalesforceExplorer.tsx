"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Database,
  Zap,
  Cloud,
  Shield,
  ArrowRight,
  Activity,
  Users,
  Settings,
  FileText,
} from "lucide-react";
import SalesforceConnection from "./SalesforceConnection";
import { useSalesforce } from "@/contexts/salesforce-context";
import { SalesforceAuthData } from "@/services/salesforceService";

export default function SalesforceExplorer() {
  const router = useRouter();
  const {
    connection,
    connectionId,
    isConnected,
    isLoading,
    error,
    connect,
    disconnect,
    checkConnection,
  } = useSalesforce();

  const handleConnection = async (authData: SalesforceAuthData) => {
    await connect(authData);
  };

  const handleDisconnect = async () => {
    await disconnect();
  };

  // Check connection status periodically
  useEffect(() => {
    if (connectionId && isConnected && !error) {
      checkConnection();

      // Set up periodic check every 5 minutes, but only if no errors
      const interval = setInterval(
        () => {
          if (!error) {
            checkConnection();
          }
        },
        5 * 60 * 1000
      );
      return () => clearInterval(interval);
    }
  }, [connectionId, isConnected, checkConnection, error]);

  const navigateToMetadata = () => {
    router.push("/salesforce/metadata");
  };

  const navigateToSOQL = () => {
    router.push("/salesforce/soql");
  };

  if (!connectionId) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">
            Salesforce Explorer
          </h2>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">
              <Cloud className="w-4 h-4 mr-1" />
              Enterprise Ready
            </Badge>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Metadata Explorer
              </CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Objects & Fields</div>
              <p className="text-xs text-muted-foreground">
                Rich metadata exploration
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Text-to-SOQL
              </CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">AI Agent</div>
              <p className="text-xs text-muted-foreground">
                Natural language to SOQL
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Relationships
              </CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Mapping</div>
              <p className="text-xs text-muted-foreground">
                Parent-child relationships
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Permissions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Security</div>
              <p className="text-xs text-muted-foreground">
                Permission sets & profiles
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Connect to Salesforce</CardTitle>
              <CardDescription>
                Connect to your Salesforce org to start exploring metadata and
                generating SOQL queries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SalesforceConnection onConnection={handleConnection} />
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Features Overview</CardTitle>
              <CardDescription>
                Powerful tools for Salesforce metadata exploration and query
                generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <Database className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Metadata Explorer</h4>
                  <p className="text-sm text-muted-foreground">
                    Browse objects, fields, relationships, and permissions with
                    rich filtering and search
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Zap className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold">AI-Powered SOQL</h4>
                  <p className="text-sm text-muted-foreground">
                    Convert natural language to optimized SOQL queries using
                    advanced ReAct agents
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Relationship Mapping</h4>
                  <p className="text-sm text-muted-foreground">
                    Intelligent parent-child relationship discovery and
                    traversal
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <FileText className="w-5 h-5 text-purple-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Export & Documentation</h4>
                  <p className="text-sm text-muted-foreground">
                    Export metadata in multiple formats for documentation and
                    analysis
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Salesforce Explorer
          </h2>
          <p className="text-muted-foreground">
            Connected to{" "}
            {String(connection?.org_info?.Name || "Salesforce Org")}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge
            variant={
              connection?.success && isConnected ? "default" : "destructive"
            }
          >
            <Activity className="w-4 h-4 mr-1" />
            {connection?.success && isConnected ? "Connected" : "Disconnected"}
          </Badge>
          <Button
            variant="outline"
            onClick={handleDisconnect}
            disabled={isLoading}
          >
            Disconnect
          </Button>
        </div>
      </div>

      {connection && isConnected && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Organization
              </CardTitle>
              <Cloud className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {String(connection.org_info?.Name || "")}
              </div>
              <p className="text-xs text-muted-foreground">
                {String(connection.org_info?.OrganizationType || "")} •{" "}
                {connection.org_info?.IsSandbox ? "Sandbox" : "Production"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">User</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {String(connection.user_info?.Name || "")}
              </div>
              <p className="text-xs text-muted-foreground">
                {String(
                  (connection.user_info?.Profile as Record<string, unknown>)
                    ?.Name || ""
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Usage</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(connection as { api_calls_used?: number }).api_calls_used ||
                  0}
              </div>
              <p className="text-xs text-muted-foreground">
                of{" "}
                {(connection as { api_calls_limit?: number | string })
                  .api_calls_limit || "unlimited"}{" "}
                calls
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Instance</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {String(connection.org_info?.InstanceName || "")}
              </div>
              <p className="text-xs text-muted-foreground">
                Last activity:{" "}
                {(() => {
                  const lastActivity = (
                    connection as unknown as { last_activity?: string }
                  ).last_activity;
                  return lastActivity
                    ? new Date(lastActivity).toLocaleTimeString()
                    : "Unknown";
                })()}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="quick-actions">Quick Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="w-5 h-5" />
                  <span>Metadata Explorer</span>
                </CardTitle>
                <CardDescription>
                  Explore your Salesforce org&apos;s metadata including objects,
                  fields, relationships, and security settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Features:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Objects Browser</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Field Details</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Relationships</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span>Permissions</span>
                    </div>
                  </div>
                  <Button onClick={navigateToMetadata} className="w-full">
                    Explore Metadata
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5" />
                  <span>Text-to-SOQL Generator</span>
                </CardTitle>
                <CardDescription>
                  Generate optimized SOQL queries from natural language using
                  AI-powered ReAct agents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Capabilities:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span>Natural Language</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span>Relationship Queries</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                      <span>Query Optimization</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                      <span>Real-time Validation</span>
                    </div>
                  </div>
                  <Button onClick={navigateToSOQL} className="w-full">
                    Generate SOQL
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quick-actions" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={navigateToMetadata}
            >
              <CardHeader>
                <CardTitle className="text-lg">Browse All Objects</CardTitle>
                <CardDescription>
                  Get an overview of all standard and custom objects
                </CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={navigateToSOQL}
            >
              <CardHeader>
                <CardTitle className="text-lg">Generate SOQL Query</CardTitle>
                <CardDescription>
                  Describe what data you need in natural language
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">Export Metadata</CardTitle>
                <CardDescription>
                  Download metadata in JSON, CSV, or Excel format
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {error && (
        <div className="p-4 border border-red-200 rounded-md bg-red-50">
          <p className="text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
}
