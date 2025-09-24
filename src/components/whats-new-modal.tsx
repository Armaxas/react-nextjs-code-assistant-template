"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles,
  Bot,
  Share2,
  Github,
  FileText,
  Brain,
  Settings,
  Users,
  Workflow,
  Zap,
  // X, // TODO: Use X icon for close functionality
  ChevronRight,
  Star,
  Palette,
  Network,
  ArrowLeft,
  Play,
  ExternalLink,
  Heart,
  CheckCircle,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  color: string;
  category: "core" | "integration" | "workflow" | "ui";
  detailedDescription?: string;
  benefits?: string[];
  gettingStarted?: string[];
  actionLabel?: string;
  actionUrl?: string;
  actionType?: "navigation" | "modal" | "external";
  demoAvailable?: boolean;
}

const features: Feature[] = [
  {
    id: "ui-redesign",
    title: "Modern UI & Chat Interface",
    description:
      "Experience our completely redesigned, clean and intuitive interface with enhanced user experience and streamlined workflows.",
    detailedDescription:
      "We've completely reimagined the user interface with a focus on clarity, efficiency, and modern design principles. The new chat interface features improved typography, better spacing, enhanced contrast, and streamlined navigation that reduces cognitive load and increases productivity.",
    benefits: [
      "50% faster navigation with streamlined menus",
      "Improved accessibility with WCAG 2.1 compliance",
      "Consistent design language across all features",
      "Mobile-optimized responsive experience",
    ],
    gettingStarted: [
      "Explore the new sidebar navigation",
      "Try the enhanced functionalities",
      "Set your preferred theme (dark/light)",
    ],
    icon: <Palette className="h-6 w-6" />,
    badge: "UI/UX",
    color: "from-purple-500 to-pink-500",
    category: "ui",
    actionLabel: "Explore Interface",
    actionUrl: "/chat",
    actionType: "navigation",
  },
  {
    id: "model-selection",
    title: "IBM Granite Model Selection",
    description:
      "Choose from multiple IBM Granite models to match your specific needs and preferences for optimal AI assistance.",
    detailedDescription:
      "Select from our collection of IBM Granite models, each optimized for different use cases. Whether you need code generation, documentation, or complex problem solving, there's a model tailored for your specific requirements.",
    benefits: [
      "Access to latest IBM Granite model variants",
      "Improved response accuracy and relevance",
      "Better performance for specialized workflows",
    ],
    gettingStarted: [
      "Access model selection in chat settings",
      "Try different models for your use case",
      "Compare responses across models",
    ],
    icon: <Bot className="h-6 w-6" />,
    badge: "AI Models",
    color: "from-blue-500 to-cyan-500",
    category: "core",
    demoAvailable: false,
  },
  {
    id: "chat-sharing",
    title: "Chat Sharing",
    description:
      "Collaborate seamlessly by sharing your conversations with colleagues, enabling team knowledge sharing and collaboration.",
    detailedDescription:
      "Share your AI conversations with team members to foster collaboration and knowledge transfer. Perfect for code reviews, brainstorming sessions, and maintaining team knowledge bases with full permission controls.",
    benefits: [
      "Real-time collaboration on AI conversations",
      "Granular permission controls",
      "Team knowledge base building",
      "Integration with existing workflows",
    ],
    gettingStarted: [
      "Click the share button in any chat",
      "Select team members to share with",
      "Track shared conversation activity",
    ],
    icon: <Share2 className="h-6 w-6" />,
    badge: "Collaboration",
    color: "from-green-500 to-emerald-500",
    category: "core",
    actionLabel: "Try Sharing",
    actionType: "modal",
  },
  {
    id: "github-integration",
    title: "GitHub Integration",
    description:
      "Upload and work with files directly from your GitHub repositories, with full branch selection and IBMSC repository access.",
    detailedDescription:
      "Seamlessly connect your GitHub repositories to the AI assistant with advanced repository browsing capabilities. Access IBMSC repositories, select specific branches, and upload files directly from your repos, making it easier to get contextual help with your actual codebase across different development stages.",
    benefits: [
      "Direct repository file access with branch selection",
      "IBMSC repository integration",
      "Context-aware code assistance across branches",
      "Streamlined development workflow",
      "Support for private repositories",
    ],
    gettingStarted: [
      "Browse IBMSC repositories",
      "Select specific branch to work with",
      "Choose files to upload from selected branch",
      "Get AI assistance with your code",
    ],
    icon: <Github className="h-6 w-6" />,
    badge: "DevOps",
    color: "from-gray-600 to-gray-800",
    category: "integration",
    actionLabel: "Connect GitHub",
    actionUrl: "/chat",
    actionType: "navigation",
  },
  {
    id: "requirement-blueprint",
    title: "Requirement Blueprint",
    description:
      "Describe your Salesforce development requirement and let our AI analyze it to provide comprehensive implementation guidance, technical specifications, and development roadmaps.",
    detailedDescription:
      "Transform your Salesforce development ideas into structured, comprehensive blueprints with AI-powered analysis. Perfect for planning complex projects or validating implementation approaches. Get detailed technical insights, step-by-step development guidance, and actionable development tasks. Enhance your analysis by attaching relevant files, GitHub repositories, or JIRA issues that provide context for your requirement.",
    benefits: [
      "AI-powered Salesforce requirement analysis",
      "Comprehensive implementation guidance",
      "Technical specifications generation",
      "Step-by-step development roadmaps",
      "Context-aware analysis with file attachments",
      "Integration with GitHub and JIRA for enhanced context",
    ],
    gettingStarted: [
      "Navigate to Requirement Blueprint feature",
      "Describe your Salesforce development requirement",
      "Attach relevant files, repos, or JIRA issues for context",
      "Review AI-generated implementation guidance",
      "Transform analysis into actionable development tasks",
    ],
    icon: <FileText className="h-6 w-6" />,
    badge: "Salesforce",
    color: "from-orange-500 to-red-500",
    category: "workflow",
    actionLabel: "Create Blueprint",
    actionUrl: "/blueprint",
    actionType: "navigation",
    demoAvailable: false,
  },
  {
    id: "code-intelligence",
    title: "Code Intelligence Hub",
    description:
      "AI-powered repository assistant with repository explorer, dependency analyser, and intelligent code chat features for comprehensive codebase insights.",
    detailedDescription:
      "Comprehensive repository analysis and intelligence platform featuring three key components: Repository Explorer for browsing IBMSC repositories with AI-powered PR and commit analysis, Dependency Analyser (Beta) for cross-repository file dependency mapping, and GitHub Repository Insights (Beta) for intelligent repository, PR, and commit insights.",
    benefits: [
      "AI-powered PR summaries and insights with JIRA integration",
      "Comprehensive commit analysis and code review suggestions",
      "Cross-repository dependency mapping and analysis",
      "Intelligent code Q&A and contextual explanations",
      "Automated code reviews and improvement recommendations",
      "Personal PR dashboard with AI insights and suggestions",
    ],
    gettingStarted: [
      "Select IBMSC repository to explore",
      "Browse PRs and commits with AI summaries",
      "Click 'My PRs' for personalized insights",
      "Try Dependency Analyser for file relationship mapping",
      "Use GitHub Repository Insights for intelligent repository analysis",
      "Get AI analysis of JIRA issues linked to PRs",
    ],
    icon: <Brain className="h-6 w-6" />,
    badge: "Beta",
    color: "from-violet-500 to-purple-600",
    category: "core",
    actionLabel: "Explore Code Intelligence",
    actionUrl: "/github-assistant/github-chat",
    actionType: "navigation",
    demoAvailable: false,
  },
  {
    id: "enhanced-feedback",
    title: "Feedback Dashboard",
    description:
      "A supercharged feedback system. Create JIRA sub-tasks with usability metrics and manage all feedback in a new, powerful dashboard.",
    detailedDescription:
      "Our feedback system has been supercharged! The new Feedback Dashboard provides a comprehensive view of all your interactions, with powerful filtering and sorting. When you give feedback, you can now directly create a JIRA sub-task to track usability issues or enhancements, complete with usability metrics. In the dashboard, view detailed JIRA issue information for your feedback, see live comments, and even add your own comments without leaving the app.",
    benefits: [
      "Create JIRA sub-tasks directly from feedback to track usability metrics.",
      "Centralized dashboard to view all your upvotes and downvotes.",
      "Deep JIRA integration: view issue status, priority, and comments.",
      "Add comments directly to linked JIRA issues from the dashboard.",
      "Powerful search, sort, and filtering capabilities.",
      "Quickly navigate back to the original chat context.",
    ],
    gettingStarted: [
      "Click 👍 or 👎 on any AI response to open the feedback dialog.",
      "To create a JIRA sub-task, check 'Create Jira Issue' and select the 'Subtask' option.",
      "Provide a parent JIRA task key and adjust the usability rating.",
      "Navigate to the Feedback Dashboard from the sidebar to view all your feedback.",
      "Expand any entry to see details, including linked JIRA issues and comments.",
    ],
    icon: <Heart className="h-6 w-6" />,
    badge: "Feedback",
    color: "from-teal-500 to-blue-500",
    category: "ui",
    actionLabel: "View Feedback",
    actionUrl: "/feedback",
    actionType: "navigation",
  },
  {
    id: "agent-scratchpad",
    title: "Agent Scratchpad",
    description:
      "Visualize AI thinking processes and intermediate steps with our interactive agent scratchpad for transparency.",
    detailedDescription:
      "Get complete transparency into how the AI processes your requests. See the step-by-step reasoning, intermediate calculations, and decision-making process that leads to the final response.",
    benefits: [
      "Complete AI transparency",
      "Step-by-step reasoning visualization",
      "Debugging and understanding aid",
      "Educational insights into AI thinking",
      "Multiple view mode option to view interactive scratchpad",
      "Interactive exploration of AI thought processes",
    ],
    gettingStarted: [
      "Submit a query to see AI reasoning",
      "Explore different thinking stages",
      "Use insights to refine your queries",
    ],
    icon: <Settings className="h-6 w-6" />,
    badge: "Transparency",
    color: "from-amber-500 to-yellow-500",
    category: "workflow",
    demoAvailable: false,
  },
  {
    id: "multi-agent",
    title: "Advanced Multi-Agent System",
    description:
      "Powered by Supervisor and Researcher agents for enhanced workflow orchestration and intelligent task distribution.",
    detailedDescription:
      "Experience the power of coordinated AI agents working together. Our supervisor agent orchestrates complex tasks while researcher agents handle specialized information gathering and analysis.",
    benefits: [
      "Coordinated AI agent collaboration",
      "Intelligent task distribution",
      "Enhanced problem-solving capabilities",
      "Specialized agent expertise",
    ],
    gettingStarted: [
      "Submit complex multi-step queries",
      "Watch agents collaborate in real-time",
      "Review agent-specific contributions",
      "Leverage specialized agent capabilities",
    ],
    icon: <Users className="h-6 w-6" />,
    badge: "Multi-Agent",
    color: "from-indigo-500 to-blue-600",
    category: "workflow",
    demoAvailable: false,
  },
  {
    id: "improved-agents",
    title: "Enhanced Agent Capabilities",
    description:
      "Improved context understanding, better execution, and more sophisticated reasoning capabilities across all agents.",
    detailedDescription:
      "All AI agents have been upgraded with enhanced context awareness, improved reasoning capabilities, and better task execution. Experience more accurate responses and sophisticated problem-solving.",
    benefits: [
      "Enhanced context understanding",
      "Improved reasoning capabilities",
      "Better task execution accuracy",
      "More sophisticated problem-solving",
    ],
    gettingStarted: [
      "Try complex reasoning tasks",
      "Test context-dependent queries",
      "Compare with previous responses",
      "Explore advanced capabilities",
    ],
    icon: <Zap className="h-6 w-6" />,
    badge: "Performance",
    color: "from-rose-500 to-pink-600",
    category: "core",
  },
  {
    id: "jira-integration",
    title: "Unified JIRA Workflow",
    description:
      "JIRA is now deeply integrated across the platform, from feedback and PR analysis to requirement blueprints.",
    detailedDescription:
      "We've woven JIRA into key workflows to connect your development activities directly with project tracking. Now you can create detailed sub-tasks from user feedback, get AI-powered analysis of JIRA issues linked to your pull requests, and attach issues to requirement blueprints for richer context.",
    benefits: [
      "Create JIRA sub-tasks directly from the feedback dialog.",
      "View and comment on JIRA issues in the Feedback Dashboard.",
      "Get AI analysis of JIRA issues within the Code Intelligence Hub.",
      "Add JIRA issues as context for Requirement Blueprints.",
    ],
    gettingStarted: [
      "Provide feedback on any chat response to see the JIRA sub-task creation option.",
      "Explore the Feedback Dashboard to see your JIRA-linked feedback.",
      "In the Code Intelligence Hub, view a PR that has a linked JIRA issue.",
      "When creating a Requirement Blueprint, use the 'Attach JIRA Issue' option.",
    ],
    icon: <Network className="h-6 w-6" />,
    badge: "Integration",
    color: "from-blue-600 to-indigo-600",
    category: "integration",
  },
];

