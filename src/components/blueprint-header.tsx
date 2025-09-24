"use client";
import { useRouter } from "next/navigation";
import { useWindowSize } from "usehooks-ts";

import { Button } from "@/components/ui/button";
import { useSidebar } from "./ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { ViewModeToggle } from "@/components/view-mode-toggle";
import { FileEditIcon, Sparkles } from "lucide-react";
import { memo } from "react";

export function PureBlueprintHeader({
  currentMode,
}: {
  currentMode?: "chat" | "blueprint";
}) {
  const router = useRouter();
  const { open } = useSidebar();
  const { width: windowWidth } = useWindowSize();

  const navigateToHome = () => {
    router.push("/");
    router.refresh();
  };

  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2">
      <div className="flex">
        {(!open || windowWidth < 768) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="order-1 md:order-0 md:px-2 px-2 md:h-fit ml-auto md:ml-0"
                onClick={navigateToHome}
              >
                <FileEditIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>New Chat</TooltipContent>
          </Tooltip>
        )}
      </div>
      {!open && (
        <div
          className="flex items-center"
          onClick={navigateToHome}
          role="button"
          tabIndex={0}
          aria-label="Navigate to home page"
        >
          <span className="inline-block pl-1">
            <Sparkles className="w-6 h-6 text-blue-400" />
          </span>
          <span className="text-lg font-semibold px-2 hover:bg-muted rounded-md cursor-pointer bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            ISC-CodeConnect
          </span>
        </div>
      )}
      <div className="flex items-center gap-3">
        {currentMode && <ViewModeToggle currentMode={currentMode} />}
      </div>
      <div className="flex ml-auto px-3">
        {/* Additional actions can be added here */}
      </div>
    </header>
  );
}

export const BlueprintHeader = memo(PureBlueprintHeader);
