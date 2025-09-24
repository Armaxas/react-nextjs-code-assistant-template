"use client";

import { GitHubChatWrapper } from "@/components/github/github-chat-wrapper";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function GitHubChatPage() {
  const { status } = useSession();
  const router = useRouter();

  // Redirect to home page if user is not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      </div>
    );
  }

  // Show the chat interface
  return <GitHubChatWrapper />;
}
