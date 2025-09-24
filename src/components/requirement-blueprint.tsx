"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Paperclip,
  Send,
  X,
  Loader,
  Lightbulb,
  FileCode,
  History as HistoryIcon,
  RefreshCw,
  Github,
  Upload,
  Eye,
  Sparkles,
  Zap,
  Target,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GitHubBrowser } from "./GitHubBrowser";
import { JiraIssueBrowser } from "./jira-issue-browser";
import { FileAttachment } from "@/types/types";
import { FileAttachment as GitHubFileAttachment } from "@/types/files";
import { JiraIssue, formatJiraIssueForAI } from "@/services/jira-service";
import { AnalysisProgress } from "./analysis-progress";
import { AnalysisTimeline } from "./analysis-timeline";
import { AnalysisResults } from "./analysis-results";
import { toast } from "sonner";
import { streamRequirementAnalysis } from "@/services/requirement-analyzer";
import {
  RequirementAnalysisResponse,
  ProgressUpdate,
  SupportingDocument,
} from "@/types/requirement-analyzer";
import useLocalStorage from "@/hooks/use-local-storage";
import { useModels } from "@/hooks/use-models";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import vscDarkPlus from "react-syntax-highlighter/dist/cjs/styles/prism/vsc-dark-plus";
import { generateUUID } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ModelSelector } from "@/components/ui/model-selector";

interface RequirementBlueprintProps {
  onQuerySelect: (query: string) => void;
}

