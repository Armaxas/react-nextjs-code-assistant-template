"use client";

import { useState } from "react";
import { getDefaultSelectedModel } from "@/lib/models-config";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bug,
  FileText,
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2,
  Github,
  RefreshCw,
  Zap,
  ArrowLeft,
} from "lucide-react";
import type {
  SalesforceConnection,
  SalesforceAuthData,
} from "@/services/salesforceService";
import type { ProcessedSalesforceConnection } from "@/actions/salesforce-connection-actions";
import type {
  LogAnalysisRequest,
  AttachedDocument,
  LogAnalysisState,
  GitHubSettings,
} from "@/types/log-analysis";
import { FileUploadZone } from "./FileUploadZone";
import { LogAnalysisProgress } from "./LogAnalysisProgress";
import { LogAnalysisResult } from "./LogAnalysisResult";
import { GitHubConfiguration } from "./GitHubConfiguration";
import { SalesforceReconnectDialog } from "@/components/salesforce/SalesforceReconnectDialog";
// import { useSalesforce } from "@/contexts/salesforce-context";
import { ModelSelector } from "@/components/ui/model-selector";

interface LogAnalysisInterfaceProps {
  connectionData: SalesforceConnection;
  onDisconnect: () => void;
}

export function LogAnalysisInterface({
  connectionData,
  onDisconnect,
}: LogAnalysisInterfaceProps) {
  const [query, setQuery] = useState("");
  const [logMessage, setLogMessage] = useState("");
  const [attachedDocuments, setAttachedDocuments] = useState<
    AttachedDocument[]
  >([]);
  const [githubSettings, setGithubSettings] = useState<GitHubSettings>({
    isConnected: false,
    token: "",
    repository: "",
    branch: "main",
  });
  const [showReconnectDialog, setShowReconnectDialog] = useState(false);
  const [selectedModel, setSelectedModel] = useState(getDefaultSelectedModel());

  const [analysisState, setAnalysisState] = useState<LogAnalysisState>({
    isAnalyzing: false,
    progressMessages: [],
    result: null,
    error: null,
  });

  // const { connection } = useSalesforce(); // Keep for potential future use

  const analyzeLog = async () => {
    if (!canAnalyze) return;

    setAnalysisState({
      isAnalyzing: true,
      progressMessages: [],
      result: null,
      error: null,
    });

    const requestData: LogAnalysisRequest = {
      sf_connection_id: connectionData.connection_id,
      query: query.trim(),
      log_message: logMessage.trim(),
      attached_documents: attachedDocuments,
      selected_model: selectedModel,
    };

    // Add GitHub settings if connected (backend will handle token from session)
    if (githubSettings.isConnected && githubSettings.repository) {
      const [owner, repo] = githubSettings.repository.split("/");
      requestData.github_org = owner;
      requestData.github_repo = repo;
    }

    try {
      // Use Next.js API route instead of direct FastAPI call
      const response = await fetch("/api/logs/analyze/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        if (response.status === 404) {
          const errorText = await response.text();
          if (
            errorText.includes("connection") &&
            errorText.includes("not found")
          ) {
            console.log(
              "🔄 Salesforce connection not found (404), showing reconnect dialog"
            );
            setShowReconnectDialog(true);
            return;
          }
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Response body is not readable");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim() && line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "progress") {
                setAnalysisState((prev) => ({
                  ...prev,
                  progressMessages: [
                    ...prev.progressMessages,
                    {
                      step: data.details?.step || "processing",
                      message: data.content || "Processing...",
                      timestamp:
                        data.details?.timestamp || new Date().toISOString(),
                    },
                  ],
                }));
              } else if (data.type === "result") {
                setAnalysisState({
                  isAnalyzing: false,
                  progressMessages: [],
                  result: data.response,
                  error: null,
                });
              } else if (data.type === "error") {
                setAnalysisState({
                  isAnalyzing: false,
                  progressMessages: [],
                  result: null,
                  error: data.message,
                });
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Analysis error:", error);
      setAnalysisState({
        isAnalyzing: false,
        progressMessages: [],
        result: null,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  };

  const resetAnalysis = () => {
    setAnalysisState({
      isAnalyzing: false,
      progressMessages: [],
      result: null,
      error: null,
    });
  };

  const handleReconnect = async (
    connectionId: string,
    authData: SalesforceAuthData
  ) => {
    try {
      console.log(
        "🔄 Reconnecting Salesforce connection for log analysis...",
        connectionId
      );
      console.log("Auth data received:", authData.instance);

      setShowReconnectDialog(false);

      console.log("🎉 Successfully reconnected, ready for log analysis");
    } catch (err) {
      console.error("❌ Failed to reconnect:", err);
      throw err;
    }
  };

  const canAnalyze =
    query.trim() && logMessage.trim() && !analysisState.isAnalyzing;

  return (
    <>
      <div className="flex flex-col h-screen w-full max-w-full overflow-hidden">
        {/* Header Bar - Following Code Intelligence Hub pattern */}
        <div className="sticky top-0 left-0 right-0 z-10 w-full bg-black/20 backdrop-blur-lg border-b border-gray-800/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between px-4 md:px-6 py-4 space-y-3 md:space-y-0">
            <div className="flex items-center space-x-3 min-w-0 overflow-hidden">
              <div className="flex items-center space-x-2 min-w-0 overflow-hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDisconnect}
                  className="text-gray-400 hover:text-white hover:bg-white/10 flex-shrink-0"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
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

            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected to{" "}
                {(connectionData.org_info?.Name as string) || "Salesforce Org"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 w-full min-w-0 flex flex-col overflow-hidden">
          {analysisState.result ? (
            <LogAnalysisResult result={analysisState.result} />
          ) : (
            <div className="flex-1 p-3 md:p-6 w-full overflow-hidden">
              <div className="h-full w-full max-w-full bg-black/40 border-gray-800/50 backdrop-blur-sm flex flex-col overflow-hidden rounded-lg border">
                <div className="p-4 flex-1 overflow-auto">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Input Panel */}
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Bug className="h-5 w-5" />
                            Error Details
                          </CardTitle>
                          <CardDescription>
                            Describe the issue and paste the error log for
                            analysis
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label htmlFor="query">
                              Query / Issue Description
                            </Label>
                            <Textarea
                              id="query"
                              placeholder="Describe the issue you're facing (e.g., 'Getting SOQL error in my trigger', 'Permission error in Lightning component')"
                              value={query}
                              onChange={(e) => setQuery(e.target.value)}
                              className="min-h-[100px] mt-2"
                            />
                          </div>

                          <div>
                            <Label htmlFor="log-message">
                              Error Log / Stack Trace
                            </Label>
                            <Textarea
                              id="log-message"
                              placeholder="Paste your complete error log, stack trace, or debug output here..."
                              value={logMessage}
                              onChange={(e) => setLogMessage(e.target.value)}
                              className="min-h-[150px] mt-2 font-mono text-sm"
                            />
                          </div>
                        </CardContent>
                      </Card>

                      <Tabs defaultValue="files" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="files">
                            <FileText className="h-4 w-4 mr-2" />
                            Files
                          </TabsTrigger>
                          <TabsTrigger value="github">
                            <Github className="h-4 w-4 mr-2" />
                            GitHub
                          </TabsTrigger>
                          <TabsTrigger value="settings">
                            <Settings className="h-4 w-4 mr-2" />
                            Settings
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="files" className="space-y-4">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base">
                                Attached Context
                              </CardTitle>
                              <CardDescription>
                                Upload relevant code files, classes, or
                                components
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <FileUploadZone
                                onFilesChange={(fileInfos) => {
                                  const docs = fileInfos.map((info) => ({
                                    name: info.file.name,
                                    content: "", // Will be read when processing
                                    type: "text" as const,
                                    language: info.file.name.split(".").pop(),
                                  }));
                                  setAttachedDocuments((prev) => [
                                    ...prev,
                                    ...docs,
                                  ]);
                                }}
                              />
                            </CardContent>
                          </Card>
                        </TabsContent>

                        <TabsContent value="github" className="space-y-4">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base">
                                GitHub Integration
                              </CardTitle>
                              <CardDescription>
                                Connect to GitHub for additional context
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <GitHubConfiguration
                                onSettingsChange={setGithubSettings}
                                initialSettings={githubSettings}
                              />
                            </CardContent>
                          </Card>
                        </TabsContent>

                        <TabsContent value="settings" className="space-y-4">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base">
                                Analysis Settings
                              </CardTitle>
                              <CardDescription>
                                Configure analysis parameters
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div>
                                <Label htmlFor="model-selector">AI Model</Label>
                                <ModelSelector
                                  selectedModel={selectedModel}
                                  onModelChange={setSelectedModel}
                                  className="mt-2"
                                />
                              </div>
                            </CardContent>
                          </Card>
                        </TabsContent>
                      </Tabs>

                      <div className="flex gap-3">
                        <Button
                          onClick={analyzeLog}
                          disabled={!canAnalyze}
                          className="flex-1"
                          size="lg"
                        >
                          {analysisState.isAnalyzing ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Zap className="h-4 w-4 mr-2" />
                              Analyze Log
                            </>
                          )}
                        </Button>
                        {(analysisState.result || analysisState.error) && (
                          <Button
                            variant="outline"
                            onClick={resetAnalysis}
                            disabled={analysisState.isAnalyzing}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Reset
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Results Panel */}
                    <div className="space-y-6">
                      {analysisState.isAnalyzing && (
                        <LogAnalysisProgress
                          progressMessages={analysisState.progressMessages}
                        />
                      )}

                      {analysisState.error && (
                        <Card className="border-red-200 dark:border-red-800">
                          <CardContent className="pt-6">
                            <Alert variant="destructive">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>
                                {analysisState.error}
                              </AlertDescription>
                            </Alert>
                          </CardContent>
                        </Card>
                      )}

                      {!analysisState.isAnalyzing &&
                        !analysisState.result &&
                        !analysisState.error && (
                          <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-12">
                              <Bug className="h-12 w-12 text-muted-foreground mb-4" />
                              <h3 className="text-lg font-medium mb-2">
                                Ready to Analyze
                              </h3>
                              <p className="text-muted-foreground text-center">
                                Enter your query and error log to get AI-powered
                                debugging insights
                              </p>
                            </CardContent>
                          </Card>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reconnect Dialog */}
          {showReconnectDialog && (
            <SalesforceReconnectDialog
              connection={
                {
                  _id: "",
                  userId: "",
                  connectionId: connectionData.connection_id,
                  name: `Log Analysis Connection`,
                  authType: "oauth2",
                  instanceUrl: connectionData.instance_url || "",
                  orgId: (connectionData.org_info?.Id as string) || "",
                  orgName:
                    (connectionData.org_info?.Name as string) ||
                    "Salesforce Org",
                  userName:
                    (connectionData.user_info?.Username as string) || "",
                  userEmail: (connectionData.user_info?.Email as string) || "",
                  version: connectionData.version || "",
                  isActive: true,
                  lastUsed:
                    connectionData.timestamp || new Date().toISOString(),
                  createdAt:
                    connectionData.timestamp || new Date().toISOString(),
                  updatedAt:
                    connectionData.timestamp || new Date().toISOString(),
                  orgInfo: connectionData.org_info,
                  userInfo: connectionData.user_info,
                } as ProcessedSalesforceConnection
              }
              open={showReconnectDialog}
              onOpenChange={setShowReconnectDialog}
              onReconnect={handleReconnect}
            />
          )}
        </div>
      </div>
    </>
  );
}
