"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Check, Loader2, Search, Share2, UserPlus } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { GitHubOrgMember } from "@/actions/github-actions";

interface SharedUser {
  userId: string;
  login: string;
  avatar_url: string;
  name?: string;
}

interface ShareDialogProps {
  chatId: string;
  isOpen: boolean;
  onClose: () => void;
  onShareComplete: () => void;
}

export function ShareDialog({
  chatId,
  isOpen,
  onClose,
  onShareComplete,
}: ShareDialogProps) {
  const [organizationMembers, setOrganizationMembers] = useState<
    GitHubOrgMember[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<GitHubOrgMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [currentlySharedWith, setCurrentlySharedWith] = useState<SharedUser[]>(
    []
  );
  const [errorMessage, setErrorMessage] = useState("");

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setSelectedUsers([]);
      setErrorMessage("");
    }
  }, [isOpen]);

  // Fetch organization members and shared users
  useEffect(() => {
    if (!isOpen) return;

    async function fetchMembers() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/organization/members");
        if (!response.ok) {
          throw new Error("Failed to fetch organization members");
        }
        const data = await response.json();
        setOrganizationMembers(data);
      } catch (error) {
        console.error("Error fetching organization members:", error);
        setErrorMessage("Failed to load organization members");
      } finally {
        setIsLoading(false);
      }
    }

    async function fetchSharedUsers() {
      try {
        const response = await fetch(`/api/share?chatId=${chatId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success !== false) {
            setCurrentlySharedWith(data.sharedWith || []);
          }
        }
      } catch (error) {
        console.error("Error fetching shared users:", error);
      }
    }

    fetchMembers();
    fetchSharedUsers();
  }, [chatId, isOpen]);

  // Filter members based on search query
  const filteredMembers = organizationMembers.filter((member) => {
    const fullName = member.name || member.login;
    const lowerQuery = searchQuery.toLowerCase();
    return (
      fullName.toLowerCase().includes(lowerQuery) ||
      member.login.toLowerCase().includes(lowerQuery) ||
      (member.email && member.email.toLowerCase().includes(lowerQuery))
    );
  });

  // Check if a user is already shared with
  const isAlreadyShared = (userId: string | number) => {
    return currentlySharedWith.some(
      (user) => user.userId === userId.toString()
    );
  };

  // Toggle selecting a user
  const toggleSelectUser = (member: GitHubOrgMember) => {
    if (isAlreadyShared(member.id)) {
      return; // Can't select already shared users
    }

    setSelectedUsers((prev) => {
      const isCurrentlySelected = prev.some((u) => u.id === member.id);
      if (isCurrentlySelected) {
        return prev.filter((u) => u.id !== member.id);
      } else {
        return [...prev, member];
      }
    });
  };

  // Share the chat with selected users
  const handleShare = async () => {
    if (selectedUsers.length === 0) {
      return;
    }

    try {
      setIsSharing(true);
      setErrorMessage("");

      const usersToShareWith = await Promise.all(
        selectedUsers.map(async (user) => {
          let email = user.email;
          if (!email) {
            try {
              const emailResponse = await fetch("/api/github/user/email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ login: user.login }),
              });
              if (emailResponse.ok) {
                const data = await emailResponse.json();
                email = data.email;
              }
            } catch (error) {
              console.error(`Failed to fetch email for ${user.login}`, error);
            }
          }

          return {
            userId: user.id.toString(),
            name: user.name || user.login,
            email: email || `${user.login}@github.com`, // Fallback email
          };
        })
      );

      const response = await fetch("/api/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId,
          usersToShareWith,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to share chat");
      }

      onShareComplete();
      onClose();
    } catch (error: unknown) {
      console.error("Error sharing chat:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to share chat"
      );
    } finally {
      setIsSharing(false);
    }
  };

  // Get initials from name or username
  const getInitials = (name: string): string => {
    if (!name) return "??";

    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return name.substring(0, 2).toUpperCase();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Conversation
          </DialogTitle>
          <DialogDescription>
            Share this conversation with other members of your organization
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="bg-destructive/15 text-destructive text-sm py-2 px-3 rounded-md">
            {errorMessage}
          </div>
        )}

        <div className="relative">
          <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2 z-10 pointer-events-none" />
          <Input
            placeholder="Search by name or email..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => {
              e.stopPropagation();
              setSearchQuery(e.target.value);
            }}
            onKeyDown={(e) => e.stopPropagation()}
            onFocus={(e) => e.stopPropagation()}
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {currentlySharedWith.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Already shared with
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentlySharedWith.map((user) => (
                    <div
                      key={user.userId}
                      className="flex items-center gap-1.5 bg-secondary/50 text-secondary-foreground text-sm py-1 px-2 rounded-full"
                    >
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-xs">
                          {user.name ? getInitials(user.name) : "??"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs">{user.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <ScrollArea className="max-h-[300px]">
              <div className="space-y-1">
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => {
                    const isSelected = selectedUsers.some(
                      (u) => u.id === member.id
                    );
                    const isShared = isAlreadyShared(member.id);
                    const userName = member.name || member.login;
                    const userInitials = getInitials(
                      member.name || member.login
                    );

                    return (
                      <div
                        key={member.id}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-md transition-colors",
                          isSelected ? "bg-primary/10" : "hover:bg-muted",
                          isShared
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer"
                        )}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!isShared) {
                            toggleSelectUser(member);
                          }
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={member.avatar_url} />
                            <AvatarFallback>{userInitials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{userName}</div>
                            <div className="text-xs text-muted-foreground">
                              {member.email || member.login}
                            </div>
                          </div>
                        </div>

                        <div>
                          {isShared ? (
                            <div className="text-xs text-muted-foreground px-2 py-1 border border-muted rounded-md">
                              Shared
                            </div>
                          ) : (
                            <div
                              className={cn(
                                "size-5 flex items-center justify-center rounded-full border transition-colors",
                                isSelected
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "border-muted hover:border-primary/50"
                              )}
                            >
                              {isSelected && <Check className="h-3 w-3" />}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    {searchQuery ? "No users found" : "Loading users..."}
                  </div>
                )}
              </div>
            </ScrollArea>
          </>
        )}

        <DialogFooter className="flex gap-2 items-center">
          <div className="text-sm text-muted-foreground mr-auto">
            {selectedUsers.length} user{selectedUsers.length !== 1 ? "s" : ""}{" "}
            selected
          </div>
          <Button variant="outline" onClick={onClose} disabled={isSharing}>
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={isSharing || selectedUsers.length === 0}
            className="flex items-center gap-2"
          >
            {isSharing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            {isSharing ? "Sharing..." : "Share"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
