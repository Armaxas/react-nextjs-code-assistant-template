"use client";

import { isToday, isYesterday, subMonths, subWeeks } from "date-fns";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import type { User } from "next-auth";
import { memo, useEffect, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";

import { ShareIcon, TrashIcon } from "@/components/icons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { fetcher, cn } from "@/lib/utils";
import { ChatType, Vote } from "@/types/types";
import { urls } from "@/constants/constants";
import { ShareDialog } from "@/components/share-dialog";
import {
  useBatchFeedbackData,
  useChatFeedbackData,
} from "@/hooks/use-feedback-data";
import { MessageSquare, ExternalLink, Edit3 } from "lucide-react";

type GroupedChats = {
  shared: ChatType[]; // Added to keep shared chats at the top
  today: ChatType[];
  yesterday: ChatType[];
  lastWeek: ChatType[];
  lastMonth: ChatType[];
  older: ChatType[];
};

const PureChatItem = ({
  chat,
  isActive,
  onDelete,
  onShare,
  setOpenMobile,
  votesByChat,
}: {
  chat: ChatType;
  isActive: boolean;
  onDelete: (chatId: string) => void;
  onShare: (chatId: string) => void;
  setOpenMobile: (open: boolean) => void;
  votesByChat?: Record<string, Vote[]>;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(chat.title);

  // Get feedback data for this chat using batched data
  const { hasFeedback, upvotes, downvotes, hasJiraIssues } =
    useChatFeedbackData(chat.id, votesByChat);

  const isShared =
    chat.visibility === "shared" ||
    (chat.sharedWith && chat.sharedWith.length > 0);

  const totalFeedback = upvotes + downvotes;
  const showFeedbackIndicator =
    hasFeedback || totalFeedback > 0 || hasJiraIssues;

  const handleRename = async () => {
    if (!newTitle.trim() || newTitle === chat.title) {
      setIsRenaming(false);
      setNewTitle(chat.title);
      return;
    }

    try {
      const response = await fetch("/api/chat/update-title", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId: chat.id,
          title: newTitle.trim(),
        }),
      });

      if (response.ok) {
        toast.success("Chat title updated successfully");
        // Trigger a refresh of the chat history
        window.location.reload();
      } else {
        toast.error("Failed to update chat title");
        setNewTitle(chat.title);
      }
    } catch {
      toast.error("Failed to update chat title");
      setNewTitle(chat.title);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRename();
    } else if (e.key === "Escape") {
      setIsRenaming(false);
      setNewTitle(chat.title);
    }
  };

  return (
    <SidebarMenuItem
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <SidebarMenuButton
        asChild
        isActive={isActive}
        className="flex items-center gap-1"
      >
        <Link href={`/chat/${chat.id}`} onClick={() => setOpenMobile(false)}>
          {isShared && (
            <span
              className="inline-flex items-center mr-1.5 px-1.5 py-0.5 rounded-md bg-emerald-500/20 dark:bg-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30 dark:hover:bg-emerald-400/40 transition-colors duration-150 group relative"
              aria-label={`Shared with ${chat.sharedWith?.length || 1} ${chat.sharedWith?.length === 1 ? "person" : "people"}`}
            >
              <ShareIcon size={12} className="mr-0.5 flex-shrink-0" />
              <span className="text-xs font-medium leading-none">
                {chat.sharedWith?.length || 1}
              </span>

              <span className="absolute -bottom-8 left-0 bg-sidebar-background border border-sidebar-border text-sidebar-foreground text-xs rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10 shadow-md">
                Shared with {chat.sharedWith?.length || 1}{" "}
                {chat.sharedWith?.length === 1 ? "person" : "people"}
              </span>
            </span>
          )}

          {/* Feedback Indicator */}
          {showFeedbackIndicator && (
            <span className="inline-flex items-center gap-1 mr-1 px-1.5 py-0.5 rounded-md bg-blue-500/20 dark:bg-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/30 dark:hover:bg-blue-400/40 transition-colors duration-150 group relative">
              <MessageSquare size={10} className="flex-shrink-0" />
              {totalFeedback > 0 && (
                <span className="text-xs font-medium leading-none">
                  {totalFeedback}
                </span>
              )}
              {hasJiraIssues && (
                <ExternalLink size={8} className="flex-shrink-0" />
              )}

              {/* Tooltip */}
              <span className="absolute -bottom-8 left-0 bg-sidebar-background border border-sidebar-border text-sidebar-foreground text-xs rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10 shadow-md">
                {totalFeedback > 0 &&
                  `${totalFeedback} feedback${totalFeedback === 1 ? "" : "s"}`}
                {totalFeedback > 0 && hasJiraIssues && " • "}
                {hasJiraIssues && "Has Jira issues"}
                {!totalFeedback && !hasJiraIssues && "Has feedback"}
              </span>
            </span>
          )}

          {isRenaming ? (
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleKeyPress}
              onBlur={handleRename}
              className="h-6 text-xs border-none bg-transparent focus:bg-sidebar-accent focus:ring-1 focus:ring-primary"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="truncate">{chat.title}</span>
          )}
        </Link>
      </SidebarMenuButton>
      <div
        className={cn(
          "flex items-center gap-1 transition-opacity duration-200 mr-0.5",
          isActive || isHovered ? "opacity-100" : "opacity-0"
        )}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsRenaming(true);
          }}
          className="p-1.5 rounded-md hover:bg-blue-200/30 hover:text-blue-600 dark:hover:text-blue-400"
          title="Rename chat"
        >
          <Edit3 size={14} />
          <span className="sr-only">Rename</span>
        </button>
        <button
          onClick={() => onShare(chat.id)}
          className="p-1.5 rounded-md hover:bg-emerald-200/30 hover:text-emerald-600 dark:hover:text-emerald-400"
          title="Share chat"
        >
          <ShareIcon size={14} />
          <span className="sr-only">Share</span>
        </button>
        <button
          onClick={() => onDelete(chat.id)}
          className="p-1.5 rounded-md hover:bg-destructive/15 hover:text-destructive dark:hover:text-red-500"
          title="Delete chat"
        >
          <TrashIcon size={14} />
          <span className="sr-only">Delete</span>
        </button>
      </div>
    </SidebarMenuItem>
  );
};

