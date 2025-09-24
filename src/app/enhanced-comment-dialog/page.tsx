import { Metadata } from "next";
import { EnhancedDialogProvider } from "@/hooks/use-comment-dialog-enhanced";
import { UserSession } from "@/hooks/use-user-session";
import { Toaster } from "@/components/ui/sonner";
import EnhancedCommentDialogDemo from "@/components/enhanced-comment-dialog-demo";

export const metadata: Metadata = {
  title: "Enhanced Comment Dialog - Demo",
  description: "Demo of the enhanced comment dialog with Jira integration",
};

export default function EnhancedCommentDialogPage() {
  return (
    <UserSession>
      <EnhancedDialogProvider>
        <div className="min-h-screen bg-gray-50">
          <EnhancedCommentDialogDemo />
        </div>
        <Toaster />
      </EnhancedDialogProvider>
    </UserSession>
  );
}
