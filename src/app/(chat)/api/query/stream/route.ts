import {
  getChatByIdWithPermissions,
  saveChat,
  saveMessages,
  getMessagesByChatId,
  updateChatTitle,
} from "@/actions/queries";
import { auth } from "@/auth";
import { generateUUID } from "@/lib/utils";
import { detectCodeLanguage } from "@/lib/code-utils";
import { sendChatStream } from "@/services/chatservice";
import { generateChatTitle } from "@/lib/title-generator";
import { Message } from "@/types/types";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!session.user?.id) {
    return new Response("User ID not found in session", { status: 401 });
  }
  if (!session.user.email) {
    return new Response("Email ID not found in session", { status: 401 });
  }

  const user = (session?.user?.name ?? "").replace(/ /g, "_").toLowerCase();
  try {
    const body = await req.json();

    const query = body.query.trim();
    const chatId = body.chatId;
    const selectedModel = body.selectedModel; // Extract selected model from request

    // Use session user ID instead of client-provided userId for security
    const userId = session.user.id;

    const chat = await getChatByIdWithPermissions({
      id: chatId,
      userId: userId,
      userEmail: session.user.email,
    });
    if (!chat) {
      // For new chats, create them first without a title to be non-blocking
      await saveChat({
        id: chatId,
        userId: userId, // Use session userId
        title: "New Chat", // Temporary title
      });

      // Generate title asynchronously in the background (non-blocking)
      // Only generate if this is truly a new chat with no existing messages
      generateTitleInBackground(chatId, query);
    } else {
      // Check if this is an existing chat with messages
      const existingMessages = await getMessagesByChatId({ id: chatId });

      // Only generate title if chat exists but has no messages yet (edge case)
      if (existingMessages.length === 0) {
        generateTitleInBackground(chatId, query);
      }
    }

    const userMessageId = generateUUID();
    await saveMessages({
      chatId: chatId,
      messages: [
        {
          id: userMessageId,
          content: query,
          role: "user",
          chatId: chatId,
          createdAt: new Date(),
        },
      ],
    });

    const assistantMessageId = generateUUID();
    const assistantMessage: Message = {
      id: assistantMessageId,
      content: "",
      role: "assistant",
      chatId: chatId,
      createdAt: new Date(),
      model: selectedModel, // Include the selected model in the assistant message
    };

    const responseMessage: string[] = [];

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const onChunk = (
          done: boolean,
          value: Uint8Array<ArrayBufferLike> | undefined
        ) => {
          if (!controller.desiredSize) {
            return;
          }
          const decoder = new TextDecoder("utf-8");
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");
          let currentEvent = "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              currentEvent = line.slice(7);
            } else if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(5));
                if (data.done) {
                  controller.close();
                  break;
                }
                // Handle different event types based on currentEvent
                let shouldProcess = false;
                let contentToSend = "";
                let eventType = "content";

                // Use the imported utility for language detection

                if (currentEvent === "progress" && data.content) {
                  eventType = "progress";
                  contentToSend = data.content;
                  shouldProcess = true;
                } else if (currentEvent === "code" && data.details?.response) {
                  // For code events, the actual code is in details.response
                  eventType = "code";
                  contentToSend = data.details.response;
                  shouldProcess = true;

                  // Auto-detect language if not provided
                  if (!data.language) {
                    data.language = detectCodeLanguage(contentToSend);
                  }
                } else if (!currentEvent && data.content) {
                  // Regular content events
                  eventType = "content";
                  contentToSend = data.content;
                  shouldProcess = true;
                }

                if (shouldProcess) {
                  // For code events, do not format as code blocks here
                  // Let the client handle this to avoid duplicate backticks
                  const jsonData = JSON.stringify({
                    content: contentToSend,
                    type: eventType,
                    done,
                    // Pass through details for progress events
                    ...(currentEvent === "progress" &&
                      data.details && { details: data.details }),
                    // Pass through code metadata for code events
                    ...(currentEvent === "code" && {
                      codeMetadata: {
                        language: data.language || "apex", // Default to apex for Salesforce code
                        filename: data.filename || "",
                        codeType: data.codeType || "",
                        metadata: data.metadata || {},
                        description: data.details?.description || "",
                      },
                    }),
                  });

                  // Add all non-progress content to response message
                  if (currentEvent !== "progress") {
                    responseMessage.push(contentToSend);
                  }
                  controller.enqueue(encoder.encode(`data: ${jsonData}\n\n`));
                }
              } catch (e) {
                console.error("Error parsing streaming data:", e);
              }
              currentEvent = ""; // Reset event type after processing
            }
          }
        };
        await sendChatStream(body.query, chatId, user, onChunk, selectedModel);

        await saveMessages({
          chatId: chatId,
          messages: [
            {
              ...assistantMessage,
              content: responseMessage.join(""),
            },
          ],
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Failed to get AI response:", error);
    return Response.json(
      { error: "Failed to get AI response" },
      { status: 500 }
    );
  }
}

// Background function to generate title without blocking the stream
async function generateTitleInBackground(chatId: string, query: string) {
  try {
    console.log("Generating title in background for chat:", chatId);

    const generatedTitle = await generateChatTitle(query);
    console.log("Generated title:", generatedTitle);

    // Update the existing chat's title using updateChatTitle
    await updateChatTitle({
      id: chatId,
      title: generatedTitle,
    });

    console.log("Updated chat with generated title:", generatedTitle);

    // Optionally, you could implement a WebSocket or Server-Sent Events mechanism here
    // to notify the client immediately about the title update
  } catch (error) {
    console.error("Failed to generate title in background:", error);

    // Fallback to truncated query
    const fallbackTitle = query.slice(0, 40);
    await updateChatTitle({
      id: chatId,
      title: fallbackTitle,
    });

    console.log("Updated chat with fallback title:", fallbackTitle);
  }
}
