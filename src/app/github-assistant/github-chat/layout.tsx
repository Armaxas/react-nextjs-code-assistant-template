"use client";

import { BackgroundGradientAnimation } from "@/components/ui/aceternity/background-gradient-animation";
import { urls } from "@/constants/constants";
import { SessionProvider } from "next-auth/react";
import dynamic from "next/dynamic";
import { SidebarProvider } from "@/components/ui/sidebar";
import { GitHubProvider } from "@/contexts/github-context";
import { Toaster } from "@/components/toaster";
import { SettingsProvider } from "@/contexts/settings-context";

const SidebarLeft = dynamic(
  () => import("@/components/sidebar-left").then((mod) => mod.SidebarLeft),
  {
    ssr: false,
  }
);

export default function GithubChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="chat-layout">
      <SessionProvider basePath={urls.authBasePath}>
        <SettingsProvider>
          <GitHubProvider>
            <SidebarProvider defaultOpen={false}>
              <div className="flex h-screen w-full">
                <SidebarLeft />
                <div className="flex-1">
                  <BackgroundGradientAnimation>
                    <div className="min-h-screen bg-black bg-opacity-80">
                      <div className="h-screen">{children}</div>
                    </div>
                  </BackgroundGradientAnimation>
                </div>
              </div>
              <Toaster />
            </SidebarProvider>
          </GitHubProvider>
        </SettingsProvider>
      </SessionProvider>
    </div>
  );
}
