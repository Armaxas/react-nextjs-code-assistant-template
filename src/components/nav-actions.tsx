"use client";

import * as React from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { PrintChat } from "@/types/types";
import { Printer } from "lucide-react";
import { AgentScratchpadToggle } from "@/components/agent-scratchpad-toggle";
import { SharedBadge } from "@/components/shared-badge";
import { ChatFeedbackSummary } from "@/components/feedback-indicator";
import { useFeedbackData } from "@/hooks/use-feedback-data";
import { useRouter } from "next/navigation";
export function NavActions({
  printChat,
  isScratchpadOpen,
  toggleScratchpad,
  chatId,
  onShareStatusChange,
}: Readonly<{
  printChat: PrintChat;
  isScratchpadOpen?: boolean;
  toggleScratchpad?: () => void;
  chatId?: string;
  onShareStatusChange?: () => void;
}>) {
  const router = useRouter();

  // Get feedback data for this chat
  const { hasFeedback, upvotes, downvotes, hasJiraIssues } = useFeedbackData(
    chatId || ""
  );

  // Create a noop function to handle undefined onShareStatusChange
  const handleShareStatusChange = React.useCallback(() => {
    if (onShareStatusChange) {
      onShareStatusChange();
    }
  }, [onShareStatusChange]);

  const navigateToFeedback = () => {
    if (chatId) {
      router.push(`/feedback?chatId=${chatId}`);
    }
  };

  return (
    <div className="flex items-center gap-3 text-sm">
      {chatId && (
        <div className="flex items-center">
          <SharedBadge
            chatId={chatId}
            onShareStatusChange={handleShareStatusChange}
          />
        </div>
      )}
      {chatId &&
        (hasFeedback || upvotes > 0 || downvotes > 0 || hasJiraIssues) && (
          <ChatFeedbackSummary
            upvotes={upvotes}
            downvotes={downvotes}
            hasJiraIssues={hasJiraIssues}
            onNavigateToFeedback={navigateToFeedback}
          />
        )}
      <div className="flex items-center gap-2">
        <ModeToggle />
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 flex items-center justify-center"
        onClick={() => printChat()}
        title="Export as PNG"
      >
        <Printer className="h-4 w-4" />
        <span className="sr-only">Export as PNG</span>
      </Button>
      {toggleScratchpad && isScratchpadOpen !== undefined && (
        <AgentScratchpadToggle
          isOpen={isScratchpadOpen}
          onClick={toggleScratchpad}
        />
      )}
    </div>
  );
}
