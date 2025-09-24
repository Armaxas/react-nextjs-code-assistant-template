export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { getGitHubAccessToken } from "@/actions/github-actions";
import { sendChatStream } from "@/services/github-chat-service";
import { DEFAULT_REPOS } from "@/services/github-service";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return Response.json(
        {
          status: "error",
          message: "Unauthorized access",
        },
        { status: 401 }
      );
    }

    const requestData = await req.json();
    const { chatId, messageId, userMessageId, messages } = requestData;

    // If this is a chat message, process it via the streaming API
    if (messages && chatId && messageId) {
      // Get GitHub access token from the session
      const githubToken = await getGitHubAccessToken();

      if (!githubToken) {
        return Response.json(
          {
            status: "error",
            message: "GitHub authentication required",
          },
          { status: 403 }
        );
      }

      // Pass the GitHub context flag to the chat service
      const stream = await sendChatStream(messages, {
        userId,
        chatId,
        messageId,
        userMessageId,
        githubContext: true,
      });

      return new Response(stream);
    }

    // Otherwise return basic info
    return Response.json({
      status: "GitHub API is working",
      received: requestData,
      availableRepos: DEFAULT_REPOS,
    });
  } catch (error) {
    console.error("GitHub API error:", error);
    return Response.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
