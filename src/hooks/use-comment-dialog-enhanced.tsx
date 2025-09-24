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
  Loader2,
} from "lucide-react";
import { useUserSession } from "@/hooks/use-user-session";
import { toast } from "sonner";
import type { JiraSubtaskData, FeedbackSubtaskOption } from "@/types/types";

// Define feedback categories
const FEEDBACK_CATEGORIES = [
  { value: "apex-query", label: "Apex Query/Code" },
  { value: "apex-test", label: "Apex Test" },
  { value: "lwc", label: "LWC (Lightning Web Components)" },
  { value: "jest", label: "JEST Testing" },
  { value: "general", label: "General Query" },
  { value: "miscellaneous", label: "Miscellaneous" },
] as const;

type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number]["value"];

interface DialogOptions {
  title?: string;
  description?: string;
  chatId?: string;
  messageId?: string;
  onSubmit: (
    comments: string,
    rating: number,
    jiraData?: {
      key: string;
      url: string;
      type: "issue" | "subtask";
      parentKey?: string;
    },
    category?: FeedbackCategory
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

export const EnhancedDialogProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isGood, setIsGood] = useState(true);
  const [rating, setRating] = useState(50);
  const [dialogTitle, setDialogTitle] = useState("Comments");
  const [dialogDescription, setDialogDescription] = useState("");
  const [callback, setCallback] = useState<
    | ((
        feedback: string,
        rating: number,
        jiraData?: {
          key: string;
          url: string;
          type: "issue" | "subtask";
          parentKey?: string;
        },
        category?: FeedbackCategory
      ) => void)
    | null
  >(null);
  const [comments, setComments] = useState("");
  const [category, setCategory] = useState<FeedbackCategory>("general");

  // Jira integration states
  const [createJiraIssue, setCreateJiraIssue] = useState(false);
  const [jiraIssueData, setJiraIssueData] = useState<JiraIssueData>({
    summary: "",
    description: "",
    priority: "Medium",
    labels: [],
    attachments: [],
  });

  // Enhanced subtask states
  const [jiraMode, setJiraMode] = useState<"issue" | "subtask">("issue");
  const [subtaskOption, setSubtaskOption] = useState<FeedbackSubtaskOption>({
    action: "create_new",
  });
  const [jiraSubtaskData, setJiraSubtaskData] = useState<JiraSubtaskData>({
    parentTaskKey: "",
    summary: "",
    description: "",
    priority: "Medium",
    labels: [],
    attachments: [],
    usabilityPercentage: 50,
  });
  const [parentTaskDetails, setParentTaskDetails] = useState<{
    key: string;
    summary: string;
    description: string;
    status: string;
  } | null>(null);
  const [existingSubtasks, setExistingSubtasks] = useState<
    Array<{
      key: string;
      summary: string;
      status: string;
    }>
  >([]);

  const [isCreatingJira, setIsCreatingJira] = useState(false);
  const [jiraSuccess, setJiraSuccess] = useState<{
    key: string;
    url: string;
    type: "issue" | "subtask";
    parentKey?: string;
  } | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [isValidatingParentTask, setIsValidatingParentTask] = useState(false);
  const [chatId, setChatId] = useState<string>("");
  const [messageId, setMessageId] = useState<string>("");
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

    // Store chat context
    setChatId(options.chatId || "");
    setMessageId(options.messageId || "");

