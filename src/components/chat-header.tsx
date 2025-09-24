"use client";
import { NavActions } from "./nav-actions";
import { PrintChat } from "@/types/types";
import { memo } from "react";
import { ViewModeToggle } from "@/components/view-mode-toggle";
import { ChatTitle } from "@/components/chat-title";
// import { SidebarToggleRight } from "./sidebar-toggle-right";

export function PureChatHeader({
  printChat,
  isScratchpadOpen,
  toggleScratchpad,
  chatId,
  onShareStatusChange,
  currentMode,
}: {
  printChat: PrintChat;
  isScratchpadOpen?: boolean;
  toggleScratchpad?: () => void;
  chatId?: string;
  onShareStatusChange?: () => void;
  currentMode?: "chat" | "blueprint";
}) {
  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2">
      {/* Chat title with dropdown */}
      {chatId && (
        <div className="flex-1">
          <ChatTitle chatId={chatId} />
        </div>
      )}
      <div className="flex items-center gap-3 ml-auto">
        {currentMode && <ViewModeToggle currentMode={currentMode} />}
      </div>
      <div className="flex px-3">
        <NavActions
          printChat={printChat}
          isScratchpadOpen={isScratchpadOpen}
          toggleScratchpad={toggleScratchpad}
          chatId={chatId}
          onShareStatusChange={onShareStatusChange}
        />
      </div>
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader);
