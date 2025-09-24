"use client";

import { useState, useRef, useEffect } from "react";
import { Message } from "@/types/types";
import { GithubMessages } from "./github-messages";
import { cn, generateUUID } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { sendChatStream } from "@/services/github-chat-service";
import GitHubContextConfig from "../github-context-config";
import { RepositorySelectionModal } from "./repository-selection-modal";
// Temporarily commented out until we reintegrate the progress indicator
// import { AgentProgressIndicator } from "../progress/agent-progress-indicator";
import { fastAPIGitHubService } from "@/services/fastapi-github-service";
import {
  Loader2,
  MessageSquare,
  Database,
  Github,
  Sparkles,
  Send,
  Network,
} from "lucide-react";
import { motion } from "framer-motion";
import { GitHubDashboard } from "./github-dashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ModelSelector } from "@/components/ui/model-selector";
import { useModelSelection } from "@/hooks/use-model-selection";
import { useModels } from "@/hooks/use-models";
import dynamic from "next/dynamic";

// Dynamic import for the dependency diagram component
const DependencyDiagramView = dynamic(
  () =>
    import("./dependency-diagram-view").then(
      (mod) => mod.DependencyDiagramView
    ),
  {
    loading: () => (
      <div className="flex justify-center items-center h-full w-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    ),
    ssr: false,
  }
);

// Interface for the GithubChat component
interface GithubChatProps {
  id: string;
  initialMessages: Message[];
}

export function GithubChat({ id, initialMessages }: GithubChatProps) {
  const { data: session } = useSession();
  const userSession = session?.user;
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [pendingUploads, setPendingUploads] = useState<File[]>([]);

  // Update state type to include the new view mode
  const [viewMode, setViewMode] = useState<
    "repositories" | "chat" | "dependency"
  >("repositories");

  // GitHub context state
  const [selectedRepository, setSelectedRepository] = useState<string | null>(
    null
  );
  const [selectedContextTypes, setSelectedContextTypes] = useState<string[]>([
    "commits",
    "prs",
    "pr_detailed",
    "contributors",
    "repository_stats",
  ]);
  const [useFastAPI, setUseFastAPI] = useState(true); // Enable FastAPI by default
  const [chatId] = useState(id);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Model selection for AI chat
  const { isLoading: isLoadingModels } = useModels();
  const { selectedModel, setSelectedModel } = useModelSelection({
    storageKey: "github-chat-model",
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [progressMessages, setProgressMessages] = useState<Message[]>([]); // Kept for future AgentProgressIndicator integration
  const [isResettingChat, setIsResettingChat] = useState(false);
  const [showRepositoryModal, setShowRepositoryModal] = useState(false);
  const [repositoryModalContext, setRepositoryModalContext] = useState<
    "chat" | "reset"
  >("chat");

  // Add keyboard shortcuts for view switching
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only respond to key combinations with Alt/Option key
      if (e.altKey) {
        switch (e.key) {
          case "1": // Alt+1: Switch to repositories view
            setViewMode("repositories");
            break;
          case "2": // Alt+2: Switch to dependency diagram view
            setViewMode("dependency");
            break;
          case "3": // Alt+3: Switch to chat view
            setViewMode("chat");
            break;
        }
      }
    };

    // Add the event listener
    window.addEventListener("keydown", handleKeyDown);

    // Clean up
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [setViewMode]);

  // Define interface for the ref
  interface MultimodalInputRef {
    processDroppedFiles: (files: File[]) => Promise<void>;
    setInput: (value: string) => void;
  }

  const inputRef = useRef<MultimodalInputRef>(null);

  // Handle GitHub context configuration changes
  const handleConfigChange = (config: {
    repository: string | null;
    contextTypes: string[];
  }) => {
    setSelectedRepository(config.repository);
    setSelectedContextTypes(config.contextTypes);
  };

  // Custom handleSubmit function for GitHub chat with context
  const handleGitHubSubmit = async (userInput: string) => {
    if (!userInput.trim() || isLoading || !userSession?.id) return;

    const userMessageId = generateUUID();
    const userMessage: Message = {
      id: userMessageId,
      role: "user",
      content: userInput.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Generate the message ID but don't add an empty message to the messages array yet
    const assistantMessageId = generateUUID();

    try {
      const stream = await sendChatStream(
        [...messages, userMessage].map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        {
          userId: userSession.id,
          chatId,
          messageId: assistantMessageId,
          userMessageId: userMessageId,
          githubContext: true,
          repository: selectedRepository || undefined,
          contextTypes: selectedContextTypes as (
            | "commits"
            | "prs"
            | "issues"
            | "files"
            | "releases"
          )[],
          useFastAPI, // Pass the FastAPI flag
          selectedModel, // Pass the selected model
        }
      );

      // Handle content streaming more efficiently
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";
      let hasAddedMessage = false;
      let updateInterval: NodeJS.Timeout | null = null;

      // Set up a throttled update mechanism
      // This prevents too many rerenders which can interfere with scrolling
      updateInterval = setInterval(() => {
        if (hasAddedMessage && accumulatedContent.trim() !== "") {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: accumulatedContent }
                : msg
            )
          );
        }
      }, 100); // Update UI at most every 100ms

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));

                // Handle messages based on type
                if (data.type === "progress") {
                  // Don't display progress messages in the UI
                  // We're keeping the progress message handling logic in the backend
                  // but skipping the UI rendering of these messages
                  console.debug("Progress message received:", data.content);
                } else if (data.content) {
                  accumulatedContent += data.content;

                  // Only add the assistant message once we have content
                  if (!hasAddedMessage && accumulatedContent.trim() !== "") {
                    hasAddedMessage = true;
                    // Immediate update for first content
                    setMessages((prev) => [
                      ...prev,
                      {
                        id: assistantMessageId,
                        role: "assistant",
                        content: accumulatedContent,
                        metadata: data.metadata || undefined,
                      },
                    ]);
                  }
                }
              } catch {
                // Ignore malformed JSON
              }
            }
          }
        }
      } finally {
        // Clean up interval and ensure final content is added
        if (updateInterval) clearInterval(updateInterval);

        if (hasAddedMessage) {
          // Final update with complete content
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: accumulatedContent }
                : msg
            )
          );
        } else if (accumulatedContent.trim() !== "") {
          // Handle case where we got content but never added the message
          setMessages((prev) => [
            ...prev,
            {
              id: assistantMessageId,
              role: "assistant",
              content: accumulatedContent,
            },
          ]);
        }
      }
    } catch (error) {
      console.error("Error sending GitHub chat message:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: "Sorry, an error occurred. Please try again." }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  }; // Handle new chat functionality
  const handleNewChat = async () => {
    // Check if repository is selected before proceeding
    if (!selectedRepository) {
      setRepositoryModalContext("reset");
      setShowRepositoryModal(true);
      return;
    }

    setIsResettingChat(true);
    try {
      // Always clear local state first
      setMessages([]);
      setProgressMessages([]);
      setInput("");

      // Always call the backend to reset server state, using default values when needed
      try {
        // Extract org and repo from repository string, using defaults like streaming chat
        let orgName = "IBMSC";
        let repoName = "PRM";

        if (selectedRepository) {
          if (selectedRepository.includes("/")) {
            [orgName, repoName] = selectedRepository.split("/");
          } else {
            repoName = selectedRepository;
          }
        }

        // Use user session info if available, otherwise use default values like streaming chat
        const username =
          userSession?.name || userSession?.email?.split("@")[0] || "anonymous";
        const sessionId = userSession?.id || chatId || "anonymous";

        // Call the FastAPI GitHub service to reset the chat (always call backend like streaming chat)
        await fastAPIGitHubService.resetGitHubChat(
          username,
          sessionId,
          orgName,
          repoName
        );

        console.log(
          `Chat reset successfully for ${orgName}/${repoName} (backend and frontend)`
        );
      } catch (backendError) {
        console.error("Error resetting backend chat state:", backendError);
        // Continue execution to allow frontend reset even if backend fails
        console.log(
          "Chat reset completed (frontend only due to backend error)"
        );
      }
    } catch (error) {
      console.error("Error during chat reset:", error);
      // Ensure local state is still cleared even on error
      setMessages([]);
      setProgressMessages([]);
      setInput("");
    } finally {
      setIsResettingChat(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!input.trim() && pendingUploads.length === 0) return;

    // Check if repository is selected before proceeding
    if (!selectedRepository) {
      setRepositoryModalContext("chat");
      setShowRepositoryModal(true);
      return;
    }

    await handleGitHubSubmit(input);
  };

  // Drop zone functionality for file uploads
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    if (isLoading) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setIsProcessingFiles(true);
      setPendingUploads(files);

      // Process files if input ref is available
      if (inputRef.current) {
        try {
          await inputRef.current.processDroppedFiles(files);
        } catch (error) {
          console.error("Error processing dropped files:", error);
        } finally {
          setIsProcessingFiles(false);
          setPendingUploads([]);
        }
      } else {
        setIsProcessingFiles(false);
        setPendingUploads([]);
      }
    }
  };

  // Prevent default behavior for drag events
  const preventDefaultDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Handle direct questions from dashboard
  const handleAskQuestion = (question: string) => {
    if (question.trim() && !isLoading) {
      // Check if repository is selected before proceeding
      if (!selectedRepository) {
        setRepositoryModalContext("chat");
        setShowRepositoryModal(true);
        return;
      }

      setViewMode("chat"); // Switch to chat view

      // Submit the question after a brief delay to allow the UI to update
      setTimeout(() => {
        handleGitHubSubmit(question);
      }, 100);
    }
  };

  // Modal callback handlers
  const handleRepositorySelected = (repository: string) => {
    setSelectedRepository(repository);
    setShowRepositoryModal(false);

    // If we were trying to start a chat, proceed with the action
    if (repositoryModalContext === "chat" && input.trim()) {
      setTimeout(() => {
        handleGitHubSubmit(input);
      }, 100);
    } else if (repositoryModalContext === "reset") {
      setTimeout(() => {
        handleNewChat();
      }, 100);
    }
  };

  const handleModalCancel = () => {
    setShowRepositoryModal(false);
  };

  return (
    <div
      className="flex flex-col h-screen w-full max-w-full overflow-hidden"
      onDragOver={preventDefaultDrag}
      onDragEnter={preventDefaultDrag}
      onDrop={handleDrop}
    >
      {/* Header Bar */}
      <div className="sticky top-0 left-0 right-0 z-10 w-full bg-black/20 backdrop-blur-lg border-b border-gray-800/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between px-4 md:px-6 py-4 space-y-3 md:space-y-0">
          <div className="flex items-center space-x-3 min-w-0 overflow-hidden">
            <div className="flex items-center space-x-2 min-w-0 overflow-hidden">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Github className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 overflow-hidden">
                <h1 className="text-xl font-bold text-white truncate">
                  Code Intelligence Hub
                </h1>
                <p className="text-sm text-gray-400 hidden sm:block truncate">
                  AI-powered repository assistant
                </p>
              </div>
            </div>
          </div>

          {/* Model Selection - not shown in any specific view since each has its own */}
          {false && (
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-300">
                AI Model:
              </label>
              <ModelSelector
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                size="sm"
                placeholder="Select model"
                disabled={isLoadingModels}
                className="w-48"
              />
            </div>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 bg-gray-900/60 backdrop-blur-sm rounded-xl p-2 border border-gray-700/50">
              <Button
                variant={viewMode === "repositories" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("repositories")}
                className={cn(
                  "flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium",
                  viewMode === "repositories"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700"
                    : "text-gray-300 hover:text-white hover:bg-gray-800/60"
                )}
                title="Browse repositories and explore code"
              >
                <Database className="w-4 h-4" />
                <span className="hidden sm:inline">Explorer</span>
              </Button>
              <Button
                variant={viewMode === "dependency" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("dependency")}
                className={cn(
                  "flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium",
                  viewMode === "dependency"
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/25 hover:bg-purple-700"
                    : "text-gray-300 hover:text-white hover:bg-gray-800/60"
                )}
                title="Visualize code dependencies and relationships"
              >
                <Network className="w-4 h-4" />
                <span className="hidden sm:inline">Dependencies</span>
              </Button>
              <Button
                variant={viewMode === "chat" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("chat")}
                className={cn(
                  "flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium",
                  viewMode === "chat"
                    ? "bg-green-600 text-white shadow-lg shadow-green-600/25 hover:bg-green-700"
                    : "text-gray-300 hover:text-white hover:bg-gray-800/60"
                )}
                title="Chat with AI about your code"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Chat</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full min-w-0 flex flex-col overflow-hidden">
        {viewMode === "repositories" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 p-3 md:p-6 w-full overflow-hidden">
              <Card className="h-full w-full max-w-full bg-black/40 border-gray-800/50 backdrop-blur-sm flex flex-col overflow-hidden">
                <CardContent className="p-4 flex-1 overflow-hidden flex flex-col">
                  <div className="mb-4 md:mb-6 flex-shrink-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <h2 className="text-xl md:text-2xl font-bold text-white mb-1 md:mb-2">
                          Repository Explorer
                        </h2>
                        <p className="text-sm text-gray-400">
                          Discover and analyze your GitHub repositories with AI
                          insights
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto">
                    <GitHubDashboard
                      onAskQuestion={handleAskQuestion}
                      onOpenDependencyDiagram={() => setViewMode("dependency")}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {viewMode === "dependency" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 p-3 md:p-6 w-full overflow-hidden">
              <Card className="h-full w-full max-w-full bg-black/40 border-gray-800/50 backdrop-blur-sm flex flex-col overflow-hidden">
                <CardContent className="p-4 flex-1 overflow-hidden flex flex-col">
                  <div className="mb-4 md:mb-6 flex-shrink-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div>
                        <h2 className="text-xl md:text-2xl font-bold text-white mb-1 md:mb-2">
                          Dependency Analysis
                        </h2>
                        <p className="text-sm text-gray-400">
                          Analyze dependencies between files across repositories
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <ModelSelector
                          selectedModel={selectedModel}
                          onModelChange={setSelectedModel}
                          size="sm"
                          label="AI Model"
                          placeholder="Select model for analysis"
                          disabled={isLoadingModels}
                          layout="horizontal"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto">
                    <DependencyDiagramView selectedModel={selectedModel} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {viewMode === "chat" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 overflow-hidden">
              <div className="h-full p-3 md:p-4 w-full">
                <Card className="h-full w-full max-w-full bg-black/40 border-gray-800/50 backdrop-blur-sm flex flex-col">
                  <CardContent className="p-3 flex-1 overflow-hidden flex flex-col min-h-0 w-full">
                    {/* Top section with GitHub Context Configuration */}
                    <div className="mb-4 flex-shrink-0">
                      <GitHubContextConfig
                        onConfigChange={handleConfigChange}
                        selectedRepository={selectedRepository}
                        selectedContextTypes={selectedContextTypes}
                        useFastAPI={useFastAPI}
                        onFastAPIChange={setUseFastAPI}
                        onNewChat={handleNewChat}
                        isResettingChat={isResettingChat}
                        selectedModel={selectedModel}
                        onModelChange={setSelectedModel}
                        isLoadingModels={isLoadingModels}
                      />
                    </div>

                    {messages.length === 0 ? (
                      <div className="text-center py-8 md:py-12 flex-1 overflow-auto">
                        {/* Hero Section */}
                        <div className="relative mb-8">
                          {/* Background decoration */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-32 h-32 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-full blur-3xl"></div>
                          </div>

                          {/* Main icon */}
                          <div className="relative w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/25">
                            <Github className="w-8 h-8 md:w-10 md:h-10 text-white" />
                          </div>

                          {/* Title and description */}
                          <div className="space-y-4 mb-8">
                            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
                              GitHub Repository Insights
                            </h1>
                            <p className="text-gray-400 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
                              Intelligent repository analysis and development
                              insights powered by AI. Get instant answers about
                              PRs, commits, contributors, and development
                              workflows.
                            </p>
                          </div>
                        </div>

                        {/* Features grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-8">
                          <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4 hover:border-blue-500/30 transition-all duration-300 group">
                            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-500/30 transition-colors">
                              <Database className="w-5 h-5 text-blue-400" />
                            </div>
                            <h3 className="text-white font-semibold mb-2 text-sm">
                              Repository Analysis
                            </h3>
                            <p className="text-gray-500 text-xs">
                              Deep insights into repository structure, PR
                              patterns, and development workflows
                            </p>
                          </div>

                          <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4 hover:border-purple-500/30 transition-all duration-300 group">
                            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-500/30 transition-colors">
                              <MessageSquare className="w-5 h-5 text-purple-400" />
                            </div>
                            <h3 className="text-white font-semibold mb-2 text-sm">
                              Repository Q&A
                            </h3>
                            <p className="text-gray-500 text-xs">
                              Ask questions about PRs, commits, contributors and
                              get contextual insights
                            </p>
                          </div>

                          <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4 hover:border-indigo-500/30 transition-all duration-300 group">
                            <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center mb-3 group-hover:bg-indigo-500/30 transition-colors">
                              <Sparkles className="w-5 h-5 text-indigo-400" />
                            </div>
                            <h3 className="text-white font-semibold mb-2 text-sm">
                              PR & Commit Insights
                            </h3>
                            <p className="text-gray-500 text-xs">
                              Automated PR reviews, commit analysis, and
                              development pattern recommendations
                            </p>
                          </div>
                        </div>

                        {/* Quick action suggestions */}
                        <div className="max-w-4xl mx-auto">
                          <h2 className="text-lg font-semibold text-white mb-4 flex items-center justify-center gap-2">
                            <Sparkles className="w-5 h-5 text-blue-400" />
                            Quick Start
                          </h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[
                              {
                                category: "Repository Overview",
                                question:
                                  "What's the main purpose and architecture of this repository?",
                                icon: "🏗️",
                                gradient:
                                  "from-blue-500/10 to-cyan-500/10 border-blue-500/20",
                              },
                              {
                                category: "Recent Activity",
                                question:
                                  "Show me recent changes, commits, and pull requests",
                                icon: "📈",
                                gradient:
                                  "from-green-500/10 to-emerald-500/10 border-green-500/20",
                              },
                              {
                                category: "PR Analysis",
                                question:
                                  "Analyze recent pull requests, review patterns, and merge insights",
                                icon: "🔍",
                                gradient:
                                  "from-purple-500/10 to-pink-500/10 border-purple-500/20",
                              },
                              {
                                category: "Commit Intelligence",
                                question:
                                  "Review commit patterns, contributor activity, and development trends",
                                icon: "🔗",
                                gradient:
                                  "from-orange-500/10 to-red-500/10 border-orange-500/20",
                              },
                            ].map((suggestion, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                className={`
                                  bg-gradient-to-r ${suggestion.gradient}
                                  hover:bg-gray-800/50 border text-left justify-start 
                                  text-xs sm:text-sm whitespace-normal h-auto py-4 px-4 
                                  group transition-all duration-300 hover:scale-[1.02]
                                `}
                                onClick={() =>
                                  handleAskQuestion(suggestion.question)
                                }
                              >
                                <div className="flex items-start gap-3 w-full">
                                  <span className="text-lg flex-shrink-0 mt-0.5">
                                    {suggestion.icon}
                                  </span>
                                  <div className="flex-1 text-left">
                                    <div className="font-medium text-gray-200 mb-1">
                                      {suggestion.category}
                                    </div>
                                    <div className="text-gray-400 text-xs leading-relaxed">
                                      {suggestion.question}
                                    </div>
                                  </div>
                                </div>
                              </Button>
                            ))}
                          </div>

                          {/* Additional help text */}
                          <div className="mt-8 p-4 bg-gray-900/30 border border-gray-800/30 rounded-xl">
                            <p className="text-gray-400 text-xs flex items-center justify-center gap-2">
                              <Github className="w-4 h-4" />
                              Select a repository from the sidebar to get
                              started, or ask any question about your codebase
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 overflow-hidden min-h-0 max-w-full w-full">
                        <GithubMessages
                          messages={messages}
                          isLoading={isLoading}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Agent Progress Indicator - Temporarily removed
            Will be re-implemented later with proper styling and functionality */}

            {/* Chat Input - Fixed at bottom */}
            <div className="border-t border-gray-800/50 bg-black/20 backdrop-blur-lg p-3 md:p-4 w-full flex-shrink-0">
              <div className="w-full max-w-full">
                <form
                  onSubmit={handleSubmit}
                  className="relative w-full max-w-full"
                >
                  <div
                    className={cn(
                      "flex items-center space-x-2 md:space-x-3 rounded-xl border p-2 md:p-3 w-full max-w-full transition-colors duration-200",
                      isLoading
                        ? "bg-gray-800/60 border-blue-500/30 shadow-sm shadow-blue-500/10"
                        : "bg-gray-900/50 border-gray-700/50 hover:border-gray-600/70"
                    )}
                  >
                    {isLoading && (
                      <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full border-2 border-gray-500 border-t-blue-400 animate-spin"></div>
                      </div>
                    )}
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={
                        isLoading
                          ? "GitHub Assistant is processing your request..."
                          : "Ask anything about your repositories..."
                      }
                      disabled={isLoading}
                      className={cn(
                        "flex-1 min-w-0 max-w-[calc(100%-40px)] bg-transparent text-white placeholder-gray-400 focus:outline-none text-xs sm:text-sm",
                        isLoading && "opacity-80"
                      )}
                    />
                    <Button
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      size="sm"
                      className={cn(
                        "shrink-0 transition-all duration-200",
                        isLoading
                          ? "bg-blue-600/50 hover:bg-blue-600/70"
                          : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-md hover:shadow-purple-500/10"
                      )}
                    >
                      {isLoading ? (
                        <motion.div
                          animate={{
                            scale: [1, 1.2, 1],
                            rotate: [0, 180, 360],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        >
                          <Loader2 className="w-4 h-4" />
                        </motion.div>
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </form>
                {isProcessingFiles && (
                  <div className="mt-2 text-xs text-blue-400 flex items-center">
                    <div className="flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 rounded-md py-1 px-2">
                      <motion.div
                        animate={{
                          rotate: [0, 360],
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <Loader2 className="w-3 h-3" />
                      </motion.div>
                      <span>
                        Processing {pendingUploads.length} file
                        {pendingUploads.length > 1 ? "s" : ""}...
                      </span>
                    </div>
                  </div>
                )}
                {/* Progress indicator will be added here in the future when we re-implement it
                  - Will display progress messages
                  - Will use isLoading state to show loading indicator
                  - Will include appropriate styling for dark mode UI
                */}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Agent Progress Indicator temporarily removed
       Will be re-implemented in the future with:
       - Progress message display
       - Loading indicator
       - Status updates from backend
      */}

      {/* Repository Selection Modal */}
      <RepositorySelectionModal
        isOpen={showRepositoryModal}
        onRepositorySelect={handleRepositorySelected}
        onClose={handleModalCancel}
        currentRepository={selectedRepository}
        title={
          repositoryModalContext === "reset"
            ? "Select Repository for New Chat"
            : "Select Repository to Continue"
        }
        description={
          repositoryModalContext === "reset"
            ? "Please select a repository to start a new chat session."
            : "Please select a repository to continue with your question."
        }
      />
    </div>
  );
}
