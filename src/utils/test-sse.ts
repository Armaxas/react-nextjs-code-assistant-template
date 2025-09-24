/**
 * Test utility for Server-Sent Events (SSE) connections
 * This is a debugging tool to check if SSE connections are working properly
 */

/**
 * Create a test SSE connection to verify connectivity
 * @param endpoint The SSE endpoint to test
 * @returns A cleanup function to close the connection
 */
export const testSSEConnection = (
  endpoint: string = "/api/requirement-analyzer/analyze/stream"
) => {
  console.log(`Testing SSE connection to ${endpoint}...`);

  // Create a simple test request
  const testPayload = {
    requirement: "Test requirement for SSE connection",
    supporting_docs: [],
    user_info: {
      name: "test-user",
      session_id: "test-session-" + Date.now(),
    },
  };

  // Create headers for the fetch request
  const headers = new Headers({
    "Content-Type": "application/json",
    Accept: "text/event-stream",
  });

  // Create fetch options
  const options: RequestInit = {
    method: "POST",
    headers,
    body: JSON.stringify(testPayload),
    cache: "no-store" as RequestCache,
    credentials: "same-origin" as RequestCredentials,
  };

  // Perform the fetch
  fetch(endpoint, options)
    .then((response) => {
      console.log(
        "SSE Response received:",
        response.status,
        response.statusText
      );
      console.log(
        "Response headers:",
        Object.fromEntries([...response.headers])
      );

      if (!response.ok) {
        throw new Error(
          `SSE connection failed: ${response.status} ${response.statusText}`
        );
      }

      if (!response.body) {
        throw new Error("No response body available");
      }

      // Process the SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      console.log("Starting to process SSE stream...");

      function processStream() {
        reader
          .read()
          .then(({ done, value }) => {
            if (done) {
              console.log("SSE stream closed");
              return;
            }

            // Decode the chunk and add it to our buffer
            const chunk = decoder.decode(value, { stream: true });
            console.log(`Received SSE chunk: ${chunk.length} bytes`);
            console.log("Chunk content:", chunk);
            buffer += chunk;

            // Process complete events from the buffer
            let lineEnd = buffer.indexOf("\n\n");
            while (lineEnd > -1) {
              const event = buffer.substring(0, lineEnd);
              buffer = buffer.substring(lineEnd + 2);

              console.log("Parsed SSE event:", event);

              // Extract event type and data
              const eventMatch = event.match(/^event: (.+)$/m);
              const dataMatch = event.match(/^data: (.+)$/m);

              if (eventMatch && dataMatch) {
                const eventType = eventMatch[1];
                try {
                  const data = JSON.parse(dataMatch[1]);
                  console.log(`Event type: ${eventType}, Data:`, data);
                } catch (e) {
                  console.error("Failed to parse event data:", e);
                }
              }

              lineEnd = buffer.indexOf("\n\n");
            }

            // Continue processing the stream
            processStream();
          })
          .catch((err) => {
            console.error("Error reading SSE stream:", err);
          });
      }

      processStream();
    })
    .catch((error) => {
      console.error("Failed to establish SSE connection:", error);
    });

  // Return a cleanup function
  return () => {
    console.log("Cleaning up SSE test connection...");
    // Nothing to clean up since we're using the fetch API
  };
};

/**
 * Run a quick SSE test automatically
 */
export const quickSSETest = () => {
  console.log("Running quick SSE connection test...");
  const cleanup = testSSEConnection();

  // Automatically clean up after 10 seconds
  setTimeout(() => {
    console.log("Auto-cleaning up SSE test after 10s");
    cleanup();
  }, 10000);
};
