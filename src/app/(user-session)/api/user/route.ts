import { getUser } from "@/actions/queries";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  const user = await getUser(session?.user?.email);
  const user_session = { ...session?.user, ...user };
  return Response.json(user_session);
}
