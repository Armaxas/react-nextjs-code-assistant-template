// FastAPI GitHub Service - Connects to the new FastAPI backend endpoints

// Import the GitHub token utility
import { getGitHubAccessToken } from "@/actions/github-actions";

// Types for FastAPI GitHub API
interface GitHubQueryRequest {
  query: string;
  org_name: string;
  repo_name: string;
  user_info?: {
    name?: string;
    email?: string;
    session_id?: string;
  };
  github_token?: string; // Add GitHub token parameter
  messages?: Array<{
    // Add messages field for conversation history
    role: "user" | "assistant" | "system";
    content: string;
  }>;
}

interface ProcessingMetrics {
  cache_hits: number;
  cache_misses: number;
  parallel_operations: number;
  average_processing_time: number;
  execution_time: number;
  start_time: string;
  end_time: string;
}

interface GitHubQueryResponse {
  answer: string;
  tools_used: string[];
  raw_data?: Record<string, unknown>;
  metrics: ProcessingMetrics;
}

interface GitHubHealthResponse {
  status: string;
  message: string;
  github_api?: string;
  github_integration?: string;
  api_base_url?: string;
  rate_limit?: {
    remaining: number;
    limit: number;
    reset: number;
  };
}

interface RepositorySummaryResponse {
  org_name: string;
  repo_name: string;
  summary: Record<string, unknown>;
  timestamp: string;
}

interface GitHubQueryStreamRequest {
  query: string;
  repository?: string;
  context_types?: string[];
  chat_id?: string;
  user_id?: string;
  selectedModel?: string; // AI model selection
  messages?: Array<{
    // Changed from message_history to messages to match FastAPI backend
    role: "user" | "assistant" | "system";
    content: string;
  }>;
}

/**
 * FastAPI GitHub Service - Connects to the new FastAPI backend endpoints
 */
export class FastAPIGitHubService {
  private baseUrl: string;

  constructor() {
    // Use the FastAPI backend URL
    this.baseUrl =
      process.env.NEXT_PUBLIC_CHAT_API_URL || "http://localhost:8000";
  }

