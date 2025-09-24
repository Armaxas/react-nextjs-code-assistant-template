"use client";

import * as React from "react";
// import { FileEditIcon, Sparkles } from "lucide-react";
import type { User } from "next-auth";
import {
  Sidebar,
  SidebarContent,
  // SidebarFooter,
  SidebarHeader,
  // SidebarMenu,
  SidebarRail,
  // useSidebar,
} from "@/components/ui/sidebar";
// import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
// import { Button } from "./ui/button";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { SidebarHistory } from "./sidebar-history";
// import { NavUser } from "./nav-user";

export function SidebarRight({ user }: { user: User | undefined }) {
  // const router = useRouter();
  // const { open, state, setOpenMobile } = useSidebar();

  return (
    <Sidebar
      side="right"
      collapsible="icon"
      className="group-data-[side=left]:border-r-0"
    >
      <SidebarHeader></SidebarHeader>
      <SidebarContent>{user?.email}</SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
