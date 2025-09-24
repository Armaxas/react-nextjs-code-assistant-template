"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface FastAPIHealthIndicatorProps {
  enabled: boolean;
}

interface RateLimit {
  remaining: number;
  limit: number;
  reset: number;
}

interface FastAPIHealthData {
  status: string;
  message: string;
  fastapi_health?: {
    status: string;
    rate_limit?: RateLimit;
  };
  error?: string;
}

export function FastAPIHealthIndicator({
  enabled,
}: FastAPIHealthIndicatorProps) {
  const [healthStatus, setHealthStatus] = useState<
    "checking" | "healthy" | "error" | "disabled"
  >("disabled");
  const [healthData, setHealthData] = useState<FastAPIHealthData | null>(null);

  useEffect(() => {
    if (!enabled) {
      setHealthStatus("disabled");
      return;
    }

    const checkHealth = async () => {
      setHealthStatus("checking");
      try {
        // Call the API route instead of the service directly
        // This ensures GitHub tokens are handled on the server side
        const response = await fetch("/api/github/fastapi/health");

        if (!response.ok) {
          throw new Error(
            `Health check failed: ${response.status} ${response.statusText}`
          );
        }

        const health = await response.json();
        setHealthData(health);
        setHealthStatus(
          health.fastapi_health?.status === "healthy" ? "healthy" : "error"
        );
      } catch (error) {
        console.error("FastAPI health check failed:", error);
        setHealthStatus("error");
        setHealthData({
          status: "error",
          message: "Health check failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    };

    checkHealth();
  }, [enabled]);

  if (!enabled) {
    return (
      <Badge variant="secondary" className="text-xs">
        Standard Mode
      </Badge>
    );
  }

  const getStatusIcon = () => {
    switch (healthStatus) {
      case "checking":
        return <Loader2 className="w-3 h-3 animate-spin" />;
      case "healthy":
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case "error":
        return <XCircle className="w-3 h-3 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (healthStatus) {
      case "checking":
        return "Connecting...";
      case "healthy":
        return "FastAPI Connected";
      case "error":
        return "FastAPI Error";
      default:
        return "Disabled";
    }
  };

  const getStatusVariant = () => {
    switch (healthStatus) {
      case "healthy":
        return "default" as const;
      case "error":
        return "destructive" as const;
      default:
        return "secondary" as const;
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Badge
        variant={getStatusVariant()}
        className="text-xs flex items-center space-x-1"
      >
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </Badge>
      {healthStatus === "healthy" && healthData?.fastapi_health?.rate_limit && (
        <span className="text-xs text-gray-400">
          Rate Limit: {healthData.fastapi_health.rate_limit.remaining}/
          {healthData.fastapi_health.rate_limit.limit}
        </span>
      )}
    </div>
  );
}
