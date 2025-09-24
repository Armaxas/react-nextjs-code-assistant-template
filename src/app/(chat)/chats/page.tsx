import { ChatExplorer } from "@/components/chat-explorer";
import { auth } from "@/auth";

export default async function ChatsPage() {
  const session = await auth();

  return (
    <div className="flex flex-col h-full">
      <ChatExplorer user={session?.user} />
    </div>
  );
}
