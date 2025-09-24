/**
 * Utility functions for debugging requirement analysis streams
 */

interface AnalysisEventData {
  step?: string;
  description?: string;
  content?: string;
  progress_percentage?: number;
  done?: boolean;
  details?: {
    analysis?: Record<string, unknown>;
  };
  analysis?: Record<string, unknown>;
  metrics?: Record<string, unknown>;
}

/**
 * Log event details in a structured way
 *
 * @param eventType The type of event
 * @param data The event data
 */
export const logAnalysisEvent = (
  eventType: string,
  data: AnalysisEventData
): void => {
  const isDarkMode = window?.matchMedia?.(
    "(prefers-color-scheme: dark)"
  )?.matches;

  // Style for console headers
  const headerStyle = `
    font-weight: bold;
    padding: 3px 5px;
    border-radius: 3px;
    color: ${isDarkMode ? "#fff" : "#000"};
    background: ${isDarkMode ? "#444" : "#eee"}
  `;

  // Style based on event type
  const getEventStyle = (type: string) => {
    switch (type) {
      case "progress":
        return `background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;`;
      case "result":
        return `background: #2ecc71; color: white; padding: 2px 5px; border-radius: 3px;`;
      case "error":
        return `background: #e74c3c; color: white; padding: 2px 5px; border-radius: 3px;`;
      case "heartbeat":
        return `background: #95a5a6; color: white; padding: 2px 5px; border-radius: 3px;`;
      default:
        return `background: #9b59b6; color: white; padding: 2px 5px; border-radius: 3px;`;
    }
  };

  // Log the event header
  console.groupCollapsed(
    `%cAnalysis Event: %c${eventType}`,
    headerStyle,
    getEventStyle(eventType)
  );

  // Log event details
  if (data.step) {
    console.log(`📍 Step: ${data.step}`);
  }

  if (data.description) {
    console.log(`📝 Description: ${data.description}`);
  }

  if (data.content) {
    console.log(`💬 Content: ${data.content}`);
  }

  if (data.progress_percentage !== undefined) {
    console.log(`📊 Progress: ${data.progress_percentage}%`);
  }

  if (data.done !== undefined) {
    console.log(`✓ Complete: ${data.done}`);
  }

  if (data.details) {
    console.log("📋 Details:", data.details);
  }

  // For final results
  if (data.analysis) {
    console.log("📊 Analysis Results Found at Root Level");
    console.log("Analysis Keys:", Object.keys(data.analysis));
    console.log("📊 Analysis Results:", data.analysis);
  }

  // Check for analysis in details
  if (data.details && data.details.analysis) {
    console.log("📊 Analysis Results Found in details.analysis");
    console.log("Analysis Keys:", Object.keys(data.details.analysis));
  }

  if (data.metrics) {
    console.log("⏱️ Metrics:", data.metrics);
  }

  // Check for completion flag
  if (data.done) {
    console.log('✅ Event is marked as "done"');
  }

  // Full data object for reference
  console.log("🔍 Raw Event Data:", data);

  console.groupEnd();
};

/**
 * Parse and log an SSE event string
 *
 * @param eventString The raw event string from SSE
 */
export const parseAndLogSSEEvent = (eventString: string): void => {
  // Extract event type
  const eventTypeMatch = eventString.match(/^event:\s*(.+)$/m);
  const eventType = eventTypeMatch ? eventTypeMatch[1].trim() : "message";

  // Extract data
  const dataMatch = eventString.match(/^data:\s*(.+)$/m);
  if (dataMatch) {
    try {
      const data = JSON.parse(dataMatch[1].trim());
      logAnalysisEvent(eventType, data);
    } catch (e) {
      console.error("Failed to parse SSE event data:", e);
      console.log("Raw event string:", eventString);
    }
  } else {
    console.log("SSE event without data:", eventString);
  }
};
