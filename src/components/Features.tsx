"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Code2,
  Blocks,
  TestTube2,
  Cpu,
  MessageSquare,
  Database,
  GitBranch,
  FileCode,
  BrainCircuit,
  Zap,
  Shield,
  Bot,
  CheckCircle,
  RefreshCcw,
  GitPullRequest,
  Share2,
  Lock,
  Github,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BackgroundGradientAnimation } from "@/components/ui/aceternity/background-gradient-animation";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define types for the feature items
interface FeatureItem {
  title: string;
  description: string;
}

// Define types for feature demos
interface FeatureDemo {
  id: string;
  label: string;
  type: string;
  title: string;
  description: string;
  content: React.ReactNode;
}

// Define the Feature interface
interface Feature {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  highlight: string;
  textHighlight: string;
  items: FeatureItem[];
  demos?: FeatureDemo[];
}

// Define props for FeatureDemo component
interface FeatureDemoProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

const FeatureDemo: React.FC<FeatureDemoProps> = ({
  title,
  description,
  children,
}) => (
  <div className="bg-gray-900/70 rounded-lg p-4 border border-gray-800">
    <h4 className="text-white font-medium mb-1">{title}</h4>
    <p className="text-gray-400 text-sm mb-4">{description}</p>
    {children}
  </div>
);

