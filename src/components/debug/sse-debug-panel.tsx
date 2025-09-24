"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { quickSSETest, testSSEConnection } from "@/utils/test-sse";

/**
 * Debug component for testing SSE connections
 */
export const SSEDebugPanel = () => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [testRunning, setTestRunning] = React.useState(false);
  const cleanupRef = React.useRef<(() => void) | null>(null);

  const handleQuickTest = () => {
    setTestRunning(true);
    quickSSETest();
    setTimeout(() => setTestRunning(false), 10000);
  };

  const handleFullTest = () => {
    if (cleanupRef.current) {
      // Clean up previous test if exists
      cleanupRef.current();
      cleanupRef.current = null;
      setTestRunning(false);
    } else {
      setTestRunning(true);
      cleanupRef.current = testSSEConnection();
    }
  };

  return (
    <div className="fixed bottom-2 right-2 bg-slate-100 dark:bg-slate-800 p-2 rounded-md shadow-md z-50">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs"
        >
          {isExpanded ? "Hide SSE Debug" : "SSE Debug"}
        </Button>
      </div>

      {isExpanded && (
        <div className="mt-2 flex flex-col gap-2">
          <div className="text-xs text-slate-600 dark:text-slate-400">
            Test Server-Sent Events connection
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleQuickTest}
              disabled={testRunning}
              className="text-xs"
            >
              Quick Test (10s)
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleFullTest}
              className="text-xs"
            >
              {cleanupRef.current ? "Stop Test" : "Full Test"}
            </Button>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Check console for results
          </div>
        </div>
      )}
    </div>
  );
};

export default SSEDebugPanel;
