"use client";

import { isToday, isYesterday, subMonths, subWeeks } from "date-fns";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import type { User } from "next-auth";
import { memo, useEffect, useState, useMemo, useRef } from "react";
import { toast } from "sonner";
import useSWR from "swr";

import {
  SearchIcon,
  ShareIcon,
  TrashIcon,
  FunnelIcon,
  CheckedSquare,
  UncheckedSquare,
} from "@/components/icons";
import { MessageSquare, ExternalLink, Edit3 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { SidebarProvider } from "@/components/ui/sidebar";
import { fetcher, cn } from "@/lib/utils";
import { ChatType, Vote } from "@/types/types";
import { urls } from "@/constants/constants";
import { SharedMenu } from "./share-menu";
import {
  useBatchFeedbackData,
  useChatFeedbackData,
} from "@/hooks/use-feedback-data";

type GroupedChats = {
  shared: ChatType[];
  today: ChatType[];
  yesterday: ChatType[];
  lastWeek: ChatType[];
  lastMonth: ChatType[];
  older: ChatType[];
};

const PureChatCard = ({
  chat,
  isActive,
  onDelete,
  onShare,
  selectionMode = false,
  isSelected = false,
  onToggleSelect,
  votesByChat,
}: {
  chat: ChatType;
  isActive: boolean;
  onDelete: (chatId: string) => void;
  onShare: (
    chatId: string,
    buttonRef: React.RefObject<HTMLButtonElement | null>
  ) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (chatId: string) => void;
  votesByChat?: Record<string, Vote[]>;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(chat.title || "Untitled Chat");
  const title = chat.title || "Untitled Chat";
  const shareButtonRef = useRef<HTMLButtonElement>(null);

  // Get feedback data for this chat using batched data
  const { hasFeedback, upvotes, downvotes, hasJiraIssues } =
    useChatFeedbackData(chat.id, votesByChat);
  const totalFeedback = upvotes + downvotes;
  const showFeedbackIndicator =
    hasFeedback || totalFeedback > 0 || hasJiraIssues;

  const handleToggleSelect = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleSelect) {
      onToggleSelect(chat.id);
    }
  };

  const handleRename = async () => {
    if (!newTitle.trim() || newTitle === title) {
      setIsRenaming(false);
      setNewTitle(title);
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
        setNewTitle(title);
      }
    } catch {
      toast.error("Failed to update chat title");
      setNewTitle(title);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRename();
    } else if (e.key === "Escape") {
      setIsRenaming(false);
      setNewTitle(title);
    }
  };

  // Card content
  const cardContent = (
    <div
      className={cn(
        "group relative rounded-md px-3 py-3 hover:bg-muted/50 transition-all shadow-sm border border-transparent",
        isActive && "bg-muted border-muted-foreground/20",
        isSelected && "bg-primary/10 border-primary/30"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={selectionMode ? handleToggleSelect : undefined}
    >
      <div className="flex justify-between items-center gap-2">
        <div className="flex items-center gap-2 flex-1">
          {selectionMode && (
            <div
              className="flex-shrink-0"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onToggleSelect) {
                  onToggleSelect(chat.id);
                }
              }}
            >
              {isSelected ? (
                <CheckedSquare size={18} />
              ) : (
                <UncheckedSquare size={18} />
              )}
            </div>
          )}

          {/* Feedback Indicator */}
          {showFeedbackIndicator && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-500/20 dark:bg-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/30 dark:hover:bg-blue-400/40 transition-colors duration-150 group relative">
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
              <span className="absolute -bottom-8 left-0 bg-background border border-border text-foreground text-xs rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10 shadow-md">
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
              className="h-6 text-sm border border-primary/20 bg-background focus:bg-background focus:ring-2 focus:ring-primary"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <h3
              className={cn("font-medium truncate", isActive && "text-primary")}
            >
              {title}
            </h3>
          )}
        </div>

        {!selectionMode && (isHovered || isActive) && (
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:text-blue-400"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsRenaming(true);
              }}
              title="Rename chat"
            >
              <Edit3 size={14} />
            </Button>
            <Button
              ref={shareButtonRef}
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:text-emerald-500"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onShare(chat.id, shareButtonRef);
              }}
            >
              <ShareIcon size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(chat.id);
              }}
            >
              <TrashIcon size={14} />
            </Button>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground truncate ml-0 mt-1">
        {new Date(chat.lastModifiedAt || chat.createdAt).toLocaleDateString()}
      </p>

      {chat.visibility === "shared" && chat.ownerName && (
        <span className="absolute top-10 right-1.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1">
          {/* <ShareIcon size={10} className="text-emerald-500" />  */}
          Owner: {chat.ownerName}
        </span>
      )}
    </div>
  );

  // If in selection mode, don't wrap in Link
  if (selectionMode) {
    return cardContent;
  }

  // Otherwise, wrap in Link for navigation
  return (
    <Link href={`/chat/${chat.id}`} passHref>
      {cardContent}
    </Link>
  );
};

