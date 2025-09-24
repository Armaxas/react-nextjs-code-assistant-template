import { auth } from "@/auth";
import { sendChatMessage } from "@/services/chatservice";

export async function POST(req: Request) {
  const session = await auth();
  const user = (session?.user?.name ?? "").replace(/ /g, "_").toLowerCase();
  try {
    const body = await req.json();
    const chatResponse = await sendChatMessage(body.query, body.chatId, user);
    return Response.json({ ...chatResponse });
  } catch (error) {
    console.error("Failed to get AI response:", error);
    // Optionally, you can add an error message to the chat
    //
  }
}
