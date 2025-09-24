import { cookies } from "next/headers";
import { SidebarLeft } from "@/components/sidebar-left";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { UserSession } from "@/hooks/use-user-session";
import { SessionProvider } from "next-auth/react";
import { urls } from "@/constants/constants";
import { DialogProvider } from "@/hooks/use-comment-dialog";
import { SettingsProvider } from "@/contexts/settings-context";

export const experimental_ppr = true;

export default async function SalesforceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const isCollapsed = cookieStore.get("sidebar_state")?.value !== "true";

  return (
    <SessionProvider basePath={urls.authBasePath}>
      <UserSession>
        <SettingsProvider>
          <SidebarProvider defaultOpen={!isCollapsed}>
            <SidebarLeft />
            <SidebarInset>
              <DialogProvider>{children}</DialogProvider>
            </SidebarInset>
          </SidebarProvider>
        </SettingsProvider>
      </UserSession>
    </SessionProvider>
  );
}
