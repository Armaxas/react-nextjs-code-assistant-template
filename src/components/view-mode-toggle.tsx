"use client";

import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Lightbulb } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface ViewModeToggleProps {
  currentMode: "chat" | "blueprint";
}

export function ViewModeToggle({ currentMode }: ViewModeToggleProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleModeChange = (value: string) => {
    if (value === currentMode) return;

    // Extract the current chat ID from the path if available
    const chatIdMatch = pathname.match(/\/chat\/([a-zA-Z0-9-]+)/);
    const blueprintIdMatch = pathname.match(/\/blueprint\/([a-zA-Z0-9-]+)/);
    const id = chatIdMatch
      ? chatIdMatch[1]
      : blueprintIdMatch
        ? blueprintIdMatch[1]
        : "";

    // Force navigate with router.replace to prevent caching issues
    if (value === "chat") {
      // Navigate to chat with the current ID, or the main chat page if no ID
      router.replace(id ? `/chat/${id}` : "/chat");
    } else {
      // Navigate to blueprint with the current ID, or the main blueprint page if no ID
      router.replace(id ? `/blueprint/${id}` : "/blueprint");
    }
  };

  return (
    <div className="z-10">
      <Tabs
        value={currentMode}
        onValueChange={handleModeChange}
        className="bg-background/70 border border-border/30 rounded-full shadow-md backdrop-blur-md"
      >
        <TabsList className="h-10 p-1 bg-transparent">
          <TabsTrigger
            value="chat"
            className={cn(
              "rounded-full flex items-center gap-1.5 px-4 text-xs font-medium transition-all duration-200",
              currentMode === "chat"
                ? "bg-blue-500 text-white shadow-sm"
                : "text-foreground/90 hover:text-foreground hover:bg-muted/50"
            )}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Chat
          </TabsTrigger>
          <TabsTrigger
            value="blueprint"
            className={cn(
              "rounded-full flex items-center gap-1.5 px-4 text-xs font-medium transition-all duration-200",
              currentMode === "blueprint"
                ? "bg-blue-500 text-white shadow-sm"
                : "text-foreground/90 hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Lightbulb className="h-3.5 w-3.5" />
            Blueprint
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
