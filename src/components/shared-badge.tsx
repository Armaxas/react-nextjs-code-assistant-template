"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { X, Trash, PanelRight } from "lucide-react";
import { ShareIcon } from "./icons";
import { useSession } from "next-auth/react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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

interface SharedBadgeProps {
  chatId: string;
  onShareStatusChange: () => void;
}

export function SharedBadge({ chatId, onShareStatusChange }: SharedBadgeProps) {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [sharedWith, setSharedWith] = useState<
    Array<{ userId: string; name: string; email: string }>
  >([]);
  const [isOwner, setIsOwner] = useState(false);
  const [isUnshareDialogOpen, setIsUnshareDialogOpen] = useState(false);
  const [selectedUserToRemove, setSelectedUserToRemove] = useState<
    string | null
  >(null);
  const { data: session } = useSession();

  // Load shared information
  const loadSharedInfo = React.useCallback(async () => {
    try {
      const response = await fetch(`/api/share?chatId=${chatId}`);

      // We maintain this check for backward compatibility
      // and in case the API change hasn't been deployed yet
      if (response.status === 403) {
        setSharedWith([]);
        setIsOwner(false);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch shared users");
      }

      const data = await response.json();
      if (data.success) {
        setSharedWith(data.sharedWith || []);

        // If the API indicates the user is not the owner with our flag, respect that
        if (data.userIsNotOwner) {
          setIsOwner(false);
        } else {
          // Otherwise check if the user is the owner the usual way
          setIsOwner(data.owner?.userId === session?.user?.id);
        }
      }
    } catch (error) {
      console.error("Error fetching shared users:", error);
      // Don't show error in the UI for this non-critical feature
      setSharedWith([]);
      setIsOwner(false);
    }
  }, [chatId, session]);

  useEffect(() => {
    loadSharedInfo();
  }, [loadSharedInfo]);

  // Handle removing a user from shared list
  const handleRemoveUser = async (userId: string) => {
    try {
      const response = await fetch(
        `/api/share?chatId=${chatId}&userId=${userId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to unshare conversation");
      }

      await loadSharedInfo();
      onShareStatusChange();
      setSelectedUserToRemove(null);
    } catch (error) {
      console.error("Error unsharing conversation:", error);
    }
  };

  // Handle unsharing with everyone
  const handleUnshareWithAll = async () => {
    try {
      const response = await fetch(`/api/share?chatId=${chatId}&userId=all`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to unshare conversation with everyone");
      }

      await loadSharedInfo();
      onShareStatusChange();
      setIsUnshareDialogOpen(false);
    } catch (error) {
      console.error("Error unsharing conversation with everyone:", error);
    }
  };

  // Get initials from name
  const getInitials = (name: string): string => {
    if (!name) return "??";

    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return name.substring(0, 2).toUpperCase();
  };

  // If no one to share with, show nothing
  if (sharedWith.length === 0 && !isOwner) {
    return null;
  }

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1 h-7 px-2 text-xs"
          >
            <ShareIcon size={14} />
            <span>{sharedWith.length > 0 ? "Shared" : "Share"}</span>
            {sharedWith.length > 0 && (
              <span className="bg-emerald-500/20 dark:bg-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-md px-1.5 py-0.5 text-[10px] font-medium">
                {sharedWith.length}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-2" align="end">
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

            {sharedWith.length > 0 ? (
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

                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full text-muted-foreground hover:text-destructive"
                        onClick={() => setSelectedUserToRemove(user.userId)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}

                {isOwner && (
                  <Button
                    variant="ghost"
                    className="w-full text-destructive text-xs mt-2 h-8"
                    onClick={() => setIsUnshareDialogOpen(true)}
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
        </PopoverContent>
      </Popover>

      {/* Share Dialog */}
      <ShareDialog
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        chatId={chatId}
        onShareComplete={() => {
          loadSharedInfo();
          onShareStatusChange();
        }}
      />

      {/* Confirm remove user dialog */}
      {selectedUserToRemove && (
        <AlertDialog
          open={!!selectedUserToRemove}
          onOpenChange={() => setSelectedUserToRemove(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove user from sharing</AlertDialogTitle>
              <AlertDialogDescription>
                This user will no longer have access to this conversation.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleRemoveUser(selectedUserToRemove)}
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Confirm unshare with everyone dialog */}
      <AlertDialog
        open={isUnshareDialogOpen}
        onOpenChange={setIsUnshareDialogOpen}
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnshareWithAll}>
              Unshare with everyone
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