const ChatCard = memo(PureChatCard, (prevProps, nextProps) => {
  if (prevProps.isActive !== nextProps.isActive) return false;
  if (prevProps.isSelected !== nextProps.isSelected) return false;
  if (prevProps.selectionMode !== nextProps.selectionMode) return false;
  return true;
});

export function ChatExplorer({ user }: { user: User | undefined }) {
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
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const router = useRouter();

  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareChatId, setShareChatId] = useState<string | null>(null);
  const [shareButtonRef, setShareButtonRef] =
    useState<React.RefObject<HTMLButtonElement | null> | null>(null);

  const [selectedChats, setSelectedChats] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    showShared: true,
    showToday: true,
    showYesterday: true,
    showLastWeek: true,
    showLastMonth: true,
    showOlder: true,
  });

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const groupChatsByDate = (chats: ChatType[]): GroupedChats => {
    const now = new Date();
    const oneWeekAgo = subWeeks(now, 1);
    const oneMonthAgo = subMonths(now, 1);

    return chats.reduce(
      (groups, chat) => {
        // Check if chat is shared
        const isShared =
          chat.visibility === "shared" ||
          (chat.sharedWith && chat.sharedWith.length > 0);

        // Add to shared group if applicable
        if (isShared) {
          groups.shared.push(chat);
          return groups;
        }

        // Date-based categorization for non-shared chats
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

        return groups;
      },
      {
        shared: [],
        today: [],
        yesterday: [],
        lastWeek: [],
        lastMonth: [],
        older: [],
      } as GroupedChats
    );
  };

  const filteredHistory = useMemo(() => {
    if (!history) return [];

    // First apply search filter
    const searchFiltered = !searchQuery
      ? history
      : history.filter((chat) =>
          chat.title.toLowerCase().includes(searchQuery.toLowerCase())
        );

    // Group chats by date
    const grouped = groupChatsByDate(searchFiltered);

    // Apply category filters
    const result: ChatType[] = [];

    if (filters.showShared) result.push(...grouped.shared);
    if (filters.showToday) result.push(...grouped.today);
    if (filters.showYesterday) result.push(...grouped.yesterday);
    if (filters.showLastWeek) result.push(...grouped.lastWeek);
    if (filters.showLastMonth) result.push(...grouped.lastMonth);
    if (filters.showOlder) result.push(...grouped.older);

    return result;
  }, [history, searchQuery, filters]);

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

  const handleBulkDelete = async () => {
    if (selectedChats.length === 0) return;

    // If there's only one chat selected, use the standard delete flow
    if (selectedChats.length === 1) {
      setDeleteId(selectedChats[0]);
      setShowDeleteDialog(true);
      return;
    }

    // For multiple chats, show a confirmation dialog with the count
    setShowBulkDeleteDialog(true);
  };

  const executeBulkDelete = async () => {
    if (selectedChats.length === 0) return;

    // Create a promise for each chat deletion
    const deletePromises = selectedChats.map((chatId) =>
      fetch(`${urls.apiChat}?id=${chatId}`, {
        method: "DELETE",
      })
    );

    toast.promise(Promise.all(deletePromises), {
      loading: `Deleting ${selectedChats.length} chats...`,
      success: async () => {
        // Handle navigation if current chat is being deleted
        if (selectedChats.includes(id as string)) {
          router.push("/");
        }

        // Refresh the chat list
        await mutate();
        setSelectedChats([]);
        setSelectionMode(false);
        setShowBulkDeleteDialog(false);
        return `Successfully deleted ${selectedChats.length} chats`;
      },
      error: "Failed to delete some chats",
    });
  };

  const handleShare = (
    chatId: string,
    buttonRef: React.RefObject<HTMLButtonElement | null>
  ) => {
    setShareChatId(chatId);
    setShareButtonRef(buttonRef);
    setShowShareMenu(true);
  };

  if (!user) {
    return (
      <div className="container mx-auto max-w-3xl p-4 text-center text-muted-foreground">
        Login to save and revisit previous chats!
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-3xl p-4">
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 rounded-md bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Group chats for UI display
  const groupedChats = groupChatsByDate(history || []);

  return (
    <SidebarProvider>
      <div className="container mx-auto max-w-3xl py-8 px-4 h-full overflow-auto">
        <div className="bg-background rounded-lg border shadow-sm flex flex-col h-full overflow-auto">
          {/* Changed from overflow-hidden to overflow-auto */}
          <div className="sticky top-0 z-10 bg-background p-4 border-b rounded-t-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Your chat history</h2>
                <span className="text-sm text-muted-foreground">
                  ({filteredHistory.length} chats)
                </span>
              </div>

              {selectionMode ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedChats(filteredHistory.map((chat) => chat.id));
                    }}
                    className="h-7 text-xs"
                  >
                    Select all
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleBulkDelete()}
                    disabled={selectedChats.length === 0}
                    className="h-7"
                  >
                    Delete{" "}
                    {selectedChats.length > 0
                      ? `(${selectedChats.length})`
                      : ""}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectionMode(false);
                      setSelectedChats([]);
                    }}
                    className="h-7"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectionMode(true)}
                  className="h-7"
                >
                  Select
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute left-2.5 top-2.5 text-muted-foreground">
                  <SearchIcon size={16} />
                </div>
                <Input
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="pl-9"
                />
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="shrink-0">
                    <div className="flex items-center justify-center">
                      <FunnelIcon size={16} />
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-3" align="end">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">Filter by</h4>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setFilters({
                              showShared: true,
                              showToday: true,
                              showYesterday: true,
                              showLastWeek: true,
                              showLastMonth: true,
                              showOlder: true,
                            })
                          }
                          className="h-7 px-2 text-xs"
                        >
                          Select all
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setFilters({
                              showShared: false,
                              showToday: false,
                              showYesterday: false,
                              showLastWeek: false,
                              showLastMonth: false,
                              showOlder: false,
                            })
                          }
                          className="h-7 px-2 text-xs"
                        >
                          Deselect all
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="filter-shared"
                          checked={filters.showShared}
                          onCheckedChange={(checked) =>
                            setFilters((prev) => ({
                              ...prev,
                              showShared: !!checked,
                            }))
                          }
                        />
                        <label
                          htmlFor="filter-shared"
                          className="text-sm flex gap-2 items-center"
                        >
                          <ShareIcon size={12} />
                          Shared ({groupedChats.shared.length})
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="filter-today"
                          checked={filters.showToday}
                          onCheckedChange={(checked) =>
                            setFilters((prev) => ({
                              ...prev,
                              showToday: !!checked,
                            }))
                          }
                        />
                        <label htmlFor="filter-today" className="text-sm">
                          Today ({groupedChats.today.length})
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="filter-yesterday"
                          checked={filters.showYesterday}
                          onCheckedChange={(checked) =>
                            setFilters((prev) => ({
                              ...prev,
                              showYesterday: !!checked,
                            }))
                          }
                        />
                        <label htmlFor="filter-yesterday" className="text-sm">
                          Yesterday ({groupedChats.yesterday.length})
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="filter-lastweek"
                          checked={filters.showLastWeek}
                          onCheckedChange={(checked) =>
                            setFilters((prev) => ({
                              ...prev,
                              showLastWeek: !!checked,
                            }))
                          }
                        />
                        <label htmlFor="filter-lastweek" className="text-sm">
                          Last 7 days ({groupedChats.lastWeek.length})
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="filter-lastmonth"
                          checked={filters.showLastMonth}
                          onCheckedChange={(checked) =>
                            setFilters((prev) => ({
                              ...prev,
                              showLastMonth: !!checked,
                            }))
                          }
                        />
                        <label htmlFor="filter-lastmonth" className="text-sm">
                          Last month ({groupedChats.lastMonth.length})
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="filter-older"
                          checked={filters.showOlder}
                          onCheckedChange={(checked) =>
                            setFilters((prev) => ({
                              ...prev,
                              showOlder: !!checked,
                            }))
                          }
                        />
                        <label htmlFor="filter-older" className="text-sm">
                          Older ({groupedChats.older.length})
                        </label>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {filteredHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? (
                  <p>No results found for &quot;{searchQuery}&quot;</p>
                ) : (
                  <p>No chats available</p>
                )}
              </div>
            ) : (
              <div className="grid gap-2">
                {/* Shared Chats Section */}
                {groupedChats.shared.length > 0 && filters.showShared && (
                  <div className="mb-6 border border-emerald-500/40 rounded-lg p-3 dark:bg-emerald-900/10 bg-emerald-100/10">
                    <div className="flex items-center gap-1 mb-2 bg-emerald-50 dark:bg-emerald-950/30 py-1 px-2 rounded">
                      <ShareIcon size={14} className="text-emerald-500" />
                      <h3 className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        Shared Chats
                      </h3>
                    </div>
                    <div className="grid gap-2">
                      {groupedChats.shared
                        .filter(
                          (chat) =>
                            !searchQuery ||
                            chat.title
                              .toLowerCase()
                              .includes(searchQuery.toLowerCase())
                        )
                        .map((chat, idx) => (
                          <ChatCard
                            key={`ce-shared-${chat.id || idx}-${idx}`}
                            chat={chat}
                            isActive={chat.id === id}
                            onDelete={(chatId) => {
                              setDeleteId(chatId);
                              setShowDeleteDialog(true);
                            }}
                            onShare={handleShare}
                            selectionMode={selectionMode}
                            isSelected={selectedChats.includes(chat.id)}
                            onToggleSelect={(chatId) => {
                              setSelectedChats((prev) =>
                                prev.includes(chatId)
                                  ? prev.filter((id) => id !== chatId)
                                  : [...prev, chatId]
                              );
                            }}
                            votesByChat={votesByChat}
                          />
                        ))}
                    </div>
                  </div>
                )}

                {/* Today's Chats Section */}
                {groupedChats.today.length > 0 && filters.showToday && (
                  <div className="mb-6 rounded-md border border-foreground/10 bg-muted/5 p-3">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2 pb-1">
                      Today
                    </h3>
                    <div className="grid gap-2">
                      {groupedChats.today
                        .filter(
                          (chat) =>
                            !searchQuery ||
                            chat.title
                              .toLowerCase()
                              .includes(searchQuery.toLowerCase())
                        )
                        .map((chat, idx) => (
                          <ChatCard
                            key={`ce-today-${chat.id || idx}-${idx}`}
                            chat={chat}
                            isActive={chat.id === id}
                            onDelete={(chatId) => {
                              setDeleteId(chatId);
                              setShowDeleteDialog(true);
                            }}
                            onShare={handleShare}
                            selectionMode={selectionMode}
                            isSelected={selectedChats.includes(chat.id)}
                            onToggleSelect={(chatId) => {
                              setSelectedChats((prev) =>
                                prev.includes(chatId)
                                  ? prev.filter((id) => id !== chatId)
                                  : [...prev, chatId]
                              );
                            }}
                            votesByChat={votesByChat}
                          />
                        ))}
                    </div>
                  </div>
                )}

                {/* Yesterday's Chats Section */}
                {groupedChats.yesterday.length > 0 && filters.showYesterday && (
                  <div className="mb-6 rounded-md border border-foreground/10 bg-muted/5 p-3">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2 pb-1">
                      Yesterday
                    </h3>
                    <div className="grid gap-2">
                      {groupedChats.yesterday
                        .filter(
                          (chat) =>
                            !searchQuery ||
                            chat.title
                              .toLowerCase()
                              .includes(searchQuery.toLowerCase())
                        )
                        .map((chat, idx) => (
                          <ChatCard
                            key={`ce-older-${chat.id || idx}-${idx}`}
                            chat={chat}
                            isActive={chat.id === id}
                            onDelete={(chatId) => {
                              setDeleteId(chatId);
                              setShowDeleteDialog(true);
                            }}
                            onShare={handleShare}
                            selectionMode={selectionMode}
                            isSelected={selectedChats.includes(chat.id)}
                            onToggleSelect={(chatId) => {
                              setSelectedChats((prev) =>
                                prev.includes(chatId)
                                  ? prev.filter((id) => id !== chatId)
                                  : [...prev, chatId]
                              );
                            }}
                            votesByChat={votesByChat}
                          />
                        ))}
                    </div>
                  </div>
                )}

                {/* Last Week's Chats Section */}
                {groupedChats.lastWeek.length > 0 && filters.showLastWeek && (
                  <div className="mb-6 rounded-md border border-foreground/10 bg-muted/5 p-3">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      Last 7 days
                    </h3>
                    <div className="grid gap-2">
                      {groupedChats.lastWeek
                        .filter(
                          (chat) =>
                            !searchQuery ||
                            chat.title
                              .toLowerCase()
                              .includes(searchQuery.toLowerCase())
                        )
                        .map((chat) => (
                          <ChatCard
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === id}
                            onDelete={(chatId) => {
                              setDeleteId(chatId);
                              setShowDeleteDialog(true);
                            }}
                            onShare={handleShare}
                            selectionMode={selectionMode}
                            isSelected={selectedChats.includes(chat.id)}
                            onToggleSelect={(chatId) => {
                              setSelectedChats((prev) =>
                                prev.includes(chatId)
                                  ? prev.filter((id) => id !== chatId)
                                  : [...prev, chatId]
                              );
                            }}
                            votesByChat={votesByChat}
                          />
                        ))}
                    </div>
                  </div>
                )}

                {/* Last Month's Chats Section */}
                {groupedChats.lastMonth.length > 0 && filters.showLastMonth && (
                  <div className="mb-6 rounded-md border border-foreground/10 bg-muted/5 p-3">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      Last month
                    </h3>
                    <div className="grid gap-2">
                      {groupedChats.lastMonth
                        .filter(
                          (chat) =>
                            !searchQuery ||
                            chat.title
                              .toLowerCase()
                              .includes(searchQuery.toLowerCase())
                        )
                        .map((chat) => (
                          <ChatCard
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === id}
                            onDelete={(chatId) => {
                              setDeleteId(chatId);
                              setShowDeleteDialog(true);
                            }}
                            onShare={handleShare}
                            selectionMode={selectionMode}
                            isSelected={selectedChats.includes(chat.id)}
                            onToggleSelect={(chatId) => {
                              setSelectedChats((prev) =>
                                prev.includes(chatId)
                                  ? prev.filter((id) => id !== chatId)
                                  : [...prev, chatId]
                              );
                            }}
                            votesByChat={votesByChat}
                          />
                        ))}
                    </div>
                  </div>
                )}

                {/* Older Chats Section */}
                {groupedChats.older.length > 0 && filters.showOlder && (
                  <div className="mb-6 rounded-md border border-foreground/10 bg-muted/5 p-3">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      Older
                    </h3>
                    <div className="grid gap-2">
                      {groupedChats.older
                        .filter(
                          (chat) =>
                            !searchQuery ||
                            chat.title
                              .toLowerCase()
                              .includes(searchQuery.toLowerCase())
                        )
                        .map((chat) => (
                          <ChatCard
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === id}
                            onDelete={(chatId) => {
                              setDeleteId(chatId);
                              setShowDeleteDialog(true);
                            }}
                            onShare={handleShare}
                            selectionMode={selectionMode}
                            isSelected={selectedChats.includes(chat.id)}
                            onToggleSelect={(chatId) => {
                              setSelectedChats((prev) =>
                                prev.includes(chatId)
                                  ? prev.filter((id) => id !== chatId)
                                  : [...prev, chatId]
                              );
                            }}
                            votesByChat={votesByChat}
                          />
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <AlertDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  your chat.
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

          <AlertDialog
            open={showBulkDeleteDialog}
            onOpenChange={setShowBulkDeleteDialog}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete multiple chats?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete{" "}
                  {selectedChats.length} chats.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  onClick={() => setShowBulkDeleteDialog(false)}
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction onClick={executeBulkDelete}>
                  Delete {selectedChats.length} chats
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {shareChatId && shareButtonRef && (
            <SharedMenu
              chatId={shareChatId}
              isOpen={showShareMenu}
              onClose={() => {
                setShowShareMenu(false);
                setShareChatId(null);
                setShareButtonRef(null);
              }}
              onShareComplete={() => {
                // Refresh the chat list immediately
                mutate();
                toast.success("Chat sharing updated successfully!");
              }}
              anchorRef={shareButtonRef as React.RefObject<HTMLElement>}
            />
          )}
        </div>
      </div>
    </SidebarProvider>
  );
}