export function RequirementBlueprint({
  onQuerySelect,
}: RequirementBlueprintProps) {
  const router = useRouter();
  const [requirement, setRequirement] = useLocalStorage<string>(
    "analysis-requirement",
    ""
  );
  const [attachedFiles, setAttachedFiles] = useLocalStorage<FileAttachment[]>(
    "analysis-files",
    []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);
  const [progressUpdates, setProgressUpdates] = useLocalStorage<
    ProgressUpdate[]
  >("analysis-progress-updates", []);
  const [error, setError] = useState<string | undefined>(undefined);
  const [analysisResult, setAnalysisResult] =
    useLocalStorage<RequirementAnalysisResponse | null>(
      "analysis-result",
      null
    );
  const [showProgressHistory, setShowProgressHistory] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [showGitHubBrowser, setShowGitHubBrowser] = useState(false);
  const [showJiraBrowser, setShowJiraBrowser] = useState(false);
  const [attachedJiraIssues, setAttachedJiraIssues] = useLocalStorage<
    JiraIssue[]
  >("requirement-blueprint-jira-issues", []);
  const [previewFile, setPreviewFile] = useState<FileAttachment | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Get available models from configuration
  const { defaultModel } = useModels();

  const [selectedModel, setSelectedModel] = useLocalStorage<string>(
    "requirement-blueprint-model",
    defaultModel || "ibm/granite-3-2-8b-instruct"
  );

  // Use hydration-safe state for showing results
  const showingResults = isHydrated && analysisResult !== null;

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Constants for file limitations
  const MAX_FILES = 3;
  const MAX_JIRA_ISSUES = 3;
  // File size limit removed - allow files of any size

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isSubmitting) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);

    if (isSubmitting) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await processDroppedFiles(files);
    }
  };

  // File processing function
  const processDroppedFiles = async (files: File[]) => {
    // Check if adding new files would exceed the limit
    if (attachedFiles.length + files.length > MAX_FILES) {
      setError(`You can only attach up to ${MAX_FILES} files at a time.`);
      return;
    }

    const newFiles: FileAttachment[] = [];
    let hasErrors = false;

    for (const file of files) {
      // Check for duplicate file names
      const isDuplicate = attachedFiles.some(
        (existing) => existing.name.toLowerCase() === file.name.toLowerCase()
      );
      if (isDuplicate) {
        setError(`File "${file.name}" is already attached.`);
        hasErrors = true;
        continue;
      }

      try {
        const content = await readFileContent(file);
        const extension = file.name.split(".").pop()?.toLowerCase() || "";
        const fileType = detectFileType(file.name, content, extension);

        // Validate that content was successfully read
        if (!content || content.trim().length === 0) {
          console.warn(
            `File ${file.name} appears to be empty or could not be read`
          );
          setError(
            `File "${file.name}" appears to be empty or could not be read.`
          );
          hasErrors = true;
          continue;
        }

        newFiles.push({
          id: generateUUID(),
          name: file.name,
          content,
          type: fileType.type,
          language: fileType.language,
          extension,
        });

        console.log(
          `Successfully processed file: ${file.name} (${content.length} characters)`
        );
      } catch (err) {
        console.error("Error reading file:", err);
        setError(`Failed to read ${file.name}. Please try again.`);
        hasErrors = true;
      }
    }

    if (newFiles.length > 0) {
      setAttachedFiles((prev) => [...prev, ...newFiles]);
    }

    // Auto-clear error after 5 seconds if there were no errors
    if (!hasErrors && newFiles.length > 0) {
      setTimeout(() => {
        setError("");
      }, 5000);
    }
  };

  // File reading utility
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  };

  // File type detection utility
  const detectFileType = (
    filename: string,
    content: string,
    extension: string
  ): { language: string; type: string } => {
    const fileExtensionMap: Record<string, { language: string; type: string }> =
      {
        // Apex
        cls: { language: "apex", type: "Apex Class" },
        trigger: { language: "apex", type: "Apex Trigger" },
        apex: { language: "apex", type: "Apex Code" },
        // LWC
        html: { language: "html", type: "LWC HTML" },
        js: { language: "javascript", type: "LWC JavaScript" },
        css: { language: "css", type: "LWC CSS" },
        xml: { language: "xml", type: "LWC Configuration" },
        // Other
        json: { language: "json", type: "JSON" },
        txt: { language: "plaintext", type: "Text" },
      };

    return (
      fileExtensionMap[extension] || { language: "plaintext", type: "Document" }
    );
  };

  // GitHub file selection handler
  const handleGitHubFileSelect = (files: GitHubFileAttachment[]) => {
    // Check if adding new files would exceed the limit
    if (attachedFiles.length + files.length > MAX_FILES) {
      setError(`You can only attach up to ${MAX_FILES} files at a time.`);
      return;
    }

    // Convert GitHub file attachments to local file attachment format
    const convertedFiles: FileAttachment[] = files.map((file) => ({
      id: file.id,
      name: file.name,
      content: file.content,
      type: file.type,
      language: file.language || "plaintext", // Convert optional language to required with fallback
      extension: file.extension || "",
    }));

    // Check for duplicate file names
    const newFiles = convertedFiles.filter((file) => {
      const isDuplicate = attachedFiles.some(
        (existing) => existing.name.toLowerCase() === file.name.toLowerCase()
      );
      return !isDuplicate;
    });

    if (newFiles.length !== files.length) {
      setError("Some files were skipped because they were already attached.");
    }

    if (newFiles.length > 0) {
      setAttachedFiles((prev) => [...prev, ...newFiles]);
    }

    setShowGitHubBrowser(false);
    setError("");
  };

  // JIRA issue selection handler
  const handleJiraIssueSelect = (issue: JiraIssue) => {
    // Check if adding new issue would exceed the limit
    if (attachedJiraIssues.length >= MAX_JIRA_ISSUES) {
      setError(
        `You can only attach up to ${MAX_JIRA_ISSUES} JIRA issues at a time.`
      );
      return;
    }

    // Check for duplicate issues
    const isDuplicate = attachedJiraIssues.some(
      (existing) => existing.key === issue.key
    );

    if (isDuplicate) {
      setError(`JIRA issue ${issue.key} is already attached.`);
      return;
    }

    // Add the issue
    setAttachedJiraIssues((prev) => [...prev, issue]);
    setShowJiraBrowser(false);
    setError("");
    toast.success(`Added JIRA issue ${issue.key} to requirements`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!requirement.trim()) return;

    setIsSubmitting(true);
    setError(undefined);
    setProgress(null);
    setProgressUpdates([]);
    setAnalysisResult(null);
    setShowProgressHistory(false);

    try {
      // Convert attached files to supporting docs format
      const fileSupportingDocs: SupportingDocument[] = attachedFiles
        .filter((file) => file.content && file.content.trim().length > 0) // Only include files with content
        .map((file) => ({
          content: file.content || "",
          name: file.name,
        }));

      // Convert attached JIRA issues to supporting docs format
      const jiraSupportingDocs: SupportingDocument[] = attachedJiraIssues.map(
        (issue) => ({
          content: formatJiraIssueForAI(issue),
          name: `JIRA-${issue.key}`,
        })
      );

      // Combine all supporting documents
      const supportingDocs: SupportingDocument[] = [
        ...fileSupportingDocs,
        ...jiraSupportingDocs,
      ];

      // Warn if some files were filtered out due to missing content
      if (fileSupportingDocs.length !== attachedFiles.length) {
        console.warn(
          `${attachedFiles.length - fileSupportingDocs.length} files excluded due to missing content`
        );
        toast.warning(
          `${attachedFiles.length - fileSupportingDocs.length} files were excluded because they have no content.`
        );
      }

      // Log file processing for debugging
      console.log("Processing attached files and JIRA issues for analysis:", {
        fileCount: attachedFiles.length,
        filenames: attachedFiles.map((f) => f.name),
        contentLengths: attachedFiles.map((f) => f.content?.length || 0),
        jiraIssueCount: attachedJiraIssues.length,
        jiraIssueKeys: attachedJiraIssues.map((j) => j.key),
        totalSupportingDocs: supportingDocs.length,
        totalContentLength: supportingDocs.reduce(
          (sum, doc) => sum + doc.content.length,
          0
        ),
      });

      // Create the request object with a stable session ID (client-side only)
      const request = {
        requirement,
        supporting_docs: supportingDocs,
        user_info: {
          name: "user", // Replace with actual user info
          session_id: `session_${typeof window !== "undefined" ? Date.now() : "initial"}`, // Generate a stable session ID
        },
        selected_model: selectedModel,
      };

      // Stream the analysis
      await streamRequirementAnalysis(
        request,
        (progressUpdate) => {
          console.log("Progress update received:", progressUpdate);
          // Set current progress
          setProgress(progressUpdate);

          // Add to progress history
          setProgressUpdates((prev) => {
            // Filter out any previous updates for the same step to avoid duplicates
            // but keep complete steps separate from in-progress steps
            const filteredUpdates = prev.filter(
              (p) =>
                p.step !== progressUpdate.step ||
                (p.step.includes("_complete") &&
                  progressUpdate.step.includes("_complete"))
            );
            return [...filteredUpdates, progressUpdate];
          });

          // Check if this is the final progress update (close to 100%)
          if (
            progressUpdate.progress_percentage &&
            progressUpdate.progress_percentage >= 95
          ) {
            console.log("Final progress stage reached (≥95%)");
          }
        },
        (result) => {
          console.log("Result received in component:", result);
          if (result.analysis) {
            console.log(
              "Analysis data found in result:",
              Object.keys(result.analysis)
            );
            setAnalysisResult(result);
            setIsSubmitting(false);
            // Add a final "complete" update if needed
            const finalCompleteUpdate = {
              step: "complete",
              description: "Analysis completed successfully",
              progress_percentage: 100,
              details: { completed_at: new Date().toISOString() },
            };

            setProgressUpdates((prev) => {
              const hasCompleteStep = prev.some(
                (p) => p.progress_percentage >= 100
              );
              if (!hasCompleteStep) {
                return [...prev, finalCompleteUpdate];
              }
              return prev;
            });

            // Update the current progress state to show completion
            setProgress(finalCompleteUpdate);

            toast.success("Requirements analysis completed successfully!");
          } else {
            console.error("No analysis data found in result:", result);
            setError(
              "Received completion event but no analysis data was found"
            );
            setIsSubmitting(false);
          }
        },
        (errorMsg) => {
          console.error("Error in analysis:", errorMsg);
          setError(errorMsg);
          setIsSubmitting(false);
          toast.error("Error analyzing requirement: " + errorMsg);
        }
      );
    } catch (error) {
      console.error("Error analyzing requirement:", error);
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
      toast.error("Error analyzing requirement");
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setRequirement("");
    setAttachedFiles([]);
    setAttachedJiraIssues([]);
    setProgress(null);
    setProgressUpdates([]);
    setAnalysisResult(null);
    setError(undefined);
    setShowProgressHistory(false);
  };

  // Skip the getQueryStatus function as we have a new implementation

  // Function to handle selecting a task prompt for chat
  const handleSelectTask = (prompt: string) => {
    onQuerySelect(prompt);
    router.push("/chat");
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full overflow-hidden bg-background",
        isDraggingOver && !isSubmitting && "bg-blue-50/50 dark:bg-blue-950/20"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="border-b border-border/30 flex items-center justify-between px-6 py-3 bg-background">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-blue-500" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 font-semibold">
            Requirement Blueprint
          </span>
        </div>
        {/* {showingResults && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="text-xs"
          >
            <FileText className="h-3.5 w-3.5 mr-1" />
            New Requirement
          </Button>
        )} */}
      </div>

      {/* Drag overlay */}
      {isDraggingOver && !isSubmitting && (
        <div className="absolute inset-0 z-50 bg-blue-50/80 dark:bg-blue-950/80 border-2 border-dashed border-blue-400 flex items-center justify-center">
          <div className="text-center">
            <Upload className="w-12 h-12 text-blue-500 mx-auto mb-2" />
            <p className="text-lg font-medium text-blue-700 dark:text-blue-300">
              Drop files here to attach
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Supports code files, documents, and more
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4">
        {!showingResults && !isSubmitting ? (
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="flex-1 flex flex-col">
              {/* Welcome Section */}
              <div className="mb-6">
                <Card className="border-blue-500/20 shadow-sm bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-blue-500" />
                      Transform Your Ideas into Salesforce Solutions
                    </CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      Describe your Salesforce development requirement and let
                      our AI analyze it to provide comprehensive implementation
                      guidance, technical specifications, and development
                      roadmaps. Perfect for planning complex projects or
                      validating implementation approaches.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                          <Zap className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">
                            AI-Powered Analysis
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Get detailed technical insights and recommendations
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
                          <Target className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">
                            Implementation Planning
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Receive step-by-step development guidance
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                          <ArrowRight className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">
                            Ready to Execute
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Transform analysis into actionable development tasks
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              {/* Requirement Input */}
              <div className="mb-6">
                <Card className="border-blue-500/20 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-500" />
                      Describe Your Salesforce Requirement
                    </CardTitle>
                    <CardDescription>
                      Provide a detailed description of what you want to build.
                      Include business requirements, technical specifications,
                      user stories, or any specific Salesforce features you
                      need.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Textarea
                        id="requirement"
                        value={requirement}
                        onChange={(e) => setRequirement(e.target.value)}
                        placeholder="Example: Build a custom Lightning component to display and manage customer service cases with advanced filtering, real-time updates, and integration with external systems. Include features for case assignment, priority management, and automated escalation workflows..."
                        className="min-h-[160px] resize-none"
                      />

                      {/* Model Selection */}
                      <div className="pt-2">
                        <ModelSelector
                          selectedModel={selectedModel}
                          onModelChange={setSelectedModel}
                          size="sm"
                          label="AI Model"
                          placeholder="Select model"
                          layout="horizontal"
                        />
                      </div>

                      {/* Action Buttons Row */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="text-sm text-muted-foreground">
                          {isHydrated && requirement.length > 0 && (
                            <span>{requirement.length} characters</span>
                          )}
                        </div>
                        <Button
                          type="submit"
                          disabled={
                            !isHydrated || !requirement.trim() || isSubmitting
                          }
                          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 min-w-[160px] h-10"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader className="mr-2 h-4 w-4 animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Send className="mr-2 h-4 w-4" />
                              Analyze Requirement
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Supporting Files & Context Section */}
              <div className="mb-6">
                <Card className="border-blue-500/20 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Paperclip className="h-5 w-5 text-blue-500" />
                      Supporting Files & Context
                      {(attachedFiles.length > 0 ||
                        attachedJiraIssues.length > 0) && (
                        <Badge variant="secondary" className="ml-2">
                          {attachedFiles.length + attachedJiraIssues.length}{" "}
                          attached
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Enhance your analysis by attaching relevant files, GitHub
                      repositories, or JIRA issues that provide context for your
                      requirement.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Attachment Toolbar */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-foreground">
                            Add Context & Files
                          </h4>
                          <span className="text-xs text-muted-foreground">
                            {attachedFiles.length + attachedJiraIssues.length}{" "}
                            items attached
                          </span>
                        </div>

                        {/* Compact Browse Options */}
                        <div className="flex flex-wrap gap-3">
                          {/* File Upload Button */}
                          <div className="relative">
                            <input
                              type="file"
                              multiple
                              className="hidden"
                              onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                if (files.length > 0) {
                                  processDroppedFiles(files);
                                }
                              }}
                              accept=".cls,.trigger,.apex,.html,.js,.css,.xml,.json,.txt,.md,.pdf,.doc,.docx"
                              id="file-upload"
                              aria-label="Upload Salesforce files for requirement analysis"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-9 px-4 gap-2 hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-950/20"
                              onClick={() =>
                                document.getElementById("file-upload")?.click()
                              }
                              disabled={
                                !isHydrated ||
                                attachedFiles.length >= MAX_FILES ||
                                isSubmitting
                              }
                            >
                              <Upload className="w-4 h-4" />
                              Local Files
                            </Button>
                          </div>

                          {/* GitHub Browse Button */}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-9 px-4 gap-2 hover:bg-purple-50 hover:border-purple-300 dark:hover:bg-purple-950/20"
                            onClick={() => setShowGitHubBrowser(true)}
                            disabled={
                              !isHydrated ||
                              attachedFiles.length >= MAX_FILES ||
                              isSubmitting
                            }
                          >
                            <Github className="w-4 h-4" />
                            GitHub
                          </Button>

                          {/* JIRA Browse Button */}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-9 px-4 gap-2 hover:bg-orange-50 hover:border-orange-300 dark:hover:bg-orange-950/20"
                            onClick={() => setShowJiraBrowser(true)}
                            disabled={
                              !isHydrated ||
                              attachedJiraIssues.length >= MAX_JIRA_ISSUES ||
                              isSubmitting
                            }
                          >
                            <FileText className="w-4 h-4" />
                            JIRA Issues
                          </Button>
                        </div>

                        {/* Drag & Drop Zone - Compact */}
                        <div
                          className={cn(
                            "border-2 border-dashed rounded-lg p-4 text-center transition-all duration-200",
                            isDraggingOver && !isSubmitting
                              ? "border-blue-400 bg-blue-50 dark:bg-blue-950/20 scale-[1.02]"
                              : "border-border hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-950/10"
                          )}
                        >
                          <div className="flex items-center justify-center gap-3">
                            <Upload className="w-5 h-5 text-muted-foreground" />
                            <div className="text-center">
                              <p className="text-sm font-medium text-foreground">
                                Drop files here to attach
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Code files, docs, PDFs, and more
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Error Display */}
                      {error && (
                        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                          <p className="text-sm text-red-700 dark:text-red-400">
                            {error}
                          </p>
                        </div>
                      )}

                      {/* Attached Items Display */}
                      {(attachedFiles.length > 0 ||
                        attachedJiraIssues.length > 0) && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium text-foreground">
                              Attached Items
                            </h4>
                            <Badge variant="secondary" className="text-xs">
                              {attachedFiles.length + attachedJiraIssues.length}
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            {/* Files */}
                            {attachedFiles.map((file) => (
                              <div
                                key={file.id}
                                className="flex items-center justify-between p-2 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md group hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-colors"
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-foreground truncate">
                                      {file.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {typeof file.type === "string"
                                        ? file.type
                                        : "Document"}{" "}
                                      •{file.content?.length || 0} chars
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => {
                                      setPreviewFile(file);
                                      setPreviewOpen(true);
                                    }}
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => {
                                      setAttachedFiles((prev) =>
                                        prev.filter((f) => f.id !== file.id)
                                      );
                                      setError("");
                                    }}
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            ))}

                            {/* JIRA Issues */}
                            {attachedJiraIssues.map((issue) => (
                              <div
                                key={issue.key}
                                className="flex items-center justify-between p-2 bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-md group hover:bg-orange-100/50 dark:hover:bg-orange-900/30 transition-colors"
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <FileText className="h-4 w-4 text-orange-600 flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="text-sm font-medium text-foreground font-mono">
                                        {issue.key}
                                      </p>
                                      <Badge
                                        variant="secondary"
                                        className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                                      >
                                        {issue.status.name}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-foreground truncate">
                                      {issue.summary}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {issue.issuetype.name} •{" "}
                                      {issue.project.name}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => {
                                      const jiraBaseUrl =
                                        process.env.NEXT_PUBLIC_JIRA_BASE_URL ||
                                        "https://jira.company.com";
                                      window.open(
                                        `${jiraBaseUrl}/browse/${issue.key}`,
                                        "_blank"
                                      );
                                    }}
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => {
                                      setAttachedJiraIssues((prev) =>
                                        prev.filter((j) => j.key !== issue.key)
                                      );
                                      setError("");
                                    }}
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        ) : isSubmitting && !showingResults ? (
          <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FileCode className="h-5 w-5 text-blue-500" />
                Analyzing Requirement
              </h2>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>

            <div className="flex-1 flex flex-col">
              {showProgressHistory ? (
                <AnalysisTimeline
                  progressUpdates={progressUpdates}
                  currentProgress={
                    // Find the complete step with 100% progress if it exists
                    progressUpdates.find(
                      (p) =>
                        p.step === "complete" && p.progress_percentage === 100
                    ) || progress
                  }
                  originalRequirement={requirement}
                  error={error}
                />
              ) : (
                <AnalysisProgress
                  progress={
                    // Find the complete step with 100% progress if it exists
                    progressUpdates.find(
                      (p) =>
                        p.step === "complete" && p.progress_percentage === 100
                    ) || progress
                  }
                  error={error}
                />
              )}

              <div className="flex justify-end mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowProgressHistory(!showProgressHistory)}
                  className="text-xs"
                >
                  {showProgressHistory ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 mr-1" />
                      Show Current Progress
                    </>
                  ) : (
                    <>
                      <HistoryIcon className="h-3.5 w-3.5 mr-1" />
                      Show Progress Timeline
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : showingResults && analysisResult ? (
          <div className="h-full flex flex-col">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FileCode className="h-5 w-5 text-blue-500" />
                Requirement Analysis
              </h2>
              <div className="flex gap-3">
                {progressUpdates.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowProgressHistory(!showProgressHistory)}
                    className="relative group px-4 py-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 bg-white dark:bg-gray-800 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-950/20 dark:hover:to-indigo-950/20 text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-300 shadow-sm hover:shadow-md rounded-xl overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative flex items-center gap-2">
                      {showProgressHistory ? (
                        <>
                          <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-md flex items-center justify-center">
                            <FileCode className="h-2.5 w-2.5 text-white" />
                          </div>
                          <span className="text-sm font-medium">
                            View Results
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="w-4 h-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-md flex items-center justify-center">
                            <HistoryIcon className="h-2.5 w-2.5 text-white" />
                          </div>
                          <span className="text-sm font-medium">
                            View Analysis History
                          </span>
                        </>
                      )}
                    </div>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="relative group px-4 py-2 border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600 bg-white dark:bg-gray-800 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 dark:hover:from-emerald-950/20 dark:hover:to-teal-950/20 text-gray-700 dark:text-gray-300 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all duration-300 shadow-sm hover:shadow-md rounded-xl overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center gap-2">
                    <div className="w-4 h-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-md flex items-center justify-center">
                      <FileText className="h-2.5 w-2.5 text-white" />
                    </div>
                    <span className="text-sm font-medium">New Requirement</span>
                  </div>
                </Button>
              </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
              {showProgressHistory ? (
                <div className="overflow-auto h-full pb-6">
                  <AnalysisTimeline
                    progressUpdates={progressUpdates}
                    currentProgress={
                      // Find the complete step with 100% progress if it exists
                      progressUpdates.find(
                        (p) =>
                          p.step === "complete" && p.progress_percentage === 100
                      ) ||
                      progress ||
                      progressUpdates[progressUpdates.length - 1]
                    }
                    originalRequirement={requirement}
                  />
                </div>
              ) : (
                <div className="h-full overflow-auto">
                  <AnalysisResults
                    analysis={analysisResult.analysis}
                    originalRequirement={requirement}
                    metrics={analysisResult.metrics}
                    onSelectTask={handleSelectTask}
                  />
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Debug panel for development environments only */}
      {/* {process.env.NODE_ENV !== "production" && <SSEDebugPanel />} */}

      {/* GitHub Browser Component */}
      <GitHubBrowser
        isOpen={showGitHubBrowser}
        onClose={() => setShowGitHubBrowser(false)}
        onFileSelect={handleGitHubFileSelect}
        selectedFiles={attachedFiles}
        maxFiles={MAX_FILES}
      />

      {/* JIRA Issue Browser Component */}
      <JiraIssueBrowser
        isOpen={showJiraBrowser}
        onClose={() => setShowJiraBrowser(false)}
        onIssueSelect={handleJiraIssueSelect}
        selectedIssues={attachedJiraIssues}
        maxSelection={10}
      />

      {/* File Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {previewFile?.name}
              <span className="text-sm font-normal text-muted-foreground">
                (
                {typeof previewFile?.type === "string"
                  ? previewFile.type
                  : "Document"}
                )
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto">
            {previewFile && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-1">
                <SyntaxHighlighter
                  language={previewFile.language || "text"}
                  style={vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    fontSize: "13px",
                    lineHeight: "1.4",
                  }}
                  showLineNumbers
                >
                  {previewFile.content || "No content available"}
                </SyntaxHighlighter>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
