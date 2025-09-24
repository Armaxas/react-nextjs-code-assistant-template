"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Zap,
  Send,
  Copy,
  Play,
  CheckCircle,
  XCircle,
  Loader2,
  MessageSquare,
  Code,
  Database,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import { salesforceService } from "@/services/salesforceService";
import { useSalesforce } from "@/contexts/salesforce-context";
import { ModelSelector } from "@/components/ui/model-selector";
import { useModelSelection } from "@/hooks/use-model-selection";
import { useModels } from "@/hooks/use-models";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

interface ProgressMessage {
  step: string;
  message: string;
  timestamp: string;
  type?: "progress" | "thinking" | "analysis" | "building";
}

interface SOQLResult {
  query: string;
  records: Record<string, unknown>[];
  totalSize: number;
  done: boolean;
  reasoning: string;
  executionTime: number;
  isValid: boolean;
  validationErrors?: string[];
}

export default function SalesforceSOQLGenerator() {
  const router = useRouter();
  const { connectionId } = useSalesforce();
  const [threadId, setThreadId] = useState<string>("");
  const [userQuery, setUserQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [progressMessages, setProgressMessages] = useState<ProgressMessage[]>([]);
  const [currentSOQL, setCurrentSOQL] = useState("");
  const [soqlResults, setSOQLResults] = useState<SOQLResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingResponse, setStreamingResponse] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Model selection for AI chat
  const { isLoading: isLoadingModels } = useModels();
  const { selectedModel, setSelectedModel } = useModelSelection({
    storageKey: "salesforce-soql-model",
  });

  // Generate a thread ID for this session
  useEffect(() => {
    if (connectionId) {
      setThreadId(
        `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      );
    }
  }, [connectionId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingResponse, progressMessages]);

  // Navigation function to go back to Salesforce Explorer
  const handleBackToExplorer = () => {
    router.push("/salesforce");
  };

  const handleGenerateSOQL = async () => {
    if (!userQuery.trim() || !connectionId) return;

    try {
      setIsGenerating(true);
      setError(null);
      setStreamingResponse("");
      setProgressMessages([]);

      // Add user message to chat
      const userMessage: ChatMessage = {
        role: "user",
        content: userQuery,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Try streaming first
      try {
        let finalData: { 
          explanation?: string; 
          soql_query?: string; 
          success?: boolean; 
          error?: string;
        } = {};
        let hasReceivedFinalData = false;

        await salesforceService.generateSOQLStream(
          {
            connection_id: connectionId,
            thread_id: threadId,
            natural_language_query: userQuery,
            selectedModel: selectedModel,
          },
          (done: boolean, value: Uint8Array) => {
            if (!done && value) {
              const chunk = new TextDecoder().decode(value);
              console.log("📦 Received chunk:", chunk);

              try {
                // Handle SSE format
                const lines = chunk.split("\n");
                for (const line of lines) {
                  const trimmedLine = line.trim();
                  
                  if (trimmedLine.startsWith("data: ")) {
                    try {
                      const jsonData = JSON.parse(trimmedLine.slice(6));
                      console.log("📝 SSE Parsed JSON:", jsonData);
                      
                      // Handle different chunk types from backend
                      if (jsonData.type === "progress") {
                        // Extract progress information from the data
                        const chunkData = jsonData.data || {};
                        
                        // Look for progress_messages in nested agent data
                        const allProgressMessages: ProgressMessage[] = [];
                        
                        // Check each agent's data for progress_messages
                        Object.keys(chunkData).forEach(agentKey => {
                          const agentData = chunkData[agentKey];
                          if (agentData && agentData.progress_messages && Array.isArray(agentData.progress_messages)) {
                            console.log(`🔄 Found progress messages for ${agentKey}:`, agentData.progress_messages);
                            
                            const agentProgressMessages = agentData.progress_messages.map((pm: Record<string, unknown>) => ({
                              step: (pm.step as string) || agentKey,
                              message: (pm.message as string) || `Processing ${agentKey.replace('_', ' ')}...`,
                              timestamp: (pm.timestamp as string) || new Date().toISOString(),
                              type: (pm.step as string)?.includes("analysis") ? "analysis" : 
                                    (pm.step as string)?.includes("building") ? "building" : 
                                    (pm.step as string)?.includes("thinking") ? "thinking" : "progress"
                            }));
                            
                            allProgressMessages.push(...agentProgressMessages);
                          }
                          
                          // Handle current agent state
                          if (agentData && agentData.current_agent) {
                            const agentMessage = `Working with ${agentData.current_agent.replace('_', ' ')}...`;
                            setStreamingResponse(agentMessage);
                          }
                          
                          // Check for final response in this agent's data
                          if (agentData && agentData.final_response) {
                            console.log(`🏁 Found final response in ${agentKey}:`, agentData.final_response);
                            finalData = {
                              soql_query: agentData.final_response.soql_query || agentData.final_response.final_soql,
                              explanation: agentData.final_response.explanation || agentData.final_response.reasoning,
                              success: agentData.final_response.success,
                              error: agentData.final_response.error
                            };
                            hasReceivedFinalData = true;
                          }
                          
                          // Check for partial SOQL in progress
                          if (agentData && agentData.partial_soql && !hasReceivedFinalData) {
                            finalData = {
                              soql_query: agentData.partial_soql,
                              explanation: "SOQL query built successfully"
                            };
                          }
                        });
                        
                        // Update progress messages if we found any
                        if (allProgressMessages.length > 0) {
                          console.log(`➕ Adding ${allProgressMessages.length} progress messages`);
                          setProgressMessages(prev => {
                            // Only add messages that aren't already in the list
                            const existingKeys = new Set(prev.map(m => `${m.step}-${m.timestamp}`));
                            const newMessages = allProgressMessages.filter(msg => 
                              !existingKeys.has(`${msg.step}-${msg.timestamp}`)
                            );
                            return [...prev, ...newMessages];
                          });
                        }
                        
                        // Check for progress_messages at the top level (fallback)
                        if (chunkData.progress_messages && Array.isArray(chunkData.progress_messages)) {
                          const newProgressMessages = chunkData.progress_messages.map((pm: Record<string, unknown>) => ({
                            step: (pm.step as string) || "processing",
                            message: (pm.message as string) || "Processing...",
                            timestamp: (pm.timestamp as string) || new Date().toISOString(),
                            type: (pm.step as string)?.includes("analysis") ? "analysis" : 
                                  (pm.step as string)?.includes("building") ? "building" : 
                                  (pm.step as string)?.includes("thinking") ? "thinking" : "progress"
                          }));
                          setProgressMessages(prev => [...prev, ...newProgressMessages]);
                        }
                        
                        // Handle individual progress messages
                        if (jsonData.step && jsonData.message) {
                          const progressMsg: ProgressMessage = {
                            step: jsonData.step,
                            message: jsonData.message,
                            timestamp: jsonData.timestamp || new Date().toISOString(),
                            type: jsonData.step.includes("analysis") ? "analysis" : 
                                  jsonData.step.includes("building") ? "building" : 
                                  jsonData.step.includes("thinking") ? "thinking" : "progress"
                          };
                          setProgressMessages(prev => [...prev, progressMsg]);
                        }
                      } else if (jsonData.type === "done") {
                        console.log("🏁 Received done message, stopping progress indicator");
                        // Stop the progress indicator
                        setStreamingResponse("");
                        setIsGenerating(false);
                      }
                    } catch (parseError) {
                      console.warn("Failed to parse SSE data:", parseError);
                    }
                  }
                }
              } catch (error) {
                console.warn("Error processing chunk:", error);
              }
            } else if (done) {
              console.log("✅ Streaming complete. Final data:", finalData);
              
              // Process final response
              if (finalData) {
                const soqlQuery = finalData.soql_query || "";
                let finalExplanation = "";
                
                // Handle success vs error cases
                if (finalData.success === false && finalData.error) {
                  finalExplanation = `❌ SOQL Generation Failed: ${finalData.error}`;
                } else if (soqlQuery) {
                  finalExplanation = finalData.explanation || "✅ SOQL query generated successfully";
                } else {
                  finalExplanation = finalData.explanation || "❌ Failed to generate SOQL query";
                }
                
                // Add assistant message to chat
                const assistantMessage: ChatMessage = {
                  role: "assistant",
                  content: finalExplanation,
                  timestamp: new Date(),
                  metadata: soqlQuery ? { soql: soqlQuery } : undefined,
                };
                setMessages((prev) => [...prev, assistantMessage]);
                
                // Update current SOQL only if we have a valid query
                if (soqlQuery && finalData.success !== false) {
                  setCurrentSOQL(soqlQuery);
                }
              } else {
                // No final data received - add error message
                const errorMessage: ChatMessage = {
                  role: "assistant",
                  content: "❌ Failed to generate SOQL query - no response received",
                  timestamp: new Date(),
                };
                setMessages((prev) => [...prev, errorMessage]);
              }
              
              // Clear streaming states
              setStreamingResponse("");
              setProgressMessages([]);
              setIsGenerating(false);
            }
          }
        );
      } catch (streamError) {
        console.warn("Streaming failed, falling back to regular API:", streamError);
        
        // Clear progress states on fallback
        setProgressMessages([]);
        setStreamingResponse("");

        // Fallback to regular API call
        const response = await salesforceService.generateSOQL({
          connection_id: connectionId,
          thread_id: threadId,
          natural_language_query: userQuery,
          selectedModel: selectedModel,
        });

        // Add assistant message to chat
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: response.explanation || "SOQL query generated successfully",
          timestamp: new Date(),
          metadata: { soql: response.soql_query || "" },
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setCurrentSOQL(response.soql_query || "");
      }

      setUserQuery("");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to generate SOQL";
      setError(errorMessage);
      setProgressMessages([]);
      setStreamingResponse("");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExecuteSOQL = async () => {
    if (!currentSOQL || !connectionId) return;

    try {
      setIsExecuting(true);
      setError(null);

      const response = await salesforceService.validateSOQL(
        connectionId,
        currentSOQL,
        true // Execute the query
      );

      setSOQLResults({
        query: currentSOQL,
        records: (response.records as Record<string, unknown>[]) || [],
        totalSize: (response.totalSize as number) || 0,
        done: (response.done as boolean) || true,
        reasoning: (response.reasoning as string) || "",
        executionTime: (response.executionTime as number) || 0,
        isValid: response.isValid !== false,
        validationErrors: response.validationErrors as string[] | undefined,
      });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to execute SOQL";
      setError(errorMessage);
      setSOQLResults({
        query: currentSOQL,
        records: [],
        totalSize: 0,
        done: true,
        reasoning: "",
        executionTime: 0,
        isValid: false,
        validationErrors: [errorMessage],
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleValidateSOQL = async () => {
    if (!currentSOQL || !connectionId) return;

    try {
      setIsExecuting(true);
      setError(null);

      const response = await salesforceService.validateSOQL(
        connectionId,
        currentSOQL,
        false // Just validate, don't execute
      );

      setSOQLResults({
        query: currentSOQL,
        records: [],
        totalSize: 0,
        done: true,
        reasoning: (response.reasoning as string) || "",
        executionTime: 0,
        isValid: response.isValid !== false,
        validationErrors: response.validationErrors as string[] | undefined,
      });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to validate SOQL";
      setError(errorMessage);
    } finally {
      setIsExecuting(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const resetChat = async () => {
    if (!connectionId || !threadId) return;

    try {
      await salesforceService.resetChat(connectionId, threadId);
      setMessages([]);
      setCurrentSOQL("");
      setSOQLResults(null);
      setError(null);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to reset chat";
      setError(errorMessage);
    }
  };

  if (!connectionId) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">No Salesforce Connection</h2>
          <p className="text-muted-foreground mt-2">
            Please connect to Salesforce first to generate SOQL queries
          </p>
          <Button
            onClick={() => (window.location.href = "/salesforce")}
            className="mt-4"
          >
            Go to Connection
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToExplorer}
            className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Explorer</span>
          </Button>
          <div className="h-6 w-px bg-border" />
          <div>
            <h2 className="text-3xl font-bold tracking-tight">SOQL Generator</h2>
            <p className="text-muted-foreground">
              Generate optimized SOQL queries from natural language using AI
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={resetChat}>
            Reset Chat
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chat Interface */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>AI Assistant</span>
                  {isGenerating && <Loader2 className="w-4 h-4 animate-spin" />}
                </CardTitle>
                
                {/* Model Selection */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    AI Model:
                  </label>
                  <ModelSelector
                    selectedModel={selectedModel}
                    onModelChange={setSelectedModel}
                    size="sm"
                    placeholder="Select model"
                    disabled={isLoadingModels || isGenerating}
                    className="w-48"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Messages */}
              <div className="h-96 overflow-y-auto space-y-4 mb-4 p-4 border rounded-md bg-muted/30">
                {messages.length === 0 && !streamingResponse && (
                  <div className="text-center text-muted-foreground py-8">
                    <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Ask me to generate a SOQL query!</p>
                    <p className="text-sm mt-2">
                      Example: &ldquo;Show me all accounts created this year
                      with their contacts&rdquo;
                    </p>
                  </div>
                )}

                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-background border"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                      {(() => {
                        const soql = message.metadata?.soql;
                        if (soql && typeof soql === "string") {
                          return (
                            <div className="mt-2 p-2 bg-muted rounded text-xs">
                              <code>{soql}</code>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                ))}

                {/* Agent Progress Messages */}
                {(progressMessages.length > 0 || (isGenerating && streamingResponse)) && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                      <div className="flex items-center space-x-2 mb-3">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        <span className="text-sm font-medium text-blue-600">SOQL Agent is working...</span>
                      </div>
                      
                      {progressMessages.length > 0 ? (
                        <div className="space-y-2">
                          {progressMessages.map((progress, index) => (
                            <div key={index} className="flex items-start space-x-2">
                              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                progress.type === "analysis" ? "bg-yellow-500" :
                                progress.type === "building" ? "bg-green-500" :
                                progress.type === "thinking" ? "bg-purple-500" :
                                "bg-blue-500"
                              }`}></div>
                              <div className="flex-1">
                                <p className="text-sm text-gray-700 font-medium">
                                  {progress.step.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                                </p>
                                <p className="text-xs text-gray-600">{progress.message}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-start space-x-2">
                          <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-blue-500"></div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-700 font-medium">Processing Query</p>
                            <p className="text-xs text-gray-600">{streamingResponse || "Initializing SOQL generation..."}</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-1 mt-3">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse delay-75"></div>
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse delay-150"></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="flex space-x-2">
                <Input
                  placeholder="Describe the data you need..."
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleGenerateSOQL();
                    }
                  }}
                  disabled={isGenerating}
                />
                <Button
                  onClick={handleGenerateSOQL}
                  disabled={isGenerating || !userQuery.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SOQL Query and Results */}
        <div className="space-y-4">
          {/* Generated SOQL */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Code className="w-5 h-5" />
                <span>Generated SOQL</span>
                {currentSOQL && (
                  <Badge variant="outline" className="ml-auto">
                    Ready
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentSOQL ? (
                <div className="space-y-4">
                  <Textarea
                    value={currentSOQL}
                    onChange={(e) => setCurrentSOQL(e.target.value)}
                    className="font-mono text-sm min-h-[120px]"
                    placeholder="Generated SOQL query will appear here..."
                  />

                  <div className="flex space-x-2">
                    <Button
                      onClick={handleValidateSOQL}
                      variant="outline"
                      disabled={isExecuting}
                    >
                      {isExecuting ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Validate
                    </Button>

                    <Button onClick={handleExecuteSOQL} disabled={isExecuting}>
                      {isExecuting ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Play className="w-4 h-4 mr-2" />
                      )}
                      Execute
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(currentSOQL)}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Generate a SOQL query to see it here</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Query Results */}
          {soqlResults && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="w-5 h-5" />
                  <span>Query Results</span>
                  <Badge
                    variant={soqlResults.isValid ? "default" : "destructive"}
                  >
                    {soqlResults.isValid ? "Valid" : "Invalid"}
                  </Badge>
                  {soqlResults.totalSize > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                      {soqlResults.totalSize} records
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="results" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="results">Results</TabsTrigger>
                    <TabsTrigger value="analysis">Analysis</TabsTrigger>
                  </TabsList>

                  <TabsContent value="results">
                    {soqlResults.isValid ? (
                      soqlResults.records.length > 0 ? (
                        <div className="space-y-4">
                          <div className="text-sm text-muted-foreground">
                            Showing {soqlResults.records.length} of{" "}
                            {soqlResults.totalSize} records
                            {soqlResults.executionTime > 0 &&
                              ` • Executed in ${soqlResults.executionTime}ms`}
                          </div>

                          <div className="max-h-96 overflow-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  {Object.keys(
                                    soqlResults.records[0] || {}
                                  ).map((key) => (
                                    <TableHead key={key} className="text-xs">
                                      {key}
                                    </TableHead>
                                  ))}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {soqlResults.records.map((record, index) => (
                                  <TableRow key={index}>
                                    {Object.values(record).map(
                                      (value: unknown, cellIndex) => (
                                        <TableCell
                                          key={cellIndex}
                                          className="text-xs max-w-32 truncate"
                                        >
                                          {typeof value === "object" &&
                                          value !== null
                                            ? JSON.stringify(value)
                                            : String(value || "")}
                                        </TableCell>
                                      )
                                    )}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                          <p>Query is valid but returned no records</p>
                        </div>
                      )
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2 text-red-600">
                          <XCircle className="w-5 h-5" />
                          <span className="font-medium">
                            Query Validation Failed
                          </span>
                        </div>
                        {soqlResults.validationErrors &&
                          soqlResults.validationErrors.length > 0 && (
                            <div className="space-y-2">
                              {soqlResults.validationErrors.map(
                                (error, index) => (
                                  <div
                                    key={index}
                                    className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800"
                                  >
                                    {error}
                                  </div>
                                )
                              )}
                            </div>
                          )}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="analysis">
                    <div className="space-y-4">
                      {soqlResults.reasoning && (
                        <div className="p-4 bg-muted rounded-lg">
                          <h4 className="font-medium mb-2">AI Reasoning</h4>
                          <p className="text-sm text-muted-foreground">
                            {soqlResults.reasoning}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Query Complexity:</span>
                          <Badge variant="outline" className="ml-2">
                            {currentSOQL.split(" ").length < 10
                              ? "Simple"
                              : currentSOQL.split(" ").length < 20
                                ? "Medium"
                                : "Complex"}
                          </Badge>
                        </div>
                        <div>
                          <span className="font-medium">Estimated Cost:</span>
                          <Badge variant="outline" className="ml-2">
                            {soqlResults.totalSize < 100
                              ? "Low"
                              : soqlResults.totalSize < 1000
                                ? "Medium"
                                : "High"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 border border-red-200 rounded-md bg-red-50">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
