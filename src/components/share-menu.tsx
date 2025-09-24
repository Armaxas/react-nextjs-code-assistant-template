"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { X, Trash, PanelRight } from "lucide-react";
import { ShareIcon } from "./icons";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ShareDialog } from "./share-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

interface SharedMenuProps {
  chatId: string;
  isOpen: boolean;
  onClose: () => void;
  onShareComplete: () => void;
  anchorRef: React.RefObject<HTMLElement>;
}

export function SharedMenu({
  chatId,
  isOpen,
  onClose,
  onShareComplete,
  anchorRef,
}: SharedMenuProps) {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [sharedWith, setSharedWith] = useState<
    Array<{ userId: string; name: string; email: string }>
  >([]);
  // const [isOwner, setIsOwner] = useState(false); // TODO: Implement owner check logic
  const [isUnshareDialogOpen, setIsUnshareDialogOpen] = useState(false);
  const [selectedUserToRemove, setSelectedUserToRemove] = useState<
    string | null
  >(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const menuRef = useRef<HTMLDivElement>(null);

  const loadSharedInfo = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/share?chatId=${chatId}`);
      console.log("share response:", response.status, response.ok);

      if (response.status === 403) {
        setSharedWith([]);
        // setIsOwner(false); // TODO: Implement owner check logic
        return;
      }

      if (!response.ok) {
        console.error("Failed to fetch shared users:", response.status);
        setSharedWith([]);
        // setIsOwner(false); // TODO: Implement owner check logic
        return;
      }

      const data = await response.json();
      console.log("shared data:", data);

      setSharedWith(data.sharedWith || []);

      // Fix the owner check logic
      const currentUserId = session?.user?.id;
      const isUserOwner =
        data.owner?.userId === currentUserId ||
        (!data.userIsNotOwner && data.owner?.userId === currentUserId);
      // setIsOwner(isUserOwner); // TODO: Implement owner check logic

      console.log(
        "isOwner:",
        isUserOwner,
        "currentUserId:",
        currentUserId,
        "ownerId:",
        data.owner?.userId
      );
    } catch (error) {
      console.error("Error fetching shared users:", error);
      setSharedWith([]);
      // setIsOwner(false); // TODO: Implement owner check logic
    } finally {
      setIsLoading(false);
    }
  }, [chatId, session?.user?.id]);

  useEffect(() => {
    if (isOpen) {
      loadSharedInfo();
      // Calculate position based on anchor element
      if (anchorRef.current) {
        const rect = anchorRef.current.getBoundingClientRect();
        setPosition({
          top: rect.bottom + 8,
          left: rect.left - 280, // Adjust to position properly
        });
      }
    }
  }, [isOpen, loadSharedInfo, anchorRef]);

  // Close menu when clicking outside - but exclude dialogs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;

      // Don't close if clicking inside any dialog
      if (
        target.closest('[role="dialog"]') ||
        target.closest("[data-radix-popper-content-wrapper]") ||
        target.closest(".fixed.inset-0") || // backdrop
        target.closest('[data-state="open"]') // any radix open state
      ) {
        return;
      }

      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (
      isOpen &&
      !isShareDialogOpen &&
      !selectedUserToRemove &&
      !isUnshareDialogOpen
    ) {
      document.addEventListener("mousedown", handleClickOutside, true);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside, true);
    }
  }, [
    isOpen,
    onClose,
    isShareDialogOpen,
    selectedUserToRemove,
    isUnshareDialogOpen,
  ]);

  const handleRemoveUser = async (userId: string) => {
    try {
      console.log("Removing user:", userId);
      const response = await fetch(
        `/api/share?chatId=${chatId}&userId=${userId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to unshare conversation:", errorData);
        throw new Error(errorData.error || "Failed to unshare conversation");
      }

      // Reload the shared info to update the UI
      await loadSharedInfo();

      // Trigger chat list refresh in parent component
      onShareComplete();

      // Close the dialog
      setSelectedUserToRemove(null);

      // If current user removed themselves or if no one is shared with anymore, close the menu
      const currentUserId = session?.user?.id;
      if (userId === currentUserId || sharedWith.length <= 1) {
        onClose();
      }
    } catch (error) {
      console.error("Error unsharing conversation:", error);
    }
  };

  const handleUnshareWithAll = async () => {
    try {
      console.log("Unsharing with all users");
      const response = await fetch(`/api/share?chatId=${chatId}&userId=all`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(
          "Failed to unshare conversation with everyone:",
          errorData
        );
        throw new Error(
          errorData.error || "Failed to unshare conversation with everyone"
        );
      }

      // Reload the shared info to update the UI
      await loadSharedInfo();

      // Trigger chat list refresh in parent component
      onShareComplete();

      // Close the dialog and menu since no one is shared with anymore
      setIsUnshareDialogOpen(false);
      onClose();
    } catch (error) {
      console.error("Error unsharing conversation with everyone:", error);
    }
  };

  const getInitials = (name: string): string => {
    const parts = name.split(/\s+/).filter(Boolean);
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Menu */}
      <div
        ref={menuRef}
        className="fixed z-50 w-80 bg-background border border-border rounded-md shadow-lg p-2"
        style={{
          top: position.top,
          left: Math.max(10, position.left), // Ensure it doesn't go off-screen
        }}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Sharing</h4>
            <Button
              variant="outline"
              size="sm"
              className="h-7"
              onClick={() => setIsShareDialogOpen(true)}
            >
              <ShareIcon size={14} className="mr-1" />
              Add people
            </Button>
          </div>

          {isLoading ? (
            <div className="py-8 text-center">
              <div className="text-sm text-muted-foreground">Loading...</div>
            </div>
          ) : sharedWith.length > 0 ? (
            <div className="space-y-1 max-h-[200px] overflow-auto">
              {sharedWith.map((user) => (
                <div
                  key={user.userId}
                  className="flex items-center justify-between p-2 hover:bg-muted rounded-md"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log("Setting user to remove:", user.userId);
                      setSelectedUserToRemove(user.userId);
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              {sharedWith.length > 0 && (
                <Button
                  variant="ghost"
                  className="w-full text-destructive text-xs mt-2 h-8"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("Opening unshare with everyone dialog");
                    setIsUnshareDialogOpen(true);
                  }}
                >
                  <Trash className="h-3.5 w-3.5 mr-2" />
                  Unshare with everyone
                </Button>
              )}
            </div>
          ) : (
            <div className="py-8 text-center">
              <PanelRight className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Share this conversation with others in your organization
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Share Dialog */}
      <ShareDialog
        chatId={chatId}
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        onShareComplete={() => {
          loadSharedInfo();
          onShareComplete();
        }}
      />

      {/* Confirm remove user dialog */}
      <AlertDialog
        open={!!selectedUserToRemove}
        onOpenChange={(open) => {
          console.log("Remove user dialog onOpenChange:", open);
          if (!open) {
            setSelectedUserToRemove(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove user from sharing</AlertDialogTitle>
            <AlertDialogDescription>
              This user will no longer have access to this conversation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                console.log("Cancel remove user");
                setSelectedUserToRemove(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                console.log("Confirm remove user:", selectedUserToRemove);
                if (selectedUserToRemove) {
                  handleRemoveUser(selectedUserToRemove);
                }
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm unshare with everyone dialog */}
      <AlertDialog
        open={isUnshareDialogOpen}
        onOpenChange={(open) => {
          console.log("Unshare dialog onOpenChange:", open);
          setIsUnshareDialogOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unshare with everyone</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove access for all users this conversation is
              currently shared with.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                console.log("Cancel unshare with everyone");
                setIsUnshareDialogOpen(false);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                console.log("Confirm unshare with everyone");
                handleUnshareWithAll();
              }}
            >
              Unshare with everyone
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
