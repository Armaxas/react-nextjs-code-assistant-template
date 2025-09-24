"use client";

import { useState, useEffect } from "react";
import { Message } from "@/types/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Bot, Clock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModernSpinner } from "@/components/ui/modern-spinners";

interface AgentProgressIndicatorProps {
  progressMessages: Message[];
  isLoading: boolean;
  className?: string;
}

interface ProgressStep {
  id: string;
  message: string;
  timestamp: Date;
  agent?: string;
  step?: string;
  status: "active" | "completed" | "pending";
}

export function AgentProgressIndicator({
  progressMessages,
  isLoading,
  className,
}: AgentProgressIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [steps, setSteps] = useState<ProgressStep[]>([]);

  useEffect(() => {
    // Transform progress messages into steps
    const progressSteps = progressMessages.map((msg, index) => ({
      id: msg.id,
      message: msg.content,
      timestamp: msg.createdAt,
      agent: "Agent", // Simplified since msg.details may not have agent
      step: `Step ${index + 1}`, // Simplified since msg.details may not have step
      status:
        index === progressMessages.length - 1 && isLoading
          ? "active"
          : "completed",
    })) as ProgressStep[];

    setSteps(progressSteps);
  }, [progressMessages, isLoading]);

  // Auto-expand when new progress messages arrive
  useEffect(() => {
    if (progressMessages.length > 0 && isLoading) {
      setIsExpanded(true);
    }
  }, [progressMessages.length, isLoading]);

  // Don't render if no progress messages
  if (steps.length === 0) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return (
          <ModernSpinner
            variant="orbital"
            size="sm"
            className="text-blue-500"
          />
        );
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-blue-900/30 text-blue-400 border-blue-800/50";
      case "completed":
        return "bg-green-900/30 text-green-400 border-green-800/50";
      default:
        return "bg-gray-800/50 text-gray-400 border-gray-700/50";
    }
  };

  return (
    <Card
      className={cn(
        "w-full z-10 shadow-md border transition-all duration-300",
        isExpanded ? "max-h-80" : "max-h-16",
        className
      )}
    >
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-800/70">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-400" />
            <h3 className="font-semibold text-sm text-gray-300">
              Agent Progress
            </h3>
            <Badge
              variant="outline"
              className="text-xs border-gray-700 text-gray-400"
            >
              {steps.length} {steps.length === 1 ? "step" : "steps"}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Progress Steps */}
        {isExpanded && (
          <div className="max-h-80 overflow-y-auto">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "flex items-start gap-3 p-3 border-b border-gray-800/50 last:border-b-0 transition-all duration-200",
                  step.status === "active"
                    ? "bg-blue-900/20"
                    : "hover:bg-gray-800/30"
                )}
              >
                {/* Status Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {getStatusIcon(step.status)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant="outline"
                      className={cn("text-xs", getStatusColor(step.status))}
                    >
                      {step.agent}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {step.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {step.message}
                  </p>
                  {step.step && (
                    <p className="text-xs text-gray-500 mt-1">{step.step}</p>
                  )}
                </div>

                {/* Progress Line (except for last item) */}
                {index < steps.length - 1 && (
                  <div className="absolute left-8 mt-8 w-px h-4 bg-gray-200" />
                )}
              </div>
            ))}

            {/* Loading indicator at bottom when active */}
            {isLoading && (
              <div className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <ModernSpinner
                    variant="dna"
                    size="sm"
                    className="text-blue-500"
                  />
                  Agent is working...
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
