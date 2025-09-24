"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  Search,
  Brain,
  Lightbulb,
  FileSearch,
  Cloud,
  AlertCircle,
} from "lucide-react";
import type { LogAnalysisProgressMessage } from "@/types/log-analysis";

interface LogAnalysisProgressProps {
  progressMessages: LogAnalysisProgressMessage[];
}

const stepIcons: Record<string, React.ReactNode> = {
  log_parsing: <FileSearch className="h-4 w-4" />,
  context_analysis: <Brain className="h-4 w-4" />,
  code_retrieval: <Search className="h-4 w-4" />,
  metadata_fetch: <Cloud className="h-4 w-4" />,
  error_analysis: <AlertCircle className="h-4 w-4" />,
  solution_generation: <Lightbulb className="h-4 w-4" />,
  response_formatting: <FileSearch className="h-4 w-4" />,
  default: <Loader2 className="h-4 w-4 animate-spin" />,
};

const stepLabels: Record<string, string> = {
  log_parsing: "Log Parsing",
  context_analysis: "Context Analysis",
  code_retrieval: "Code Retrieval",
  metadata_fetch: "Metadata Fetch",
  error_analysis: "Error Analysis",
  solution_generation: "Solution Generation",
  response_formatting: "Response Formatting",
};

export function LogAnalysisProgress({
  progressMessages,
}: LogAnalysisProgressProps) {
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getStepBadgeColor = (step: string) => {
    const colors: Record<string, string> = {
      log_parsing:
        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      context_analysis:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      code_retrieval:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      metadata_fetch:
        "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      error_analysis:
        "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      solution_generation:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      response_formatting:
        "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    };
    return (
      colors[step] ||
      "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          Analysis Progress
        </CardTitle>
        <CardDescription>
          Real-time updates from the AI analysis agent
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {progressMessages.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mr-3" />
                Initializing analysis...
              </div>
            ) : (
              progressMessages.map((message, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card/50"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {stepIcons[message.step] || stepIcons.default}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant="secondary"
                        className={getStepBadgeColor(message.step)}
                      >
                        {stepLabels[message.step] || message.step}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(message.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{message.message}</p>
                    {message.details && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        <pre className="whitespace-pre-wrap font-mono bg-muted/30 p-2 rounded">
                          {JSON.stringify(message.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Current Status */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Agent is actively processing...</span>
            </div>
            <span className="ml-auto">
              {progressMessages.length} step
              {progressMessages.length !== 1 ? "s" : ""} completed
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