    // Reset states
    setCreateJiraIssue(false);
    setJiraSuccess(null);
    setJiraMode("issue");
    setSubtaskOption({ action: "create_new" });
    setJiraIssueData({
      summary: "",
      description: "",
      priority: "Medium",
      labels: [],
      attachments: [],
    });
    setJiraSubtaskData({
      parentTaskKey: "",
      summary: "",
      description: "",
      priority: "Medium",
      labels: [],
      attachments: [],
      usabilityPercentage: 50,
    });
    setParentTaskDetails(null);
    setExistingSubtasks([]);
  };

  const closeDialog = () => {
    setIsOpen(false);
    // Reset the form state for next use
    setComments("");
    setCategory("general");
    setCreateJiraIssue(false);
    setJiraSuccess(null);
    setIsCreatingJira(false);
    setJiraMode("issue");
    setSubtaskOption({ action: "create_new" });
    setJiraIssueData({
      summary: "",
      description: "",
      priority: "Medium",
      labels: [],
      attachments: [],
    });
    setJiraSubtaskData({
      parentTaskKey: "",
      summary: "",
      description: "",
      priority: "Medium",
      labels: [],
      attachments: [],
      usabilityPercentage: 50,
    });
    setParentTaskDetails(null);
    setExistingSubtasks([]);
    setNewLabel("");
  };

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComments(event.target.value);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (jiraMode === "issue") {
      setJiraIssueData((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...files],
      }));
    } else {
      setJiraSubtaskData((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...files],
      }));
    }
  };

  const removeAttachment = (index: number) => {
    if (jiraMode === "issue") {
      setJiraIssueData((prev) => ({
        ...prev,
        attachments: prev.attachments.filter((_, i) => i !== index),
      }));
    } else {
      setJiraSubtaskData((prev) => ({
        ...prev,
        attachments: prev.attachments.filter((_, i) => i !== index),
      }));
    }
  };

  const addLabel = () => {
    if (newLabel.trim()) {
      if (
        jiraMode === "issue" &&
        !jiraIssueData.labels.includes(newLabel.trim())
      ) {
        setJiraIssueData((prev) => ({
          ...prev,
          labels: [...prev.labels, newLabel.trim()],
        }));
      } else if (
        jiraMode === "subtask" &&
        !jiraSubtaskData.labels.includes(newLabel.trim())
      ) {
        setJiraSubtaskData((prev) => ({
          ...prev,
          labels: [...prev.labels, newLabel.trim()],
        }));
      }
      setNewLabel("");
    }
  };

  const removeLabel = (label: string) => {
    if (jiraMode === "issue") {
      setJiraIssueData((prev) => ({
        ...prev,
        labels: prev.labels.filter((l) => l !== label),
      }));
    } else {
      setJiraSubtaskData((prev) => ({
        ...prev,
        labels: prev.labels.filter((l) => l !== label),
      }));
    }
  };

  // Validate parent task and fetch details
  const validateParentTask = async (parentKey: string) => {
    if (!parentKey.trim()) {
      setParentTaskDetails(null);
      setExistingSubtasks([]);
      return;
    }

    setIsValidatingParentTask(true);
    try {
      const response = await fetch(
        `/api/jira/subtask?parentTaskKey=${encodeURIComponent(parentKey.trim())}`
      );
      const result = await response.json();

      if (result.status === "success") {
        setParentTaskDetails(result.data.parentTask);
        setExistingSubtasks(result.data.existingSubtasks || []);
        setJiraSubtaskData((prev) => ({
          ...prev,
          parentTaskKey: parentKey.trim(),
          parentTaskSummary: result.data.parentTask.summary,
          parentTaskDescription: result.data.parentTask.description,
          parentTaskStatus: result.data.parentTask.status,
        }));
      } else {
        setParentTaskDetails(null);
        setExistingSubtasks([]);
        toast.error(result.message || "Invalid parent task key");
      }
    } catch (error) {
      console.error("Error validating parent task:", error);
      setParentTaskDetails(null);
      setExistingSubtasks([]);
      toast.error("Failed to validate parent task");
    } finally {
      setIsValidatingParentTask(false);
    }
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
    if (jiraMode === "issue") {
      if (!jiraIssueData.summary || !jiraIssueData.description) {
        toast.error(
          "Please fill in both summary and description for the Jira issue"
        );
        return;
      }
    } else {
      if (
        !jiraSubtaskData.summary ||
        !jiraSubtaskData.description ||
        !jiraSubtaskData.parentTaskKey
      ) {
        toast.error(
          "Please fill in summary, description, and parent task key for the subtask"
        );
        return;
      }
      if (!parentTaskDetails) {
        toast.error("Please validate the parent task first");
        return;
      }
    }

    setIsCreatingJira(true);
    try {
      const currentData =
        jiraMode === "issue" ? jiraIssueData : jiraSubtaskData;

      // Convert attachments to base64
      let attachmentData: string[] = [];
      if (currentData.attachments.length > 0) {
        toast.info(
          `Processing ${currentData.attachments.length} attachment(s)...`
        );
        const attachmentPromises = currentData.attachments.map((file) =>
          fileToBase64(file)
        );
        const attachmentResults = await Promise.all(attachmentPromises);
        attachmentData = attachmentResults.map((result) =>
          JSON.stringify(result)
        );
      }

      if (jiraMode === "issue") {
        const response = await fetch("/api/jira/create-issue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
            type: "issue",
          });
          let message = `Jira issue ${result.data.issueKey} created successfully!`;
          if (result.data.attachments && result.data.attachments.length > 0) {
            message += ` ${result.data.attachments.length} attachment(s) uploaded.`;
          }
          toast.success(message);
        } else {
          throw new Error(result.message || "Failed to create Jira issue");
        }
      } else {
        // Handle subtask creation
        const subtaskPayload = {
          parentTaskKey: jiraSubtaskData.parentTaskKey,
          summary: jiraSubtaskData.summary,
          description: `${jiraSubtaskData.description}\n\n--- Original Feedback ---\n${comments}\n\nUsability Rating: ${jiraSubtaskData.usabilityPercentage}%`,
          priority: jiraSubtaskData.priority,
          labels: jiraSubtaskData.labels,
          usabilityPercentage: jiraSubtaskData.usabilityPercentage,
          reporterEmail: userSession?.email,
          reporterName: userSession?.email?.split("@")[0],
          chatId: chatId,
          messageId: messageId,
          attachments: attachmentData,
          additionalDetails: jiraSubtaskData.additionalDetails,
        };

        if (
          subtaskOption.action === "add_to_existing" &&
          subtaskOption.existingSubtaskKey
        ) {
          // Update existing subtask
          const response = await fetch("/api/jira/subtask", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...subtaskPayload,
              existingSubtaskKey: subtaskOption.existingSubtaskKey,
            }),
          });

          const result = await response.json();
          if (result.status === "success") {
            setJiraSuccess({
              key: result.data.subtaskKey,
              url: result.data.subtaskUrl,
              type: "subtask",
              parentKey: jiraSubtaskData.parentTaskKey,
            });
            toast.success(
              `Subtask ${result.data.subtaskKey} updated successfully!`
            );
          } else {
            throw new Error(result.message || "Failed to update Jira subtask");
          }
        } else {
          // Create new subtask
          const response = await fetch("/api/jira/subtask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(subtaskPayload),
          });

          const result = await response.json();
          if (result.status === "success") {
            setJiraSuccess({
              key: result.data.subtaskKey,
              url: result.data.subtaskUrl,
              type: "subtask",
              parentKey: jiraSubtaskData.parentTaskKey,
            });
            let message = `Subtask ${result.data.subtaskKey} created successfully!`;
            if (result.data.attachments && result.data.attachments.length > 0) {
              message += ` ${result.data.attachments.length} attachment(s) uploaded.`;
            }
            toast.success(message);
          } else {
            throw new Error(result.message || "Failed to create Jira subtask");
          }
        }
      }
    } catch (error) {
      console.error("Error creating Jira issue/subtask:", error);
      toast.error(
        `Failed to create Jira ${jiraMode}: ${error instanceof Error ? error.message : "Unknown error"}`
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
      callback(comments, rating, jiraSuccess || undefined, category);
    }
    closeDialog();
  };

  const currentLabels =
    jiraMode === "issue" ? jiraIssueData.labels : jiraSubtaskData.labels;
  const currentAttachments =
    jiraMode === "issue"
      ? jiraIssueData.attachments
      : jiraSubtaskData.attachments;

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

            {/* Feedback Category Section */}
            <div className="space-y-3">
              <Label htmlFor="category" className="text-sm font-medium">
                Feedback Category *
              </Label>
              <Select
                value={category}
                onValueChange={(value: FeedbackCategory) => setCategory(value)}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {FEEDBACK_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            {/* Jira Integration - Available for both Good and Bad Responses */}
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="create-jira"
                    checked={createJiraIssue}
                    onCheckedChange={(checked) => setCreateJiraIssue(!!checked)}
                  />
                  <Label
                    htmlFor="create-jira"
                    className="text-sm font-medium cursor-pointer flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Create Jira {isGood ? "Enhancement" : "Issue"} for this
                    feedback
                  </Label>
                </div>

                {createJiraIssue && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Jira {isGood ? "Enhancement" : "Issue"} Details
                      </CardTitle>
                      <CardDescription>
                        {isGood
                          ? "Create an enhancement request to improve this feature based on your positive feedback."
                          : "This will create a new issue in the ISCCC project to track and resolve this problem."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {jiraSuccess ? (
                        <Alert>
                          <CheckCircle2 className="h-4 w-4" />
                          <AlertDescription className="flex items-center gap-2">
                            Jira {jiraSuccess.type} created successfully:
                            <a
                              href={jiraSuccess.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              {jiraSuccess.key}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            {jiraSuccess.parentKey && (
                              <span className="text-sm text-gray-600">
                                (Subtask of {jiraSuccess.parentKey})
                              </span>
                            )}
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <>
                          {/* Jira Mode Selection */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">
                              Creation Type
                            </Label>
                            <Select
                              value={jiraMode}
                              onValueChange={(value: "issue" | "subtask") =>
                                setJiraMode(value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="issue">
                                  Create New {isGood ? "Enhancement" : "Issue"}
                                </SelectItem>
                                <SelectItem value="subtask">
                                  Create/Update Subtask
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {jiraMode === "subtask" && (
                            <>
                              {/* Parent Task Input */}
                              <div className="space-y-2">
                                <Label
                                  htmlFor="parent-task"
                                  className="text-sm font-medium"
                                >
                                  Parent Task Key *
                                </Label>
                                <div className="flex gap-2">
                                  <Input
                                    id="parent-task"
                                    value={jiraSubtaskData.parentTaskKey}
                                    onChange={(e) => {
                                      setJiraSubtaskData((prev) => ({
                                        ...prev,
                                        parentTaskKey: e.target.value,
                                      }));
                                    }}
                                    onBlur={(e) =>
                                      validateParentTask(e.target.value)
                                    }
                                    placeholder="e.g., ISCCC-123"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      validateParentTask(
                                        jiraSubtaskData.parentTaskKey
                                      )
                                    }
                                    disabled={isValidatingParentTask}
                                  >
                                    {isValidatingParentTask ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Validating...
                                      </>
                                    ) : (
                                      "Validate"
                                    )}
                                  </Button>
                                </div>
                              </div>

                              {/* Parent Task Details */}
                              {parentTaskDetails && (
                                <Alert>
                                  <CheckCircle2 className="h-4 w-4" />
                                  <AlertDescription>
                                    <div className="space-y-1">
                                      <div>
                                        <strong>Parent Task:</strong>{" "}
                                        {parentTaskDetails.key}
                                      </div>
                                      <div>
                                        <strong>Summary:</strong>{" "}
                                        {parentTaskDetails.summary}
                                      </div>
                                      <div>
                                        <strong>Status:</strong>{" "}
                                        {parentTaskDetails.status}
                                      </div>
                                    </div>
                                  </AlertDescription>
                                </Alert>
                              )}

                              {/* Existing Subtasks */}
                              {existingSubtasks.length > 0 && (
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">
                                    Subtask Option
                                  </Label>
                                  <Select
                                    value={subtaskOption.action}
                                    onValueChange={(
                                      value: "create_new" | "add_to_existing"
                                    ) =>
                                      setSubtaskOption((prev) => ({
                                        ...prev,
                                        action: value,
                                      }))
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="create_new">
                                        Create New Subtask
                                      </SelectItem>
                                      <SelectItem value="add_to_existing">
                                        Add to Existing Subtask (
                                        {existingSubtasks.length} found)
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>

                                  {subtaskOption.action ===
                                    "add_to_existing" && (
                                    <Select
                                      value={
                                        subtaskOption.existingSubtaskKey || ""
                                      }
                                      onValueChange={(value) =>
                                        setSubtaskOption((prev) => ({
                                          ...prev,
                                          existingSubtaskKey: value,
                                        }))
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select existing subtask" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {existingSubtasks.map((subtask) => (
                                          <SelectItem
                                            key={subtask.key}
                                            value={subtask.key}
                                          >
                                            {subtask.key}: {subtask.summary} (
                                            {subtask.status})
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                </div>
                              )}

                              {/* Usability Percentage for Subtasks */}
                              <div className="space-y-3">
                                <Label className="text-sm font-medium">
                                  Usability Rating:{" "}
                                  {jiraSubtaskData.usabilityPercentage}%
                                </Label>
                                <div className="flex items-center gap-4">
                                  <Slider
                                    value={[
                                      jiraSubtaskData.usabilityPercentage,
                                    ]}
                                    min={0}
                                    max={100}
                                    step={5}
                                    onValueChange={(value) =>
                                      setJiraSubtaskData((prev) => ({
                                        ...prev,
                                        usabilityPercentage: value[0],
                                      }))
                                    }
                                    className="flex-1"
                                  />
                                  <div className="min-w-[60px]">
                                    <Badge
                                      variant={
                                        jiraSubtaskData.usabilityPercentage >=
                                        70
                                          ? "default"
                                          : jiraSubtaskData.usabilityPercentage >=
                                              40
                                            ? "secondary"
                                            : "destructive"
                                      }
                                    >
                                      {jiraSubtaskData.usabilityPercentage}%
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}

                          {/* Summary Input */}
                          <div className="space-y-2">
                            <Label
                              htmlFor={`${jiraMode}-summary`}
                              className="text-sm font-medium"
                            >
                              {jiraMode === "issue" ? "Issue" : "Subtask"}{" "}
                              Summary *
                            </Label>
                            <Input
                              id={`${jiraMode}-summary`}
                              value={
                                jiraMode === "issue"
                                  ? jiraIssueData.summary
                                  : jiraSubtaskData.summary
                              }
                              onChange={(e) => {
                                if (jiraMode === "issue") {
                                  setJiraIssueData((prev) => ({
                                    ...prev,
                                    summary: e.target.value,
                                  }));
                                } else {
                                  setJiraSubtaskData((prev) => ({
                                    ...prev,
                                    summary: e.target.value,
                                  }));
                                }
                              }}
                              placeholder={`Brief description of the ${jiraMode}`}
                            />
                          </div>

                          {/* Description Input */}
                          <div className="space-y-2">
                            <Label
                              htmlFor={`${jiraMode}-description`}
                              className="text-sm font-medium"
                            >
                              Detailed Description *
                            </Label>
                            <Textarea
                              id={`${jiraMode}-description`}
                              value={
                                jiraMode === "issue"
                                  ? jiraIssueData.description
                                  : jiraSubtaskData.description
                              }
                              onChange={(e) => {
                                if (jiraMode === "issue") {
                                  setJiraIssueData((prev) => ({
                                    ...prev,
                                    description: e.target.value,
                                  }));
                                } else {
                                  setJiraSubtaskData((prev) => ({
                                    ...prev,
                                    description: e.target.value,
                                  }));
                                }
                              }}
                              placeholder={`Detailed description of the ${jiraMode}, steps to reproduce, expected vs actual behavior...`}
                              className="min-h-[100px]"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">
                                Priority
                              </Label>
                              <Select
                                value={
                                  jiraMode === "issue"
                                    ? jiraIssueData.priority
                                    : jiraSubtaskData.priority
                                }
                                onValueChange={(value) => {
                                  if (jiraMode === "issue") {
                                    setJiraIssueData((prev) => ({
                                      ...prev,
                                      priority: value,
                                    }));
                                  } else {
                                    setJiraSubtaskData((prev) => ({
                                      ...prev,
                                      priority: value,
                                    }));
                                  }
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Highest">
                                    Highest
                                  </SelectItem>
                                  <SelectItem value="High">High</SelectItem>
                                  <SelectItem value="Medium">Medium</SelectItem>
                                  <SelectItem value="Low">Low</SelectItem>
                                  <SelectItem value="Lowest">Lowest</SelectItem>
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
                                  onChange={(e) => setNewLabel(e.target.value)}
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

                          {/* Labels Display */}
                          {currentLabels.length > 0 && (
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">
                                Labels
                              </Label>
                              <div className="flex flex-wrap gap-2">
                                {currentLabels.map((label) => (
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
                                      title="Remove label"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Attachments */}
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
                                aria-label="Upload attachment files"
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
                              {currentAttachments.length > 0 && (
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">
                                    Selected Files ({currentAttachments.length})
                                  </Label>
                                  <div className="space-y-1">
                                    {currentAttachments.map((file, index) => (
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
                                            ({(file.size / 1024).toFixed(1)} KB)
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
                                    ))}
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
              {isCreatingJira ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating {jiraMode}...
                </>
              ) : createJiraIssue && !jiraSuccess ? (
                `Create ${jiraMode} & Submit`
              ) : (
                "Submit Feedback"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DialogContext.Provider>
  );
};

export const useEnhancedDialog = (): DialogContextType => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error(
      "useEnhancedDialog must be used within an EnhancedDialogProvider"
    );
  }
  return context;
};
