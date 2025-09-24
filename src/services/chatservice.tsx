import { urls } from "@/constants/constants";
import { generateUUID } from "@/lib/utils";
import { Message } from "@/types/types";

/* interface ChatResponse {
  status: string;
  new_thread_id?: object;
} */

export const sendChatStream = async (
  query: string,
  chatId: string,
  userName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChunk: any,
  selectedModel?: string // Add selectedModel parameter
): Promise<void> => {
  const controller = new AbortController();
  const timeout = Number.parseInt(
    process.env.NEXT_PUBLIC_CHAT_API_TIMEOUT ?? "90000"
  );

  const timeoutId = setTimeout(() => controller.abort(), timeout);
  const chatURL = `${process.env.NEXT_PUBLIC_CHAT_API_URL}${urls.apiQueryStream}`;

  try {
    const response = await fetch(chatURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        user_info: {
          name: userName,
          session_id: chatId,
        },
        formatInstructions: {
          requireSections: true,
          codeHighlighting: true,
          structuredResponse: true,
        },
        query,
        selectedModel, // Include selectedModel in the request body
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.body) {
      throw new Error("ReadableStream not supported in this browser.");
    }

    const reader = response.body?.getReader();
    while (true) {
      const { done, value } = await reader.read();
      onChunk(done, value);
      if (done) {
        reader.releaseLock();
        break;
      }
    }
  } catch (error) {
    const encoder = new TextEncoder();
    const errorMsg = `data: {"content": "Network Error - Please try again!", "done": false}`;
    const errorMsgEnd = `data: {"content": "", "done": true}`;
    onChunk(false, encoder.encode(errorMsg));
    onChunk(true, encoder.encode(errorMsgEnd));
    console.error("Error sending chat message:", error);
    // throw error;
  }
};

export const sendChatMessage = async (
  query: string,
  chatId: string,
  userName: string
): Promise<Message> => {
  const controller = new AbortController();
  const timeout = Number.parseInt(
    process.env.NEXT_PUBLIC_CHAT_API_TIMEOUT ?? "90000"
  );

  const timeoutId = setTimeout(() => controller.abort(), timeout);
  const chatURL = `${process.env.NEXT_PUBLIC_CHAT_API_URL}${urls.apiQuery}`;
  try {
    const response = await fetch(chatURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        user_info: {
          name: userName,
          session_id: chatId,
        },
        formatInstructions: {
          requireSections: true,
          codeHighlighting: true,
          structuredResponse: true,
        },
        query,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.body) {
      throw new Error("ReadableStream not supported in this browser.");
    }

    const data = await response.json();
    return {
      id: generateUUID(),
      content: data.response,
      role: "assistant",
    };
  } catch (error) {
    console.error("Error sending chat message:", error);
    throw error;
  }
};

export const chatNew = async (
  chatId: string,
  userName: string
): Promise<string> => {
  const controller = new AbortController();
  const timeout = Number.parseInt(
    process.env.NEXT_PUBLIC_CHAT_API_TIMEOUT ?? "90000"
  );

  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_CHAT_API_URL}${urls.apiChatNew}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          username: userName,
          session_id: chatId,
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.body) {
      throw new Error("No response from the chat reset body");
    }

    const data = await response.json();
    if (data.status === "success") {
      return data.new_thread_id;
    } else {
      return "";
    }
  } catch (error) {
    console.error("Error chat reset:", error);
    throw error;
  }
};

export const chatReset = async (
  chatId: string,
  userName: string
): Promise<boolean> => {
  const controller = new AbortController();
  const timeout = Number.parseInt(
    process.env.NEXT_PUBLIC_CHAT_API_TIMEOUT ?? "90000"
  );

  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_CHAT_API_URL}${urls.chatReset}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          username: userName,
          session_id: chatId,
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.body) {
      throw new Error("No response from the chat reset body");
    }

    const data = await response.json();
    if (data.status === "success") {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error chat reset:", error);
    throw error;
  }
};