  /**
   * Check GitHub integration health
   */
  async checkHealth(githubToken?: string): Promise<GitHubHealthResponse> {
    try {
      // If no token provided, try to get it from session
      const token = githubToken || (await getGitHubAccessToken());

      const url = new URL(`${this.baseUrl}/api/github/health`);
      if (token) {
        url.searchParams.append("github_token", token);
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error(
          `Health check failed: ${response.status} ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("GitHub health check failed:", error);
      throw error;
    }
  }

  /**
   * Query GitHub repositories with AI-powered analysis
   */
  async queryGitHub(
    query: string,
    orgName: string,
    repoName: string,
    userInfo?: Record<string, unknown>,
    githubToken?: string,
    messages?: Array<{ role: "user" | "assistant" | "system"; content: string }> // Add messages parameter
  ): Promise<GitHubQueryResponse> {
    try {
      // If no token provided, try to get it from session
      const token = githubToken || (await getGitHubAccessToken());

      const requestData: GitHubQueryRequest = {
        query,
        org_name: orgName,
        repo_name: repoName,
        user_info: userInfo,
        github_token: token || undefined,
        messages: messages || [], // Include conversation history
      };

      const response = await fetch(`${this.baseUrl}/api/github/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `GitHub query failed: ${response.status} ${response.statusText} - ${
            errorData.detail || "Unknown error"
          }`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("GitHub query failed:", error);
      throw error;
    }
  }

  /**
   * Get repository summary
   */
  async getRepositorySummary(
    orgName: string,
    repoName: string,
    githubToken?: string
  ): Promise<RepositorySummaryResponse> {
    try {
      // If no token provided, try to get it from session
      const token = githubToken || (await getGitHubAccessToken());

      const url = new URL(
        `${this.baseUrl}/api/github/repository/${orgName}/${repoName}/summary`
      );
      if (token) {
        url.searchParams.append("github_token", token);
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Repository summary failed: ${response.status} ${response.statusText} - ${
            errorData.detail || "Unknown error"
          }`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Repository summary failed:", error);
      throw error;
    }
  }

  /**
   * Stream chat responses from FastAPI GitHub endpoint
   */
  async streamGitHubChat(
    request: GitHubQueryStreamRequest,
    githubToken?: string
  ): Promise<ReadableStream> {
    try {
      // If no token provided, try to get it from session
      const token = githubToken || (await getGitHubAccessToken());

      // Extract org and repo from repository string
      let orgName = "IBMSC";
      let repoName = "PRM";

      if (request.repository) {
        if (request.repository.includes("/")) {
          [orgName, repoName] = request.repository.split("/");
        } else {
          repoName = request.repository;
        }
      }

      console.log(`FastAPI Request: ${this.baseUrl}/api/github/query/stream`);
      console.log("Request payload:", {
        query: request.query,
        org_name: orgName,
        repo_name: repoName,
        user_info: {
          name: "anonymous",
          session_id: request.user_id || "anonymous",
          email: "anonymous@example.com",
        },
        github_token: token ? "[REDACTED]" : undefined, // Don't log the actual token
        messages: request.messages || [], // Add messages to the log
        selected_model: request.selectedModel, // Add selected model to the log
      });

      const response = await fetch(`${this.baseUrl}/api/github/query/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          query: request.query,
          org_name: orgName,
          repo_name: repoName,
          user_info: {
            name: "anonymous",
            session_id: request.user_id || "anonymous",
            email: "anonymous@example.com",
          },
          github_token: token || undefined,
          messages: request.messages || [], // ✅ Forward the conversation history!
          selected_model: request.selectedModel, // ✅ Include selected model
        }),
      });

      console.log("FastAPI Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("FastAPI error response:", errorText);

        // Try to parse the error as JSON
        let errorDetail = "Unknown error";
        try {
          const errorJson = JSON.parse(errorText);
          errorDetail = errorJson.detail || errorJson.message || errorText;
        } catch {
          errorDetail = errorText;
        }

        throw new Error(
          `FastAPI GitHub query failed: ${response.status} ${response.statusText} - ${errorDetail}`
        );
      }

      // Check if response is already a stream
      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        return new ReadableStream({
          start(controller) {
            async function pump() {
              try {
                while (true) {
                  const { done, value } = await reader.read();

                  if (done) {
                    controller.close();
                    break;
                  }

                  const chunk = decoder.decode(value, { stream: true });
                  const lines = chunk.split("\n");

                  for (const line of lines) {
                    if (line.startsWith("data: ")) {
                      try {
                        const jsonStr = line.slice(6); // Remove 'data: ' prefix
                        if (jsonStr.trim()) {
                          const data = JSON.parse(jsonStr);

                          // Handle different event types from the backend
                          if (data.event === "progress") {
                            // Progress events for agent status - log but don't forward to UI
                            console.debug(
                              "Progress event:",
                              data.content || data.message
                            );
                            // We don't enqueue these events anymore to avoid showing progress messages in the UI
                          } else if (data.event === "content" || data.content) {
                            // Content events for actual response
                            const contentData = JSON.stringify({
                              type: "content",
                              content: data.content,
                              done: data.done || false,
                              tools_used: data.tools_used,
                              metrics: data.metrics,
                            });
                            controller.enqueue(
                              new TextEncoder().encode(
                                `data: ${contentData}\n\n`
                              )
                            );
                          } else {
                            // Forward other data as-is
                            controller.enqueue(
                              new TextEncoder().encode(`data: ${jsonStr}\n\n`)
                            );
                          }
                        }
                      } catch (parseError) {
                        console.warn(
                          "Failed to parse streaming data:",
                          parseError
                        );
                        // Forward the raw line if parsing fails
                        controller.enqueue(
                          new TextEncoder().encode(`${line}\n`)
                        );
                      }
                    }
                  }
                }
              } catch (error) {
                console.error("Error in streaming pump:", error);
                const errorData = JSON.stringify({
                  type: "content",
                  content: "Error processing stream",
                  done: true,
                });
                controller.enqueue(
                  new TextEncoder().encode(`data: ${errorData}\n\n`)
                );
                controller.close();
              }
            }

            pump();
          },
        });
      }

