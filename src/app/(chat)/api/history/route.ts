import { auth } from "@/auth";
import { getAllUserChats, getUser } from "@/actions/queries";

export async function GET() {
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const user = await getUser(session?.user?.email);
  if (!user) {
    return Response.json([]);
  }

  if (!session.user.email) {
    throw new Error("Email is null");
  }

  // Get both user's own chats and shared chats
  // biome-ignore lint: Forbidden non-null assertion.
  const chats = await getAllUserChats({
    id: user._id.toString(),
    userEmail: session.user.email,
  });
  return Response.json(chats);
}
