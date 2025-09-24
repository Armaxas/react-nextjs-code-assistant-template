import { auth } from "@/auth";
import { updateChatTitle } from "@/actions/queries";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { chatId, title } = body;

    if (!chatId || !title || typeof title !== "string") {
      return Response.json(
        { error: "Chat ID and title are required" },
        { status: 400 }
      );
    }

    // Trim and validate title length
    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0 || trimmedTitle.length > 100) {
      return Response.json(
        { error: "Title must be between 1 and 100 characters" },
        { status: 400 }
      );
    }

    await updateChatTitle({ id: chatId, title: trimmedTitle });

    return Response.json({ success: true, title: trimmedTitle });
  } catch (error) {
    console.error("Failed to update chat title:", error);
    return Response.json(
      { error: "Failed to update chat title" },
      { status: 500 }
    );
  }
}
