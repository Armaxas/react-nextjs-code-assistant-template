import { urls } from "@/constants/constants";
import { generateUUID } from "@/lib/utils";
import { Message, FileAttachment } from "@/types/types";
import { useEffect, useRef, useState } from "react";
import {
  detectSalesforceLanguage,
  formatCodeAsMarkdown,
} from "./apex-language-helper";

// Extended interface for event with files and cleaned input
interface SubmitEvent {
  preventDefault?: () => void;
  files?: FileAttachment[];
  cleanedInput?: string; // New property for cleaned input text
  selectedModel?: string; // Add selectedModel property
}

export function useChat({
  api = urls.chatQueryStream,
  id,
  userId,
  initialMessages,
  onFinish,
  onChatResetFinish,
}: {
  api: string;
  id: string;
  userId: string | undefined;
  initialMessages: Array<Message>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onFinish: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChatResetFinish: any;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages ?? []);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [stopped, setStopped] = useState(false);
  const [progressMessages, setProgressMessages] = useState<Message[]>([]);
  const [showProgress, setShowProgress] = useState(true);
  const contentStartedRef = useRef(false);
  const analysisStateRef = useRef<{
    isInAnalysis: boolean;
    pendingContent: string;
  }>({
    isInAnalysis: false,
    pendingContent: "",
  });

  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      setMessages([...initialMessages]);
    }
  }, [initialMessages]);

  const resetChat = async () => {
    try {
      const response = await fetch(urls.chatReset, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          chatId: id,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const respNewChat = await newChat();
      return respNewChat;
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An error occurred"));
      return null;
    }
  };

  const newChat = async () => {
    try {
      const newChatId = generateUUID();
      const response = await fetch(urls.chatNew, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          chatId: newChatId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      onChatResetFinish(responseData);
      return responseData;
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An error occurred"));
      return null;
    }
  };

  const formatFilesForAPI = (
    inputText: string,
    files: FileAttachment[]
  ): string => {
    if (!files || files.length === 0) return inputText;

    const uploadedContent = files
      .map(
        (file) =>
          `Attached ${file.type} (${file.name}):\n\`\`\`${file.language}\n${file.content}\n\`\`\`\n\n`
      )
      .join("");

    return `${inputText}\n\n${uploadedContent}`;
  };

  // Helper function to process content with analysis tags
  const processAnalysisContent = (newContent: string) => {
    let processedContent = analysisStateRef.current.pendingContent + newContent;
    let finalContent = "";

    // Check if we're entering analysis mode
    const startAnalysisMatch = processedContent.match(/<start analysis>/);
    if (
      startAnalysisMatch &&
      !analysisStateRef.current.isInAnalysis &&
      startAnalysisMatch.index !== undefined
    ) {
      analysisStateRef.current.isInAnalysis = true;
      // Add content before analysis tag
      finalContent += processedContent.substring(0, startAnalysisMatch.index);
      // Keep the analysis tag and content after it for processing
      processedContent = processedContent.substring(startAnalysisMatch.index);
    }

    // Check if we're exiting analysis mode (handle all possible end tag variations)
    const endAnalysisMatch = processedContent.match(
      /<end analysis>|<\/start analysis>|<\/end analysis>/
    );
    if (
      endAnalysisMatch &&
      analysisStateRef.current.isInAnalysis &&
      endAnalysisMatch.index !== undefined
    ) {
      analysisStateRef.current.isInAnalysis = false;
      // Add all content including the end tag
      finalContent += processedContent.substring(
        0,
        endAnalysisMatch.index + endAnalysisMatch[0].length
      );
      // Keep any content after the end tag
      analysisStateRef.current.pendingContent = processedContent.substring(
        endAnalysisMatch.index + endAnalysisMatch[0].length
      );
    } else {
      // If we're in analysis mode or normal mode, add all content
      finalContent += processedContent;
      analysisStateRef.current.pendingContent = "";
    }

    // Additional check: if content ends with any analysis end tag variation, ensure analysis mode is properly exited
    if (
      analysisStateRef.current.isInAnalysis &&
      /<\/start analysis>|<\/end analysis>|<end analysis>$/.test(
        processedContent.trim()
      )
    ) {
      analysisStateRef.current.isInAnalysis = false;
    }

    return finalContent;
  };

  const handleSubmit = async (event?: SubmitEvent) => {
    event?.preventDefault?.();

    const files = event?.files || [];
    const hasFiles = files.length > 0;

    const messageText =
      event?.cleanedInput !== undefined ? event.cleanedInput : input;

    if (!messageText && !hasFiles) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setStopped(false);
    // Don't clear progress messages here, to preserve history
    contentStartedRef.current = false;

    // Reset analysis state for new conversation
    analysisStateRef.current = {
      isInAnalysis: false,
      pendingContent: "",
    };

    const messageContent = messageText;

    const apiMessageContent = formatFilesForAPI(messageText, files);

    const userMessage: Message = {
      id: generateUUID(),
      content: messageContent,
      role: "user",
      createdAt: new Date(),
      files: hasFiles ? files : undefined,
    };

    setMessages([...messages, userMessage]);

    const assistantMessage: Message = {
      id: generateUUID(),
      content: "",
      role: "assistant",
      createdAt: new Date(),
      model: event?.selectedModel, // Include the selected model in the assistant message
    };

    setInput("");

    try {
      interface ChatRequestBody {
        query: string;
        chatId: string;
        userId?: string;
        selectedModel?: string; // Add selectedModel to request body
        attached_files?: Array<{
          name: string;
          type: string;
          language: string;
          extension: string;
        }>;
      }

      const requestBody: ChatRequestBody = {
        query: apiMessageContent,
        chatId: id,
        userId: userId,
        selectedModel: event?.selectedModel, // Include selected model in request
      };

      if (hasFiles) {
        requestBody.attached_files = files.map((file) => ({
          name: file.name,
          type: file.type,
          language: file.language,
          extension: file.extension,
        }));
      }

      const response = await fetch(api, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      if (!response.body) {
        throw new Error("ReadableStream not supported");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();

        if (stopped) {
          reader.releaseLock();
          break;
        }

        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(5));

              if (data.done) {
                // Don't clear progress messages when done
                setShowProgress(true); // Reset progress visibility
                break;
              }

              // For GitHub API compatibility - handle responses that don't have a type field but do have content
              if (data.content && !data.type) {
                console.log("Received content from GitHub API:", data); // Debug log
                const processedContent = processAnalysisContent(data.content);

                if (!contentStartedRef.current) {
                  contentStartedRef.current = true;
                  // Don't clear progress messages when content starts
                  setMessages((messages) => [
                    ...messages,
                    { ...assistantMessage, content: processedContent },
                  ]);
                } else {
                  setMessages((messages) => {
                    const lastMessage = messages[messages.length - 1];
                    const updatedMessage = {
                      ...lastMessage,
                      content: lastMessage.content + processedContent,
                    };
                    return [...messages.slice(0, -1), updatedMessage];
                  });
                }
              }
              // Handle original message types
              else if (data.type === "progress") {
                // Add progress message to progressMessages state regardless of content started status
                console.log("Progress data received:", data); // Debug log
                setProgressMessages((prev) => [
                  ...prev,
                  {
                    id: generateUUID(),
                    content: data.content,
                    role: "assistant",
                    type: "progress",
                    createdAt: new Date(),
                    relatedToQuery: userMessage.id, // Track which query this progress message is related to
                    details: data.details, // Include details object from server response
                  },
                ]);
              } else if (data.type === "code") {
                // Handle code events - Format code for inclusion in message
                console.log("Code data received:", data); // Debug log

                // Get language from metadata or auto-detect
                let language = data.codeMetadata?.language || "apex";
                if (language === "text") {
                  language = detectSalesforceLanguage(data.content);
                }

                // Format the code with proper markdown without any header comments
                const codeBlock = formatCodeAsMarkdown(data.content, language);

                // Check if an assistant message already exists to append to
                if (!contentStartedRef.current) {
                  contentStartedRef.current = true;
                  // Create a new message with the code block
                  setMessages((messages) => [
                    ...messages,
                    {
                      ...assistantMessage,
                      content: codeBlock,
                    },
                  ]);
                } else {
                  setMessages((messages) => {
                    const lastMessage = messages[messages.length - 1];
                    if (lastMessage.role === "assistant") {
                      // Append code to existing assistant message with an extra line break
                      // to ensure separation between text and code
                      const updatedMessage = {
                        ...lastMessage,
                        content: lastMessage.content + "\n" + codeBlock,
                      };
                      return [...messages.slice(0, -1), updatedMessage];
                    } else {
                      // Start a new message if last message is not from assistant
                      return [
                        ...messages,
                        {
                          ...assistantMessage,
                          content: codeBlock,
                        },
                      ];
                    }
                  });
                }
              } else if (data.type === "content") {
                const processedContent = processAnalysisContent(data.content);

                if (!contentStartedRef.current) {
                  contentStartedRef.current = true;
                  // Don't clear progress messages when content starts
                  setMessages((messages) => [
                    ...messages,
                    { ...assistantMessage, content: processedContent },
                  ]);
                } else {
                  setMessages((messages) => {
                    const lastMessage = messages[messages.length - 1];
                    if (lastMessage.role === "assistant") {
                      // Append to existing assistant message
                      const updatedMessage = {
                        ...lastMessage,
                        content: lastMessage.content + processedContent,
                      };
                      return [...messages.slice(0, -1), updatedMessage];
                    } else {
                      // Start a new message if last message is not from assistant
                      return [
                        ...messages,
                        {
                          ...assistantMessage,
                          content: processedContent,
                        },
                      ];
                    }
                  });
                }
              }
            } catch (e) {
              console.error("Error parsing streaming data:", e);
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An error occurred"));
      return null;
    } finally {
      setIsLoading(false);
      // Don't clear progress messages when the response completes
      contentStartedRef.current = false;

      // Reset analysis state when streaming completes
      analysisStateRef.current = {
        isInAnalysis: false,
        pendingContent: "",
      };

      onFinish();
    }
  };

  const stop = () => {
    setStopped(true);
  };

  return {
    input,
    setInput,
    messages,
    handleSubmit,
    resetChat,
    newChat,
    isLoading,
    error,
    stop,
    progressMessages,
    showProgress,
    setShowProgress,
  };
}
