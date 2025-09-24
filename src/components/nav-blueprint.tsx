"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "./ui/sidebar";
import { Lightbulb } from "lucide-react";

export function NavBlueprint() {
  const pathname = usePathname();
  const isActive = pathname.includes("/blueprint");

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("Navigating to blueprint...");
    console.log("Current pathname:", pathname);

    // Try using window.location instead of router
    window.location.href = "/blueprint";
  };

  return (
    <SidebarMenu className="px-1.5">
      <SidebarMenuItem className="w-full">
        <Link href="/blueprint" passHref legacyBehavior>
          <SidebarMenuButton
            onClick={handleClick}
            className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-purple-500/20 transition-all duration-200 mx-0.5 ${
              isActive
                ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-500"
                : "text-muted-foreground hover:text-foreground"
            }`}
            tooltip="Create and manage requirement blueprints"
          >
            <div className="flex items-center gap-3 relative">
              <div
                className={`p-1 rounded-full ${isActive ? "bg-blue-100 dark:bg-blue-900" : "group-hover:bg-blue-50 dark:group-hover:bg-blue-900/50"}`}
              >
                <Lightbulb
                  className={`h-5 w-5 transition-colors ${
                    isActive
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-muted-foreground group-hover:text-blue-500"
                  }`}
                />
              </div>
              <span className="font-medium">New Blueprint</span>
              {isActive && (
                <div className="absolute -left-3 inset-y-0 w-0.5 bg-blue-500 rounded-full" />
              )}
            </div>
          </SidebarMenuButton>
        </Link>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
