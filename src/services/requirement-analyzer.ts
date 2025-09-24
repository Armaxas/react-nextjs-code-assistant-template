import type {
  RequirementAnalysisRequest,
  RequirementAnalysisResponse,
  ProgressUpdate,
  AnalysisResult,
} from "@/types/requirement-analyzer";
import type { ProcessingMetrics } from "@/types/metrics";
import { logAnalysisEvent, parseAndLogSSEEvent } from "@/utils/analysis-logger";
import {
  validateSSEEvent,
  extractAnalysisFromEvent,
  extractMetricsFromEvent,
} from "@/utils/sse-helper";

/**
 * Type assertion helper to ensure analysis data matches expected structure
 */
function assertAnalysisResult(data: Record<string, unknown>): AnalysisResult {
  return data as unknown as AnalysisResult;
}

/**
 * Type assertion helper to ensure metrics data matches expected structure
 */
function assertProcessingMetrics(
  data: Record<string, unknown>
): ProcessingMetrics {
  return data as unknown as ProcessingMetrics;
}

/**
 * Stream a requirement analysis
 * @param request The analysis request
 * @param onProgress Callback for progress updates
 * @param onResult Callback for final result
 * @param onError Callback for errors
 */
export const streamRequirementAnalysis = async (
  request: RequirementAnalysisRequest,
  onProgress: (progress: ProgressUpdate) => void,
  onResult: (result: RequirementAnalysisResponse) => void,
  onError: (error: string) => void
) => {
  try {
    const response = await fetch("/api/requirement-analyzer/analyze/stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify(request),
      cache: "no-store" as RequestCache,
      credentials: "same-origin",
    });

    console.log(
      "Stream response received:",
      response.status,
      response.statusText
    );
    console.log("Response headers:", Object.fromEntries([...response.headers]));

    if (!response.ok) {
      let errorMessage = "Failed to analyze requirement";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        console.error("Could not parse error response:", e);
      }
      throw new Error(errorMessage);
    }

    if (!response.body) {
      throw new Error("No response stream available");
    }

    // Create a reader from the response body
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    // Process the stream
    let resultReceived = false;
    let timeoutTimer: NodeJS.Timeout | null = null;

    // Set a timeout to ensure we don't get stuck
    const setCompletionTimeout = () => {
      if (timeoutTimer) clearTimeout(timeoutTimer);

      timeoutTimer = setTimeout(() => {
        if (!resultReceived) {
          console.warn("SSE stream timeout - no completion event received");
          try {
            reader.cancel();
          } catch (e) {
            console.error("Error canceling reader:", e);
          }
          onError("Analysis timed out. The process took too long to complete.");
        }
      }, 300000); // 3 minutes timeout
    };

    setCompletionTimeout();

    while (true) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          console.log("Stream done signal received");

          // If we reached the end of the stream without receiving a result, notify
          if (!resultReceived) {
            console.warn("Stream completed without result event");
            onError("Stream closed before analysis was completed");
          }

          if (timeoutTimer) {
            clearTimeout(timeoutTimer);
          }

          break;
        }

        // Decode the chunk and add it to our buffer
        const chunk = decoder.decode(value, { stream: true });
        console.log("Received chunk:", chunk.length, "bytes");
        if (chunk.length < 200) {
          // Only log small chunks to avoid console flooding
          console.log("Chunk content:", chunk);
        }
        buffer += chunk;
      } catch (error) {
        console.error("Error reading from stream:", error);

        if (timeoutTimer) {
          clearTimeout(timeoutTimer);
        }

        // Only report error if we didn't already receive a result
        if (!resultReceived) {
          onError(
            `Error reading from stream: ${error instanceof Error ? error.message : String(error)}`
          );
        }

        break;
      }

      // Process complete events from the buffer
      let lineEnd = buffer.indexOf("\n\n");
      while (lineEnd > -1) {
        const line = buffer.substring(0, lineEnd);
        buffer = buffer.substring(lineEnd + 2);

        // Skip empty lines
        if (!line.trim()) {
          lineEnd = buffer.indexOf("\n\n");
          continue;
        }

        // Parse event data
        const dataMatch = line.match(/^data: (.+)$/m);
        const eventMatch = line.match(/^event: (.+)$/m);
        const eventType = eventMatch ? eventMatch[1] : "message";

        console.log(
          `Received SSE event: ${eventType}, data match: ${!!dataMatch}, line length: ${line.length}`
        );

        // Log the complete event for advanced debugging
        parseAndLogSSEEvent(line);

        if (eventType && dataMatch) {
          try {
            const data = JSON.parse(dataMatch[1]);
            logAnalysisEvent(eventType, data);

            switch (eventType) {
              case "progress":
                // Handle progress updates
                console.log("Progress update:", data.details);
                if (data.details) {
                  onProgress(data.details);
                }
                break;
              case "result":
                // Handle final result
                console.log("Final result received:", data);

                if (data.done) {
                  resultReceived = true;
                  if (timeoutTimer) {
                    clearTimeout(timeoutTimer);
                    timeoutTimer = null;
                  }

                  // Use helper to validate event and extract analysis
                  const validation = validateSSEEvent(data);
                  console.log("Event validation:", validation);

                  if (validation.hasAnalysis) {
                    const analysisData = extractAnalysisFromEvent(data);
                    const metricsData = extractMetricsFromEvent(data);

                    if (analysisData) {
                      console.log(
                        "Analysis data extracted successfully:",
                        Object.keys(analysisData)
                      );
                      onResult({
                        analysis: assertAnalysisResult(analysisData),
                        metrics: assertProcessingMetrics(metricsData),
                      });
                    } else {
                      console.warn(
                        "Failed to extract analysis data despite validation passing"
                      );
                    }
                  } else {
                    console.warn(
                      "Result event with done=true but validation failed:",
                      validation.errors
                    );
                  }
                }
                break;
              case "error":
                console.error("Stream error:", data.content);
                onError(data.content);
                break;
              case "heartbeat":
                console.log("Heartbeat received");
                break;
              default:
                // Fallback for events without explicit type or using data.type
                if (data.type === "error") {
                  console.error("Stream error:", data.content);
                  onError(data.content);
                } else if (data.type === "progress" && !data.done) {
                  console.log("Progress update via data.type:", data.details);
                  if (data.details) {
                    onProgress(data.details);
                  }
                } else if (data.type === "result" && data.done) {
                  console.log("Final result via data.type:", data);

                  resultReceived = true;
                  if (timeoutTimer) {
                    clearTimeout(timeoutTimer);
                    timeoutTimer = null;
                  }

                  // Use helper to validate event and extract analysis
                  const validation = validateSSEEvent(data);
                  console.log("Event validation via data.type:", validation);

                  if (validation.hasAnalysis) {
                    const analysisData = extractAnalysisFromEvent(data);
                    const metricsData = extractMetricsFromEvent(data);

                    if (analysisData) {
                      console.log(
                        "Analysis data extracted successfully via data.type:",
                        Object.keys(analysisData)
                      );
                      onResult({
                        analysis: assertAnalysisResult(analysisData),
                        metrics: assertProcessingMetrics(metricsData),
                      });
                    } else {
                      console.warn(
                        "Failed to extract analysis data despite validation passing (via data.type)"
                      );
                    }
                  } else {
                    console.warn(
                      "Result event via data.type but validation failed:",
                      validation.errors
                    );
                  }
                } else if (data.type === "heartbeat") {
                  console.log("Heartbeat received via data.type");
                } else {
                  console.log("Unhandled event type:", data.type || eventType);
                }
            }
          } catch (e) {
            console.error(
              "Error parsing stream data:",
              e,
              "Raw data:",
              dataMatch[1]
            );
          }
        }

        lineEnd = buffer.indexOf("\n\n");
      }
    }
  } catch (error) {
    onError(error instanceof Error ? error.message : String(error));
  }
};

/**
 * Direct (non-streaming) requirement analysis
 */
export const analyzeRequirement = async (
  request: RequirementAnalysisRequest
): Promise<RequirementAnalysisResponse> => {
  const response = await fetch("/api/requirement-analyzer/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to analyze requirement");
  }

  return response.json();
};