const Features: React.FC = () => {
  const router = useRouter();
  const [activeFeature, setActiveFeature] = useState<number | null>(null);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const handleFeatureClick = (index: number) => {
    setActiveFeature(activeFeature === index ? null : index);
  };

  const features: Feature[] = [
    {
      title: "Intelligent Code Assistant",
      description:
        "Production-ready Apex classes and Lightning Web Components with context-aware recommendations",
      icon: Code2,
      color: "bg-blue-500/10",
      highlight: "border-blue-500/40",
      textHighlight: "text-blue-400",
      items: [
        {
          title: "Repository-Aware Code Generation",
          description:
            "Creates new Apex and LWC code based on existing patterns in ISC repositories",
        },
        {
          title: "Code Explanation & Analysis",
          description:
            "Explains and analyzes existing code from PRM, Global-Schema, Sales, Global Core and Sirion-Schema repositories",
        },
        {
          title: "Best Practices Integration",
          description:
            "Automatically applies Salesforce development best practices from ISC repositories",
        },
        {
          title: "Pattern Recognition",
          description:
            "Identifies and implements design patterns from existing code bases",
        },
      ],
      demos: [
        {
          id: "repository-aware",
          label: "Repositories",
          type: "content",
          title: "Repository-Aware Generation",
          description:
            "Creates code that aligns with existing patterns in ISC repositories",
          content: (
            <div className="space-y-4">
              <div className="bg-gray-900/70 p-4 rounded-lg border border-gray-800">
                <h4 className="text-white font-medium mb-2">
                  Supported Repositories
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    "PRM",
                    "Global-Schema",
                    "Sales",
                    "Global Core",
                    "Sirion-Schema",
                  ].map((repo, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <Github className="w-4 h-4 text-blue-400" />
                      <span className="text-gray-300 text-sm">{repo}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gray-900/70 p-4 rounded-lg border border-gray-800">
                <h4 className="text-white font-medium mb-2">
                  Key Generation Features
                </h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span>
                      Pattern-matched code that follows ISC coding standards
                    </span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span>Contextual awareness of existing architecture</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span>
                      Reuse of successful patterns from across repositories
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          ),
        },
        {
          id: "explanation",
          label: "Explanation",
          type: "content",
          title: "Code Explanation Features",
          description: "Detailed breakdown of existing code",
          content: (
            <div className="space-y-4">
              <div className="bg-gray-900/70 p-4 rounded-lg border border-gray-800">
                <h4 className="text-white font-medium mb-2">
                  Explanation Capabilities
                </h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span>Method-by-method breakdown of complex code</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span>Best practices identification and explanation</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span>Performance optimization recommendations</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gray-900/70 p-4 rounded-lg border border-gray-800">
                <h4 className="text-white font-medium mb-2">
                  Explanation Examples
                </h4>
                <div className="space-y-2">
                  <div className="p-2 bg-gray-800 rounded-lg">
                    <div className="text-blue-400 text-sm font-medium">
                      Class Purpose
                    </div>
                    <div className="text-xs text-gray-300">
                      Understanding the high-level intent and structure
                    </div>
                  </div>
                  <div className="p-2 bg-gray-800 rounded-lg">
                    <div className="text-blue-400 text-sm font-medium">
                      Method Flows
                    </div>
                    <div className="text-xs text-gray-300">
                      Step-by-step execution paths and logic
                    </div>
                  </div>
                  <div className="p-2 bg-gray-800 rounded-lg">
                    <div className="text-blue-400 text-sm font-medium">
                      Design Patterns
                    </div>
                    <div className="text-xs text-gray-300">
                      Identification of architectural patterns in use
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ),
        },
        {
          id: "improvement",
          label: "Improvement",
          type: "content",
          title: "Code Improvement Suggestions",
          description: "Recommendations for enhancing existing code",
          content: (
            <div className="space-y-4">
              <div className="bg-gray-900/70 p-4 rounded-lg border border-gray-800">
                <h4 className="text-white font-medium mb-2">
                  Improvement Categories
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 bg-gray-800 rounded-lg">
                    <div className="text-green-400 text-sm font-medium">
                      Performance
                    </div>
                    <div className="text-xs text-gray-300">
                      Query and processing optimizations
                    </div>
                  </div>
                  <div className="p-2 bg-gray-800 rounded-lg">
                    <div className="text-green-400 text-sm font-medium">
                      Security
                    </div>
                    <div className="text-xs text-gray-300">
                      CRUD and FLS compliance
                    </div>
                  </div>
                  <div className="p-2 bg-gray-800 rounded-lg">
                    <div className="text-green-400 text-sm font-medium">
                      Maintainability
                    </div>
                    <div className="text-xs text-gray-300">
                      Code structure and documentation
                    </div>
                  </div>
                  <div className="p-2 bg-gray-800 rounded-lg">
                    <div className="text-green-400 text-sm font-medium">
                      Best Practices
                    </div>
                    <div className="text-xs text-gray-300">
                      Aligning with Salesforce standards
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ),
        },
      ],
    },
    {
      title: "Multi-Agent Architecture",
      description:
        "LangGraph-based agents working together for specialized tasks in code analysis and generation",
      icon: BrainCircuit,
      color: "bg-indigo-500/10",
      highlight: "border-indigo-500/40",
      textHighlight: "text-indigo-400",
      items: [
        {
          title: "Query Analysis Agent",
          description:
            "Interprets user requests and routes to appropriate specialized agents",
        },
        {
          title: "Retrieval Agent",
          description:
            "Finds relevant code examples and patterns from ISC repositories",
        },
        {
          title: "Code Generation Agent",
          description:
            "Creates new code based on retrieved patterns and best practices",
        },
        {
          title: "IBM Granite 3.2 Integration",
          description:
            "Leverages IBM's latest reasoning model for optimal code generation",
        },
      ],
      demos: [
        {
          id: "agent-flow",
          label: "Architecture",
          type: "content",
          title: "Multi-Agent System Architecture",
          description: "How specialized agents collaborate in the system",
          content: (
            <div className="p-6 bg-gray-900/70 rounded-lg border border-gray-800">
              <div className="flex flex-col space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-lg bg-indigo-500/20 border border-indigo-500/30">
                    <MessageSquare className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-medium">User Query</h4>
                    <p className="text-sm text-gray-400">
                      Input request from developer
                    </p>
                  </div>
                </div>

                <div className="w-0.5 h-6 bg-gray-700 mx-auto"></div>

                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-lg bg-blue-500/20 border border-blue-500/30">
                    <BrainCircuit className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-medium">
                      Query Analysis Agent
                    </h4>
                    <p className="text-sm text-gray-400">
                      Interprets request intent and routes accordingly
                    </p>
                  </div>
                </div>

                <div className="w-0.5 h-6 bg-gray-700 mx-auto"></div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="p-3 rounded-lg bg-green-500/20 border border-green-500/30">
                      <Database className="w-5 h-5 text-green-400" />
                    </div>
                    <h4 className="text-white font-medium text-center">
                      Retrieval Agent
                    </h4>
                    <p className="text-xs text-gray-400 text-center">
                      Searches repositories
                    </p>
                  </div>

                  <div className="flex flex-col items-center space-y-3">
                    <div className="p-3 rounded-lg bg-yellow-500/20 border border-yellow-500/30">
                      <Code2 className="w-5 h-5 text-yellow-400" />
                    </div>
                    <h4 className="text-white font-medium text-center">
                      Generation Agent
                    </h4>
                    <p className="text-xs text-gray-400 text-center">
                      Creates new code
                    </p>
                  </div>

                  <div className="flex flex-col items-center space-y-3">
                    <div className="p-3 rounded-lg bg-purple-500/20 border border-purple-500/30">
                      <TestTube2 className="w-5 h-5 text-purple-400" />
                    </div>
                    <h4 className="text-white font-medium text-center">
                      Test Agent
                    </h4>
                    <p className="text-xs text-gray-400 text-center">
                      Develops test cases
                    </p>
                  </div>
                </div>

                <div className="w-0.5 h-6 bg-gray-700 mx-auto"></div>

                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-lg bg-teal-500/20 border border-teal-500/30">
                    <MessageSquare className="w-5 h-5 text-teal-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-medium">Unified Response</h4>
                    <p className="text-sm text-gray-400">
                      Cohesive answer delivered to user
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ),
        },
        {
          id: "ibm-granite",
          label: "IBM Granite",
          type: "content",
          title: "IBM Granite 3.2 Integration",
          description: "Utilizing the latest IBM reasoning model",
          content: (
            <div className="space-y-4">
              <div className="bg-gray-900/70 p-4 rounded-lg border border-gray-800">
                <h4 className="text-white font-medium mb-3">
                  Advanced AI Capabilities
                </h4>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30 mt-0.5">
                      <BrainCircuit className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <h5 className="text-white text-sm font-medium">
                        Reasoning-Based Code Analysis
                      </h5>
                      <p className="text-xs text-gray-400">
                        Advanced contextual understanding of complex code
                        structures
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30 mt-0.5">
                      <GitBranch className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <h5 className="text-white text-sm font-medium">
                        Enhanced Pattern Recognition
                      </h5>
                      <p className="text-xs text-gray-400">
                        Identification of subtle patterns across repository code
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30 mt-0.5">
                      <MessageSquare className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <h5 className="text-white text-sm font-medium">
                        Natural Language Processing
                      </h5>
                      <p className="text-xs text-gray-400">
                        Better understanding of developer intent from natural
                        language queries
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900/70 p-4 rounded-lg border border-gray-800">
                <h4 className="text-white font-medium mb-3">
                  Integration Benefits
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 bg-gray-800 rounded-lg">
                    <div className="text-indigo-400 text-sm font-medium">
                      Higher Accuracy
                    </div>
                    <div className="text-xs text-gray-300">
                      More precise code generation
                    </div>
                  </div>
                  <div className="p-2 bg-gray-800 rounded-lg">
                    <div className="text-indigo-400 text-sm font-medium">
                      Faster Response
                    </div>
                    <div className="text-xs text-gray-300">
                      Optimized processing times
                    </div>
                  </div>
                  <div className="p-2 bg-gray-800 rounded-lg">
                    <div className="text-indigo-400 text-sm font-medium">
                      Better Context
                    </div>
                    <div className="text-xs text-gray-300">
                      Enhanced understanding of code relationships
                    </div>
                  </div>
                  <div className="p-2 bg-gray-800 rounded-lg">
                    <div className="text-indigo-400 text-sm font-medium">
                      Complex Reasoning
                    </div>
                    <div className="text-xs text-gray-300">
                      Advanced problem-solving capabilities
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ),
        },
      ],
    },
    {
      title: "Advanced Testing",
      description:
        "Comprehensive test coverage with context-aware edge case handling",
      icon: TestTube2,
      color: "bg-green-500/10",
      highlight: "border-green-500/40",
      textHighlight: "text-green-400",
      items: [
        {
          title: "Automated Test Generation",
          description:
            "Creates thorough test classes with high coverage based on ISC patterns",
        },
        {
          title: "Edge Case Detection",
          description:
            "Identifies and tests potential failure points specific to your code",
        },
        {
          title: "Bulk Testing",
          description: "Automatically implements bulk data testing scenarios",
        },
        {
          title: "Integration Tests",
          description: "Generates tests that verify cross-object interactions",
        },
      ],
      demos: [
        {
          id: "testing-features",
          label: "Core Testing",
          type: "content",
          title: "Comprehensive Testing Features",
          description: "Key testing capabilities available in the platform",
          content: (
            <div className="space-y-4">
              <div className="bg-gray-900/70 p-4 rounded-lg border border-gray-800">
                <h4 className="text-white font-medium mb-3">
                  Test Generation Features
                </h4>
                <div className="space-y-2">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h5 className="text-white text-sm font-medium">
                        Pattern-Based Test Creation
                      </h5>
                      <p className="text-xs text-gray-400">
                        Creates tests that match ISC testing patterns
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h5 className="text-white text-sm font-medium">
                        Bulk Testing Scenarios
                      </h5>
                      <p className="text-xs text-gray-400">
                        Automatic generation of tests that verify bulk
                        processing
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h5 className="text-white text-sm font-medium">
                        Edge Case Detection
                      </h5>
                      <p className="text-xs text-gray-400">
                        Identification and testing of boundary conditions
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ),
        },
        {
          id: "mocking",
          label: "Mocking",
          type: "content",
          title: "Advanced Mocking & Stubbing",
          description: "Powerful tools for isolating code during testing",
          content: (
            <div className="space-y-4">
              <div className="bg-gray-900/70 p-4 rounded-lg border border-gray-800">
                <h4 className="text-white font-medium mb-3">
                  Mocking Capabilities
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 bg-gray-800 rounded-lg">
                    <div className="text-green-400 text-sm font-medium">
                      HTTP Callout Mocks
                    </div>
                    <div className="text-xs text-gray-300">
                      Simulate external API responses
                    </div>
                  </div>
                  <div className="p-2 bg-gray-800 rounded-lg">
                    <div className="text-green-400 text-sm font-medium">
                      Database Mocks
                    </div>
                    <div className="text-xs text-gray-300">
                      Virtual database records
                    </div>
                  </div>
                  <div className="p-2 bg-gray-800 rounded-lg">
                    <div className="text-green-400 text-sm font-medium">
                      Dependency Injection
                    </div>
                    <div className="text-xs text-gray-300">
                      Interface-based mock substitution
                    </div>
                  </div>
                  <div className="p-2 bg-gray-800 rounded-lg">
                    <div className="text-green-400 text-sm font-medium">
                      Service Virtualization
                    </div>
                    <div className="text-xs text-gray-300">
                      Mock service implementations
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-900/70 p-4 rounded-lg border border-gray-800">
                <h4 className="text-white font-medium mb-3">
                  Testing Best Practices
                </h4>
                <div className="space-y-2">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span className="text-sm text-gray-300">
                      AAA pattern (Arrange-Act-Assert)
                    </span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span className="text-sm text-gray-300">
                      Single responsibility tests
                    </span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span className="text-sm text-gray-300">
                      Data isolation with @TestSetup
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ),
        },
      ],
    },
    {
      title: "Advanced RAG System",
      description:
        "Context-aware retrieval from ISC repositories with Milvus vector database",
      icon: Database,
      color: "bg-amber-500/10",
      highlight: "border-amber-500/40",
      textHighlight: "text-amber-400",
      items: [
        {
          title: "Context-Aware Retrieval",
          description:
            "Smart fetching of relevant code patterns from ISC repositories",
        },
        {
          title: "Milvus Vector Database",
          description: "Efficient storage and retrieval of code embeddings",
        },
        {
          title: "Intelligent Chunking",
          description:
            "Advanced algorithm for creating meaningful code fragments",
        },
        {
          title: "Auto-Updating Knowledge Base",
          description:
            "Seamless updates when PRs are merged in ISC repositories",
        },
      ],
      demos: [
        {
          id: "vectordb",
          label: "Vector Database",
          type: "content",
          title: "Milvus Vector Database",
          description: "Powerful vector database for code embeddings",
          content: (
            <div className="space-y-4">
              <div className="bg-gray-900/70 p-4 rounded-lg border border-gray-800">
                <h4 className="text-white font-medium mb-3">
                  Vector Database Features
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 bg-gray-800 rounded-lg">
                    <div className="text-amber-400 text-sm font-medium">
                      High Performance
                    </div>
                    <div className="text-xs text-gray-300">
                      Sub-second similarity search
                    </div>
                  </div>
                  <div className="p-2 bg-gray-800 rounded-lg">
                    <div className="text-amber-400 text-sm font-medium">
                      Scalability
                    </div>
                    <div className="text-xs text-gray-300">
                      Millions of code embeddings
                    </div>
                  </div>
                  <div className="p-2 bg-gray-800 rounded-lg">
                    <div className="text-amber-400 text-sm font-medium">
                      Hybrid Search
                    </div>
                    <div className="text-xs text-gray-300">
                      Vector + keyword filtering
                    </div>
                  </div>
                  <div className="p-2 bg-gray-800 rounded-lg">
                    <div className="text-amber-400 text-sm font-medium">
                      Near Real-Time
                    </div>
                    <div className="text-xs text-gray-300">
                      Fast index updates
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-900/70 p-4 rounded-lg border border-gray-800">
                <h4 className="text-white font-medium mb-3">
                  Repository Coverage
                </h4>
                <div className="space-y-3">
                  {[
                    { name: "PRM", files: "5,842", coverage: "99.8%" },
                    { name: "Global-Schema", files: "2,371", coverage: "100%" },
                    { name: "Sales", files: "4,280", coverage: "99.7%" },
                    { name: "Global Core", files: "3,126", coverage: "99.9%" },
                    { name: "Sirion-Schema", files: "1,894", coverage: "100%" },
                  ].map((repo, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center text-sm"
                    >
                      <div className="flex items-center space-x-2">
                        <Github className="w-4 h-4 text-amber-400" />
                        <span className="text-white">{repo.name}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-gray-400">
                          {repo.files} files
                        </span>
                        <span className="text-green-400">{repo.coverage}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ),
        },
        {
          id: "chunking",
          label: "Smart Chunking",
          type: "content",
          title: "Intelligent Code Chunking",
          description:
            "How the system breaks down code for meaningful understanding",
          content: (
            <div className="space-y-4">
              <div className="bg-gray-900/70 p-4 rounded-lg border border-gray-800">
                <h4 className="text-white font-medium mb-2">
                  Chunking Process
                </h4>
                <ol className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start space-x-2">
                    <div className="min-w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xs text-amber-400">
                      1
                    </div>
                    <div>
                      <span className="font-medium text-white">
                        Semantic Analysis
                      </span>
                      <p className="text-xs text-gray-400 mt-1">
                        Code is analyzed to understand logical sections and
                        boundaries
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="min-w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xs text-amber-400">
                      2
                    </div>
                    <div>
                      <span className="font-medium text-white">
                        Method-Level Chunking
                      </span>
                      <p className="text-xs text-gray-400 mt-1">
                        Methods and their associated docstrings are kept
                        together
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="min-w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xs text-amber-400">
                      3
                    </div>
                    <div>
                      <span className="font-medium text-white">
                        Context Preservation
                      </span>
                      <p className="text-xs text-gray-400 mt-1">
                        Related methods and properties are grouped to maintain
                        context
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="min-w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xs text-amber-400">
                      4
                    </div>
                    <div>
                      <span className="font-medium text-white">
                        Overlap Strategy
                      </span>
                      <p className="text-xs text-gray-400 mt-1">
                        Chunks have strategic overlap to maintain connections
                      </p>
                    </div>
                  </li>
                </ol>
              </div>
              <div className="bg-gray-900/70 p-4 rounded-lg border border-gray-800">
                <h4 className="text-white font-medium mb-2">Benefits</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 bg-gray-800 rounded-lg">
                    <div className="text-amber-400 text-sm font-medium">
                      Contextual Understanding
                    </div>
                    <div className="text-xs text-gray-300">
                      Preserves semantic relationships
                    </div>
                  </div>
                  <div className="p-2 bg-gray-800 rounded-lg">
                    <div className="text-amber-400 text-sm font-medium">
                      Relevant Retrieval
                    </div>
                    <div className="text-xs text-gray-300">
                      Returns complete code units
                    </div>
                  </div>
                  <div className="p-2 bg-gray-800 rounded-lg">
                    <div className="text-amber-400 text-sm font-medium">
                      Efficient Storage
                    </div>
                    <div className="text-xs text-gray-300">
                      Optimizes vector database space
                    </div>
                  </div>
                  <div className="p-2 bg-gray-800 rounded-lg">
                    <div className="text-amber-400 text-sm font-medium">
                      Better Patterns
                    </div>
                    <div className="text-xs text-gray-300">
                      Identifies design patterns easier
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ),
        },
        {
          id: "auto-update",
          label: "Auto-Update",
          type: "content",
          title: "Automatic Knowledge Updates",
          description:
            "How the system stays up-to-date with repository changes",
          content: (
            <div className="space-y-4">
              <div className="bg-gray-900/70 p-4 rounded-lg border border-gray-800 relative overflow-hidden">
                <div className="flex items-start space-x-4">
                  <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/40">
                    <GitPullRequest className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h5 className="text-white font-medium">
                      PR Merge Detection
                    </h5>
                    <p className="text-sm text-gray-400 mt-1">
                      System automatically detects when PRs are merged to main
                      branches
                    </p>
                  </div>
                </div>
                <div className="w-0.5 h-8 bg-gray-700 mx-8 my-2"></div>
                <div className="flex items-start space-x-4">
                  <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/40">
                    <FileCode className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h5 className="text-white font-medium">Delta Extraction</h5>
                    <p className="text-sm text-gray-400 mt-1">
                      Only changed files are processed to optimize performance
                    </p>
                  </div>
                </div>
                <div className="w-0.5 h-8 bg-gray-700 mx-8 my-2"></div>
                <div className="flex items-start space-x-4">
                  <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/40">
                    <Cpu className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h5 className="text-white font-medium">Re-Embedding</h5>
                    <p className="text-sm text-gray-400 mt-1">
                      Changed files are re-chunked and embedded into vector
                      database
                    </p>
                  </div>
                </div>
                <div className="absolute right-0 bottom-0 p-2 bg-green-500/20 rounded-tl-lg border-l border-t border-green-500/40">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xs text-green-400">Live</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-900/70 p-4 rounded-lg border border-gray-800">
                <h4 className="text-white font-medium mb-2">
                  Repository Monitoring
                </h4>
                <div className="space-y-2">
                  {[
                    {
                      name: "Global-Schema",
                      status: "Up to date",
                      time: "12m ago",
                    },
                    { name: "PRM", status: "Up to date", time: "34m ago" },
                    { name: "Sales", status: "Indexing", time: "In progress" },
                    {
                      name: "Global Core",
                      status: "Up to date",
                      time: "1h ago",
                    },
                    {
                      name: "Sirion-Schema",
                      status: "Up to date",
                      time: "2h ago",
                    },
                  ].map((repo, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center space-x-2">
                        <Github className="w-4 h-4 text-gray-400" />
                        <span className="text-white">{repo.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-xs ${repo.status === "Indexing" ? "text-amber-400" : "text-green-400"}`}
                        >
                          {repo.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {repo.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ),
        },
      ],
    },
    {
      title: "Advanced User Experience",
      description:
        "Rich interactive interface with modern features for effective collaboration",
      icon: Zap,
      color: "bg-purple-500/10",
      highlight: "border-purple-500/40",
      textHighlight: "text-purple-400",
      items: [
        {
          title: "Rich Chat Interface",
          description: "Modern NextJS, Tailwind CSS and ShadCN UI components",
        },
        {
          title: "Conversation Management",
          description:
            "Continue previous conversations with full context preservation",
        },
        {
          title: "Export Capabilities",
          description: "Export chat to PNG to share with colleagues",
        },
        {
          title: "Advanced Feedback Mechanism",
          description:
            "Detailed feedback system for improving agent performance",
        },
      ],
      demos: [
        {
          id: "chat-ui",
          label: "Interface",
          type: "content",
          title: "Modern Chat Interface",
          description:
            "Intuitive and responsive design for developer productivity",
          content: (
            <div className="space-y-4">
              <div className="bg-gray-900/70 p-4 rounded-lg border border-gray-800">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="p-2 rounded-full bg-purple-500/20 border border-purple-500/40">
                    <Bot className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h5 className="text-white font-medium">ISC-CodeConnect</h5>
                    <p className="text-xs text-gray-400">
                      IBM & Github SSO enabled
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
                      <RefreshCcw className="w-4 h-4 text-gray-400" />
                    </button>
                    <button className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
                      <Share2 className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex space-x-3">
                    <div className="p-2 rounded-full bg-blue-500/20 flex-shrink-0">
                      <MessageSquare className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="bg-gray-800 p-3 rounded-lg text-sm text-white max-w-[80%]">
                      Generate an Apex class that handles account merging with
                      proper error handling.
                    </div>
                  </div>
                  <div className="flex space-x-3 justify-end">
                    <div className="bg-purple-500/20 p-3 rounded-lg text-sm text-white max-w-[80%] border border-purple-500/40">
                      I&apos;ll create an AccountMergeService class that follows
                      ISC patterns. Here&apos;s the implementation...
                    </div>
                    <div className="p-2 rounded-full bg-purple-500/20 flex-shrink-0 border border-purple-500/40">
                      <Bot className="w-4 h-4 text-purple-400" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-900/70 p-4 rounded-lg border border-gray-800">
                  <div className="flex items-center space-x-2 mb-3">
                    <Share2 className="w-4 h-4 text-purple-400" />
                    <h5 className="text-white font-medium">Export Options</h5>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2 text-gray-300">
                      <CheckCircle className="w-4 h-4 text-purple-400" />
                      <span>PNG Export</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-300">
                      <CheckCircle className="w-4 h-4 text-purple-400" />
                      <span>Conversation History</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-900/70 p-4 rounded-lg border border-gray-800">
                  <div className="flex items-center space-x-2 mb-3">
                    <RefreshCcw className="w-4 h-4 text-purple-400" />
                    <h5 className="text-white font-medium">Continuity</h5>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2 text-gray-300">
                      <CheckCircle className="w-4 h-4 text-purple-400" />
                      <span>Resume conversations</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-300">
                      <CheckCircle className="w-4 h-4 text-purple-400" />
                      <span>Context preservation</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ),
        },
        {
          id: "feedback",
          label: "Feedback",
          type: "content",
          title: "Advanced Feedback System",
          description: "Detailed feedback mechanism for continuous improvement",
          content: (
            <div className="bg-gray-900/70 p-5 rounded-lg border border-gray-800">
              <h4 className="text-white font-medium mb-4">
                Response Feedback Interface
              </h4>
              <div className="space-y-4">
                <div className="bg-gray-800 p-3 rounded-lg">
                  <h5 className="text-white text-sm font-medium mb-2">
                    How helpful was this response?
                  </h5>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        className="w-8 h-8 rounded-full flex items-center justify-center border border-gray-700 hover:bg-gray-700 transition-colors"
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-gray-800 p-3 rounded-lg">
                  <h5 className="text-white text-sm font-medium mb-2">
                    What aspects need improvement?
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Code quality",
                      "Relevance",
                      "Efficiency",
                      "Readability",
                      "Test coverage",
                    ].map((aspect) => (
                      <button
                        key={aspect}
                        className="px-3 py-1 rounded-full text-xs border border-gray-700 hover:bg-gray-700 transition-colors"
                      >
                        {aspect}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-gray-800 p-3 rounded-lg">
                  <h5 className="text-white text-sm font-medium mb-2">
                    Additional comments
                  </h5>
                  <textarea
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-white text-sm resize-none h-20"
                    placeholder="Share your detailed feedback..."
                  ></textarea>
                </div>
                <button className="w-full bg-purple-500/20 border border-purple-500/40 text-purple-400 py-2 rounded-lg hover:bg-purple-500/30 transition-colors text-sm font-medium">
                  Submit Feedback
                </button>
              </div>
            </div>
          ),
        },
      ],
    },
    {
      title: "Enterprise Security",
      description:
        "Robust security features with IBM and Github SSO integration",
      icon: Shield,
      color: "bg-teal-500/10",
      highlight: "border-teal-500/40",
      textHighlight: "text-teal-400",
      items: [
        {
          title: "Secure Authentication",
          description: "IBM and Github SSO integration for controlled access",
        },
        {
          title: "Data Privacy",
          description: "Secure handling of sensitive code and repository data",
        },
        {
          title: "Access Controls",
          description: "Role-based access to code repositories and features",
        },
        {
          title: "Encryption",
          description: "End-to-end encryption for all communications",
        },
      ],
      demos: [
        {
          id: "authentication",
          label: "Authentication",
          type: "content",
          title: "Secure Authentication Flow",
          description: "Multi-layer security with SSO integration",
          content: (
            <div className="space-y-4">
              <div className="bg-gray-900/70 p-4 rounded-lg border border-gray-800">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="p-2 rounded-lg bg-teal-500/20 border border-teal-500/40">
                    <Lock className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <h5 className="text-white font-medium">
                      SSO Authentication
                    </h5>
                    <p className="text-sm text-gray-400">
                      Secure login through IBM or Github credentials
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-gray-800 rounded-lg p-3 flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center text-blue-200 font-bold">
                      IBM
                    </div>
                    <span className="text-white">Sign in with IBM</span>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3 flex items-center space-x-3">
                    <Github className="w-6 h-6 text-white" />
                    <span className="text-white">Sign in with Github</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-900/70 p-4 rounded-lg border border-gray-800">
                  <h5 className="text-white font-medium mb-2">
                    Access Controls
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Role-based access</span>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">
                        Repository restrictions
                      </span>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Session management</span>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-900/70 p-4 rounded-lg border border-gray-800">
                  <h5 className="text-white font-medium mb-2">Data Security</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">
                        End-to-end encryption
                      </span>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Secure data storage</span>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Audit logging</span>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ),
        },
      ],
    },
    {
      title: "Advanced Testing Capabilities",
      description:
        "Comprehensive testing with mocking, stubbing and pattern-based test generation",
      icon: Blocks,
      color: "bg-red-500/10",
      highlight: "border-red-500/40",
      textHighlight: "text-red-400",
      items: [
        {
          title: "Advanced Mocking & Stubbing",
          description:
            "Intelligent test double generation for complex dependencies",
        },
        {
          title: "Pattern-Based Test Generation",
          description:
            "Creates tests based on identified patterns in your codebase",
        },
        {
          title: "Boundary Testing",
          description:
            "Automatic identification and testing of boundary conditions",
        },
        {
          title: "Integration Test Workflows",
          description: "Complex integration test scenarios with mock services",
        },
      ],
      demos: [
        {
          id: "testing-features",
          label: "Core Testing",
          type: "content",
          title: "Advanced Testing Features",
          description: "Key testing capabilities available in the platform",
          content: (
            <div className="space-y-4">
              <div className="bg-gray-900/70 p-4 rounded-lg border border-gray-800">
                <h4 className="text-white font-medium mb-3">
                  Testing Generation Features
                </h4>
                <div className="space-y-2">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h5 className="text-white text-sm font-medium">
                        Pattern-Based Test Creation
                      </h5>
                      <p className="text-xs text-gray-400">
                        Creates tests that match ISC testing patterns
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h5 className="text-white text-sm font-medium">
                        Bulk Testing Scenarios
                      </h5>
                      <p className="text-xs text-gray-400">
                        Automatic generation of tests that verify bulk
                        processing
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h5 className="text-white text-sm font-medium">
                        Edge Case Detection
                      </h5>
                      <p className="text-xs text-gray-400">
                        Identification and testing of boundary conditions
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ),
        },
        {
          id: "mocking",
          label: "Mocking",
          type: "content",
          title: "Advanced Mocking & Stubbing",
          description: "Powerful tools for isolating code during testing",
          content: (
            <div className="space-y-4">
              <div className="bg-gray-900/70 p-4 rounded-lg border border-gray-800">
                <h4 className="text-white font-medium mb-3">
                  Mocking Capabilities
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 bg-gray-800 rounded-lg">
                    <div className="text-red-400 text-sm font-medium">
                      HTTP Callout Mocks
                    </div>
                    <div className="text-xs text-gray-300">
                      Simulate external API responses
                    </div>
                  </div>
                  <div className="p-2 bg-gray-800 rounded-lg">
                    <div className="text-red-400 text-sm font-medium">
                      Database Mocks
                    </div>
                    <div className="text-xs text-gray-300">
                      Virtual database records
                    </div>
                  </div>
                  <div className="p-2 bg-gray-800 rounded-lg">
                    <div className="text-red-400 text-sm font-medium">
                      Dependency Injection
                    </div>
                    <div className="text-xs text-gray-300">
                      Interface-based mock substitution
                    </div>
                  </div>
                  <div className="p-2 bg-gray-800 rounded-lg">
                    <div className="text-red-400 text-sm font-medium">
                      Service Virtualization
                    </div>
                    <div className="text-xs text-gray-300">
                      Mock service implementations
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-900/70 p-4 rounded-lg border border-gray-800">
                <h4 className="text-white font-medium mb-3">
                  Testing Best Practices
                </h4>
                <div className="space-y-2">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span className="text-sm text-gray-300">
                      AAA pattern (Arrange-Act-Assert)
                    </span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span className="text-sm text-gray-300">
                      Single responsibility tests
                    </span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span className="text-sm text-gray-300">
                      Data isolation with @TestSetup
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ),
        },
      ],
    },
    {
      title: "Modern UI Component Support",
      description:
        "Generate and adapt modern Lightning Web Components with Carbon design system",
      icon: Cpu,
      color: "bg-cyan-500/10",
      highlight: "border-cyan-500/40",
      textHighlight: "text-cyan-400",
      items: [
        {
          title: "Carbon for Salesforce Components",
          description:
            "Integration with IBM Carbon design system components for Salesforce",
        },
        {
          title: "Pattern Library",
          description:
            "Implementation of standard UI patterns from Carbon design system",
        },
        {
          title: "Responsive Design",
          description: "Mobile-first approach with responsive layouts",
        },
        {
          title: "Accessibility Compliance",
          description: "Components follow WCAG accessibility guidelines",
        },
      ],
      demos: [
        {
          id: "carbon-ui",
          label: "Carbon Components",
          type: "content",
          title: "Carbon for Salesforce Components",
          description: "Integration with IBM Carbon design system",
          content: (
            <div className="space-y-4">
              <div className="bg-gray-900/70 p-4 rounded-lg border border-gray-800">
                <h4 className="text-white font-medium mb-3">
                  IBM Carbon Integration
                </h4>
                <p className="text-gray-300 text-sm mb-3">
                  ISC-CodeConnect generates Lightning Web Components that
                  seamlessly integrate with IBM&apos;s Carbon design system for
                  Salesforce, ensuring consistent UI experiences across IBM
                  applications.
                </p>

                <div className="bg-gray-800 p-3 rounded-lg mb-3">
                  <h5 className="text-cyan-400 text-sm font-medium mb-2">
                    Key Benefits
                  </h5>
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span className="text-gray-300">
                        Design consistency with IBM enterprise applications
                      </span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span className="text-gray-300">
                        Pre-built accessible components
                      </span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span className="text-gray-300">
                        Responsive design built-in
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          ),
        },
        {
          id: "patterns",
          label: "UI Patterns",
          type: "content",
          title: "UI Patterns",
          description: "Implementation of standard Carbon design patterns",
          content: (
            <div className="space-y-4">
              <div className="bg-gray-900/70 p-4 rounded-lg border border-gray-800">
                <h4 className="text-white font-medium mb-3">
                  Supported Carbon Patterns
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-800 p-3 rounded-lg">
                    <h5 className="text-white text-sm font-medium mb-1">
                      Data Tables
                    </h5>
                    <p className="text-xs text-gray-400">
                      Sortable, filterable data tables with batch actions
                    </p>
                  </div>
                  <div className="bg-gray-800 p-3 rounded-lg">
                    <h5 className="text-white text-sm font-medium mb-1">
                      Form Patterns
                    </h5>
                    <p className="text-xs text-gray-400">
                      Validated input fields with inline error states
                    </p>
                  </div>
                  <div className="bg-gray-800 p-3 rounded-lg">
                    <h5 className="text-white text-sm font-medium mb-1">
                      Modal Dialogs
                    </h5>
                    <p className="text-xs text-gray-400">
                      Accessible modal overlays for focused tasks
                    </p>
                  </div>
                  <div className="bg-gray-800 p-3 rounded-lg">
                    <h5 className="text-white text-sm font-medium mb-1">
                      Notifications
                    </h5>
                    <p className="text-xs text-gray-400">
                      Toast, inline, and modal notification patterns
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-900/70 p-4 rounded-lg border border-gray-800">
                <h4 className="text-white font-medium mb-3">
                  Design System Benefits
                </h4>
                <div className="space-y-2">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <div>
                      <h5 className="text-white text-sm font-medium">
                        Accessibility Compliance
                      </h5>
                      <p className="text-xs text-gray-400">
                        WCAG 2.1 AA compliant components
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <div>
                      <h5 className="text-white text-sm font-medium">
                        Responsive Design
                      </h5>
                      <p className="text-xs text-gray-400">
                        Mobile-first approach with adaptive layouts
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <div>
                      <h5 className="text-white text-sm font-medium">
                        Consistent Experience
                      </h5>
                      <p className="text-xs text-gray-400">
                        Unified look and feel across applications
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ),
        },
      ],
    },
  ];

  const renderFeatureCard = (feature: Feature, index: number) => {
    const isActive = activeFeature === index;
    const isHovered = hoveredFeature === index;

    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="w-full"
        onMouseEnter={() => setHoveredFeature(index)}
        onMouseLeave={() => setHoveredFeature(null)}
      >
        <Card
          className={`bg-gray-900/70 backdrop-blur-sm border transition-all duration-300 ${
            isActive || isHovered ? feature.highlight : "border-gray-800"
          }`}
        >
          <div
            onClick={() => handleFeatureClick(index)}
            className={`p-6 cursor-pointer transition-all duration-300 ${feature.color}`}
          >
            <div className="flex items-center space-x-4">
              <div
                className={`p-3 rounded-lg bg-gray-900/50 border ${feature.highlight}`}
              >
                <feature.icon className={`w-6 h-6 ${feature.textHighlight}`} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-400 mt-1">{feature.description}</p>
              </div>
              <motion.div
                animate={{ rotate: isActive ? 90 : 0 }}
                transition={{ duration: 0.3 }}
                className={`p-2 rounded-full ${feature.color} ${isActive ? feature.highlight : ""}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={feature.textHighlight}
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </motion.div>
            </div>
          </div>

          {isActive && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    {feature.items.map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-start space-x-3"
                      >
                        <div
                          className={`p-1 rounded-full ${feature.color} ${feature.highlight}`}
                        >
                          <CheckCircle
                            className={`w-4 h-4 ${feature.textHighlight}`}
                          />
                        </div>
                        <div>
                          <h4 className="text-white font-medium">
                            {item.title}
                          </h4>
                          <p className="text-gray-400 text-sm">
                            {item.description}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {feature.demos && (
                    <div className="space-y-4">
                      <Tabs
                        defaultValue={feature.demos[0].id}
                        className="w-full"
                      >
                        <TabsList className="grid grid-cols-3 bg-gray-900/50 mb-3">
                          {feature.demos.map((demo) => (
                            <TabsTrigger
                              key={demo.id}
                              value={demo.id}
                              className="data-[state=active]:bg-gray-800"
                            >
                              {demo.label}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                        {feature.demos.map((demo) => (
                          <TabsContent
                            key={demo.id}
                            value={demo.id}
                            className="mt-0"
                          >
                            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
                              <h4 className="text-white font-medium mb-1">
                                {demo.title}
                              </h4>
                              <p className="text-gray-400 text-sm mb-4">
                                {demo.description}
                              </p>
                              {demo.content}
                            </div>
                          </TabsContent>
                        ))}
                      </Tabs>
                    </div>
                  )}
                </div>
              </CardContent>
            </motion.div>
          )}
        </Card>
      </motion.div>
    );
  };

  return (
    <BackgroundGradientAnimation>
      <Navbar session={null} />
      <div className="min-h-screen bg-black bg-opacity-90">
        <div className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto mb-16"
          >
            <h1 className="text-5xl font-bold text-white mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                ISC-CodeConnect
              </span>
            </h1>
            <p className="text-xl text-gray-400">
              AI-powered Salesforce development assistant with advanced features
            </p>
          </motion.div>

          <div className="space-y-6">
            {features.map((feature, index) =>
              renderFeatureCard(feature, index)
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-16 space-y-8"
          >
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to Transform Your Salesforce Development?
              </h2>
              <p className="text-gray-400 mb-8">
                Experience the power of AI-assisted development with
                ISC-CodeConnect.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <Button
                onClick={() => router.push("/chat")}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg text-lg hover:opacity-90 transition-opacity"
              >
                Try It Now
              </Button>
              <Button
                onClick={() => router.push("/docs")}
                variant="outline"
                className="border-gray-700 text-white px-8 py-3 rounded-lg text-lg hover:bg-gray-800 transition-colors"
              >
                View Documentation
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </BackgroundGradientAnimation>
  );
};

export default Features;
