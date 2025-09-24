import { auth } from "@/auth";
import { formatUserName } from "@/lib/utils";
import { chatNew } from "@/services/chatservice";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  const user = formatUserName(session?.user?.name ?? "");
  try {
    const body = await req.json();
    const resp = await chatNew(body.chatId, user);
    if (resp) {
      const splitStr = resp.split("_");

      return Response.json({
        new_thread_id: resp,
        chatId: splitStr[splitStr.length - 1],
      });
    }
    return Response.json({ status: "error" });
  } catch (error) {
    console.error("Failed to get AI response:", error);
    // Optionally, you can add an error message to the chat
    //
  }
}
