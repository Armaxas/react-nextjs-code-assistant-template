"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Code2,
  Blocks,
  TestTube2,
  GitBranch,
  MessageSquare,
  Database,
  Workflow,
  Bot,
  BrainCircuit,
  ChevronRight,
  BookOpen,
  Layout,
  Server,
  Shield,
  Zap,
  RefreshCcw,
  FileCode,
  Fingerprint,
} from "lucide-react";

// Types
interface DocSectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

interface CodeExampleProps {
  title: string;
  description: string;
  code: string;
  language?: string;
}

interface APIEndpointProps {
  method: "GET" | "POST" | "PUT" | "DELETE";
  endpoint: string;
  description: string;
  parameters?: Array<{ name: string; description: string }>;
}

interface NavigationSection {
  id: string;
  icon: React.ElementType;
  title: string;
  subsections: string[];
}

// Navigation Configuration
const navigationSections: NavigationSection[] = [
  {
    id: "overview",
    icon: BookOpen,
    title: "Overview",
    subsections: ["introduction", "features", "getting-started"],
  },
  {
    id: "architecture",
    icon: Workflow,
    title: "Architecture",
    subsections: [
      "multi-agent-system",
      "vector-store",
      "langchain-integration",
    ],
  },
  {
    id: "frontend",
    icon: Layout,
    title: "Frontend",
    subsections: ["components", "state-management", "routing"],
  },
  {
    id: "backend",
    icon: Server,
    title: "Backend",
    subsections: ["api-endpoints", "error-handling", "middleware"],
  },
  {
    id: "agents",
    icon: Bot,
    title: "AI Agents",
    subsections: [
      "chat-handler",
      "code-generator",
      "test-generator",
      "retrieval-system",
    ],
  },
  {
    id: "security",
    icon: Shield,
    title: "Security",
    subsections: ["authentication", "data-protection", "compliance"],
  },
  {
    id: "performance",
    icon: Zap,
    title: "Performance",
    subsections: ["optimization", "caching", "monitoring"],
  },
  {
    id: "examples",
    icon: Code2,
    title: "Examples",
    subsections: ["apex-examples", "lwc-examples", "test-examples"],
  },
];