const categoryLabels = {
  core: "Core Features",
  integration: "Integrations",
  workflow: "Workflow",
  ui: "User Experience",
};

interface WhatsNewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMarkAsSeen?: () => void;
}

export function WhatsNewModal({
  isOpen,
  onClose,
  onMarkAsSeen,
}: WhatsNewModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [animationStage, setAnimationStage] = useState(0);

  const handleClose = () => {
    onClose();
    onMarkAsSeen?.();
  };

  const handleFeatureClick = (feature: Feature) => {
    setSelectedFeature(feature);
  };

  const handleBackToList = () => {
    setSelectedFeature(null);
  };

  const handleAction = (feature: Feature) => {
    if (feature.actionType === "navigation" && feature.actionUrl) {
      window.location.href = feature.actionUrl;
    } else if (feature.actionType === "external" && feature.actionUrl) {
      window.open(feature.actionUrl, "_blank");
    }
    // For modal type, you could trigger specific modals here
    handleClose();
  };

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setAnimationStage(1), 100);
      return () => clearTimeout(timer);
    } else {
      setAnimationStage(0);
      setSelectedCategory(null);
      setSelectedFeature(null);
    }
  }, [isOpen]);

  const filteredFeatures = selectedCategory
    ? features.filter((feature) => feature.category === selectedCategory)
    : features;

  const categories = Object.entries(categoryLabels);

  // Detailed Feature View
  if (selectedFeature) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
          <div className="relative">
            {/* Header */}
            <div
              className={cn(
                "relative px-8 py-6 text-white overflow-hidden bg-gradient-to-r",
                selectedFeature.color
              )}
            >
              <div className="absolute inset-0 opacity-30">
                <div className="absolute inset-0 bg-white/5 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
              </div>

              <Button
                onClick={handleBackToList}
                variant="ghost"
                size="sm"
                className="absolute left-4 top-4 text-white/80 hover:text-white hover:bg-white/20 z-10"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>

              <div className="relative z-10 pt-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                    {selectedFeature.icon}
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold mb-1">
                      {selectedFeature.title}
                    </DialogTitle>
                    {selectedFeature.badge && (
                      <Badge
                        variant="secondary"
                        className="bg-white/20 text-white border-white/30"
                      >
                        {selectedFeature.badge}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <ScrollArea className="h-[60vh] px-8 py-6">
              <div className="space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    About this feature
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {selectedFeature.detailedDescription ||
                      selectedFeature.description}
                  </p>
                </div>

                {/* Benefits */}
                {selectedFeature.benefits && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      Key Benefits
                    </h3>
                    <ul className="space-y-2">
                      {selectedFeature.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">
                            {benefit}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Getting Started */}
                {selectedFeature.gettingStarted && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Lightbulb className="h-5 w-5" />
                      Getting Started
                    </h3>
                    <ol className="space-y-2">
                      {selectedFeature.gettingStarted.map((step, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex-shrink-0 mt-0.5">
                            {index + 1}
                          </div>
                          <span className="text-muted-foreground">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Demo Available */}
                {selectedFeature.demoAvailable && (
                  <div className="p-4 bg-muted/50 rounded-lg border border-muted">
                    <div className="flex items-center gap-2 mb-2">
                      <Play className="h-5 w-5 text-primary" />
                      <span className="font-medium">
                        Interactive Demo Available
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      This feature includes an interactive demo to help you
                      explore its capabilities.
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Footer Actions */}
            <div className="px-8 py-4 border-t bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Ready to try {selectedFeature.title}?
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBackToList}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Features
                  </Button>
                  {selectedFeature.actionLabel && (
                    <Button
                      size="sm"
                      onClick={() => handleAction(selectedFeature)}
                      className={cn(
                        "bg-gradient-to-r hover:opacity-90",
                        selectedFeature.color
                      )}
                    >
                      {selectedFeature.actionType === "external" ? (
                        <ExternalLink className="h-4 w-4 mr-2" />
                      ) : (
                        <ChevronRight className="h-4 w-4 mr-2" />
                      )}
                      {selectedFeature.actionLabel}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Main Features List View
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
        <div className="relative">
          {/* Header with gradient and sparkles */}
          <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-8 py-6 text-white overflow-hidden">
            <div className="absolute inset-0 opacity-30">
              <div className="absolute inset-0 bg-white/5 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold mb-1">
                    What&apos;s New in MVP2
                  </DialogTitle>
                  <p className="text-white/90 text-sm">
                    Discover powerful new features and enhancements
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <Badge
                  variant="secondary"
                  className="bg-white/20 text-white border-white/30"
                >
                  <Star className="h-3 w-3 mr-1" />
                  11 New Features
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-white/20 text-white border-white/30"
                >
                  Enhanced AI
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-white/20 text-white border-white/30"
                >
                  Better UX
                </Badge>
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="px-6 py-4 border-b bg-muted/30">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className="h-8"
              >
                All Features
              </Button>
              {categories.map(([key, label]) => (
                <Button
                  key={key}
                  variant={selectedCategory === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(key)}
                  className="h-8"
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Features Grid */}
          <ScrollArea className="h-[55vh] px-6 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              {filteredFeatures.map((feature, index) => (
                <div
                  key={feature.id}
                  className={cn(
                    "group relative p-6 rounded-xl border bg-card/50 hover:bg-card transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 cursor-pointer",
                    animationStage === 1 &&
                      "animate-in fade-in-0 slide-in-from-bottom-4"
                  )}
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                  onClick={() => handleFeatureClick(feature)}
                >
                  {/* Gradient overlay */}
                  <div
                    className={cn(
                      "absolute inset-0 rounded-xl bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-300",
                      feature.color
                    )}
                  />

                  <div className="relative z-10">
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "p-3 rounded-lg bg-gradient-to-br text-white shadow-lg",
                          feature.color
                        )}
                      >
                        {feature.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {feature.title}
                          </h3>
                          {feature.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {feature.badge}
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                          {feature.description}
                        </p>

                        {/* Feature indicators */}
                        <div className="flex items-center gap-2 mt-2">
                          {feature.demoAvailable && (
                            <Badge variant="outline" className="text-xs">
                              <Play className="h-3 w-3 mr-1" />
                              Demo
                            </Badge>
                          )}
                          {feature.actionLabel && (
                            <Badge variant="outline" className="text-xs">
                              <ChevronRight className="h-3 w-3 mr-1" />
                              Try Now
                            </Badge>
                          )}
                        </div>
                      </div>

                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-200" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Click any feature to learn more and get started
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleClose}>
                  Maybe Later
                </Button>
                <Button
                  size="sm"
                  onClick={handleClose}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Workflow className="h-4 w-4 mr-2" />
                  Start Exploring
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
