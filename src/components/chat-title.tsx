"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { ChevronDown, Edit, Trash } from "lucide-react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import useSWR, { useSWRConfig } from "swr";
import { urls } from "@/constants/constants";

interface ChatTitleProps {
  chatId: string;
  className?: string;
}

export function ChatTitle({ chatId, className }: ChatTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState<string>("");
  const [newTitle, setNewTitle] = useState<string>("");
  const [shouldPoll, setShouldPoll] = useState(false);
  const { mutate } = useSWRConfig();

  // Fetch chat data to get the title using the fetcher function
  const { data: chatData, error } = useSWR<{ title: string }>(
    chatId ? `/api/chat?id=${chatId}` : null,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Failed to fetch chat data");
      }
      return res.json();
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
      // Poll for title updates when shouldPoll is true
      refreshInterval: shouldPoll ? 2000 : 0,
    }
  );

  useEffect(() => {
    if (chatData?.title) {
      console.log("ChatTitle: Received title from API:", chatData.title);
      setTitle(chatData.title);
      setNewTitle(chatData.title);

      // Start polling if we get "New Chat" title, stop polling otherwise
      if (chatData.title === "New Chat") {
        setShouldPoll(true);
      } else {
        setShouldPoll(false);
      }
    }
  }, [chatData, chatId, mutate]);

  useEffect(() => {
    console.log("ChatTitle: Component mounted/updated with chatId:", chatId);
    console.log("ChatTitle: Current title state:", title);
    console.log("ChatTitle: Chat data:", chatData);
    console.log("ChatTitle: Error:", error);
  }, [chatId, title, chatData, error]);

  const handleRename = async () => {
    if (!newTitle.trim() || newTitle === title) {
      setIsEditing(false);
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
          chatId: chatId,
          title: newTitle.trim(),
        }),
      });

      if (response.ok) {
        toast.success("Chat title updated successfully");
        setTitle(newTitle.trim());
        // Refresh chat data
        mutate(`/api/chat?id=${chatId}`);
        // Refresh chat history in sidebar
        mutate(urls.apiHistory);
      } else {
        toast.error("Failed to update chat title");
        setNewTitle(title);
      }
    } catch (err) {
      console.error("Error updating title:", err);
      toast.error("Failed to update chat title");
      setNewTitle(title);
    } finally {
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`${urls.apiChat}?id=${chatId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Chat deleted successfully");
        // Redirect to home page
        window.location.href = "/";
      } else {
        toast.error("Failed to delete chat");
      }
    } catch (err) {
      console.error("Error deleting chat:", err);
      toast.error("Failed to delete chat");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRename();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setNewTitle(title);
    }
  };

  if (error) {
    return null;
  }

  // Show loading state if title is not yet available
  if (!title && !isEditing) {
    return (
      <div
        className={cn("h-7 w-40 bg-muted/30 animate-pulse rounded", className)}
      />
    );
  }

  // Show fallback if we have an error but still want to display something
  const displayTitle = title || "New Chat";

  return (
    <div className={cn("flex items-center", className)}>
      {isEditing ? (
        <div className="flex items-center">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={handleKeyPress}
            onBlur={handleRename}
            className="h-7 text-sm border focus:ring-primary min-w-[200px]"
            autoFocus
          />
        </div>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-1 h-7 px-2 py-1 text-sm font-medium hover:bg-accent"
            >
              <span className="max-w-[240px] truncate">{displayTitle}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="mr-2 h-4 w-4" />
              <span>Rename</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              onClick={handleDelete}
            >
              <Trash className="mr-2 h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
