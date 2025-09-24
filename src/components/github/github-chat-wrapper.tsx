"use client";

import { GithubChat } from "@/components/github/github-chat";
import { Message } from "@/types/types";

export function GitHubChatWrapper() {
  // Generate a unique ID for the new chat session
  const chatId = `github-chat-${Math.random().toString(36).substring(2, 11)}`;

  // Create an empty array of messages with proper typing
  const initialMessages: Message[] = [];

  return <GithubChat id={chatId} initialMessages={initialMessages} />;
}