export const ChatItem = memo(PureChatItem, (prevProps, nextProps) => {
  if (prevProps.isActive !== nextProps.isActive) return false;
  return true;
});

export function SidebarHistory({ user }: { user: User | undefined }) {
  const { setOpenMobile } = useSidebar();
  const { id } = useParams();
  const pathname = usePathname();
  const {
    data: history,
    isLoading,
    mutate,
  } = useSWR<Array<ChatType>>(user ? urls.apiHistory : null, fetcher, {
    fallbackData: [],
    revalidateOnFocus: false,
  });

  // Batch load all feedback data
  const { votesByChat } = useBatchFeedbackData();

  useEffect(() => {
    if (user) {
      mutate();
    }
  }, [pathname, user, mutate]);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const router = useRouter();

  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareChatId, setShareChatId] = useState<string | null>(null);

  // Search functionality removed as requested
  const filteredHistory = history || [];

  const handleDelete = async () => {
    const deletePromise = fetch(`${urls.apiChat}?id=${deleteId}`, {
      method: "DELETE",
    });
    toast.promise(deletePromise, {
      loading: "Deleting chat...",
      success: async () => {
        mutate((history) => {
          if (history) {
            return history.filter((h) => h.chatId !== id);
          }
        });
        return "Chat deleted successfully";
      },
      error: "Failed to delete chat",
    });

    setShowDeleteDialog(false);
    if (deleteId === id) {
      router.push("/");
    }
  };

  if (!user) {
    return (
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupContent>
          <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
            Login to save and revisit previous chats!
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (isLoading) {
    return (
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
          Today
        </div>
        <SidebarGroupContent>
          <div className="flex flex-col">
            {[44, 32, 28, 64, 52].map((item) => (
              <div
                key={item}
                className="rounded-md h-8 flex gap-2 px-2 items-center"
              >
                <div
                  className="h-4 rounded-md flex-1 max-w-[--skeleton-width] bg-sidebar-accent-foreground/10"
                  style={
                    {
                      "--skeleton-width": `${item}%`,
                    } as React.CSSProperties
                  }
                />
              </div>
            ))}
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (history?.length === 0) {
    return (
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupContent>
          <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
            Your conversations will appear here once you start chatting!
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  const groupChatsByDate = (chats: ChatType[]): GroupedChats => {
    const now = new Date();
    const oneWeekAgo = subWeeks(now, 1);
    const oneMonthAgo = subMonths(now, 1);

    const groups: GroupedChats = {
      shared: [],
      today: [],
      yesterday: [],
      lastWeek: [],
      lastMonth: [],
      older: [],
    };

    chats.forEach((chat) => {
      // Check if chat is shared (either by the user or with the user)
      const isShared =
        chat.visibility === "shared" ||
        (chat.sharedWith && chat.sharedWith.length > 0);

      // Add to shared group if applicable and skip date categorization
      if (isShared) {
        groups.shared.push(chat);
        return; // Early return prevents date categorization
      }

      // Continue with date-based categorization for non-shared chats only
      const updatedDate = chat.lastModifiedAt ?? chat.createdAt;
      const chatDate = new Date(updatedDate);

      if (isToday(chatDate)) {
        groups.today.push(chat);
      } else if (isYesterday(chatDate)) {
        groups.yesterday.push(chat);
      } else if (chatDate > oneWeekAgo) {
        groups.lastWeek.push(chat);
      } else if (chatDate > oneMonthAgo) {
        groups.lastMonth.push(chat);
      } else {
        groups.older.push(chat);
      }
    });

    return groups;
  };

  return (
    <>
      <SidebarGroup className="group-data-[collapsible=icon]:hidden pt-2">
        <SidebarGroupContent>
          <SidebarMenu>
            {filteredHistory &&
              (() => {
                const groupedChats = groupChatsByDate(filteredHistory);

                return (
                  <>
                    {groupedChats.shared.length === 0 &&
                    groupedChats.today.length === 0 &&
                    groupedChats.yesterday.length === 0 &&
                    groupedChats.lastWeek.length === 0 &&
                    groupedChats.lastMonth.length === 0 &&
                    groupedChats.older.length === 0 ? (
                      <div className="p-4 text-center text-sidebar-foreground">
                        <p>No chats available</p>
                      </div>
                    ) : null}

                    {groupedChats.shared.length > 0 && (
                      <>
                        <div className="border-t border-gray-400 my-4 mx-2" />
                        <div className="px-2 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center">
                          <ShareIcon size={12} className="mr-1.5" />
                          Shared Chats
                        </div>
                        {groupedChats.shared.map((chat, idx) => (
                          <ChatItem
                            key={`sh-shared-${chat.id || idx}-${idx}`}
                            chat={chat}
                            isActive={chat.id === id}
                            onDelete={(chatId) => {
                              setDeleteId(chatId);
                              setShowDeleteDialog(true);
                            }}
                            onShare={(chatId) => {
                              setShareChatId(chatId);
                              setShowShareDialog(true);
                            }}
                            setOpenMobile={setOpenMobile}
                            votesByChat={votesByChat}
                          />
                        ))}
                      </>
                    )}

                    {groupedChats.today.length > 0 && (
                      <>
                        <div className="border-t border-gray-400 my-3 mx-2" />
                        <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                          Today
                        </div>
                        {groupedChats.today.map((chat, idx) => (
                          <ChatItem
                            key={`sh-today-${chat.id || idx}-${idx}`}
                            chat={chat}
                            isActive={chat.id === id}
                            onDelete={(chatId) => {
                              setDeleteId(chatId);
                              setShowDeleteDialog(true);
                            }}
                            onShare={(chatId) => {
                              setShareChatId(chatId);
                              setShowShareDialog(true);
                            }}
                            setOpenMobile={setOpenMobile}
                            votesByChat={votesByChat}
                          />
                        ))}
                      </>
                    )}

                    {groupedChats.yesterday.length > 0 && (
                      <>
                        <div className="border-t border-gray-400 my-0 mx-2" />
                        <div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-1">
                          Yesterday
                        </div>
                        {groupedChats.yesterday.map((chat, idx) => (
                          <ChatItem
                            key={`sh-yesterday-${chat.id || idx}-${idx}`}
                            chat={chat}
                            isActive={chat.id === id}
                            onDelete={(chatId) => {
                              setDeleteId(chatId);
                              setShowDeleteDialog(true);
                            }}
                            onShare={(chatId) => {
                              setShareChatId(chatId);
                              setShowShareDialog(true);
                            }}
                            setOpenMobile={setOpenMobile}
                            votesByChat={votesByChat}
                          />
                        ))}
                      </>
                    )}

                    {groupedChats.lastWeek.length > 0 && (
                      <>
                        <div className="border-t border-gray-400 my-0 mx-2" />
                        <div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-6">
                          Last 7 days
                        </div>
                        {groupedChats.lastWeek.map((chat, idx) => (
                          <ChatItem
                            key={`sh-lastWeek-${chat.id || idx}-${idx}`}
                            chat={chat}
                            isActive={chat.id === id}
                            onDelete={(chatId) => {
                              setDeleteId(chatId);
                              setShowDeleteDialog(true);
                            }}
                            onShare={(chatId) => {
                              setShareChatId(chatId);
                              setShowShareDialog(true);
                            }}
                            setOpenMobile={setOpenMobile}
                            votesByChat={votesByChat}
                          />
                        ))}
                      </>
                    )}

                    {groupedChats.lastMonth.length > 0 && (
                      <>
                        <div className="border-t border-gray-400 my-0 mx-2" />
                        <div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-6">
                          Last 30 days
                        </div>
                        {groupedChats.lastMonth.map((chat, idx) => (
                          <ChatItem
                            key={`sh-lastMonth-${chat.id || idx}-${idx}`}
                            chat={chat}
                            isActive={chat.id === id}
                            onDelete={(chatId) => {
                              setDeleteId(chatId);
                              setShowDeleteDialog(true);
                            }}
                            onShare={(chatId) => {
                              setShareChatId(chatId);
                              setShowShareDialog(true);
                            }}
                            setOpenMobile={setOpenMobile}
                            votesByChat={votesByChat}
                          />
                        ))}
                      </>
                    )}

                    {groupedChats.older.length > 0 && (
                      <>
                        <div className="border-t border-gray-400 my-0 mx-2" />
                        <div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-6">
                          Older
                        </div>
                        {groupedChats.older.map((chat, idx) => (
                          <ChatItem
                            key={`sh-older-${chat.id || idx}-${idx}`}
                            chat={chat}
                            isActive={chat.id === id}
                            onDelete={(chatId) => {
                              setDeleteId(chatId);
                              setShowDeleteDialog(true);
                            }}
                            onShare={(chatId) => {
                              setShareChatId(chatId);
                              setShowShareDialog(true);
                            }}
                            setOpenMobile={setOpenMobile}
                            votesByChat={votesByChat}
                          />
                        ))}
                      </>
                    )}
                  </>
                );
              })()}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              chat.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {shareChatId && (
        <ShareDialog
          chatId={shareChatId}
          isOpen={showShareDialog}
          onClose={() => {
            setShowShareDialog(false);
            setShareChatId(null);
          }}
          onShareComplete={() => {
            toast.success("Chat shared successfully!");
          }}
        />
      )}
    </>
  );
}

export function SidebarComingSoon() {
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
          Chat history feature will be coming soon!
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
