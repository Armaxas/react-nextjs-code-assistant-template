import { cookies } from "next/headers";
import { SidebarLeft } from "@/components/sidebar-left";
import { SidebarProvider } from "@/components/ui/sidebar";
import { UserSession } from "@/hooks/use-user-session";
import { SessionProvider } from "next-auth/react";
import { urls } from "@/constants/constants";
import { SettingsProvider } from "@/contexts/settings-context";

export const experimental_ppr = true;

export default async function UserSessionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const isOpen = cookieStore.get("sidebar_state")?.value === "true";

  return (
    <div className="user-session-layout">
      <SessionProvider basePath={urls.authBasePath}>
        <UserSession>
          <SettingsProvider>
            <SidebarProvider defaultOpen={isOpen}>
              <SidebarLeft />
              <div className="flex-1 overflow-auto">{children}</div>
            </SidebarProvider>
          </SettingsProvider>
        </UserSession>
      </SessionProvider>
    </div>
  );
}