      // Fallback: If response is not a stream, handle as before
      const data = await response.json();
      console.log("FastAPI Response data:", data);

      const encoder = new TextEncoder();
      return new ReadableStream({
        start(controller) {
          try {
            // Send the response as chunks to simulate streaming
            const answer = data.answer || "No response generated";
            const words = answer.split(" ");
            const chunkSize = 10; // Words per chunk

            let index = 0;
            const sendChunk = () => {
              if (index < words.length) {
                const chunk = words.slice(index, index + chunkSize).join(" ");
                const chunkData = JSON.stringify({
                  type: "content",
                  content: chunk + " ",
                  done: false,
                });
                controller.enqueue(encoder.encode(`data: ${chunkData}\n\n`));
                index += chunkSize;
                setTimeout(sendChunk, 50); // Small delay between chunks
              } else {
                // Send final chunk with metadata
                const finalData = JSON.stringify({
                  type: "content",
                  content: "",
                  done: true,
                  tools_used: data.tools_used,
                  metrics: data.metrics,
                });
                controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));
                controller.close();
              }
            };

            sendChunk();
          } catch (error) {
            console.error("Error in streaming:", error);
            const errorData = JSON.stringify({
              type: "content",
              content: "Error processing response",
              done: true,
            });
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
            controller.close();
          }
        },
      });
    } catch (error) {
      console.error("FastAPI GitHub chat streaming failed:", error);

      // Return an error stream with detailed error information
      const encoder = new TextEncoder();
      return new ReadableStream({
        start(controller) {
          const errorMsg =
            error instanceof Error ? error.message : "Unknown error occurred";

          // Check if it's a LangChain parsing error and provide helpful guidance
          let helpfulMessage = errorMsg;
          if (
            errorMsg.includes(
              "Parsing LLM output produced both a final answer and a parse-able action"
            )
          ) {
            helpfulMessage =
              "The AI assistant is experiencing a parsing issue. This usually happens when the model tries to use tools and provide a final answer simultaneously. The issue is on the backend side and may resolve with a retry.";
          }

          const errorData = JSON.stringify({
            type: "content",
            content: `⚠️ FastAPI Backend Error: ${helpfulMessage}\n\nFalling back to standard GitHub service...`,
            done: true,
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        },
      });
    }
  }

  /**
   * Reset the GitHub chat session
   */
  async resetGitHubChat(
    username: string,
    sessionId: string,
    orgName: string,
    repoName: string,
    githubToken?: string
  ): Promise<{ status: string; message: string }> {
    try {
      // If no token provided, try to get it from session
      const token = githubToken || (await getGitHubAccessToken());

      const response = await fetch(`${this.baseUrl}/api/github/reset-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          username: username,
          session_id: sessionId,
          org_name: orgName,
          repo_name: repoName,
          github_token: token,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorDetail = "Unknown error";
        try {
          const errorData = JSON.parse(errorText);
          errorDetail =
            errorData.detail || errorData.message || "Unknown error";
        } catch {
          errorDetail = errorText || "Unknown error";
        }

        throw new Error(
          `Chat reset failed: ${response.status} ${response.statusText} - ${errorDetail}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("GitHub chat reset failed:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const fastAPIGitHubService = new FastAPIGitHubService();

// Utility function to get user info from session
export async function getCurrentUserInfo(): Promise<Record<
  string,
  unknown
> | null> {
  try {
    // This would typically come from your authentication context
    // For now, return a basic structure
    return {
      name: "current_user", // You'll need to get this from your auth context
      session_id: Date.now().toString(), // Generate or get from session
      // email can be extracted from GitHub token or session
    };
  } catch (error) {
    console.error("Error getting user info:", error);
    return null;
  }
}
