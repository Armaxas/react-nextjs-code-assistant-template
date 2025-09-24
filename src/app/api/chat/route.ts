import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import {
  deleteChatById,
  getChatById,
  getChatByIdWithPermissions,
  getUser,
} from "@/actions/queries";
import { ChatType } from "@/types/types";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Get the chat ID from the query params
  const searchParams = req.nextUrl.searchParams;
  const chatId = searchParams.get("id");

  if (!chatId) {
    return NextResponse.json({ error: "Chat ID is required" }, { status: 400 });
  }

  if (!session.user.email) {
    throw new Error("Email is null");
  }

  try {
    // Get the chat with permission checks
    const chat = await getChatByIdWithPermissions({
      id: chatId,
      userId: session.user.id,
      userEmail: session.user.email,
    });

    if (!chat) {
      return NextResponse.json(
        { error: "Chat not found or access denied" },
        { status: 404 }
      );
    }

    // Return the chat data
    return NextResponse.json(chat);
  } catch (error) {
    console.error("Error fetching chat:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Not Found", { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chat: ChatType | any = await getChatById({ id });

    const user = await getUser(session.user.email);

    if (chat && user && chat?.userId.toString() !== user._id.toString()) {
      return new Response("Unauthorized", { status: 401 });
    }

    await deleteChatById({ id });

    return new Response("Chat deleted", { status: 200 });
  } catch (error) {
    return new Response(
      "An error occurred while processing your request: " +
        JSON.stringify(error),
      {
        status: 500,
      }
    );
  }
}
