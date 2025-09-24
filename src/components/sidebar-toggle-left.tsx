import type { ComponentProps } from "react";

import { type SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Button } from "./ui/button";
import { ChevronRight, ChevronLeft } from "lucide-react";

export function SidebarToggleLeft({
  className,
}: ComponentProps<typeof SidebarTrigger>) {
  const { toggleSidebar, state } = useSidebar();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={toggleSidebar}
          variant="outline"
          className={`md:px-2 md:h-fit transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-950 ${className}`}
        >
          {state === "expanded" ? (
            <ChevronLeft size={18} className="text-blue-500" />
          ) : (
            <ChevronRight size={18} className="text-blue-500" />
          )}
        </Button>
      </TooltipTrigger>
      {state === "collapsed" && (
        <TooltipContent side="right" align="start">
          Toggle Sidebar
        </TooltipContent>
      )}
    </Tooltip>
  );
}
