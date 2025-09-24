"use client";

import useSWR, { useSWRConfig } from "swr";
import { useRouter } from "next/navigation";

import { ChatHeader } from "@/components/chat-header";
import { fetcher } from "@/lib/utils";

import { MultimodalInput } from "@/components/multimodal-input";
import { Messages } from "@/components/messages";
import { useChat } from "@/hooks/use-chat";
import { useModels } from "@/hooks/use-models";
import { urls } from "@/constants/constants";
import { useEffect, useState, useRef } from "react";
import { Message, PrintChat, Vote, FileAttachment } from "@/types/types";
import useScreenshotScroller from "@/hooks/use-screenshot-scroller";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

import { useUserSession } from "@/hooks/use-user-session";
import { UploadIcon } from "lucide-react";
// import { AgentScratchpad } from "@/components/agent-scratchpad";
import { AgentScratchpadDemo } from "@/components/agent-scratchpad-demo";
import { useSidebar } from "@/components/ui/sidebar";
import { Overview } from "@/components/overview";
import { useWhatsNew } from "@/hooks/use-whats-new";
import { WhatsNewModal } from "@/components/whats-new-modal";

export function Chat({
  id,
  initialMessages,
}: {
  id: string;
  initialMessages: Array<Message>;
}) {
  const { mutate } = useSWRConfig();
  const { theme, systemTheme } = useTheme();
  const selectedTheme: string | undefined =
    theme !== "system" ? theme : systemTheme;

  const router = useRouter();
  const { userSession } = useUserSession();

  // Define interface for the ref
  interface MultimodalInputRef {
    processDroppedFiles: (files: File[]) => Promise<void>;
    setInput: (value: string) => void;
  }

  // Add ref to MultimodalInput component with correct type
  const multimodalInputRef = useRef<MultimodalInputRef>(null);

  // Add state for drag over
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Add state to track chat sharing status
  const [shareRefresh, setShareRefresh] = useState(0);

  // Add state to control Agent Scratchpad visibility
  const [isScratchpadOpen, setIsScratchpadOpen] = useState<boolean>(false);
  // Get the sidebar state
  const { state: sidebarState } = useSidebar();
  const isSidebarExpanded = sidebarState === "expanded";

  // Get available models from configuration
  const { defaultModel } = useModels();

  // Add shared model selection state
  const [selectedModel, setSelectedModel] = useState(
    defaultModel || "ibm/granite-3-2-8b-instruct"
  );

  // What's New modal integration
  const { isModalOpen, hideModal, markAsSeen } = useWhatsNew();

  const {
    messages,
    input,
    setInput,
    handleSubmit: originalHandleSubmit,
    isLoading,
    stop,
    error,
    progressMessages,
  } = useChat({
    api: urls.chatQueryStream,
    id,
    userId: userSession?._id,
    initialMessages,
    onFinish: () => {
      mutate(urls.apiHistory);
    },
    onChatResetFinish: (response: {
      new_thread_id: string;
      chatId: string;
    }) => {
      console.log("chat reset finish:", response);
    },
  });

  // Use shareRefresh state to trigger re-fetching when share status changes
  const { data: votes } = useSWR<Array<Vote>>(
    [`/api/vote?chatId=${id}`, shareRefresh],
    ([url]) => fetcher(url)
  );

  // Fetch shared status data when needed - used by the shared badge component
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: sharedData } = useSWR<{
    success: boolean;
    sharedWith: Array<{ userId: string; name: string; email: string }>;
  }>([`/api/share?chatId=${id}`, shareRefresh], ([url]) => fetcher(url));

  useEffect(() => {
    if (error?.cause === 401) {
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  // Wrap original handleSubmit to also open scratchpad when query is submitted
  const handleSubmit = (event?: {
    preventDefault: () => void;
    files: FileAttachment[];
    cleanedInput: string;
  }) => {
    // Open the scratchpad when submitting a new query
    setIsScratchpadOpen(true);
    // Call the original handleSubmit
    return originalHandleSubmit(event);
  };

  const { containerRef, captureAndStitchScreenshots } =
    useScreenshotScroller(selectedTheme);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const printChat: PrintChat = async () => {
    setIsExporting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await captureAndStitchScreenshots();
    setIsExporting(false);
  };

  // Handle share status changes
  const handleShareStatusChange = () => {
    setShareRefresh((prev) => prev + 1);
    // Refresh chat history to update shared chats in the sidebar
    mutate(urls.apiHistory);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      <div className="sticky top-0 z-20 bg-background">
        <ChatHeader
          printChat={printChat}
          isScratchpadOpen={isScratchpadOpen}
          toggleScratchpad={() => setIsScratchpadOpen(!isScratchpadOpen)}
          chatId={id}
          onShareStatusChange={handleShareStatusChange}
          currentMode="chat"
        />
      </div>

      <div
        className={cn(
          "flex-1 flex flex-col bg-background relative",
          isDraggingOver && "ring-2 ring-primary"
        )}
        style={{
          height: "calc(100vh - 6rem)",
          width: isScratchpadOpen ? "50%" : "100%",
          marginRight: isScratchpadOpen ? "30%" : "0",
          paddingLeft: "1rem",
          overflowX: "hidden",
        }}
        ref={containerRef}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={async (e) => {
          e.preventDefault();
          setIsDraggingOver(false);
          const files = Array.from(e.dataTransfer.files);
          await multimodalInputRef.current?.processDroppedFiles(files);
        }}
      >
        {/* Show content based on whether there are messages */}
        {messages.length === 0 ? (
          /* Empty state with centered layout - show even during loading */
          <div className="flex-1 flex flex-col w-full min-h-0">
            {/* Overview section - takes up available space and centers content */}
            <div className="flex-1 flex items-center justify-center px-4 py-4">
              <Overview />
            </div>

            {/* Input section - fixed at bottom */}
            <div className="flex-shrink-0 w-full px-4 pb-4">
              <div className="w-full max-w-3xl mx-auto">
                <div className="bg-card rounded-2xl shadow-xl p-6">
                  <MultimodalInput
                    ref={multimodalInputRef}
                    input={input}
                    setInput={setInput}
                    handleSubmit={handleSubmit}
                    isLoading={isLoading}
                    stop={stop}
                    chatId={id}
                    messages={messages}
                    className="rounded-lg"
                    selectedModel={selectedModel}
                    setSelectedModel={setSelectedModel}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Normal chat view with messages and bottom-fixed input */
          <>
            <div
              className={cn("flex-1 pb-[90px] scroll-container", {
                "overflow-auto": !isScratchpadOpen,
                "overflow-hidden": isScratchpadOpen,
              })}
            >
              <Messages
                chatId={id}
                messages={messages}
                isLoading={isLoading}
                votes={votes}
                isExporting={isExporting}
                messageContainerRef={containerRef}
                progressMessages={progressMessages}
                isScratchpadOpen={isScratchpadOpen}
              />
            </div>

            {/* Floating input container - fixed at the bottom */}
            <div
              className="fixed bottom-0 bg-gradient-to-t from-background via-background/95 to-transparent px-4 z-10 pb-5 pt-8 transition-all duration-300"
              style={{
                left: isSidebarExpanded ? "16rem" : "3rem", // Adjust based on sidebar width
                right: isScratchpadOpen ? "50%" : 0,
              }}
            >
              {isDraggingOver && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-xl backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-primary">
                    <UploadIcon className="w-5 h-5" />
                    <span>Drop files to attach</span>
                  </div>
                </div>
              )}
              <div className="max-w-3xl mx-auto w-full">
                <MultimodalInput
                  ref={multimodalInputRef}
                  input={input}
                  setInput={setInput}
                  handleSubmit={handleSubmit}
                  isLoading={isLoading}
                  stop={stop}
                  chatId={id}
                  messages={messages}
                  className="shadow-lg rounded-xl"
                  selectedModel={selectedModel}
                  setSelectedModel={setSelectedModel}
                />
              </div>
            </div>
          </>
        )}

        {/* Agent Scratchpad */}
        <AgentScratchpadDemo
          isOpen={isScratchpadOpen}
          onClose={() => setIsScratchpadOpen(false)}
          messages={messages}
          isLoading={isLoading}
          progressMessages={progressMessages}
        />

        {/* What's New Modal - Auto-show for new users */}
        <WhatsNewModal
          isOpen={isModalOpen}
          onClose={hideModal}
          onMarkAsSeen={markAsSeen}
        />
      </div>
    </div>
  );
}