// Component Definitions
const DocSection: React.FC<DocSectionProps> = ({
  title,
  icon: Icon,
  children,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <Card className="w-full mb-8 overflow-hidden bg-black/40 backdrop-blur-lg border border-gray-800 group hover:border-gray-700 transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 group-hover:from-blue-400 group-hover:to-purple-400 transition-all duration-300">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            {title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-6 prose prose-invert max-w-none">
        {children}
      </CardContent>
    </Card>
  </motion.div>
);

const CodeExample: React.FC<CodeExampleProps> = ({
  title,
  description,
  code,
  language = "typescript",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="bg-black/30 border-gray-800 mb-4 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-500/5 to-purple-500/5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {isExpanded ? "Show Less" : "Show More"}
          </button>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <motion.div
        initial={false}
        animate={{ height: isExpanded ? "auto" : "200px" }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden"
      >
        <CardContent className="p-4">
          <div className="bg-black/50 rounded-lg p-4 font-mono text-sm">
            <pre className={`language-${language}`}>{code}</pre>
          </div>
          {!isExpanded && (
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/80 to-transparent" />
          )}
        </CardContent>
      </motion.div>
    </Card>
  );
};

const APIEndpoint: React.FC<APIEndpointProps> = ({
  method,
  endpoint,
  description,
  parameters = [],
}) => (
  <Card className="bg-black/30 border-gray-800 mb-4">
    <CardHeader className="flex flex-row items-center space-x-4 bg-gradient-to-r from-blue-500/5 to-purple-500/5">
      <span
        className={`px-2 py-1 rounded text-sm font-mono
        ${method === "GET" ? "bg-green-500/20 text-green-400" : ""}
        ${method === "POST" ? "bg-blue-500/20 text-blue-400" : ""}
        ${method === "PUT" ? "bg-yellow-500/20 text-yellow-400" : ""}
        ${method === "DELETE" ? "bg-red-500/20 text-red-400" : ""}`}
      >
        {method}
      </span>
      <code className="text-gray-300">{endpoint}</code>
    </CardHeader>
    <CardContent className="space-y-4">
      <p className="text-gray-400">{description}</p>
      {parameters.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-2">
            Parameters:
          </h4>
          <div className="bg-black/50 rounded-lg p-4">
            {parameters.map((param, index) => (
              <div key={index} className="mb-2 last:mb-0">
                <code className="text-blue-400">{param.name}</code>
                <span className="text-gray-400 mx-2">-</span>
                <span className="text-gray-300">{param.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </CardContent>
  </Card>
);

// Quick Navigation Component
const QuickNav: React.FC<{
  activeTab: string;
  setActiveTab: (tab: string) => void;
}> = ({ activeTab, setActiveTab }) => {
  const [visibleSection, setVisibleSection] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSection(entry.target.id);
          }
        });
      },
      { threshold: 0.5 }
    );

    navigationSections.forEach((section) => {
      section.subsections.forEach((subsection) => {
        const element = document.getElementById(subsection);
        if (element) observer.observe(element);
      });
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="sticky top-24">
      <Card className="bg-black/30 border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg">Quick Navigation</CardTitle>
        </CardHeader>
        <CardContent>
          <nav className="space-y-1">
            {navigationSections.map((section) => (
              <div key={section.id} className="space-y-1">
                <button
                  onClick={() => setActiveTab(section.id)}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-all duration-200 flex items-center ${
                    activeTab === section.id
                      ? "bg-blue-500/20 text-blue-400"
                      : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                  }`}
                >
                  <section.icon className="w-4 h-4 mr-2" />
                  <span>{section.title}</span>
                  <ChevronRight
                    className={`ml-auto w-4 h-4 transition-transform ${
                      activeTab === section.id ? "rotate-90" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {activeTab === section.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="ml-6 space-y-1"
                    >
                      {section.subsections.map((subsection) => (
                        <button
                          key={subsection}
                          onClick={() => {
                            const element = document.getElementById(subsection);
                            element?.scrollIntoView({ behavior: "smooth" });
                          }}
                          className={`w-full text-left px-4 py-1.5 rounded-lg text-sm transition-all duration-200 flex items-center ${
                            visibleSection === subsection
                              ? "text-blue-400"
                              : "text-gray-500 hover:text-gray-300"
                          }`}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-current mr-2" />
                          {subsection
                            .split("-")
                            .map(
                              (word) =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                            )
                            .join(" ")}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </nav>
        </CardContent>
      </Card>
    </div>
  );
};

// Main Documentation Component
const Documentation: React.FC = () => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-purple-500/10 to-transparent h-96 pointer-events-none" />

        <div className="container mx-auto px-4 pt-20 pb-32 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-7xl mx-auto"
          >
            {/* Header */}
            <div className="text-center mb-12">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400 mb-4"
              >
                ISC-CodeConnect Documentation
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl text-gray-400 max-w-3xl mx-auto"
              >
                Your comprehensive guide to building powerful Salesforce
                applications with AI-powered assistance
              </motion.p>
            </div>

            {/* Main Navigation Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="w-full flex flex-wrap justify-center gap-2 bg-transparent mb-8">
                {navigationSections.map((section) => (
                  <TabsTrigger
                    key={section.id}
                    value={section.id}
                    className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500"
                  >
                    <section.icon className="w-4 h-4" />
                    <span>{section.title}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Content Grid with Quick Navigation */}
              <div className="grid grid-cols-12 gap-8">
                <div className="col-span-12 xl:col-span-9">
                  {/* Tab Content will go here */}
                  {/* Insert the TabsContent components from previous responses */}
                  <TabsContent value="overview">
                    <DocSection title="System Overview" icon={BrainCircuit}>
                      <div id="introduction" className="mb-12">
                        <h3 className="text-xl font-semibold mb-4 text-white">
                          Introduction
                        </h3>
                        <p className="mb-6 text-gray-300">
                          ISC-CodeConnect is an advanced AI-powered assistant
                          that combines LangGraph-based multi-agent architecture
                          with sophisticated RAG capabilities for Salesforce
                          development. The system uses specialized agents to
                          handle different aspects of development, from code
                          generation to testing and documentation.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                          <Card className="bg-black/20 border-gray-800">
                            <CardHeader>
                              <div className="flex items-center space-x-2">
                                <BrainCircuit className="w-5 h-5 text-blue-400" />
                                <CardTitle className="text-lg">
                                  Intelligent Processing
                                </CardTitle>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-2 text-gray-300">
                                <li>Context-aware query processing</li>
                                <li>Smart follow-up handling</li>
                                <li>Code understanding and explanation</li>
                                <li>Multi-agent coordination</li>
                              </ul>
                            </CardContent>
                          </Card>

                          <Card className="bg-black/20 border-gray-800">
                            <CardHeader>
                              <div className="flex items-center space-x-2">
                                <Database className="w-5 h-5 text-purple-400" />
                                <CardTitle className="text-lg">
                                  Knowledge Base
                                </CardTitle>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-2 text-gray-300">
                                <li>Advanced vector embeddings</li>
                                <li>Code pattern storage</li>
                                <li>Contextual retrieval</li>
                                <li>Dynamic updates</li>
                              </ul>
                            </CardContent>
                          </Card>
                        </div>
                      </div>

                      <div id="features" className="mb-12">
                        <h3 className="text-xl font-semibold mb-4 text-white">
                          Key Features
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                          <Card className="bg-black/20 border-gray-800">
                            <CardHeader>
                              <div className="flex items-center space-x-2">
                                <Code2 className="w-5 h-5 text-blue-400" />
                                <CardTitle className="text-lg">
                                  Intelligent Code Generation
                                </CardTitle>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-2 text-gray-300">
                                <li>
                                  Production-ready Apex code with best practices
                                </li>
                                <li>Modern Lightning Web Components</li>
                                <li>Automated test class generation</li>
                                <li>Context-aware code modifications</li>
                              </ul>
                            </CardContent>
                          </Card>

                          <Card className="bg-black/20 border-gray-800">
                            <CardHeader>
                              <div className="flex items-center space-x-2">
                                <BrainCircuit className="w-5 h-5 text-purple-400" />
                                <CardTitle className="text-lg">
                                  Multi-Agent Architecture
                                </CardTitle>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-2 text-gray-300">
                                <li>Specialized agents for different tasks</li>
                                <li>Advanced query analysis and routing</li>
                                <li>Context-aware processing</li>
                                <li>Parallel execution capabilities</li>
                              </ul>
                            </CardContent>
                          </Card>

                          <Card className="bg-black/20 border-gray-800">
                            <CardHeader>
                              <div className="flex items-center space-x-2">
                                <Database className="w-5 h-5 text-emerald-400" />
                                <CardTitle className="text-lg">
                                  Advanced RAG System
                                </CardTitle>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-2 text-gray-300">
                                <li>Multiple vector collections for code</li>
                                <li>Context-enhanced embeddings</li>
                                <li>Intelligent pattern matching</li>
                                <li>Dynamic retrieval optimization</li>
                              </ul>
                            </CardContent>
                          </Card>

                          <Card className="bg-black/20 border-gray-800">
                            <CardHeader>
                              <div className="flex items-center space-x-2">
                                <TestTube2 className="w-5 h-5 text-yellow-400" />
                                <CardTitle className="text-lg">
                                  Comprehensive Testing
                                </CardTitle>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-2 text-gray-300">
                                <li>Automated test case generation</li>
                                <li>High code coverage strategies</li>
                                <li>Edge case handling</li>
                                <li>Jest tests for LWC components</li>
                              </ul>
                            </CardContent>
                          </Card>

                          <Card className="bg-black/20 border-gray-800">
                            <CardHeader>
                              <div className="flex items-center space-x-2">
                                <MessageSquare className="w-5 h-5 text-pink-400" />
                                <CardTitle className="text-lg">
                                  Natural Interaction
                                </CardTitle>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-2 text-gray-300">
                                <li>Natural language query understanding</li>
                                <li>Context-aware conversations</li>
                                <li>Intelligent follow-up handling</li>
                                <li>Detailed explanations and guidance</li>
                              </ul>
                            </CardContent>
                          </Card>

                          <Card className="bg-black/20 border-gray-800">
                            <CardHeader>
                              <div className="flex items-center space-x-2">
                                <Zap className="w-5 h-5 text-orange-400" />
                                <CardTitle className="text-lg">
                                  Performance & Security
                                </CardTitle>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-2 text-gray-300">
                                <li>Optimized response generation</li>
                                <li>Secure code handling</li>
                                <li>Parallel processing capabilities</li>
                                <li>Resource optimization</li>
                              </ul>
                            </CardContent>
                          </Card>
                        </div>

                        <CodeExample
                          title="Feature Example: Code Generation"
                          description="Example of generating an Apex class with best practices"
                          language="apex"
                          code={`// Example of generated Apex class with best practices
public with sharing class AccountService {
    /**
     * Creates a new account with duplicate checking
     * @param account The account to create
     * @return The created account with additional details
     * @throws AuraHandledException if duplicate found
     */
    @AuraEnabled
    public static Account createAccount(Account account) {
        try {
            // Check for duplicates
            List<Account> duplicates = [
                SELECT Id, Name 
                FROM Account 
                WHERE Name = :account.Name
                LIMIT 1
            ];
            
            if (!duplicates.isEmpty()) {
                throw new AuraHandledException(
                    'Account with this name already exists.'
                );
            }
            
            // Insert with sharing rules
            insert account;
            
            // Return with additional details
            return [
                SELECT Id, Name, CreatedDate, 
                       CreatedBy.Name, LastModifiedDate
                FROM Account
                WHERE Id = :account.Id
            ];
            
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}`}
                        />
                        <div className="space-y-6">
                          <CodeExample
                            title="Intelligent Chat Analysis"
                            description="Example of how the system analyzes and categorizes queries"
                            language="typescript"
                            code={`// Query Analysis Example
                  const chatAnalysis = {
                    "query_type": "technical",
                    "chat_category": null,
                    "requires_history": true,
                    "requires_retrieval": true,
                    "context_relevance_score": 0.85,
                    "answer_in_history": false,
                    "relevant_history_indices": [1, 2]
                  }`}
                          />

                          <CodeExample
                            title="Code Generation Capabilities"
                            description="Example of generated Apex code with best practices"
                            language="apex"
                            code={`public with sharing class AccountController {
                      @AuraEnabled
                      public static Account createAccount(Account newAccount) {
                          try {
                              // Duplicate check implementation
                              List<Account> duplicates = [
                                  SELECT Id, Name 
                                  FROM Account 
                                  WHERE Name = :newAccount.Name
                                  LIMIT 1
                              ];
                              
                              if (!duplicates.isEmpty()) {
                                  throw new AuraHandledException(
                                      'Account with this name already exists.'
                                  );
                              }
                              
                              // Insert with sharing rules
                              insert newAccount;
                              return newAccount;
                              
                          } catch (Exception e) {
                              throw new AuraHandledException(e.getMessage());
                          }
                      }
                  }`}
                          />
                        </div>
                      </div>

                      <div id="getting-started" className="mb-12">
                        <h3 className="text-xl font-semibold mb-4 text-white">
                          Getting Started
                        </h3>

                        <CodeExample
                          title="Basic Usage"
                          description="Example of interacting with ISC-CodeConnect"
                          language="typescript"
                          code={`// Example 1: Generate an Apex class
                  "Create an Apex controller for handling account creation with duplicate checking"
                  
                  // Example 2: Create LWC component
                  "Generate a Lightning Web Component for displaying account details"
                  
                  // Example 3: Generate test classes
                  "Create test coverage for the AccountController class"
                  
                  // Example 4: Code explanation
                  "Explain how the duplicate checking works in this code"`}
                        />
                      </div>
                    </DocSection>
                  </TabsContent>

                  {/* Architecture Tab Content */}
                  <TabsContent value="architecture">
                    <DocSection title="System Architecture" icon={Workflow}>
                      <div id="multi-agent-system" className="mb-12">
                        <h3 className="text-xl font-semibold mb-4 text-white">
                          Multi-Agent System
                        </h3>

                        <p className="mb-6 text-gray-300">
                          The system employs a sophisticated LangGraph-based
                          architecture where specialized agents handle different
                          aspects of the development process. These agents
                          coordinate through a central router to provide
                          comprehensive assistance.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                          <Card className="bg-black/20 border-gray-800">
                            <CardHeader>
                              <div className="flex items-center space-x-2">
                                <MessageSquare className="w-5 h-5 text-blue-400" />
                                <CardTitle className="text-lg">
                                  Chat & Analysis Agents
                                </CardTitle>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <CodeExample
                                title="Chat Analysis"
                                description="Analysis of chat queries and their handling"
                                language="typescript"
                                code={`async function analyzeChat(query: string) {
                    const analysis = await analyze_chat_query(query);
                    return {
                      isChat: analysis.query_type === "chat",
                      requiresHistory: analysis.requires_history,
                      contextScore: analysis.context_relevance_score
                    };
                  }`}
                              />
                            </CardContent>
                          </Card>

                          <Card className="bg-black/20 border-gray-800">
                            <CardHeader>
                              <div className="flex items-center space-x-2">
                                <GitBranch className="w-5 h-5 text-purple-400" />
                                <CardTitle className="text-lg">
                                  Router Agent
                                </CardTitle>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <CodeExample
                                title="Query Routing"
                                description="Routing of query"
                                language="typescript"
                                code={`function routeQuery(state: AgentState) {
                    const analysis = state.analysis;
                    
                    if (analysis.query_type === "chat") {
                      return "chat_handler";
                    } else if (analysis.requires_retrieval) {
                      return "retrieval_agent";
                    }
                    return "code_generator";
                  }`}
                              />
                            </CardContent>
                          </Card>
                        </div>
                      </div>

                      <div id="vector-store" className="mb-12">
                        <h3 className="text-xl font-semibold mb-4 text-white">
                          Vector Store System
                        </h3>

                        <p className="mb-6 text-gray-300">
                          The vector store system maintains specialized
                          collections for different types of code, enabling
                          efficient retrieval of relevant patterns and examples.
                        </p>

                        <Card className="bg-black/20 border-gray-800 mb-8">
                          <CardHeader>
                            <CardTitle className="text-lg">
                              Collections Overview
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-4 text-gray-300">
                              <li className="flex items-start space-x-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2" />
                                <div>
                                  <strong className="text-white">
                                    apex_code:
                                  </strong>{" "}
                                  Stores Apex class implementations with rich
                                  context about functionality and patterns
                                </div>
                              </li>
                              <li className="flex items-start space-x-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2" />
                                <div>
                                  <strong className="text-white">
                                    apex_test_code:
                                  </strong>{" "}
                                  Contains test classes with coverage patterns
                                  and assertions
                                </div>
                              </li>
                              <li className="flex items-start space-x-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2" />
                                <div>
                                  <strong className="text-white">
                                    lwc_js_code:
                                  </strong>{" "}
                                  JavaScript controllers for Lightning Web
                                  Components
                                </div>
                              </li>
                              <li className="flex items-start space-x-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2" />
                                <div>
                                  <strong className="text-white">
                                    lwc_html_code:
                                  </strong>{" "}
                                  HTML templates with component structure
                                  information
                                </div>
                              </li>
                              <li className="flex items-start space-x-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2" />
                                <div>
                                  <strong className="text-white">
                                    lwc_test_code:
                                  </strong>{" "}
                                  Jest test implementations for LWC components
                                </div>
                              </li>
                            </ul>
                          </CardContent>
                        </Card>

                        <CodeExample
                          title="Vector Store Interaction"
                          description="Example of how the system interacts with vector stores"
                          language="typescript"
                          code={`class CodeRetrieverFactory {
                    constructor(persist_directory: string) {
                      this.stores = {
                        "apex_code": Chroma(
                          persist_directory=persist_directory,
                          embedding_function=embeddings,
                          collection_name="apex_code"
                        ),
                        "apex_test_code": Chroma(
                          persist_directory=persist_directory,
                          embedding_function=embeddings,
                          collection_name="apex_test_code"
                        ),
                        // Additional stores...
                      };
                    }
                  
                    // Get appropriate retriever based on collection type
                    getRetriever(collection_name: string) {
                      return this.stores[collection_name].as_retriever(
                        search_type="mmr",
                        search_kwargs: { "k": sys.maxsize }
                      );
                    }
                  }`}
                        />
                      </div>

                      <div id="langchain-integration" className="mb-12">
                        <h3 className="text-xl font-semibold mb-4 text-white">
                          LangChain Integration
                        </h3>

                        <p className="mb-6 text-gray-300">
                          The system leverages LangChain for sophisticated
                          language model interactions and vector store
                          management.
                        </p>

                        <CodeExample
                          title="LangChain Setup"
                          description="Example of LangChain integration"
                          language="typescript"
                          code={`// LLM Provider setup with LangChain
                  class LLMProvider {
                    private _initialize() {
                      const credentials = Credentials({
                        api_key: settings.WATSONX_API_KEY,
                        api_endpoint: settings.BAM_API_ENDPOINT
                      });
                      
                      this._client = Client(credentials);
                      
                      this._llm = LangChainChatInterface(
                        client=this._client,
                        **settings.get_llm_config()
                      );
                      
                      this._embeddings = LangChainEmbeddingsInterface(
                        client=embeddings_client,
                        **settings.get_embeddings_config()
                      );
                    }
                  }`}
                        />
                      </div>
                    </DocSection>
                  </TabsContent>

                  {/* Backend Tab Content */}
                  <TabsContent value="backend">
                    <DocSection title="Backend Systems" icon={Server}>
                      <div id="api-endpoints" className="mb-12">
                        <h3 className="text-xl font-semibold mb-4 text-white">
                          API Endpoints
                        </h3>

                        <div className="space-y-6">
                          <APIEndpoint
                            method="GET"
                            endpoint="/api/health"
                            description="Check system health and assistant initialization status"
                            parameters={[]}
                          />

                          <APIEndpoint
                            method="POST"
                            endpoint="/api/query"
                            description="Process a new query through the multi-agent system with comprehensive response"
                            parameters={[
                              {
                                name: "query",
                                description: "The user's input query",
                              },
                              {
                                name: "context",
                                description:
                                  "Additional context for query processing",
                              },
                              {
                                name: "thread_id",
                                description: "Conversation thread identifier",
                              },
                            ]}
                          />

                          <CodeExample
                            title="Query Response Structure"
                            description="Example of the query endpoint response format"
                            language="typescript"
                            code={`// Response Interface
                  interface QueryResponse {
                    response: string;
                    metrics: {
                      processing_time: number;
                      tokens_used: number;
                      cache_hits: number;
                      retrieval_count: number;
                    };
                    generated_code?: {
                      apex?: string;
                      test?: string;
                      lwc?: {
                        js?: string;
                        html?: string;
                        test?: string;
                      };
                    };
                  }`}
                          />

                          <APIEndpoint
                            method="POST"
                            endpoint="/api/chat/reset"
                            description="Reset chat state and generate new thread ID"
                            parameters={[
                              {
                                name: "thread_id",
                                description: "Current conversation thread ID",
                              },
                            ]}
                          />

                          <APIEndpoint
                            method="POST"
                            endpoint="/api/chat/new"
                            description="Initialize a new chat session with fresh context"
                            parameters={[]}
                          />
                        </div>
                      </div>

                      <div id="error-handling" className="mb-12">
                        <h3 className="text-xl font-semibold mb-4 text-white">
                          Error Handling
                        </h3>

                        <CodeExample
                          title="Error Handler Implementation"
                          description="Error handling system with graceful degradation"
                          language="typescript"
                          code={`async function handleError(state: AgentState): Promise<Dict> {
                    try {
                      const error_state = state.get("error_state", {});
                      const error_location = error_state.get("location", "unknown");
                      const error_message = error_state.get("message", "An unknown error occurred");
                  
                      // Generate user-friendly error message
                      const response = \`I encountered an error while processing your query:
                  
                  Location: \${error_location}
                  Details: \${error_message}
                  
                  Would you please:
                  1. Check if the query is clear and well-formed
                  2. Ensure any referenced component names are correct
                  3. Try rephrasing the query if it's complex\`;
                  
                      // Log error details
                      log_agent_step(
                        "Error Handler",
                        \`Error processed - Location: \${error_location}, Message: \${error_message}\`
                      );
                  
                      return { "final_response": response, "current_agent": "end" };
                    } catch (e) {
                      // Fallback error handling
                      log_agent_step("Error Handler", \`Error in error handler: \${str(e)}\`);
                      return {
                        "final_response": "A critical error occurred. Please try your query again.",
                        "current_agent": "end"
                      };
                    }
                  }`}
                        />
                      </div>

                      <div id="middleware" className="mb-12">
                        <h3 className="text-xl font-semibold mb-4 text-white">
                          Middleware Configuration
                        </h3>

                        <CodeExample
                          title="CORS and API Middleware"
                          description="API middleware configuration for security and routing"
                          language="typescript"
                          code={`// CORS configuration
                  app.add_middleware(
                      CORSMiddleware,
                      allow_origins=[get_frontend_url()],
                      allow_credentials=True,
                      allow_methods=["*"],
                      allow_headers=["*"],
                      expose_headers=["*"],
                  )
                  
                  // Function to get frontend URL
                  def get_frontend_url():
                      try:
                          with open(".env", "r") as f:
                              for line in f:
                                  if line.startswith("FRONTEND_PORT="):
                                      port = line.split("=")[1].strip()
                                      if port:
                                          return f"http://localhost:{port}"
                      except Exception as e:
                          logger.warning(f"Error reading .env file: {e}")
                      
                      frontend_port = os.environ.get("FRONTEND_PORT", "3000")
                      return f"http://localhost:{frontend_port}"`}
                        />
                      </div>
                    </DocSection>
                  </TabsContent>

                  {/* Frontend Tab Content */}
                  <TabsContent value="frontend">
                    <DocSection title="Frontend Implementation" icon={Layout}>
                      <div id="components" className="mb-12">
                        <h3 className="text-xl font-semibold mb-4 text-white">
                          Component Architecture
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                          <Card className="bg-black/20 border-gray-800">
                            <CardHeader>
                              <div className="flex items-center space-x-2">
                                <Layout className="w-5 h-5 text-blue-400" />
                                <CardTitle className="text-lg">
                                  Core Components
                                </CardTitle>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-2 text-gray-300">
                                <li>Interactive chat interface</li>
                                <li>Code editor with syntax highlighting</li>
                                <li>Real-time response streaming</li>
                                <li>Dynamic documentation system</li>
                              </ul>
                            </CardContent>
                          </Card>

                          <Card className="bg-black/20 border-gray-800">
                            <CardHeader>
                              <div className="flex items-center space-x-2">
                                <Blocks className="w-5 h-5 text-purple-400" />
                                <CardTitle className="text-lg">
                                  UI Components
                                </CardTitle>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-2 text-gray-300">
                                <li>ShadcnUI integration</li>
                                <li>Tailwind styling</li>
                                <li>Framer Motion animations</li>
                                <li>Responsive design system</li>
                              </ul>
                            </CardContent>
                          </Card>
                        </div>

                        <CodeExample
                          title="Chat Component Implementation"
                          description="Example of the chat interface implementation"
                          language="typescript"
                          code={`"use client";
                  
                  import React, { useState, useEffect, useRef } from "react";
                  import { motion, AnimatePresence } from "framer-motion";
                  import { Message } from "@/types/chat";
                  import { Button } from "@/components/ui/button";
                  import { Textarea } from "@/components/ui/textarea";
                  import { Send, Bot } from "lucide-react";
                  
                  export const ChatInterface: React.FC = () => {
                    const [messages, setMessages] = useState<Message[]>([]);
                    const [input, setInput] = useState("");
                    const messagesEndRef = useRef<HTMLDivElement>(null);
                  
                    const scrollToBottom = () => {
                      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
                    };
                  
                    useEffect(() => {
                      scrollToBottom();
                    }, [messages]);
                  
                    const handleSubmit = async (e: React.FormEvent) => {
                      e.preventDefault();
                      if (!input.trim()) return;
                  
                      const newMessage: Message = {
                        role: "user",
                        content: input,
                        timestamp: new Date().toISOString(),
                      };
                  
                      setMessages((prev) => [...prev, newMessage]);
                      setInput("");
                  
                      // API call implementation...
                    };
                  
                    return (
                      <div className="flex flex-col h-full">
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                          <AnimatePresence>
                            {messages.map((message, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className={\`flex \${
                                  message.role === "user" ? "justify-end" : "justify-start"
                                }\`}
                              >
                                {/* Message content */}
                              </motion.div>
                            ))}
                          </AnimatePresence>
                          <div ref={messagesEndRef} />
                        </div>
                  
                        <form onSubmit={handleSubmit} className="p-4 border-t">
                          <div className="flex space-x-2">
                            <Textarea
                              value={input}
                              onChange={(e) => setInput(e.target.value)}
                              placeholder="Type your message..."
                              className="flex-1"
                            />
                            <Button type="submit">
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>
                        </form>
                      </div>
                    );
                  };`}
                        />
                      </div>

                      <div id="state-management" className="mb-12">
                        <h3 className="text-xl font-semibold mb-4 text-white">
                          State Management
                        </h3>

                        <CodeExample
                          title="Chat State Hook"
                          description="Custom hook for managing chat state"
                          language="typescript"
                          code={`import { useState, useCallback } from 'react';
                  import { Message, ChatState } from '@/types/chat';
                  import { chatApi } from '@/lib/api';
                  
                  export const useChatState = () => {
                    const [messages, setMessages] = useState<Message[]>([]);
                    const [isLoading, setIsLoading] = useState(false);
                    const [error, setError] = useState<string | null>(null);
                  
                    const sendMessage = useCallback(async (content: string) => {
                      try {
                        setIsLoading(true);
                        setError(null);
                  
                        const response = await chatApi.sendQuery(content);
                        
                        setMessages(prev => [
                          ...prev,
                          { role: 'user', content },
                          { role: 'assistant', content: response.response }
                        ]);
                      } catch (e) {
                        setError(e.message);
                      } finally {
                        setIsLoading(false);
                      }
                    }, []);
                  
                    const resetChat = useCallback(async () => {
                      try {
                        await chatApi.resetChat();
                        setMessages([]);
                      } catch (e) {
                        setError(e.message);
                      }
                    }, []);
                  
                    return {
                      messages,
                      isLoading,
                      error,
                      sendMessage,
                      resetChat
                    };
                  };`}
                        />
                      </div>

                      <div id="routing" className="mb-12">
                        <h3 className="text-xl font-semibold mb-4 text-white">
                          Routing Configuration
                        </h3>

                        <CodeExample
                          title="Next.js App Router Configuration"
                          description="Route configuration for the application"
                          language="typescript"
                          code={`// app/layout.tsx
                  import { Inter } from "next/font/google";
                  import "./globals.css";
                  
                  const inter = Inter({ subsets: ["latin"] });
                  
                  export default function RootLayout({
                    children,
                  }: {
                    children: React.ReactNode;
                  }) {
                    return (
                      <html lang="en" className="dark">
                        <body className={\`\${inter.className} bg-background text-foreground antialiased\`}>
                          {children}
                        </body>
                      </html>
                    );
                  }
                  
                  // app/page.tsx
                  import { LandingPage } from "@/components/LandingPage";
                  
                  export default function Home() {
                    return <LandingPage />;
                  }
                  
                  // app/chat/page.tsx
                  import { ChatInterface } from "@/components/ChatInterface";
                  
                  export default function Chat() {
                    return <ChatInterface />;
                  }
                  
                  // app/docs/page.tsx
                  import { Documentation } from "@/components/Documentation";
                  
                  export default function Docs() {
                    return <Documentation />;
                  }`}
                        />
                      </div>
                    </DocSection>
                  </TabsContent>
                  {/* Agents Tab Content */}
                  <TabsContent value="agents">
                    <DocSection title="AI Agents System" icon={Bot}>
                      <div id="chat-handler" className="mb-12">
                        <h3 className="text-xl font-semibold mb-4 text-white">
                          Chat Handler
                        </h3>

                        <p className="mb-6 text-gray-300">
                          The chat handler agent analyzes queries, manages
                          conversation context, and determines the appropriate
                          processing path through the system.
                        </p>

                        <CodeExample
                          title="Chat Analysis Implementation"
                          description="Query analysis and categorization"
                          language="typescript"
                          code={`// Chat analysis prompt and implementation
const CHAT_ANALYZER_PROMPT = \`You are a chat analyzer for a Salesforce technical assistant. Analyze the given query.

IMPORTANT: You must ONLY return a single JSON object. No other text, no markdown, no explanations.

{
    "query_type": "chat" | "history_based" | "technical",
    "chat_category": "greeting" | "confirmation" | "clarification" | "farewell" | "other" | null,
    "requires_history": boolean,
    "requires_retrieval": boolean,
    "context_relevance_score": float,
    "answer_in_history": boolean,
    "relevant_history_indices": [int] | null
}\`;

async function analyze_chat_query(query: string, chat_history: list): Promise<Dict> {
    try {
        // Prepare chat history text
        const history_text = chat_history
            .slice(-6)
            .map((msg, i) => \`[\${i}] \${msg.role.title()}: \${msg.content}\`)
            .join("\\n");

        const analysis_prompt = \`Analyze this query: "\${query}"\\n\\nChat history:\\n\${history_text}\`;

        const messages = [
            SystemMessage(content=CHAT_ANALYZER_PROMPT),
            HumanMessage(content=analysis_prompt)
        ];

        const response = await query_llm.invoke(messages);
        let result = _parse_json_response(response.content.strip());
        
        // Validate and enforce rules
        result = enforce_analysis_rules(result, chat_history, query);
        
        return result;
    } catch (e) {
        log_agent_step("Chat Analyzer", \`Error analyzing chat query: \${e}\`);
        return {
            query_type: "technical",
            chat_category: null,
            requires_history: false,
            requires_retrieval: true,
            context_relevance_score: 0.0,
            answer_in_history: false,
            relevant_history_indices: null
        };
    }
}`}
                        />
                      </div>

                      <div id="code-generator" className="mb-12">
                        <h3 className="text-xl font-semibold mb-4 text-white">
                          Code Generator
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                          <CodeExample
                            title="Apex Code Generation"
                            description="Generator agent for Apex code"
                            language="typescript"
                            code={`async function generate_apex_code(state: AgentState): Promise<Dict> {
    try {
        const context_manager = new ContextManager();
        
        // Process context chunks
        const processed_chunks = await Promise.all(
            state.context_chunks.map(chunk => 
                context_manager.process_large_context(
                    chunk.page_content,
                    { max_tokens: 6000 }
                )
            )
        );

        // Combine processed chunks
        const context = processed_chunks.join("\\n\\n");

        // Process requirements
        const requirements = await context_manager.manage_context_window(
            "Requirements:",
            state.query,
            { max_tokens: 2000 }
        );

        const is_modification = state.analysis.operation_type === "modify";
        const mode = is_modification ? "modify" : "create";
        
        // Format prompt and generate code
        const messages = [
            SystemMessage(content=APEX_CODE_GENERATOR_PROMPT),
            HumanMessage(content=format_prompt_input({
                mode,
                context,
                requirements,
                code_to_modify: is_modification ? state.generated_apex_code : null
            }))
        ];

        const response = await llm.invoke(messages);
        
        return {
            generated_apex_code: response.content,
            final_response: response.content,
            current_agent: "end"
        };
    } catch (e) {
        return {
            current_agent: "error_handler",
            error_state: {
                message: String(e),
                location: "generate_apex_code"
            }
        };
    }
}`}
                          />

                          <CodeExample
                            title="LWC Generation"
                            description="Generator agent for Lightning Web Components"
                            language="typescript"
                            code={`async function generate_lwc_code(state: AgentState): Promise<Dict> {
    // Extract component requirements
    const componentName = state.analysis.component_name || "DefaultComponent";
    const requirements = state.query;

    // Prepare the generation prompt
    const prompt = {
        componentName,
        type: "lwc",
        requirements,
        features: {
            reactive: true,
            api: true,
            events: true
        }
    };

    // Generate component code
    const jsContent = await generateJavaScript(prompt);
    const htmlContent = await generateTemplate(prompt);
    const testContent = await generateJestTests(prompt);

    // Combine all generated content
    const generatedCode = {
        js: jsContent,
        html: htmlContent,
        test: testContent
    };

    // Return final response
    return {
        generated_lwc_code: generatedCode,
        final_response: formatOutput(generatedCode),
        current_agent: "end"
    };
}

// Helper function to generate JavaScript controller
async function generateJavaScript(prompt: ComponentPrompt): Promise<string> {
    const messages = [
        SystemMessage(content: LWC_JS_GENERATOR_PROMPT),
        HumanMessage(content: JSON.stringify(prompt))
    ];
    
    const response = await llm.invoke(messages);
    return response.content;
}

// Helper function to generate HTML template
async function generateTemplate(prompt: ComponentPrompt): Promise<string> {
    const messages = [
        SystemMessage(content: LWC_HTML_GENERATOR_PROMPT),
        HumanMessage(content: JSON.stringify(prompt))
    ];
    
    const response = await llm.invoke(messages);
    return response.content;
}

// Helper function to generate Jest tests
async function generateJestTests(prompt: ComponentPrompt): Promise<string> {
    const messages = [
        SystemMessage(content: JEST_TEST_GENERATOR_PROMPT),
        HumanMessage(content: JSON.stringify(prompt))
    ];
    
    const response = await llm.invoke(messages);
    return response.content;
}`}
                          />
                        </div>
                      </div>

                      <div id="test-generator" className="mb-12">
                        <h3 className="text-xl font-semibold mb-4 text-white">
                          Test Generator
                        </h3>

                        <CodeExample
                          title="Test Generation System"
                          description="Advanced test generation with pattern matching"
                          language="typescript"
                          code={`async function generate_apex_test_code(state: AgentState): Promise<Dict> {
    try {
        // Get source code and determine mode
        const apex_code = state.apex_code_for_test 
            || state.generated_apex_code 
            || state.query;

        const is_modification = state.analysis.operation_type === "modify";
        const mode = is_modification ? "modify" : "create";
        const existing_test_code = is_modification 
            ? state.generated_apex_test_code 
            : null;

        // Build context string
        const context_parts = [];
        
        if (is_modification && existing_test_code) {
            context_parts.push(\`
                ### Existing Test Code:
                \`\`\`apex
                \${existing_test_code}
                \`\`\`
            \`);
        }

        // Process test patterns
        if (state.context_queries) {
            const test_patterns = await _retrieve_test_patterns(
                state.context_queries,
                5
            );
            if (test_patterns.length) {
                context_parts.push(
                    "\\n### Relevant Test Patterns:\\n" + 
                    test_patterns.join("\\n")
                );
            }
        }

        const context = context_parts.join("\\n");
        
        // Generate test code
        const messages = [
            SystemMessage(content=APEX_TEST_GENERATOR_PROMPT),
            HumanMessage(content=\`
                Mode: \${mode}\\n
                Context:\\n\${context}\\n
                Requirements:\\n\${state.query}
            \`)
        ];

        const response = await llm.invoke(messages);
        const final_content = response.content;

        // Format response
        const final_response = state.generated_apex_code && state.is_combined_request
            ? \`# Original Apex Implementation\\n\${state.generated_apex_code}\\n\\n
               # Generated Test Implementation\\n\${final_content}\`
            : final_content;

        return {
            final_response,
            generated_apex_test_code: final_content,
            current_agent: "end",
            processing_metrics: context_manager.get_metrics()
        };

    } catch (e) {
        return {
            current_agent: "error_handler",
            error_state: {
                message: String(e),
                location: "generate_apex_test_code"
            }
        };
    }
}`}
                        />
                      </div>

                      <div id="retrieval-system" className="mb-12">
                        <h3 className="text-xl font-semibold mb-4 text-white">
                          Retrieval System
                        </h3>

                        <CodeExample
                          title="Multi-Collection Retriever"
                          description="Sophisticated retrieval system for code patterns"
                          language="typescript"
                          code={`class MultiCollectionRetriever {
    constructor(factory: CodeRetrieverFactory) {
        this.factory = factory;
        this.collections = {
            apex: ["apex_code", "apex_test_code"],
            lwc: ["lwc_js_code", "lwc_html_code", "lwc_test_code"]
        };
    }

    private _determine_collections(query: string): string[] {
        const query_lower = query.toLowerCase();
        const collections = [];

        // Apex context keywords
        const apex_keywords = [
            "class", "trigger", "apex", "test class",
            "handler", "service", "controller", "batch"
        ];

        // LWC context keywords
        const lwc_keywords = [
            "lwc", "component", "lightning", "aura",
            "template", "javascript", "html", "jest"
        ];

        // Check contexts
        if (apex_keywords.some(kw => query_lower.includes(kw))) {
            collections.push(...this.collections.apex);
        }
        if (lwc_keywords.some(kw => query_lower.includes(kw))) {
            collections.push(...this.collections.lwc);
        }

        // Default to all collections if no specific context
        return collections.length ? [...new Set(collections)] 
            : Object.values(this.collections).flat();
    }

    async retrieve(
        query: string, 
        context_manager?: ContextManager
    ): Promise<Dict<Document[]>> {
        const collections = this._determine_collections(query);
        const retrievers = {};

        // Create retrievers
        for (const collection of collections) {
            const store = this.factory.stores[collection];
            const base_retriever = store.as_retriever({
                search_type: "mmr",
                search_kwargs: { k: sys.maxsize }
            });

            const compressor = new FlashrankRerank({ top_n: 3 });
            retrievers[collection] = new ContextualCompressionRetriever({
                base_compressor: compressor,
                base_retriever
            });
        }

        // Process retrievals
        if (context_manager) {
            const results = await Promise.all(
                Object.entries(retrievers).map(
                    async ([collection, retriever]) => {
                        try {
                            const chunks = await retriever
                                .get_relevant_documents(query);
                            
                            if (!chunks.length) return [collection, []];

                            const combined_content = chunks
                                .map(chunk => chunk.page_content)
                                .join("\\n");
                            
                            const processed_content = 
                                await context_manager.process_large_context(
                                    combined_content,
                                    {
                                        max_tokens: 4000,
                                        chunk_size: 1000
                                    }
                                );

                            const processed_chunks = chunks.map(
                                (chunk, i) => new Document({
                                    page_content: processed_content[i] 
                                        || processed_content,
                                    metadata: chunk.metadata
                                })
                            );

                            return [collection, processed_chunks];
                        } catch (e) {
                            console.error(
                                \`Error processing \${collection}: \${e}\`
                            );
                            return [collection, []];
                        }
                    }
                )
            );

            return Object.fromEntries(results);
        }

        // Sequential processing without context manager
        const retrieved_chunks = {};
        for (const [collection, retriever] of Object.entries(retrievers)) {
            try {
                const chunks = await retriever.get_relevant_documents(query);
                retrieved_chunks[collection] = chunks;
            } catch (e) {
                console.error(\`Error retrieving from \${collection}: \${e}\`);
                retrieved_chunks[collection] = [];
            }
        }

        return retrieved_chunks;
    }
}`}
                        />
                      </div>
                    </DocSection>
                  </TabsContent>
                  {/* Security Tab Content */}
                  <TabsContent value="security">
                    <DocSection title="Security Implementation" icon={Shield}>
                      <div id="authentication" className="mb-12">
                        <h3 className="text-xl font-semibold mb-4 text-white">
                          Authentication
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                          <Card className="bg-black/20 border-gray-800">
                            <CardHeader>
                              <div className="flex items-center space-x-2">
                                <Fingerprint className="w-5 h-5 text-blue-400" />
                                <CardTitle className="text-lg">
                                  Authentication Flow
                                </CardTitle>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-2 text-gray-300">
                                <li>IBM w3Id integration</li>
                                <li>Session management</li>
                                <li>Token validation</li>
                                <li>Secure cookie handling</li>
                              </ul>
                            </CardContent>
                          </Card>

                          <Card className="bg-black/20 border-gray-800">
                            <CardHeader>
                              <div className="flex items-center space-x-2">
                                <Shield className="w-5 h-5 text-purple-400" />
                                <CardTitle className="text-lg">
                                  Access Control
                                </CardTitle>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-2 text-gray-300">
                                <li>Role-based access control</li>
                                <li>Permission validation</li>
                                <li>Resource protection</li>
                                <li>Audit logging</li>
                              </ul>
                            </CardContent>
                          </Card>
                        </div>

                        <CodeExample
                          title="Authentication Middleware"
                          description="Implementation of authentication middleware"
                          language="typescript"
                          code={`// Authentication middleware implementation
                  async function validateAuth(req: Request, res: Response, next: NextFunction) {
                    try {
                      // Verify auth token
                      const token = req.headers.authorization?.split(" ")[1];
                      if (!token) {
                        throw new UnauthorizedError("No token provided");
                      }
                  
                      // Validate token with IBM w3Id
                      const validationResult = await validateW3IdToken(token);
                      if (!validationResult.valid) {
                        throw new UnauthorizedError("Invalid token");
                      }
                  
                      // Add user info to request
                      req.user = {
                        id: validationResult.userId,
                        email: validationResult.email,
                        roles: validationResult.roles,
                        permissions: validationResult.permissions
                      };
                  
                      // Check if token needs refresh
                      if (validationResult.shouldRefresh) {
                        res.setHeader("X-Token-Refresh-Required", "true");
                      }
                  
                      next();
                    } catch (error) {
                      next(error);
                    }
                  }`}
                        />
                      </div>

                      <div id="data-protection" className="mb-12">
                        <h3 className="text-xl font-semibold mb-4 text-white">
                          Data Protection
                        </h3>

                        <CodeExample
                          title="Data Protection Implementation"
                          description="Secure data handling and encryption"
                          language="typescript"
                          code={`// Data protection utilities
                  class DataProtection {
                    private static readonly ENCRYPTION_ALGORITHM = "aes-256-gcm";
                    private static readonly KEY_LENGTH = 32;
                    private static readonly IV_LENGTH = 16;
                    private static readonly AUTH_TAG_LENGTH = 16;
                  
                    // Encrypt sensitive data
                    static async encrypt(data: string, key: Buffer): Promise<string> {
                      const iv = crypto.randomBytes(this.IV_LENGTH);
                      const cipher = crypto.createCipheriv(
                        this.ENCRYPTION_ALGORITHM,
                        key,
                        iv,
                        { authTagLength: this.AUTH_TAG_LENGTH }
                      );
                  
                      const encrypted = Buffer.concat([
                        cipher.update(data, "utf8"),
                        cipher.final()
                      ]);
                  
                      const authTag = cipher.getAuthTag();
                  
                      return JSON.stringify({
                        iv: iv.toString("hex"),
                        data: encrypted.toString("hex"),
                        authTag: authTag.toString("hex")
                      });
                    }
                  
                    // Decrypt sensitive data
                    static async decrypt(encryptedData: string, key: Buffer): Promise<string> {
                      const { iv, data, authTag } = JSON.parse(encryptedData);
                      
                      const decipher = crypto.createDecipheriv(
                        this.ENCRYPTION_ALGORITHM,
                        key,
                        Buffer.from(iv, "hex"),
                        { authTagLength: this.AUTH_TAG_LENGTH }
                      );
                  
                      decipher.setAuthTag(Buffer.from(authTag, "hex"));
                  
                      return Buffer.concat([
                        decipher.update(Buffer.from(data, "hex")),
                        decipher.final()
                      ]).toString("utf8");
                    }
                  
                    // Secure storage of sensitive data
                    static async storeSecurely(data: any): Promise<void> {
                      const encryptionKey = await this.getEncryptionKey();
                      const serializedData = JSON.stringify(data);
                      const encryptedData = await this.encrypt(serializedData, encryptionKey);
                      
                      // Store with additional safeguards
                      await this.secureStore(encryptedData);
                    }
                  }`}
                        />
                      </div>

                      <div id="compliance" className="mb-12">
                        <h3 className="text-xl font-semibold mb-4 text-white">
                          Compliance & Monitoring
                        </h3>

                        <CodeExample
                          title="Security Monitoring System"
                          description="Implementation of security monitoring and compliance"
                          language="typescript"
                          code={`// Security monitoring implementation
                  class SecurityMonitor {
                    private static readonly ALERT_THRESHOLD = 5;
                    private static readonly MONITOR_INTERVAL = 60000; // 1 minute
                  
                    private failedAttempts: Map<string, number> = new Map();
                    private blockedIPs: Set<string> = new Set();
                  
                    // Initialize monitoring system
                    constructor() {
                      setInterval(() => this.cleanupFailedAttempts(), this.MONITOR_INTERVAL);
                    }
                  
                    // Record and analyze security events
                    async recordEvent(event: SecurityEvent): Promise<void> {
                      const eventLog = {
                        timestamp: new Date(),
                        ip: event.ip,
                        type: event.type,
                        userId: event.userId,
                        details: event.details
                      };
                  
                      // Log event
                      await this.logSecurityEvent(eventLog);
                  
                      // Check for suspicious patterns
                      if (this.isSupiciousPattern(eventLog)) {
                        await this.handleSuspiciousActivity(eventLog);
                      }
                  
                      // Update metrics
                      await this.updateSecurityMetrics(eventLog);
                    }
                  
                    // Check for suspicious patterns
                    private isSupiciousPattern(event: SecurityEvent): boolean {
                      const attempts = this.failedAttempts.get(event.ip) || 0;
                      
                      if (event.type === "failed_auth") {
                        this.failedAttempts.set(event.ip, attempts + 1);
                        
                        if (attempts + 1 >= this.ALERT_THRESHOLD) {
                          this.blockedIPs.add(event.ip);
                          return true;
                        }
                      }
                  
                      return false;
                    }
                  
                    // Handle suspicious activity
                    private async handleSuspiciousActivity(event: SecurityEvent): Promise<void> {
                      // Alert security team
                      await this.sendSecurityAlert({
                        level: "HIGH",
                        event: event,
                        message: "Suspicious activity detected"
                      });
                  
                      // Take protective action
                      await this.takeProtectiveAction(event);
                    }
                  
                    // Send security alerts
                    private async sendSecurityAlert(alert: SecurityAlert): Promise<void> {
                      await Promise.all([
                        this.notifySecurityTeam(alert),
                        this.logSecurityAlert(alert),
                        this.triggerIncidentResponse(alert)
                      ]);
                    }
                  }`}
                        />
                      </div>
                    </DocSection>
                  </TabsContent>
                  {/* Performance Tab Content */}
                  <TabsContent value="performance">
                    <DocSection title="Performance Optimization" icon={Zap}>
                      <div id="optimization" className="mb-12">
                        <h3 className="text-xl font-semibold mb-4 text-white">
                          Optimization Techniques
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                          <Card className="bg-black/20 border-gray-800">
                            <CardHeader>
                              <div className="flex items-center space-x-2">
                                <Zap className="w-5 h-5 text-blue-400" />
                                <CardTitle className="text-lg">
                                  Response Optimization
                                </CardTitle>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-2 text-gray-300">
                                <li>Parallel processing</li>
                                <li>Query optimization</li>
                                <li>Response streaming</li>
                                <li>Load balancing</li>
                              </ul>
                            </CardContent>
                          </Card>

                          <Card className="bg-black/20 border-gray-800">
                            <CardHeader>
                              <div className="flex items-center space-x-2">
                                <RefreshCcw className="w-5 h-5 text-purple-400" />
                                <CardTitle className="text-lg">
                                  Resource Management
                                </CardTitle>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-2 text-gray-300">
                                <li>Memory optimization</li>
                                <li>Connection pooling</li>
                                <li>Resource cleanup</li>
                                <li>Error recovery</li>
                              </ul>
                            </CardContent>
                          </Card>
                        </div>

                        <CodeExample
                          title="Performance Optimization Implementation"
                          description="Implementation of performance optimizations"
                          language="typescript"
                          code={`// Context window management with optimization
                  class ContextManager {
                    constructor(
                      private avg_chars_per_token: number = 4,
                      private max_parallel_chunks: number = 5,
                      private max_cache_size: number = 1000
                    ) {
                      this.metrics = {
                        cache_hits: 0,
                        cache_misses: 0,
                        parallel_operations: 0,
                        average_processing_time: 0,
                        total_processed: 0
                      };
                    }
                  
                    // Optimize context window management
                    async manage_context_window(
                      prompt: string,
                      context: string,
                      max_tokens: number
                    ): Promise<string> {
                      const start_time = performance.now();
                      
                      try {
                        // Check cache first
                        const cache_key = this.generate_cache_key(prompt, context);
                        const cached_result = await this.check_cache(cache_key);
                        
                        if (cached_result) {
                          this.metrics.cache_hits++;
                          return cached_result;
                        }
                  
                        this.metrics.cache_misses++;
                  
                        // Split into manageable chunks
                        const chunks = this.split_into_chunks(context, max_tokens);
                        
                        // Process chunks in parallel with limits
                        const processed_chunks = await this.process_chunks_parallel(
                          chunks,
                          prompt
                        );
                  
                        // Combine and optimize result
                        const result = this.combine_chunks(processed_chunks);
                        
                        // Update cache
                        await this.update_cache(cache_key, result);
                        
                        // Update metrics
                        this.update_processing_metrics(start_time);
                        
                        return result;
                  
                      } catch (error) {
                        console.error("Context management error:", error);
                        return this.fallback_processing(prompt, context);
                      }
                    }
                  
                    // Parallel chunk processing with limits
                    private async process_chunks_parallel(
                      chunks: string[],
                      prompt: string
                    ): Promise<string[]> {
                      const processed_chunks: string[] = [];
                      
                      // Process in batches to limit parallel operations
                      for (let i = 0; i < chunks.length; i += this.max_parallel_chunks) {
                        const batch = chunks.slice(i, i + this.max_parallel_chunks);
                        
                        const batch_results = await Promise.all(
                          batch.map(chunk => this.process_chunk(chunk, prompt))
                        );
                        
                        processed_chunks.push(...batch_results);
                        this.metrics.parallel_operations++;
                      }
                      
                      return processed_chunks;
                    }
                  }`}
                        />
                      </div>

                      <div id="caching" className="mb-12">
                        <h3 className="text-xl font-semibold mb-4 text-white">
                          Caching Strategy
                        </h3>

                        <CodeExample
                          title="Caching Implementation"
                          description="Advanced caching system with LRU implementation"
                          language="typescript"
                          code={`// Caching system implementation
                  class CacheManager {
                    private cache: Map<string, any>;
                    private lruList: string[];
                    private readonly maxSize: number;
                  
                    constructor(maxSize: number = 1000) {
                      this.cache = new Map();
                      this.lruList = [];
                      this.maxSize = maxSize;
                    }
                  
                    // Get cached item with LRU update
                    async get(key: string): Promise<any> {
                      const value = this.cache.get(key);
                      
                      if (value !== undefined) {
                        // Update LRU order
                        this.updateLRU(key);
                        return value;
                      }
                      
                      return null;
                    }
                  
                    // Set cache item with size management
                    async set(key: string, value: any): Promise<void> {
                      // Check cache size and evict if necessary
                      while (this.cache.size >= this.maxSize) {
                        const lruKey = this.lruList.shift();
                        if (lruKey) {
                          this.cache.delete(lruKey);
                        }
                      }
                  
                      this.cache.set(key, value);
                      this.updateLRU(key);
                    }
                  
                    // Update LRU order
                    private updateLRU(key: string): void {
                      const index = this.lruList.indexOf(key);
                      if (index > -1) {
                        this.lruList.splice(index, 1);
                      }
                      this.lruList.push(key);
                    }
                  
                    // Clear expired items
                    async clearExpired(): Promise<void> {
                      const now = Date.now();
                      for (const [key, value] of this.cache.entries()) {
                        if (value.expiry && value.expiry < now) {
                          this.cache.delete(key);
                          this.lruList = this.lruList.filter(k => k !== key);
                        }
                      }
                    }
                  }`}
                        />
                      </div>

                      <div id="monitoring" className="mb-12">
                        <h3 className="text-xl font-semibold mb-4 text-white">
                          Performance Monitoring
                        </h3>

                        <CodeExample
                          title="Performance Monitoring System"
                          description="Implementation of performance monitoring and metrics"
                          language="typescript"
                          code={`// Performance monitoring implementation
                  class PerformanceMonitor {
                    private metrics: {
                      requestTimes: number[];
                      errorRates: Map<string, number>;
                      resourceUsage: Map<string, number>;
                      responseLatencies: number[];
                      throughput: number;
                    };
                  
                    private static instance: PerformanceMonitor;
                  
                    private constructor() {
                      this.metrics = {
                        requestTimes: [],
                        errorRates: new Map(),
                        resourceUsage: new Map(),
                        responseLatencies: [],
                        throughput: 0
                      };
                    }
                  
                    // Singleton instance getter
                    static getInstance(): PerformanceMonitor {
                      if (!PerformanceMonitor.instance) {
                        PerformanceMonitor.instance = new PerformanceMonitor();
                      }
                      return PerformanceMonitor.instance;
                    }
                  
                    // Record request metrics
                    async recordRequest(metrics: RequestMetrics): Promise<void> {
                      const startTime = performance.now();
                      
                      try {
                        // Record response time
                        this.metrics.requestTimes.push(metrics.duration);
                        
                        // Update error rates if applicable
                        if (metrics.error) {
                          const currentErrors = this.metrics.errorRates.get(metrics.endpoint) || 0;
                          this.metrics.errorRates.set(metrics.endpoint, currentErrors + 1);
                        }
                        
                        // Update resource usage
                        metrics.resources.forEach((usage, resource) => {
                          const currentUsage = this.metrics.resourceUsage.get(resource) || 0;
                          this.metrics.resourceUsage.set(resource, currentUsage + usage);
                        });
                        
                        // Calculate and update throughput
                        this.updateThroughput();
                        
                        // Log performance data
                        await this.logPerformanceData({
                          timestamp: new Date(),
                          metrics: this.getMetricsSummary()
                        });
                  
                      } catch (error) {
                        console.error("Error recording metrics:", error);
                      } finally {
                        const duration = performance.now() - startTime;
                        this.metrics.responseLatencies.push(duration);
                      }
                    }
                  
                    // Get performance metrics summary
                    getMetricsSummary() {
                      return {
                        averageResponseTime: this.calculateAverageResponseTime(),
                        errorRates: Object.fromEntries(this.metrics.errorRates),
                        resourceUtilization: this.calculateResourceUtilization(),
                        throughput: this.metrics.throughput,
                        latencyPercentiles: this.calculateLatencyPercentiles()
                      };
                    }
                  
                    // Calculate average response time
                    private calculateAverageResponseTime(): number {
                      if (this.metrics.requestTimes.length === 0) return 0;
                      return this.metrics.requestTimes.reduce((a, b) => a + b, 0) / 
                             this.metrics.requestTimes.length;
                    }
                  
                    // Calculate resource utilization
                    private calculateResourceUtilization(): Record<string, number> {
                      const utilization: Record<string, number> = {};
                      this.metrics.resourceUsage.forEach((usage, resource) => {
                        utilization[resource] = usage / this.metrics.requestTimes.length;
                      });
                      return utilization;
                    }
                  
                    // Calculate latency percentiles
                    private calculateLatencyPercentiles(): Record<string, number> {
                      const sorted = [...this.metrics.responseLatencies].sort((a, b) => a - b);
                      return {
                        p50: this.getPercentile(sorted, 50),
                        p90: this.getPercentile(sorted, 90),
                        p95: this.getPercentile(sorted, 95),
                        p99: this.getPercentile(sorted, 99)
                      };
                    }
                  
                    // Get percentile value
                    private getPercentile(sorted: number[], percentile: number): number {
                      const index = Math.ceil((percentile / 100) * sorted.length) - 1;
                      return sorted[index];
                    }
                  
                    // Update throughput calculation
                    private updateThroughput(): void {
                      const recentWindow = this.metrics.requestTimes.slice(-100);
                      const windowDuration = recentWindow.reduce((a, b) => a + b, 0);
                      this.metrics.throughput = (recentWindow.length / windowDuration) * 1000;
                    }
                  }`}
                        />
                      </div>
                    </DocSection>
                  </TabsContent>
                  {/* Examples Tab Content */}
                  <TabsContent value="examples">
                    <DocSection title="Code Examples" icon={FileCode}>
                      <div id="apex-examples" className="mb-12">
                        <h3 className="text-xl font-semibold mb-4 text-white">
                          Apex Code Examples
                        </h3>

                        <CodeExample
                          title="Account Service Implementation"
                          description="Example of a service class with best practices"
                          language="apex"
                          code={`public with sharing class AccountService {
                      /**
                       * Create a new account with duplicate checking
                       * @param account The account to create
                       * @return The created account
                       * @throws AuraHandledException if duplicate found
                       */
                      @AuraEnabled
                      public static Account createAccount(Account account) {
                          try {
                              // Check for duplicates
                              List<Account> duplicates = [
                                  SELECT Id, Name 
                                  FROM Account 
                                  WHERE Name = :account.Name
                                  LIMIT 1
                              ];
                              
                              if (!duplicates.isEmpty()) {
                                  throw new AuraHandledException(
                                      'Account with this name already exists.'
                                  );
                              }
                              
                              // Insert with sharing rules
                              insert account;
                              return account;
                              
                          } catch (Exception e) {
                              throw new AuraHandledException(e.getMessage());
                          }
                      }
                  
                      /**
                       * Update account with related contacts
                       * @param account The account to update
                       * @param contacts List of contacts to associate
                       * @return Updated account with contacts
                       */
                      @AuraEnabled
                      public static Account updateAccountWithContacts(
                          Account account,
                          List<Contact> contacts
                      ) {
                          Savepoint sp = Database.setSavepoint();
                          try {
                              update account;
                              
                              for (Contact contact : contacts) {
                                  contact.AccountId = account.Id;
                              }
                              
                              upsert contacts;
                              
                              return [
                                  SELECT Id, Name, 
                                      (SELECT Id, Name FROM Contacts)
                                  FROM Account
                                  WHERE Id = :account.Id
                              ];
                              
                          } catch (Exception e) {
                              Database.rollback(sp);
                              throw new AuraHandledException(e.getMessage());
                          }
                      }
                  }`}
                        />
                      </div>

                      <div id="lwc-examples" className="mb-12">
                        <h3 className="text-xl font-semibold mb-4 text-white">
                          LWC Examples
                        </h3>

                        <CodeExample
                          title="Account List Component"
                          description="Example of a Lightning Web Component with best practices"
                          language="typescript"
                          code={`// accountList.js
                  import { LightningElement, wire, track } from 'lwc';
                  import { refreshApex } from '@salesforce/apex';
                  import getAccounts from '@salesforce/apex/AccountController.getAccounts';
                  import { showToastEvent } from 'lightning/platformShowToastEvent';
                  
                  export default class AccountList extends LightningElement {
                      @track accounts;
                      @track error;
                      @track loading = true;
                      
                      wiredAccountsResult;
                  
                      // Wire service to fetch accounts
                      @wire(getAccounts)
                      wiredAccounts(result) {
                          this.wiredAccountsResult = result;
                          this.loading = true;
                          
                          if (result.data) {
                              this.accounts = result.data;
                              this.error = undefined;
                          } else if (result.error) {
                              this.error = result.error;
                              this.accounts = undefined;
                              this.showError(result.error);
                          }
                          
                          this.loading = false;
                      }
                  
                      // Refresh data
                      async handleRefresh() {
                          this.loading = true;
                          try {
                              await refreshApex(this.wiredAccountsResult);
                          } catch (error) {
                              this.showError(error);
                          }
                          this.loading = false;
                      }
                  
                      // Handle row selection
                      handleRowSelection(event) {
                          const accountId = event.detail.accountId;
                          const selectedEvent = new CustomEvent('accountselect', {
                              detail: { accountId }
                          });
                          this.dispatchEvent(selectedEvent);
                      }
                  
                      // Show error toast
                      showError(error) {
                          this.dispatchEvent(
                              new ShowToastEvent({
                                  title: 'Error',
                                  message: error.message || error.body?.message || 'Unknown error',
                                  variant: 'error'
                              })
                          );
                      }
                  }`}
                        />

                        <CodeExample
                          title="Account List Template"
                          description="HTML template for the Account List component"
                          language="html"
                          code={`<!-- accountList.html -->
                  <template>
                      <div class="account-list">
                          <!-- Header -->
                          <div class="slds-page-header">
                              <div class="slds-page-header__row">
                                  <div class="slds-page-header__col-title">
                                      <div class="slds-media">
                                          <div class="slds-media__figure">
                                              <lightning-icon icon-name="standard:account"
                                                            alternative-text="Accounts"
                                                            size="medium">
                                              </lightning-icon>
                                          </div>
                                          <div class="slds-media__body">
                                              <div class="slds-page-header__name">
                                                  <div class="slds-page-header__name-title">
                                                      <h1>
                                                          <span class="slds-page-header__title">
                                                              Accounts
                                                          </span>
                                                      </h1>
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                                  <div class="slds-page-header__col-actions">
                                      <lightning-button label="Refresh"
                                                      icon-name="utility:refresh"
                                                      onclick={handleRefresh}>
                                      </lightning-button>
                                  </div>
                              </div>
                          </div>
                  
                          <!-- Loading spinner -->
                          <template if:true={loading}>
                              <lightning-spinner alternative-text="Loading">
                              </lightning-spinner>
                          </template>
                  
                          <!-- Error display -->
                          <template if:true={error}>
                              <div class="slds-notify slds-notify_alert slds-theme_alert-texture
                                          slds-theme_error">
                                  {error.message}
                              </div>
                          </template>
                  
                          <!-- Account list -->
                          <template if:true={accounts}>
                              <lightning-datatable
                                  key-field="Id"
                                  data={accounts}
                                  columns={columns}
                                  onrowaction={handleRowAction}
                                  hide-checkbox-column>
                              </lightning-datatable>
                          </template>
                      </div>
                  </template>`}
                        />
                      </div>

                      <div id="test-examples" className="mb-12">
                        <h3 className="text-xl font-semibold mb-4 text-white">
                          Test Examples
                        </h3>

                        <CodeExample
                          title="Apex Test Implementation"
                          description="Example of comprehensive test coverage"
                          language="apex"
                          code={`@IsTest
                  public class AccountServiceTest {
                      @TestSetup
                      static void setupTestData() {
                          // Create test accounts
                          List<Account> testAccounts = new List<Account>();
                          for (Integer i = 0; i < 5; i++) {
                              testAccounts.add(new Account(
                                  Name = 'Test Account ' + i,
                                  Industry = 'Technology'
                              ));
                          }
                          insert testAccounts;
                      }
                      
                      @IsTest
                      static void testCreateAccount_Success() {
                          // Arrange
                          Account newAccount = new Account(
                              Name = 'New Test Account',
                              Industry = 'Healthcare'
                          );
                          
                          // Act
                          Test.startTest();
                          Account result = AccountService.createAccount(newAccount);
                          Test.stopTest();
                          
                          // Assert
                          System.assertNotNull(result.Id);
                          Account savedAccount = [
                              SELECT Id, Name, Industry 
                              FROM Account 
                              WHERE Id = :result.Id
                          ];
                          System.assertEquals('New Test Account', savedAccount.Name);
                          System.assertEquals('Healthcare', savedAccount.Industry);
                      }
                      
                      @IsTest
                      static void testCreateAccount_DuplicateName() {
                          // Arrange
                          Account existingAccount = [
                              SELECT Id, Name 
                              FROM Account 
                              LIMIT 1
                          ];
                          
                          Account duplicateAccount = new Account(
                              Name = existingAccount.Name
                          );
                          
                          // Act & Assert
                          Test.startTest();
                          try {
                              AccountService.createAccount(duplicateAccount);
                              System.assert(false, 'Expected exception was not thrown');
                          } catch (AuraHandledException e) {
                              System.assert(
                                  e.getMessage().contains('already exists'),
                                  'Unexpected error message: ' + e.getMessage()
                              );
                          }
                          Test.stopTest();
                      }
                  
                      @IsTest
                      static void testUpdateAccountWithContacts_Success() {
                          // Arrange
                          Account testAccount = [
                              SELECT Id, Name 
                              FROM Account 
                              LIMIT 1
                          ];
                          
                          List<Contact> contacts = new List<Contact>();
                          for (Integer i = 0; i < 3; i++) {
                              contacts.add(new Contact(
                                  FirstName = 'Test',
                                  LastName = 'Contact ' + i,
                                  Email = 'test' + i + '@example.com'
                              ));
                          }
                          
                          // Act
                          Test.startTest();
                          Account result = AccountService.updateAccountWithContacts(
                              testAccount,
                              contacts
                          );
                          Test.stopTest();
                          
                          // Assert
                          System.assertEquals(
                              3,
                              result.Contacts.size(),
                              'Expected 3 contacts to be associated'
                          );
                          
                          // Verify contact details
                          for (Contact c : result.Contacts) {
                              System.assert(
                                  c.Email.startsWith('test'),
                                  'Contact email format incorrect'
                              );
                              System.assertEquals(
                                  testAccount.Id,
                                  c.AccountId,
                                  'Contact not properly associated with account'
                              );
                          }
                      }
                  }`}
                        />

                        <CodeExample
                          title="LWC Jest Test Implementation"
                          description="Example of Jest tests for Lightning Web Component"
                          language="javascript"
                          code={`import { createElement } from 'lwc';
                  import AccountList from 'c/accountList';
                  import getAccounts from '@salesforce/apex/AccountController.getAccounts';
                  import { refreshApex } from '@salesforce/apex';
                  
                  // Mock the apex method
                  jest.mock(
                      '@salesforce/apex/AccountController.getAccounts',
                      () => {
                          return {
                              default: jest.fn()
                          };
                      },
                      { virtual: true }
                  );
                  
                  // Mock refreshApex
                  jest.mock('@salesforce/apex', () => ({
                      refreshApex: jest.fn()
                  }));
                  
                  describe('c-account-list', () => {
                      beforeEach(() => {
                          // Reset mocks before each test
                          jest.clearAllMocks();
                      });
                  
                      it('renders accounts when data is returned', async () => {
                          // Arrange
                          const element = createElement('c-account-list', {
                              is: AccountList
                          });
                  
                          const mockAccounts = [
                              { Id: '1', Name: 'Test Account 1' },
                              { Id: '2', Name: 'Test Account 2' }
                          ];
                  
                          getAccounts.mockResolvedValue(mockAccounts);
                  
                          // Act
                          document.body.appendChild(element);
                  
                          // Wait for any asynchronous operations
                          await Promise.resolve();
                          await Promise.resolve();
                  
                          // Assert
                          const rows = element.shadowRoot.querySelectorAll(
                          'lightning-datatable tr'
                          );
                          expect(rows.length).toBe(2);
                          
                          const title = element.shadowRoot.querySelector(
                              '.slds-page-header__title'
                          );
                          expect(title.textContent).toBe('Accounts');
                      });
                  
                      it('shows error when apex call fails', async () => {
                          // Arrange
                          const element = createElement('c-account-list', {
                              is: AccountList
                          });
                  
                          const mockError = new Error('Failed to fetch accounts');
                          getAccounts.mockRejectedValue(mockError);
                  
                          // Act
                          document.body.appendChild(element);
                          
                          // Wait for any asynchronous operations
                          await Promise.resolve();
                          await Promise.resolve();
                  
                          // Assert
                          const errorDiv = element.shadowRoot.querySelector(
                              '.slds-notify_alert'
                          );
                          expect(errorDiv).not.toBeNull();
                          expect(errorDiv.textContent).toBe(mockError.message);
                      });
                  
                      it('handles refresh button click', async () => {
                          // Arrange
                          const element = createElement('c-account-list', {
                              is: AccountList
                          });
                  
                          const mockAccounts = [
                              { Id: '1', Name: 'Test Account 1' }
                          ];
                          getAccounts.mockResolvedValue(mockAccounts);
                          
                          document.body.appendChild(element);
                          await Promise.resolve();
                  
                          // Act
                          const refreshButton = element.shadowRoot.querySelector(
                              'lightning-button'
                          );
                          refreshButton.click();
                          
                          // Wait for refresh
                          await Promise.resolve();
                  
                          // Assert
                          expect(refreshApex).toHaveBeenCalled();
                      });
                  
                      it('dispatches accountselect event on row selection', async () => {
                          // Arrange
                          const element = createElement('c-account-list', {
                              is: AccountList
                          });
                  
                          const mockAccounts = [
                              { Id: '1', Name: 'Test Account 1' }
                          ];
                          getAccounts.mockResolvedValue(mockAccounts);
                          
                          // Setup event listener
                          const handler = jest.fn();
                          element.addEventListener('accountselect', handler);
                          
                          document.body.appendChild(element);
                          await Promise.resolve();
                  
                          // Act
                          const table = element.shadowRoot.querySelector(
                              'lightning-datatable'
                          );
                          table.dispatchEvent(new CustomEvent('rowaction', {
                              detail: { accountId: '1' }
                          }));
                  
                          // Assert
                          expect(handler).toHaveBeenCalled();
                          expect(handler.mock.calls[0][0].detail.accountId).toBe('1');
                      });
                  });`}
                        />
                      </div>
                    </DocSection>
                  </TabsContent>
                </div>
                {/* Quick Navigation */}
                <div className="col-span-12 xl:col-span-3">
                  <QuickNav activeTab={activeTab} setActiveTab={setActiveTab} />
                </div>
              </div>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Documentation;
