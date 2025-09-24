"use client";
import { createContext, useContext, useState, ReactNode, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Upload,
  X,
} from "lucide-react";
import { useUserSession } from "@/hooks/use-user-session";
import { toast } from "sonner";

interface DialogOptions {
  title?: string;
  description?: string;
  chatId?: string;
  messageId?: string;
  onSubmit: (
    comments: string,
    rating: number,
    jiraIssue?: { key: string; url: string }
  ) => void;
}

interface DialogContextType {
  openDialog: (options: DialogOptions) => void;
  closeDialog: () => void;
}

interface JiraIssueData {
  summary: string;
  description: string;
  priority: string;
  labels: string[];
  attachments: File[];
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const DialogProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isGood, setIsGood] = useState(true);
  const [rating, setRating] = useState(50);
  const [dialogTitle, setDialogTitle] = useState("Comments");
  const [dialogDescription, setDialogDescription] = useState("");
  const [callback, setCallback] = useState<
    | ((
        feedback: string,
        rating: number,
        jiraIssue?: { key: string; url: string }
      ) => void)
    | null
  >(null);
  const [comments, setComments] = useState("");

  // Jira integration states
  const [createJiraIssue, setCreateJiraIssue] = useState(false);
  const [jiraIssueData, setJiraIssueData] = useState<JiraIssueData>({
    summary: "",
    description: "",
    priority: "Medium",
    labels: [],
    attachments: [],
  });
  const [isCreatingJira, setIsCreatingJira] = useState(false);
  const [jiraSuccess, setJiraSuccess] = useState<{
    key: string;
    url: string;
  } | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { userSession } = useUserSession();

  const openDialog = (options: DialogOptions) => {
    setIsOpen(true);
    // Determine if it's a positive feedback based on the title (contains "Upvote" or not)
    const isPositive = options.title?.includes("Upvote") ?? true;
    setIsGood(isPositive);
    setRating(isPositive ? 50 : 20);
    setDialogTitle(options.title || "Comments");
    setDialogDescription(options.description || "");
    setCallback(() => options.onSubmit);

    // Reset states
    setCreateJiraIssue(false);
    setJiraSuccess(null);
    setJiraIssueData({
      summary: "",
      description: "",
      priority: "Medium",
      labels: [],
      attachments: [],
    });
  };

  const closeDialog = () => {
    setIsOpen(false);
    // Reset the form state for next use
    setComments("");
    setCreateJiraIssue(false);
    setJiraSuccess(null);
    setIsCreatingJira(false);
    setJiraIssueData({
      summary: "",
      description: "",
      priority: "Medium",
      labels: [],
      attachments: [],
    });
    setNewLabel("");
  };

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComments(event.target.value);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setJiraIssueData((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...files],
    }));
  };

  const removeAttachment = (index: number) => {
    setJiraIssueData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const addLabel = () => {
    if (newLabel.trim() && !jiraIssueData.labels.includes(newLabel.trim())) {
      setJiraIssueData((prev) => ({
        ...prev,
        labels: [...prev.labels, newLabel.trim()],
      }));
      setNewLabel("");
    }
  };

  const removeLabel = (label: string) => {
    setJiraIssueData((prev) => ({
      ...prev,
      labels: prev.labels.filter((l) => l !== label),
    }));
  };

  // Helper function to convert file to base64
  const fileToBase64 = (
    file: File
  ): Promise<{ fileName: string; content: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1]; // Remove data:type;base64, prefix
        resolve({
          fileName: file.name,
          content: base64,
          mimeType: file.type || "application/octet-stream",
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleCreateJiraIssue = async () => {
    if (!jiraIssueData.summary || !jiraIssueData.description) {
      toast.error(
        "Please fill in both summary and description for the Jira issue"
      );
      return;
    }

    setIsCreatingJira(true);
    try {
      // Convert attachments to base64
      let attachmentData: string[] = [];
      if (jiraIssueData.attachments.length > 0) {
        toast.info(
          `Processing ${jiraIssueData.attachments.length} attachment(s)...`
        );
        const attachmentPromises = jiraIssueData.attachments.map((file) =>
          fileToBase64(file)
        );
        const attachmentResults = await Promise.all(attachmentPromises);
        attachmentData = attachmentResults.map((result) =>
          JSON.stringify(result)
        );
      }

      const response = await fetch("/api/jira/create-issue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: jiraIssueData.summary,
          description: `${jiraIssueData.description}\n\n--- Original Feedback ---\n${comments}`,
          projectKey: "ISCCC",
          issueType: "Task",
          priority: jiraIssueData.priority,
          labels: jiraIssueData.labels,
          reporterEmail: userSession?.email,
          reporterName: userSession?.email?.split("@")[0],
          attachments: attachmentData,
        }),
      });

      const result = await response.json();

      if (result.status === "success") {
        setJiraSuccess({
          key: result.data.issueKey,
          url: result.data.issueUrl,
        });

        let message = `Jira issue ${result.data.issueKey} created successfully!`;
        if (result.data.attachments && result.data.attachments.length > 0) {
          message += ` ${result.data.attachments.length} attachment(s) uploaded.`;
        }
        toast.success(message);
      } else {
        throw new Error(result.message || "Failed to create Jira issue");
      }
    } catch (error) {
      console.error("Error creating Jira issue:", error);
      toast.error(
        `Failed to create Jira issue: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsCreatingJira(false);
    }
  };

  const handleSubmit = async () => {
    if (createJiraIssue && !jiraSuccess) {
      await handleCreateJiraIssue();
      return;
    }

    if (callback) {
      callback(comments, rating, jiraSuccess || undefined);
    }
    closeDialog();
  };

  return (
    <DialogContext.Provider value={{ openDialog, closeDialog }}>
      {children}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          onPointerDownOutside={(e) => {
            // Prevent closing when clicking outside the modal
            e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            // Prevent closing when pressing Escape key
            e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isGood ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              {dialogTitle}
            </DialogTitle>
            <DialogDescription>
              {dialogDescription || (
                <>
                  Please provide detailed feedback on why this is a{" "}
                  <Badge variant={isGood ? "default" : "destructive"}>
                    {isGood ? "Good Response" : "Bad Response"}
                  </Badge>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Comment Section */}
            <div className="space-y-3">
              <Label htmlFor="comments" className="text-sm font-medium">
                Your Feedback *
              </Label>
              <Textarea
                id="comments"
                value={comments}
                onChange={handleInput}
                placeholder="Please provide specific details about what worked well or what needs improvement..."
                className="min-h-[120px] resize-none"
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !createJiraIssue
                  ) {
                    event.preventDefault();
                    handleSubmit();
                  }
                }}
              />
            </div>

            {/* Rating Section */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Usefulness Rating: {rating}%
              </Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[rating]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={(value) => setRating(value[0])}
                  className="flex-1"
                />
                <div className="min-w-[60px]">
                  <Badge
                    variant={
                      rating >= 70
                        ? "default"
                        : rating >= 40
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {rating}%
                  </Badge>
                </div>
              </div>
            </div>

            {/* Jira Integration for Bad Responses */}
            {!isGood && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="create-jira"
                      checked={createJiraIssue}
                      onCheckedChange={(checked) =>
                        setCreateJiraIssue(!!checked)
                      }
                    />
                    <Label
                      htmlFor="create-jira"
                      className="text-sm font-medium cursor-pointer flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Create Jira Issue for this problem
                    </Label>
                  </div>

                  {createJiraIssue && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Jira Issue Details
                        </CardTitle>
                        <CardDescription>
                          This will create a new issue in the ISCCC project to
                          track and resolve this problem.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {jiraSuccess ? (
                          <Alert>
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertDescription className="flex items-center gap-2">
                              Jira issue created successfully:
                              <a
                                href={jiraSuccess.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                              >
                                {jiraSuccess.key}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <>
                            <div className="space-y-2">
                              <Label
                                htmlFor="jira-summary"
                                className="text-sm font-medium"
                              >
                                Issue Summary *
                              </Label>
                              <Input
                                id="jira-summary"
                                value={jiraIssueData.summary}
                                onChange={(e) =>
                                  setJiraIssueData((prev) => ({
                                    ...prev,
                                    summary: e.target.value,
                                  }))
                                }
                                placeholder="Brief description of the issue"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label
                                htmlFor="jira-description"
                                className="text-sm font-medium"
                              >
                                Detailed Description *
                              </Label>
                              <Textarea
                                id="jira-description"
                                value={jiraIssueData.description}
                                onChange={(e) =>
                                  setJiraIssueData((prev) => ({
                                    ...prev,
                                    description: e.target.value,
                                  }))
                                }
                                placeholder="Detailed description of the issue, steps to reproduce, expected vs actual behavior..."
                                className="min-h-[100px]"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                  Priority
                                </Label>
                                <Select
                                  value={jiraIssueData.priority}
                                  onValueChange={(value) =>
                                    setJiraIssueData((prev) => ({
                                      ...prev,
                                      priority: value,
                                    }))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Highest">
                                      Highest
                                    </SelectItem>
                                    <SelectItem value="High">High</SelectItem>
                                    <SelectItem value="Medium">
                                      Medium
                                    </SelectItem>
                                    <SelectItem value="Low">Low</SelectItem>
                                    <SelectItem value="Lowest">
                                      Lowest
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                  Add Labels
                                </Label>
                                <div className="flex gap-2">
                                  <Input
                                    value={newLabel}
                                    onChange={(e) =>
                                      setNewLabel(e.target.value)
                                    }
                                    placeholder="Label name"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        addLabel();
                                      }
                                    }}
                                  />
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={addLabel}
                                  >
                                    Add
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {jiraIssueData.labels.length > 0 && (
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                  Labels
                                </Label>
                                <div className="flex flex-wrap gap-2">
                                  {jiraIssueData.labels.map((label) => (
                                    <Badge
                                      key={label}
                                      variant="secondary"
                                      className="flex items-center gap-1"
                                    >
                                      {label}
                                      <button
                                        type="button"
                                        onClick={() => removeLabel(label)}
                                        className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="space-y-2">
                              <Label className="text-sm font-medium">
                                Attachments
                              </Label>
                              <div className="space-y-2">
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  multiple
                                  accept=".svg,.png,.jpg,.jpeg,.gif,.pdf,.txt,.log,.json,.xml,.csv,.zip,.doc,.docx,.xls,.xlsx"
                                  onChange={handleFileUpload}
                                  className="hidden"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => fileInputRef.current?.click()}
                                  className="flex items-center gap-2"
                                >
                                  <Upload className="h-4 w-4" />
                                  Add Files
                                </Button>
                                {jiraIssueData.attachments.length > 0 && (
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium">
                                      Selected Files (
                                      {jiraIssueData.attachments.length})
                                    </Label>
                                    <div className="space-y-1">
                                      {jiraIssueData.attachments.map(
                                        (file, index) => (
                                          <div
                                            key={index}
                                            className="flex items-center justify-between text-sm bg-slate-100 border border-slate-200 p-3 rounded-md"
                                          >
                                            <div className="flex items-center gap-2">
                                              <FileText className="h-4 w-4 text-slate-600" />
                                              <span className="text-slate-800 font-medium">
                                                {file.name}
                                              </span>
                                              <span className="text-slate-500 text-xs">
                                                ({(file.size / 1024).toFixed(1)}{" "}
                                                KB)
                                              </span>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                removeAttachment(index)
                                              }
                                              className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded transition-colors"
                                              title="Remove file"
                                            >
                                              <X className="h-4 w-4" />
                                            </button>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button type="button" onClick={closeDialog} variant="secondary">
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={isCreatingJira}
            >
              {isCreatingJira
                ? "Creating Issue..."
                : createJiraIssue && !jiraSuccess
                  ? "Create Issue & Submit"
                  : "Submit Feedback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DialogContext.Provider>
  );
};

export const useDialog = (): DialogContextType => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
};
