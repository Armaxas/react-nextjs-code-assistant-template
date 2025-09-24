import { auth } from "@/auth";
import {
  getUser,
  getVotesByChatId,
  getAllVotes,
  voteMessage,
} from "@/actions/queries";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get("chatId");
  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (chatId) {
    // Get votes for a specific chat
    const votes = await getVotesByChatId({ id: chatId });
    return Response.json(votes, { status: 200 });
  } else {
    // Get all votes for batch loading
    const allVotes = await getAllVotes();
    return Response.json(allVotes, { status: 200 });
  }
}

export async function PATCH(request: Request) {
  try {
    const requestBody = await request.json();

    const {
      chatId,
      messageId,
      comments,
      rating,
      type,
      jiraIssue,
      category,
    }: {
      chatId: string;
      messageId: string;
      comments: string;
      rating: number;
      type: "up" | "down";
      category?: string;
      jiraIssue?: {
        issueKey: string;
        issueId: string;
        issueUrl: string;
        summary: string;
        description: string;
        status: string;
        assignee?: string;
        priority: string;
        labels: string[];
        attachments?: string[];
        createdDate: Date;
      };
    } = requestBody;

    if (!chatId || !messageId || !type) {
      return new Response("messageId and type are required", { status: 400 });
    }

    const session = await auth();

    if (!session || !session.user || !session.user.email) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Get the user from the database to obtain the user ID
    const user = await getUser(session.user.email);

    if (!user || !user._id) {
      return new Response("User not found", { status: 404 });
    }

    const voteParams = {
      chatId,
      messageId,
      comments,
      rating,
      type: type,
      userId: user._id.toString(),
      jiraIssue,
      category: category || "general",
    };

    await voteMessage(voteParams);

    return new Response("Message voted", { status: 200 });
  } catch (error) {
    console.error("Vote API error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
