"use client";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

// Define the Benefit interface
interface Benefit {
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
}

// Define the BenefitDetails interface
interface BenefitDetails {
  keyPoints: string[];
  example: string;
}

// Define props for the BenefitModal component
interface BenefitModalProps {
  isOpen: boolean;
  onClose: () => void;
  benefit: Benefit | null;
}

export function BenefitModal({ isOpen, onClose, benefit }: BenefitModalProps) {
  if (!benefit) return null;

  // Map of additional details for each benefit type
  const benefitDetails: Record<string, BenefitDetails> = {
    "Code Intelligence Hub": {
      keyPoints: [
        "AI-powered repository analysis with deep code understanding",
        "Comprehensive PR summaries with automated insights",
        "Commit history analysis for development patterns",
        "Dependency mapping across multiple repositories",
        "Real-time code quality and security recommendations",
      ],
      example:
        "Access detailed repository insights including PR impact analysis, dependency relationships, and code quality metrics. View commit summaries that highlight architectural changes and potential impacts across your codebase.",
    },
    "Multi-Agent Orchestration": {
      keyPoints: [
        "Supervisor agent coordinates specialized AI workflows",
        "RAG-powered research agents for accurate information retrieval",
        "Task-specific agent specialization for optimal results",
        "IBM Granite models powering intelligent decision-making",
        "Seamless collaboration between agents for complex queries",
      ],
      example:
        "Your complex Salesforce development question triggers the supervisor agent, which coordinates research agents to gather relevant documentation, code patterns, and best practices before generating a comprehensive solution.",
    },
    "Smart Requirement Analysis": {
      keyPoints: [
        "Transform Salesforce ideas into structured blueprints",
        "AI-powered analysis of requirements and dependencies",
        "Automated implementation planning and task breakdown",
        "Architecture recommendations based on best practices",
        "Integration with existing Salesforce org structure analysis",
      ],
      example:
        "Describe your Salesforce feature idea and receive a detailed blueprint including object model design, workflow requirements, integration points, and step-by-step implementation guidance.",
    },
    "Enhanced Feedback System": {
      keyPoints: [
        "Direct JIRA sub-task creation from user feedback",
        "Comprehensive usability metrics and analytics dashboard",
        "Automated feedback categorization and prioritization",
        "Integration with development workflow tracking",
        "Real-time feedback processing and notification system",
      ],
      example:
        "User feedback is automatically analyzed, categorized, and converted into actionable JIRA sub-tasks with appropriate labels, priorities, and assignments. Track feedback resolution metrics through the enhanced dashboard.",
    },
    "Agent Transparency": {
      keyPoints: [
        "Step-by-step visualization of AI reasoning processes",
        "Real-time display of agent decision-making logic",
        "Interactive scratchpad showing thought progression",
        "Debug and understand AI responses with full transparency",
        "Educational insights into multi-agent collaboration",
      ],
      example:
        "Watch as the AI breaks down your complex query, shows its research process, explains its reasoning steps, and demonstrates how multiple agents collaborate to generate the final solution.",
    },
    "Seamless GitHub Integration": {
      keyPoints: [
        "Enhanced repository browsing with advanced search capabilities",
        "Branch selection and comparison features",
        "IBMSC repository access with enterprise security",
        "Integration with development workflow and CI/CD pipelines",
        "Real-time synchronization with repository changes",
      ],
      example:
        "Browse IBMSC repositories with intelligent search, compare branches visually, access private enterprise repos securely, and integrate findings directly into your development workflow.",
    },
    "Unified JIRA Workflow": {
      keyPoints: [
        "Complete integration with JIRA project management",
        "Automated sub-task creation and status tracking",
        "Seamless transition from development to deployment",
        "Real-time project status updates and notifications",
        "Integration with agile development methodologies",
      ],
      example:
        "Create development tasks directly from AI conversations, track implementation progress automatically, and maintain seamless project visibility from ideation through deployment.",
    },
    "Advanced Chat Sharing": {
      keyPoints: [
        "Share conversations with team members and stakeholders",
        "Build collaborative team knowledge bases",
        "Persistent chat history with search capabilities",
        "Export conversations for documentation purposes",
        "Team collaboration features with role-based access",
      ],
      example:
        "Share your AI-assisted problem-solving sessions with team members, build a searchable knowledge base of solutions, and collaborate effectively with persistent conversation history.",
    },
    "Enhanced Performance": {
      keyPoints: [
        "50% faster navigation with optimized user interface",
        "Modern UI design with improved accessibility (WCAG compliance)",
        "Streamlined workflows reducing cognitive load",
        "Responsive design optimized for all device sizes",
        "Performance monitoring and continuous optimization",
      ],
      example:
        "Experience lightning-fast navigation, cleaner interfaces that reduce mental overhead, full accessibility support for inclusive development, and consistent performance across desktop and mobile devices.",
    },
  };

  const details = benefitDetails[benefit.title] || {
    keyPoints: ["Feature details not available"],
    example: "Example not available",
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-gray-900/90 border-gray-700">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`p-3 rounded-xl bg-gradient-to-r ${benefit.gradient}`}
            >
              {benefit.icon}
            </div>
            <DialogTitle className="text-2xl text-white">
              {benefit.title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-gray-300 text-base">
            {benefit.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 my-2">
          <div>
            <h4 className="text-white font-medium mb-3">Key Features</h4>
            <div className="space-y-2">
              {details.keyPoints.map((point, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckCircle className="text-green-500 h-5 w-5 mt-0.5" />
                  <p className="text-gray-300">{point}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-medium mb-2">Example Usage</h4>
            <div className="bg-black/50 p-4 rounded-lg border border-gray-800">
              <p className="text-gray-300">{details.example}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={onClose}
            className={`bg-gradient-to-r ${benefit.gradient} hover:opacity-90 transition-opacity`}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
