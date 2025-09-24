import { urls } from "@/constants/constants";
import { Message } from "@/types/types";

interface ChatStreamOptions {
  userId: string;
  chatId: string;
  messageId: string;
  userMessageId: string;
  githubContext?: boolean;
  repository?: string;
  contextTypes?: ("commits" | "prs" | "issues" | "files" | "releases")[];
  useFastAPI?: boolean; // New option to use FastAPI backend
  selectedModel?: string; // AI model selection
}

export const sendChatStream = async (
  messages: Message[],
  options: ChatStreamOptions
): Promise<ReadableStream> => {
  // If FastAPI is enabled and GitHub context is requested, use FastAPI service
  if (options.useFastAPI && options.githubContext) {
    try {
      return await sendFastAPIChatStream(messages, options);
    } catch (error) {
      console.warn("FastAPI failed, falling back to standard service:", error);
      // Fall back to standard service by setting useFastAPI to false
      return sendChatStream(messages, { ...options, useFastAPI: false });
    }
  }

  // Original implementation for non-FastAPI requests
  const controller = new AbortController();
  const timeout = Number.parseInt(
    process.env.NEXT_PUBLIC_CHAT_API_TIMEOUT ?? "90000"
  );

  const timeoutId = setTimeout(() => controller.abort(), timeout);

  // Determine the last user message
  const userMessage = messages
    .filter((message) => message.role === "user")
    .pop();

  if (!userMessage) {
    throw new Error("No user message found");
  }

  // Convert messages to the format expected by the API
  const formattedMessages = messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  // Add GitHub context if needed
  if (options.githubContext) {
    // Add GitHub-specific instructions to the messages
    formattedMessages.unshift({
      role: "system",
      content:
        "You are a specialized GitHub Repository Insights assistant focused on analyzing repositories, pull requests, commits, and developer patterns. Provide comprehensive insights with actionable recommendations when appropriate.",
    });
  }

  // Build API URL - for GitHub context, use direct endpoint, otherwise use configured URL
  const endpoint = options.githubContext
    ? "/api/github/chat" // Use the GitHub RAG endpoint on same domain
    : urls.apiQueryStream;

  const chatURL = options.githubContext
    ? endpoint // Direct call to GitHub endpoint (no base URL needed)
    : `${process.env.NEXT_PUBLIC_CHAT_API_URL || ""}${endpoint}`;

  try {
    const response = await fetch(chatURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        messages: formattedMessages,
        chatId: options.chatId,
        messageId: options.messageId,
        userId: options.userId,
        userMessageId: options.userMessageId,
        query: userMessage.content,
        repository: options.repository,
        contextTypes: options.contextTypes || ["commits", "prs", "files"],
        selectedModel: options.selectedModel,
        useEnhancedSearch: true, // Enable enhanced search by default
        formatInstructions: {
          requireSections: true,
          codeHighlighting: true,
          structuredResponse: true,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error("ReadableStream not supported or response has no body.");
    }

    return response.body;
  } catch (error) {
    console.error("Error sending chat message:", error);

    // Create a stream that returns an error message
    const encoder = new TextEncoder();
    const errorMsg = `{"content": "Network Error - Please try again!", "done": false}`;
    const errorMsgEnd = `{"content": "", "done": true}`;

    const stream = new ReadableStream({
      start(ctrl) {
        ctrl.enqueue(encoder.encode(`data: ${errorMsg}\n\n`));
        ctrl.enqueue(encoder.encode(`data: ${errorMsgEnd}\n\n`));
        ctrl.close();
      },
    });

    return stream;
  }
};

// New FastAPI chat stream function
const sendFastAPIChatStream = async (
  messages: Message[],
  options: ChatStreamOptions
): Promise<ReadableStream> => {
  try {
    // Get the last user message for the query
    const userMessage = messages
      .filter((message) => message.role === "user")
      .pop();

    if (!userMessage) {
      throw new Error("No user message found");
    }

    // Call the FastAPI API route instead of the service directly
    // This ensures GitHub tokens are handled on the server side
    const response = await fetch("/api/github/fastapi", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: messages.map((msg) => ({
          role: msg.role,
          content:
            typeof msg.content === "string"
              ? msg.content
              : Array.isArray(msg.content)
                ? msg.content.map((item) => item.text).join(" ")
                : String(msg.content),
        })),
        repository: options.repository,
        orgName: "IBMSC", // Default organization
        contextTypes: options.contextTypes || ["commits", "prs", "files"],
        selectedModel: options.selectedModel, // Include selected model
      }),
    });

    if (!response.ok) {
      throw new Error(
        `FastAPI request failed: ${response.status} ${response.statusText}`
      );
    }

    if (!response.body) {
      throw new Error("No response body from FastAPI endpoint");
    }

    return response.body;
  } catch (error) {
    console.error("Error with FastAPI chat stream:", error);

    // Create a stream that returns an error message
    const encoder = new TextEncoder();
    const errorMsg = `{"content": "FastAPI Error - Falling back to standard service", "done": false}`;
    const errorMsgEnd = `{"content": "", "done": true}`;

    const stream = new ReadableStream({
      start(ctrl) {
        ctrl.enqueue(encoder.encode(`data: ${errorMsg}\n\n`));
        ctrl.enqueue(encoder.encode(`data: ${errorMsgEnd}\n\n`));
        ctrl.close();
      },
    });

    return stream;
  }
};
