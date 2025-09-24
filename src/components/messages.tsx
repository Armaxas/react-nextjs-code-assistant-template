import { PreviewMessage, ThinkingMessage } from "@/components/message";
import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom";
import { useScrollFade } from "@/hooks/use-scroll-fade";
import { memo, Ref } from "react";
import equal from "fast-deep-equal";
import { Message, Vote } from "@/types/types";
import { Overview } from "@/components/overview";
import { cn } from "@/lib/utils";
import ScrollButtons from "./scroll-buttons";
import { AgentProgress } from "@/components/agent-progress";

interface MessagesProps {
  chatId: string;
  isLoading: boolean;
  isExporting: boolean;
  votes: Array<Vote> | undefined;
  messages: Array<Message>;
  messageContainerRef: Ref<HTMLDivElement> | undefined;
  progressMessages?: Array<Message>;
  isScratchpadOpen?: boolean;
}

function PureMessages({
  chatId,
  isLoading,
  isExporting,
  votes,
  messages,
  messageContainerRef,
  progressMessages = [],
  isScratchpadOpen = false,
}: MessagesProps) {
  const [messagesEndRef] = useScrollToBottom<HTMLDivElement>();

  // Apply scroll fade effect to the container
  useScrollFade(messageContainerRef as React.RefObject<HTMLDivElement>);

  return (
    <div
      ref={messageContainerRef}
      className={cn(
        "messages flex flex-col min-w-0 gap-6 h-full scroll-container",
        {
          "overflow-y-auto": !isExporting,
        }
      )}
    >
      {/* Wrap everything in a centered container with consistent padding */}
      <div className="max-w-3xl w-full mx-auto px-4 pb-4 pt-4">
        {messages.length === 0 && <Overview />}

        {messages.map((message, index) => {
          // Ensure every message has a truly unique key by combining multiple unique identifiers
          const messageKey =
            message.id ||
            `msg-${index}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

          const vote = votes
            ? votes.find((v) => v.messageId === message.id)
            : undefined;

          // Skip progress messages as they are handled separately
          if (message.type === "progress") {
            return null;
          }

          // If this is a user message, see if there are any related progress messages
          const isUserMessage = message.role === "user";
          const relatedProgressMessages =
            isUserMessage && message.id && progressMessages
              ? progressMessages.filter(
                  (pm) => pm.relatedToQuery === message.id
                )
              : [];

          // Debug log to trace progress messages
          if (isUserMessage && message.id) {
            console.log("User message ID:", message.id);
            console.log("All progress messages:", progressMessages);
            console.log("Related progress messages:", relatedProgressMessages);
          }

          // Only show progress component if there are related messages
          const showProgress = relatedProgressMessages.length > 0;

          return (
            <div key={messageKey} className="mb-6">
              {/* Show the message */}
              <PreviewMessage
                chatId={chatId}
                message={{
                  ...message,
                  id: message.id || messageKey,
                }}
                isLoading={isLoading && messages.length - 1 === index}
                vote={vote}
              />

              {/* Show progress messages after user message ONLY IF:
                  1. Progress messages exist for this query
                  2. Scratchpad is closed
                  3. This is the most recent user message (when isLoading is true) 
                     OR there's no assistant response yet for this query 
                  This ensures we don't duplicate completed progress in both places */}
              {isUserMessage &&
                showProgress &&
                !isScratchpadOpen &&
                ((isLoading && index === messages.length - 1) ||
                  // If this is not the latest message, only show progress if no assistant has responded
                  (index !== messages.length - 1 &&
                    !messages.some(
                      (m) =>
                        m.role === "assistant" &&
                        // Look for assistant messages that appear to be responses to this user message
                        // First by checking if they came after this message (if timestamps are available)
                        ((m.createdAt &&
                          message.createdAt &&
                          new Date(m.createdAt) >
                            new Date(message.createdAt)) ||
                          // If timestamps aren't available, check if the assistant message appears
                          // after this message in the array (implying it's a response)
                          messages.indexOf(m) > index)
                    ))) && (
                  <div className="mt-4 mb-2">
                    <AgentProgress
                      message={
                        relatedProgressMessages[
                          relatedProgressMessages.length - 1
                        ]
                      }
                      messages={relatedProgressMessages}
                    />
                  </div>
                )}
            </div>
          );
        })}

        {/* Enhanced ThinkingMessage logic: Show when loading but be more intelligent about agent progress */}
        {isLoading &&
          messages.length > 0 &&
          messages[messages.length - 1].role === "user" &&
          // Only show if there are no progress messages yet, or if progress messages exist but no actual analysis content yet
          (progressMessages.length === 0 ||
            !progressMessages.some((pm) => {
              const content = typeof pm.content === "string" ? pm.content : "";
              return (
                content.includes("<start analysis>") || content.length > 50
              ); // Has substantial content
            })) && <ThinkingMessage key={`thinking-${Date.now()}`} />}

        <div
          ref={messagesEndRef}
          className="message-end shrink-0 min-w-[24px] min-h-[24px] mb-2"
          id="messages-end-anchor"
        />
        <ScrollButtons targetRef={messagesEndRef} />
      </div>

      {/* Agent progress is now handled directly in the Chat component */}
    </div>
  );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (prevProps.isLoading && nextProps.isLoading) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;
  if (!equal(prevProps.votes, nextProps.votes)) return false;

  return true;
});
