import { auth } from "@/auth";
import { formatUserName } from "@/lib/utils";
import { chatReset } from "@/services/chatservice";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  const user = formatUserName(session?.user?.name ?? "");
  try {
    const body = await req.json();
    const resp = await chatReset(body.chatId, user);
    if (resp) return Response.json({ status: "ok", resp });
    return Response.json({ status: "error" });
  } catch (error) {
    console.error("Failed to get AI response:", error);
    // Optionally, you can add an error message to the chat
    //
  }
}
