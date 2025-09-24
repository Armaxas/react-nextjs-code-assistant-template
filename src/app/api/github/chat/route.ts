export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { WatsonxLLM } from "@langchain/community/llms/ibm";
import { buildGitHubContext } from "@/services/github-context-service";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages: Message[];
  chatId: string;
  messageId: string;
  userId: string;
  userMessageId: string;
  query: string;
  selectedModel?: string;
  repository?: string;
  contextTypes?: ("commits" | "prs" | "issues" | "files" | "releases")[];
  formatInstructions?: {
    requireSections?: boolean;
    codeHighlighting?: boolean;
    structuredResponse?: boolean;
  };
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Unauthorized access",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const requestData: ChatRequest = await req.json();
    const {
      messages,
      selectedModel,
      repository,
      contextTypes = ["commits", "prs", "files"],
      formatInstructions = {},
    } = requestData;

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Messages are required for chat",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Fetch actual GitHub context if repository is specified
    let gitHubContext = "";
    let gitHubSources: string[] = [];

    if (repository && contextTypes && contextTypes.length > 0) {
      try {
        console.log(
          `Fetching GitHub context for repository: ${repository}, types: ${contextTypes.join(", ")}`
        );

        const contextResult = await buildGitHubContext({
          repository,
          contextTypes,
          query: messages[messages.length - 1]?.content || "",
          organization: "IBMSC", // Default organization
          maxTokens: 4000, // Reserve tokens for context
        });

        gitHubContext = contextResult.content;
        gitHubSources = contextResult.sources;

        console.log(
          `GitHub context fetched: ${gitHubContext.length} characters, ${gitHubSources.length} sources`
        );
      } catch (contextError) {
        console.error("Failed to fetch GitHub context:", contextError);
        // Continue without context rather than failing
      }
    }

    // Build context-aware prompt for GitHub repository insights with JIRA integration
    const systemPrompt = `You are a specialized GitHub Repository Insights assistant with access to real repository information and integrated JIRA data. 
You help developers gain deep insights into repositories, analyze pull requests, examine commit patterns, understand contributor behavior, and track project evolution.
You can also provide insights about related JIRA issues when they are referenced in pull requests or commits.

Repository: ${repository || "Not specified"}
Context Types: ${contextTypes.join(", ")}

${
  gitHubContext
    ? `
## REAL-TIME REPOSITORY CONTEXT:
${gitHubContext}

Sources: ${gitHubSources.join(", ")}
`
    : ""
}

Guidelines:
- Focus on repository insights, patterns, and trends rather than just code explanations
- Analyze pull request patterns, commit behaviors, and contributor dynamics
- Provide actionable insights about repository health and development practices
- Use the real-time context provided above when answering questions
- When JIRA issues are mentioned or referenced, provide relevant insights about their relationship to the code changes
- Use code examples when appropriate
- Structure responses clearly with sections when requested
- Be concise but comprehensive
- Focus on practical, actionable advice
- When analyzing code or repositories, provide specific insights based on the context
- If repository context is available, tailor responses to that specific codebase
- Always reference specific commits, PRs, or files when they're mentioned in the context
- Connect JIRA issue context with GitHub activities to provide comprehensive development insights
- When discussing PRs, include information about linked JIRA issues if available

${formatInstructions.requireSections ? "Structure your response with clear sections using markdown headers." : ""}
${formatInstructions.codeHighlighting ? "Use proper code syntax highlighting in code blocks." : ""}
${formatInstructions.structuredResponse ? "Provide well-organized, structured responses." : ""}
`;

    // Prepare messages for the LLM
    const conversationMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages,
    ];

    // Create the prompt from the conversation
    const conversationText = conversationMessages
      .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join("\n\n");

    const promptTemplate = `${conversationText}

ASSISTANT: `;

    try {
      // Initialize WatsonX LLM
      const model = new WatsonxLLM({
        model: selectedModel || "ibm/granite-3-2-8b-instruct",
        watsonxAIAuthType: "iam",
        watsonxAIApikey: process.env.WATSONX_API_KEY || "",
        serviceUrl: "https://us-south.ml.cloud.ibm.com",
        projectId: process.env.WATSONX_PROJECT_ID || "",
        version: "2023-05-29",
        maxNewTokens: 8000,
        minNewTokens: 50,
        temperature: 0.7,
        topP: 0.9,
      });

      // Create a ReadableStream for streaming response
      const encoder = new TextEncoder();

      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Generate response using the model
            const response = await model.invoke(promptTemplate);

            if (!response || response.trim() === "") {
              console.error("Empty response generated by the model");
              const errorData = JSON.stringify({
                content:
                  "I'm sorry, I couldn't generate a response. Please try again.",
                done: true,
              });
              controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
              controller.close();
              return;
            }

            // Clean up the response
            const cleanedResponse = response.trim();

            // Stream the response in chunks (simulating streaming)
            const words = cleanedResponse.split(" ");
            const chunkSize = 10; // Words per chunk

            for (let i = 0; i < words.length; i += chunkSize) {
              const chunk = words.slice(i, i + chunkSize).join(" ");
              const chunkData = JSON.stringify({
                content: chunk + (i + chunkSize < words.length ? " " : ""),
                done: false,
              });

              controller.enqueue(encoder.encode(`data: ${chunkData}\n\n`));

              // Small delay to simulate streaming
              await new Promise((resolve) => setTimeout(resolve, 50));
            }

            // Send final done message
            const doneData = JSON.stringify({
              content: "",
              done: true,
            });
            controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));
            controller.close();
          } catch (streamError) {
            console.error("Error in stream:", streamError);
            const errorData = JSON.stringify({
              content: "An error occurred while generating the response.",
              done: true,
            });
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    } catch (aiError) {
      console.error("WatsonX API request failed:", aiError);

      // Return error as streaming response
      const encoder = new TextEncoder();
      const errorStream = new ReadableStream({
        start(controller) {
          const errorData = JSON.stringify({
            content:
              "AI service is currently unavailable. Please try again later.",
            done: true,
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        },
      });

      return new Response(errorStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }
  } catch (error) {
    console.error("GitHub chat error:", error);

    return new Response(
      JSON.stringify({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
