"use client";

import * as React from "react";
import {
  MessageSquare,
  ListFilter,
  Lightbulb,
  Github,
  Heart,
  Gift,
  LayoutDashboard,
  Cloud,
  Bug,
  // History,
  // SquareTerminal,
} from "lucide-react";
// import { NavMain } from "@/components/nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Button } from "./ui/button";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { SidebarHistory } from "./sidebar-history";
import { NavUser } from "./nav-user";
import { SidebarToggleLeft } from "./sidebar-toggle-left";
import { useSidebarSession } from "@/hooks/use-sidebar-session";
import { useWhatsNew } from "@/hooks/use-whats-new";
import { WhatsNewModal } from "./whats-new-modal";
import { useSettings } from "@/contexts/settings-context";

// This is sample data.
/* const data = {
  navMain: [
    {
      title: "Chat Histiroy",
      url: "/",
      icon: SquareTerminal,
      // isActive: true,
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: HistoryIcon,
    },
  ],
}; */

export function SidebarLeft() {
  const router = useRouter();
  const pathname = usePathname();
  const { state, setOpenMobile, setOpen } = useSidebar();
  const { user } = useSidebarSession();
  const { isModalOpen, hasSeenVersion, showModal, hideModal, markAsSeen } =
    useWhatsNew();
  const { settings } = useSettings();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Only calculate active states after component is mounted to avoid hydration issues
  const isBlueprintActive = isMounted && pathname.includes("/blueprint");
  const isGithubAssistantActive =
    isMounted && pathname.startsWith("/github-assistant");
  const isDashboardActive = isMounted && pathname === "/dashboard";
  const isSalesforceActive = isMounted && pathname.startsWith("/salesforce");
  const isLogAnalysisActive = isMounted && pathname.startsWith("/log-analysis");

  // Check if user is admin
  const isAdmin = user && (user as { role?: string }).role === "admin";

  const handleBlueprintClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setOpenMobile(false);
    setOpen(false); // Collapse sidebar
    window.location.href = "/blueprint";
  };

  return (
    <Sidebar collapsible="icon" className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        {/* <TeamSwitcher teams={data.teams} /> */}
        <SidebarMenu className="space-y-2">
          {/* App Logo and Name */}
          <div className="flex flex-row justify-between items-center h-8">
            <Link
              href="/"
              onClick={() => {
                setOpenMobile(false);
                setOpen(false); // Collapse sidebar
              }}
              className="flex flex-row gap-3 items-center"
            >
              {/* <span className="inline-block pl-1">
                <Sparkles className="w-6 h-6 text-blue-400 p-[2px]" />
              </span> */}
              {state === "expanded" && (
                <span className="text-md font-semibold px-2 hover:bg-muted rounded-md cursor-pointer bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 whitespace-nowrap">
                  ISC CodeConnect
                </span>
              )}
            </Link>
            <SidebarToggleLeft />
          </div>
          {/* New Chat button moved to top */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                type="button"
                className={`w-full flex items-center justify-start gap-2 p-2 transition-all duration-200 ${state === "collapsed" ? "justify-center" : "justify-start"} hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 dark:hover:text-blue-400 border border-blue-200 dark:border-blue-800`}
                onClick={() => {
                  setOpenMobile(false);
                  setOpen(false); // Collapse sidebar
                  router.push("/");
                  router.refresh();
                }}
              >
                <MessageSquare className="w-5 h-5 text-blue-500" />
                {state === "expanded" && (
                  <span className="font-medium">New Chat</span>
                )}
              </Button>
            </TooltipTrigger>
            {state === "collapsed" && (
              <TooltipContent side="right" align="start">
                Start a new chat
              </TooltipContent>
            )}
          </Tooltip>

          {/* All Chats button */}
          {settings.features.allChats && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  type="button"
                  className={`w-full flex items-center justify-start gap-2 p-2 transition-all duration-200 ${state === "collapsed" ? "justify-center" : "justify-start"} hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 dark:hover:text-blue-400
                  ${
                    pathname === "/chats"
                      ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-500"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => {
                    setOpenMobile(false);
                    setOpen(false); // Collapse sidebar
                    router.push("/chats");
                  }}
                >
                  <ListFilter className="w-5 h-5 text-muted-foreground" />
                  {state === "expanded" && (
                    <span className="font-medium">All Chats</span>
                  )}
                </Button>
              </TooltipTrigger>
              {state === "collapsed" && (
                <TooltipContent side="right" align="start">
                  Browse all chats
                </TooltipContent>
              )}
            </Tooltip>
          )}

          {/* Feedback Dashboard button */}
          {settings.features.feedbackDashboard && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  type="button"
                  className={`w-full flex items-center justify-start gap-2 p-2 transition-all duration-200 ${state === "collapsed" ? "justify-center" : "justify-start"} hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 dark:hover:text-blue-400 ${
                    pathname === "/feedback"
                      ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-500"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => {
                    setOpenMobile(false);
                    setOpen(false); // Collapse sidebar
                    router.push("/feedback");
                  }}
                >
                  <Heart className="w-5 h-5 text-muted-foreground" />
                  {state === "expanded" && (
                    <span className="font-medium">Feedback Dashboard</span>
                  )}
                </Button>
              </TooltipTrigger>
              {state === "collapsed" && (
                <TooltipContent side="right" align="start">
                  Manage feedback and Jira issues
                </TooltipContent>
              )}
            </Tooltip>
          )}

          {/* GitHub Assistant button */}
          {settings.features.githubCodeIntelligence && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  type="button"
                  className={`w-full flex items-center justify-start gap-2 p-2 transition-all duration-200 ${
                    state === "collapsed" ? "justify-center" : "justify-start"
                  } hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 dark:hover:text-blue-400 ${
                    isGithubAssistantActive
                      ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-500"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => {
                    setOpenMobile(false);
                    setOpen(false); // Collapse sidebar
                    router.push("/github-assistant/github-chat");
                  }}
                >
                  <div
                    className={`rounded-full ${
                      isGithubAssistantActive
                        ? "bg-blue-100 dark:bg-blue-900"
                        : "hover:bg-blue-50 dark:hover:bg-blue-900/50"
                    }`}
                  >
                    <Github
                      className={`w-5 h-5 ${
                        isGithubAssistantActive
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-muted-foreground hover:text-blue-500"
                      }`}
                    />
                  </div>
                  {state === "expanded" && (
                    <span className="font-medium">Code Intelligence Hub</span>
                  )}
                </Button>
              </TooltipTrigger>
              {state === "collapsed" && (
                <TooltipContent side="right" align="start">
                  GitHub repositories and insights
                </TooltipContent>
              )}
            </Tooltip>
          )}

          {/* New Blueprint button (moved from NavBlueprint component) */}
          {settings.features.requirementBlueprint && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  type="button"
                  className={`w-full flex items-center justify-start gap-2 p-2 transition-all duration-200 ${
                    state === "collapsed" ? "justify-center" : "justify-start"
                  } hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 dark:hover:text-blue-400 ${
                    isBlueprintActive
                      ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-500"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={handleBlueprintClick}
                >
                  <div
                    className={`rounded-full ${isBlueprintActive ? "bg-blue-100 dark:bg-blue-900" : "hover:bg-blue-50 dark:hover:bg-blue-900/50"}`}
                  >
                    <Lightbulb
                      className={`w-5 h-5 ${
                        isBlueprintActive
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-muted-foreground hover:text-blue-500"
                      }`}
                    />
                  </div>
                  {state === "expanded" && (
                    <span className="font-medium">New Blueprint</span>
                  )}
                </Button>
              </TooltipTrigger>
              {state === "collapsed" && (
                <TooltipContent side="right" align="start">
                  Create and manage requirement blueprints
                </TooltipContent>
              )}
            </Tooltip>
          )}

          {/* Salesforce Explorer button */}
          {settings.features.salesforceExplorer && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  type="button"
                  className={`w-full flex items-center justify-start gap-2 p-2 transition-all duration-200 ${
                    state === "collapsed" ? "justify-center" : "justify-start"
                  } hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 dark:hover:text-blue-400 ${
                    isSalesforceActive
                      ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-500"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => {
                    setOpenMobile(false);
                    setOpen(false); // Collapse sidebar
                    router.push("/salesforce");
                  }}
                >
                  <div
                    className={`rounded-full ${
                      isSalesforceActive
                        ? "bg-blue-100 dark:bg-blue-900"
                        : "hover:bg-blue-50 dark:hover:bg-blue-900/50"
                    }`}
                  >
                    <Cloud
                      className={`w-5 h-5 ${
                        isSalesforceActive
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-muted-foreground hover:text-blue-500"
                      }`}
                    />
                  </div>
                  {state === "expanded" && (
                    <span className="font-medium">Salesforce Explorer</span>
                  )}
                </Button>
              </TooltipTrigger>
              {state === "collapsed" && (
                <TooltipContent side="right" align="start">
                  Explore Salesforce metadata and generate SOQL
                </TooltipContent>
              )}
            </Tooltip>
          )}

          {/* Log Analysis button */}
          {settings.features.logAnalysis && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  type="button"
                  className={`w-full flex items-center justify-start gap-2 p-2 transition-all duration-200 ${
                    state === "collapsed" ? "justify-center" : "justify-start"
                  } hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 dark:hover:text-blue-400 ${
                    isLogAnalysisActive
                      ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-500"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => {
                    setOpenMobile(false);
                    setOpen(false); // Collapse sidebar
                    router.push("/log-analysis");
                  }}
                >
                  <div
                    className={`rounded-full ${
                      isLogAnalysisActive
                        ? "bg-blue-100 dark:bg-blue-900"
                        : "hover:bg-blue-50 dark:hover:bg-blue-900/50"
                    }`}
                  >
                    <Bug
                      className={`w-5 h-5 ${
                        isLogAnalysisActive
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-muted-foreground hover:text-blue-500"
                      }`}
                    />
                  </div>
                  {state === "expanded" && (
                    <span className="font-medium">Log Analysis</span>
                  )}
                </Button>
              </TooltipTrigger>
              {state === "collapsed" && (
                <TooltipContent side="right" align="start">
                  Analyze Salesforce error logs with AI insights
                </TooltipContent>
              )}
            </Tooltip>
          )}

          {/* Admin Dashboard button - Only visible to admin users */}
          {isAdmin && settings.features.adminDashboard && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  type="button"
                  className={`w-full flex items-center justify-start gap-2 p-2 transition-all duration-200 ${
                    state === "collapsed" ? "justify-center" : "justify-start"
                  } hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 dark:hover:text-blue-400 ${
                    isDashboardActive
                      ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-500"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => {
                    setOpenMobile(false);
                    setOpen(false); // Collapse sidebar
                    router.push("/dashboard");
                  }}
                >
                  <div
                    className={`rounded-full ${
                      isDashboardActive
                        ? "bg-blue-100 dark:bg-blue-900"
                        : "hover:bg-blue-50 dark:hover:bg-blue-900/50"
                    }`}
                  >
                    <LayoutDashboard
                      className={`w-5 h-5 ${
                        isDashboardActive
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-muted-foreground hover:text-blue-500"
                      }`}
                    />
                  </div>
                  {state === "expanded" && (
                    <span className="font-medium">Admin Dashboard</span>
                  )}
                </Button>
              </TooltipTrigger>
              {state === "collapsed" && (
                <TooltipContent side="right" align="start">
                  Manage users, chats, and analytics
                </TooltipContent>
              )}
            </Tooltip>
          )}

          {/* What's New button */}
          {settings.features.whatsNew && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  type="button"
                  className={`relative w-full flex items-center justify-start gap-2 p-2 transition-all duration-200 ${state === "collapsed" ? "justify-center" : "justify-start"} bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-500 dark:text-blue-400 hover:from-blue-500/20 hover:to-purple-500/20 animate-pulse`}
                  onClick={showModal}
                >
                  <Gift className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                  {state === "expanded" && (
                    <span className="font-medium">What&apos;s New</span>
                  )}
                  {!hasSeenVersion && (
                    <div className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></div>
                  )}
                </Button>
              </TooltipTrigger>
              {state === "collapsed" && (
                <TooltipContent side="right" align="start">
                  See what&apos;s new in the latest update
                </TooltipContent>
              )}
            </Tooltip>
          )}
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* <NavMain items={data.navMain} /> */}
        {/* <NavProjects projects={data.projects} /> */}
        {/* NavBlueprint removed from here and integrated above */}
        {user && <SidebarHistory user={user} />}
        {/* <SidebarComingSoon /> */}
      </SidebarContent>
      <SidebarFooter>
        {user && <NavUser user={user} />}
        {/* {user && <SidebarUserNav user={user} />} */}
      </SidebarFooter>
      <SidebarRail />
      <WhatsNewModal
        isOpen={isModalOpen}
        onClose={hideModal}
        onMarkAsSeen={markAsSeen}
      />
    </Sidebar>
  );
}
