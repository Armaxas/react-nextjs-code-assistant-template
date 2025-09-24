/**
 * Helper utility for working with Server-Sent Events (SSE)
 */

interface SSEValidationResult {
  isValid: boolean;
  hasAnalysis: boolean;
  analysisPath: string;
  errors: string[];
}

/**
 * Validate the structure of an SSE event
 *
 * @param data The event data object
 * @returns An object with validation results
 */
export const validateSSEEvent = (data: unknown): SSEValidationResult => {
  const result: SSEValidationResult = {
    isValid: false,
    hasAnalysis: false,
    analysisPath: "",
    errors: [],
  };

  // Check basic structure
  if (!data) {
    result.errors.push("Event data is null or undefined");
    return result;
  }

  // Type guard to check if data is an object
  if (typeof data !== "object") {
    result.errors.push("Event data is not an object");
    return result;
  }

  const eventData = data as Record<string, unknown>;

  // Check for done flag
  if (eventData.done !== true) {
    result.errors.push('Event is not marked as "done"');
  }

  // Check for analysis data
  if (eventData.analysis) {
    result.hasAnalysis = true;
    result.analysisPath = "data.analysis";
  } else if (
    eventData.details &&
    typeof eventData.details === "object" &&
    (eventData.details as Record<string, unknown>).analysis
  ) {
    result.hasAnalysis = true;
    result.analysisPath = "data.details.analysis";
  } else if (
    eventData.details &&
    typeof eventData.details === "object" &&
    (eventData.details as Record<string, unknown>).step === "complete" &&
    (eventData.details as Record<string, unknown>).details &&
    typeof (eventData.details as Record<string, unknown>).details ===
      "object" &&
    (
      (eventData.details as Record<string, unknown>).details as Record<
        string,
        unknown
      >
    ).analysis
  ) {
    result.hasAnalysis = true;
    result.analysisPath = "data.details.details.analysis";
  } else {
    result.errors.push("No analysis data found in event");
  }

  // Event is valid if it has analysis data and no critical errors
  result.isValid =
    result.hasAnalysis &&
    (result.errors.length === 0 ||
      (result.errors.length === 1 &&
        result.errors[0] === 'Event is not marked as "done"'));

  return result;
};

/**
 * Extract analysis data from an SSE event, looking in various possible locations
 *
 * @param data The event data object
 * @returns The analysis data if found, or undefined
 */
export const extractAnalysisFromEvent = (
  data: unknown
): Record<string, unknown> | undefined => {
  if (!data || typeof data !== "object") return undefined;

  const eventData = data as Record<string, unknown>;

  // Try different possible locations
  if (eventData.analysis && typeof eventData.analysis === "object") {
    return eventData.analysis as Record<string, unknown>;
  }

  if (eventData.details && typeof eventData.details === "object") {
    const details = eventData.details as Record<string, unknown>;
    if (details.analysis && typeof details.analysis === "object") {
      return details.analysis as Record<string, unknown>;
    }
  }

  // Check for nested details structure
  if (eventData.details && typeof eventData.details === "object") {
    const details = eventData.details as Record<string, unknown>;
    if (details.step === "complete") {
      // For complete events, check various places
      let possibleAnalysis: unknown;

      if (details.details && typeof details.details === "object") {
        const nestedDetails = details.details as Record<string, unknown>;
        possibleAnalysis = nestedDetails.analysis || details;
      } else {
        possibleAnalysis = details;
      }

      // Validate if it looks like an analysis object
      if (
        possibleAnalysis &&
        typeof possibleAnalysis === "object" &&
        possibleAnalysis !== null
      ) {
        const analysis = possibleAnalysis as Record<string, unknown>;
        if (
          analysis.tasks ||
          analysis.key_components ||
          analysis.requirement_summary
        ) {
          return analysis;
        }
      }
    }
  }

  return undefined;
};

/**
 * Extract metrics from an SSE event
 *
 * @param data The event data object
 * @returns The metrics object or a default metrics object
 */
export const extractMetricsFromEvent = (
  data: unknown
): Record<string, unknown> => {
  if (!data || typeof data !== "object") return createDefaultMetrics();

  const eventData = data as Record<string, unknown>;

  // Try different possible locations
  if (eventData.metrics && typeof eventData.metrics === "object") {
    return eventData.metrics as Record<string, unknown>;
  }

  if (eventData.details && typeof eventData.details === "object") {
    const details = eventData.details as Record<string, unknown>;
    if (details.metrics && typeof details.metrics === "object") {
      return details.metrics as Record<string, unknown>;
    }
  }

  return createDefaultMetrics();
};

/**
 * Create a default metrics object
 */
const createDefaultMetrics = () => ({
  cache_hits: 0,
  cache_misses: 0,
  parallel_operations: 0,
  average_processing_time: 0,
  execution_time: 0,
  start_time: new Date().toISOString(),
  end_time: new Date().toISOString(),
});
