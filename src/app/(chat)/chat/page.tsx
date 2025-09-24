"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Chat } from "@/components/chat";
import { generateUUID } from "@/lib/utils";
import { useState } from "react";

export default function Page() {
  const chatId = generateUUID();
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <Chat key={chatId} id={chatId} initialMessages={[]} />
    </QueryClientProvider>
  );
}
