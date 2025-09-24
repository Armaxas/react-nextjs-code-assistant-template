// import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Chat } from "@/components/chat";
import { getChatById, getMessagesByChatId } from "@/actions/queries";
// import { DEFAULT_MODEL_NAME, models } from '@/lib/ai/models';
import { convertToUIMessages } from "@/lib/utils";
import { Message } from "@/types/types";
import { auth } from "@/auth";
// import { DataStreamHandler } from '@/components/data-stream-handler';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const params = await props.params;
  const { id } = params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chat: any = await getChatById({ id });

  if (!chat) {
    notFound();
  }

  // if (chat.visibility === "private") {
  if (!session || !session.user) {
    return notFound();
  }

  const isOwner = session.user.id === chat.userId.toString();
  const isSharedWithUser = chat.sharedWith?.some(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (entry: any) => entry.email === session.user.email
  );

  if (!isOwner && !isSharedWithUser) {
    console.log("User is not owner or sharedWith. Access denied.");
    return notFound();
  }

  // }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messagesFromDb: Message[] | any[] = await getMessagesByChatId({
    id,
  });

  return (
    <>
      <Chat
        id={id}
        initialMessages={convertToUIMessages(messagesFromDb)}
        // selectedModelId={selectedModelId}
        // selectedVisibilityType={chat.visibility}
        // isReadonly={session?.user?.id !== chat.userId}
      />
      {/* <DataStreamHandler id={id} /> */}
    </>
  );
}
