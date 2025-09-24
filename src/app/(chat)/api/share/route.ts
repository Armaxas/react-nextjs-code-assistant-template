import { auth } from "@/auth";
import { shareChat, unshareChat, getSharedUsers } from "@/actions/queries";

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const { chatId, usersToShareWith } = body;

    if (!chatId || !usersToShareWith) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await shareChat({
      chatId,
      userId: session.user.id,
      usersToShareWith,
    });

    if (!result.success) {
      return Response.json({ error: result.error }, { status: 403 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error sharing chat:", error);
    return Response.json({ error: "Failed to share chat" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");
    const userIdToRemove = searchParams.get("userId") || "all";

    if (!chatId) {
      return Response.json(
        { error: "Missing chatId parameter" },
        { status: 400 }
      );
    }

    const result = await unshareChat({
      chatId,
      userId: session.user.id,
      userIdToRemove,
    });

    if (!result.success) {
      return Response.json({ error: result.error }, { status: 403 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error unsharing chat:", error);
    return Response.json({ error: "Failed to unshare chat" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");

    if (!chatId) {
      return Response.json(
        { error: "Missing chatId parameter" },
        { status: 400 }
      );
    }

    const result = await getSharedUsers({
      chatId,
      userId: session.user.id,
      userEmail: session.user.email!, // <-- non-null assertion
    });

    if (!result.success) {
      // Instead of returning a 403 error, return a successful response with empty data
      // This prevents console errors while maintaining the same UI behavior
      return Response.json({
        success: true,
        sharedWith: [],
        owner: null,
        userIsNotOwner: true, // Add a flag to indicate the user isn't the owner
      });
    }

    return Response.json(result);
  } catch (error) {
    console.error("Error getting shared users:", error);
    return Response.json(
      { error: "Failed to get shared users" },
      { status: 500 }
    );
  }
}
