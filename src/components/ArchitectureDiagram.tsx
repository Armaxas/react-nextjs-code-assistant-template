import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ArrowRight,
  Database,
  Brain,
  Server,
  Cpu,
  Code2,
  Blocks,
  TestTube2,
  Search,
  Sparkles,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

// Define types for the component props
interface ArchitectureDiagramProps {
  onClose?: () => void;
}

// Define types for BlockNode props
interface BlockNodeProps {
  title: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  id: string;
  description: string;
  agents?: string[];
  expanded?: boolean;
  onToggleExpand?: (id: string | null) => void;
}

// Define types for Connector props
interface ConnectorProps {
  color?: string;
  vertical?: boolean;
  animated?: boolean;
  delay?: number;
}

const ArchitectureDiagram: React.FC<ArchitectureDiagramProps> = ({
  onClose = () => {},
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [expandedNode, setExpandedNode] = useState<string | null>(null);
  const autoPlayIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const steps = [
    { id: "overview", title: "Multi-Agent Architecture Overview" },
    { id: "query", title: "Query Analysis & Routing" },
    { id: "retrieval", title: "Context Retrieval" },
    { id: "processing", title: "Processing & Generation" },
    { id: "evaluation", title: "Response Evaluation" },
  ];

  const agentGroups = {
    router: {
      title: "Router Agents",
      color: "from-blue-600 to-cyan-500",
      bgColor: "bg-blue-950/50",
      borderColor: "border-blue-600/50",
      icon: <Cpu className="w-6 h-6 text-blue-400" />,
      agents: ["router", "query_validator", "incomplete_query_handler"],
    },
    analysis: {
      title: "Analysis Agents",
      color: "from-indigo-600 to-blue-500",
      bgColor: "bg-indigo-950/50",
      borderColor: "border-indigo-600/50",
      icon: <Brain className="w-6 h-6 text-indigo-400" />,
      agents: [
        "context_analyzer",
        "modification_context_analyzer",
        "lwc_context_analyzer",
        "analyze_test_needs",
      ],
    },
    retrieval: {
      title: "Retrieval Agents",
      color: "from-purple-600 to-indigo-500",
      bgColor: "bg-purple-950/50",
      borderColor: "border-purple-600/50",
      icon: <Search className="w-6 h-6 text-purple-400" />,
      agents: [
        "apex_retriever",
        "lwc_retriever",
        "context_retriever",
        "lwc_code_retriever",
        "apex_code_retriever",
      ],
    },
    generation: {
      title: "Generation Agents",
      color: "from-fuchsia-600 to-purple-500",
      bgColor: "bg-fuchsia-950/50",
      borderColor: "border-fuchsia-600/50",
      icon: <Code2 className="w-6 h-6 text-fuchsia-400" />,
      agents: [
        "apex_generator",
        "lwc_generator",
        "lwc_html_generator",
        "lwc_js_generator",
        "lwc_apex_generator",
      ],
    },
    test: {
      title: "Test Agents",
      color: "from-green-600 to-emerald-500",
      bgColor: "bg-green-950/50",
      borderColor: "border-green-600/50",
      icon: <TestTube2 className="w-6 h-6 text-green-400" />,
      agents: [
        "apex_test_generator",
        "jest_test_generator",
        "test_method_generator",
        "jest_test_context_analyzer",
      ],
    },
    evaluation: {
      title: "Evaluation Agents",
      color: "from-orange-600 to-amber-500",
      bgColor: "bg-orange-950/50",
      borderColor: "border-orange-600/50",
      icon: <Sparkles className="w-6 h-6 text-orange-400" />,
      agents: ["evaluator", "error_handler"],
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const nodeDescriptions = {
    router:
      "Routes user queries to appropriate agent paths based on query analysis",
    query_validator: "Validates completeness of user queries",
    incomplete_query_handler:
      "Handles incomplete queries by prompting for more information",
    context_analyzer: "Analyzes what context is needed for code generation",
    modification_context_analyzer:
      "Analyzes context needed for code modifications",
    lwc_context_analyzer: "Analyzes context for Lightning Web Components",
    analyze_test_needs: "Determines testing requirements for Apex classes",
    apex_retriever: "Retrieves relevant Apex code chunks",
    lwc_retriever: "Retrieves Lightning Web Component code",
    context_retriever: "Retrieves context for code generation",
    lwc_code_retriever: "Retrieves Lightning Web Component by name",
    apex_code_retriever: "Retrieves specific Apex classes by name",
    apex_generator: "Generates Apex code based on requirements",
    lwc_generator: "Generates Lightning Web Components",
    lwc_html_generator: "Generates HTML markup for LWC",
    lwc_js_generator: "Generates JavaScript for LWC components",
    lwc_apex_generator: "Generates Apex controller for LWC components",
    apex_test_generator: "Generates Apex test classes",
    jest_test_generator: "Generates Jest tests for LWC components",
    test_method_generator: "Generates individual test methods",
    jest_test_context_analyzer: "Analyzes context for Jest test generation",
    evaluator: "Evaluates response quality before returning to user",
    error_handler: "Handles errors in agent workflow",
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  useEffect(() => {
    if (autoPlay) {
      autoPlayIntervalRef.current = setInterval(() => {
        setCurrentStep((prev) => (prev + 1) % steps.length);
      }, 10000); // Change slide every 10 seconds
    } else if (autoPlayIntervalRef.current) {
      clearInterval(autoPlayIntervalRef.current);
      autoPlayIntervalRef.current = null;
    }

    // Cleanup function
    return () => {
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
        autoPlayIntervalRef.current = null;
      }
    };
  }, [autoPlay, steps.length]);

  // Block component for nodes
  const BlockNode: React.FC<BlockNodeProps> = ({
    title,
    icon,
    color,
    bgColor,
    borderColor,
    id,
    description,
    agents = [],
    expanded = false,
    onToggleExpand,
  }) => {
    const [isLocalHovered, setIsLocalHovered] = useState(false);

    const handleMouseEnter = useCallback(() => {
      setIsLocalHovered(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
      setIsLocalHovered(false);
    }, []);

    const handleClick = useCallback(() => {
      void (onToggleExpand && onToggleExpand(id));
    }, [onToggleExpand, id]);

    return (
      <div
        className={`
          p-4 rounded-lg shadow-lg border transition-all duration-300 
          ${borderColor} ${bgColor} 
          ${expanded ? "scale-[1.02]" : ""}
          ${isLocalHovered ? "ring-2 ring-white/30" : ""}
        `}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className="flex items-center justify-between mb-2 cursor-pointer"
          onClick={handleClick}
        >
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="font-bold text-white">{title}</h3>
          </div>
          {agents.length > 0 && (
            <button
              className="text-gray-400 hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                if (onToggleExpand) {
                  onToggleExpand(expanded ? null : id);
                }
              }}
            >
              {expanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {description && (
          <p className="text-sm text-gray-300 mb-3">{description}</p>
        )}

        {expanded && agents.length > 0 && (
          <div className="mt-3 space-y-2">
            <div className="h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent my-2"></div>
            <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Included Agents
            </h4>
            <ul className="grid grid-cols-1 gap-2">
              {agents.map((agent) => (
                <li key={agent} className="text-sm">
                  <div className="flex items-center gap-2 p-2 rounded bg-black/30 hover:bg-black/50">
                    <div
                      className={`w-2 h-2 rounded-full bg-gradient-to-r ${color}`}
                    ></div>
                    <span className="text-gray-200">
                      {agent && typeof agent === "string"
                        ? agent.replace(/_/g, " ")
                        : agent}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // Connector component for the visual connection between blocks
  const Connector: React.FC<ConnectorProps> = ({
    color = "bg-blue-500",
    vertical = true,
    animated = true,
  }) => {
    return (
      <div
        className={`flex justify-center items-center ${vertical ? "h-8" : "w-full"}`}
      >
        <div
          className={`
            ${vertical ? "w-0.5 h-full" : "h-0.5 w-full"} 
            ${color} 
            rounded-full
            relative
            after:absolute after:inset-0 after:origin-center
            ${animated ? "after:animate-pulse" : ""}
          `}
        />
      </div>
    );
  };

  const renderOverviewDiagram = () => (
    <div className="p-6 max-w-5xl mx-auto">
      <motion.div
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* User Query Block */}
        <motion.div variants={itemVariants} className="mb-4">
          <BlockNode
            title="User Query"
            icon={<Database className="w-6 h-6 text-gray-400" />}
            color="from-gray-600 to-gray-800"
            bgColor="bg-gray-900"
            borderColor="border-gray-700"
            id="user-query"
            description="The starting point - user's input query about Salesforce development needs"
            onToggleExpand={setExpandedNode}
          />
        </motion.div>

        <Connector color="bg-blue-500" />

        {/* Router Layer */}
        <motion.div variants={itemVariants} className="mb-4">
          <BlockNode
            title={agentGroups.router.title}
            icon={agentGroups.router.icon}
            color={agentGroups.router.color}
            bgColor={agentGroups.router.bgColor}
            borderColor={agentGroups.router.borderColor}
            id="router"
            description="Routes the query to the appropriate analysis or retrieval path"
            agents={agentGroups.router.agents}
            expanded={expandedNode === "router"}
            onToggleExpand={setExpandedNode}
          />
        </motion.div>

        <Connector color="bg-blue-500" />

        {/* Analysis & Retrieval Layer (2 columns) */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-2 gap-4 mb-4"
        >
          <div className="space-y-4">
            <BlockNode
              title={agentGroups.analysis.title}
              icon={agentGroups.analysis.icon}
              color={agentGroups.analysis.color}
              bgColor={agentGroups.analysis.bgColor}
              borderColor={agentGroups.analysis.borderColor}
              id="analysis"
              description="Analyzes the query and determines required context"
              agents={agentGroups.analysis.agents}
              expanded={expandedNode === "analysis"}
              onToggleExpand={setExpandedNode}
            />
            <Connector color="bg-purple-500" />
          </div>

          <div className="space-y-4">
            <BlockNode
              title={agentGroups.retrieval.title}
              icon={agentGroups.retrieval.icon}
              color={agentGroups.retrieval.color}
              bgColor={agentGroups.retrieval.bgColor}
              borderColor={agentGroups.retrieval.borderColor}
              id="retrieval"
              description="Retrieves relevant Salesforce code and documentation"
              agents={agentGroups.retrieval.agents}
              expanded={expandedNode === "retrieval"}
              onToggleExpand={setExpandedNode}
            />
            <Connector color="bg-purple-500" />
          </div>
        </motion.div>

        {/* Generation Layer */}
        <motion.div variants={itemVariants} className="mb-4">
          <BlockNode
            title={agentGroups.generation.title}
            icon={agentGroups.generation.icon}
            color={agentGroups.generation.color}
            bgColor={agentGroups.generation.bgColor}
            borderColor={agentGroups.generation.borderColor}
            id="generation"
            description="Generates Apex, LWC, and other code based on query and context"
            agents={agentGroups.generation.agents}
            expanded={expandedNode === "generation"}
            onToggleExpand={setExpandedNode}
          />
        </motion.div>

        <Connector color="bg-green-500" />

        {/* Test Layer */}
        <motion.div variants={itemVariants} className="mb-4">
          <BlockNode
            title={agentGroups.test.title}
            icon={agentGroups.test.icon}
            color={agentGroups.test.color}
            bgColor={agentGroups.test.bgColor}
            borderColor={agentGroups.test.borderColor}
            id="test"
            description="Creates test classes and methods for generated code"
            agents={agentGroups.test.agents}
            expanded={expandedNode === "test"}
            onToggleExpand={setExpandedNode}
          />
        </motion.div>

        <Connector color="bg-orange-500" />

        {/* Evaluation Layer */}
        <motion.div variants={itemVariants} className="mb-4">
          <BlockNode
            title={agentGroups.evaluation.title}
            icon={agentGroups.evaluation.icon}
            color={agentGroups.evaluation.color}
            bgColor={agentGroups.evaluation.bgColor}
            borderColor={agentGroups.evaluation.borderColor}
            id="evaluation"
            description="Evaluates response for quality and correctness"
            agents={agentGroups.evaluation.agents}
            expanded={expandedNode === "evaluation"}
            onToggleExpand={setExpandedNode}
          />
        </motion.div>

        <Connector color="bg-green-500" />

        {/* User Response Layer */}
        <motion.div variants={itemVariants}>
          <BlockNode
            title="User Response"
            icon={<Server className="w-6 h-6 text-green-400" />}
            color="from-green-600 to-green-800"
            bgColor="bg-green-900/30"
            borderColor="border-green-700"
            id="user-response"
            description="The final Salesforce code solution delivered to the user"
            onToggleExpand={setExpandedNode}
          />
        </motion.div>
      </motion.div>
    </div>
  );

  const renderQueryDiagram = () => (
    <div className="p-6 max-w-5xl mx-auto">
      <motion.div
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* User Query Block */}
        <motion.div variants={itemVariants} className="mb-4">
          <BlockNode
            title="User Query"
            icon={<Database className="w-6 h-6 text-gray-400" />}
            color="from-gray-600 to-gray-800"
            bgColor="bg-gray-900"
            borderColor="border-gray-700"
            id="user-query"
            description="User's Salesforce development request"
            onToggleExpand={setExpandedNode}
          />
        </motion.div>

        <Connector color="bg-blue-500" />

        {/* Query Validator */}
        <motion.div variants={itemVariants} className="mb-4">
          <BlockNode
            title="Query Validator"
            icon={<Cpu className="w-6 h-6 text-blue-400" />}
            color="from-blue-600 to-blue-400"
            bgColor="bg-blue-950/50"
            borderColor="border-blue-600/50"
            id="query-validator"
            description="Validates that the query has all necessary information"
            onToggleExpand={setExpandedNode}
          />
        </motion.div>

        {/* Conditional path based on validity */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-2 gap-8 mb-4"
        >
          <div className="space-y-4">
            <div className="text-center text-sm text-gray-400">Valid Query</div>
            <Connector color="bg-green-500" />
            <BlockNode
              title="Query Router"
              icon={<Cpu className="w-6 h-6 text-blue-400" />}
              color="from-blue-600 to-blue-400"
              bgColor="bg-blue-950/50"
              borderColor="border-blue-600/50"
              id="router"
              description="Routes the query to the appropriate agent path"
              onToggleExpand={setExpandedNode}
            />
          </div>

          <div className="space-y-4">
            <div className="text-center text-sm text-gray-400">
              Invalid Query
            </div>
            <Connector color="bg-red-500" />
            <BlockNode
              title="Incomplete Query Handler"
              icon={<Cpu className="w-6 h-6 text-red-400" />}
              color="from-red-600 to-red-400"
              bgColor="bg-red-950/50"
              borderColor="border-red-600/50"
              id="incomplete-handler"
              description="Asks user for more information to complete the query"
              onToggleExpand={setExpandedNode}
            />
          </div>
        </motion.div>

        <Connector color="bg-blue-500" />

        {/* Context Analysis */}
        <motion.div variants={itemVariants} className="mb-4">
          <BlockNode
            title="Context Analyzer"
            icon={<Brain className="w-6 h-6 text-indigo-400" />}
            color="from-indigo-600 to-blue-500"
            bgColor="bg-indigo-950/50"
            borderColor="border-indigo-600/50"
            id="lwc-analysis"
            description="Analyzes requirements for LWC creation"
            onToggleExpand={setExpandedNode}
          />

          <BlockNode
            title="Test Analysis"
            icon={<Brain className="w-6 h-6 text-indigo-400" />}
            color="from-indigo-600 to-blue-500"
            bgColor="bg-indigo-950/50"
            borderColor="border-indigo-600/50"
            id="test-analysis"
            description="Analyzes code structure for test coverage"
            onToggleExpand={setExpandedNode}
          />
        </motion.div>

        <Connector color="bg-fuchsia-500" />

        {/* Generation Layer (3 columns) */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-3 gap-4 mb-4"
        >
          <BlockNode
            title="Apex Generator"
            icon={<Sparkles className="w-6 h-6 text-fuchsia-400" />}
            color="from-fuchsia-600 to-purple-500"
            bgColor="bg-fuchsia-950/50"
            borderColor="border-fuchsia-600/50"
            id="apex-gen"
            description="Generates Apex classes with error handling"
            onToggleExpand={setExpandedNode}
          />

          <BlockNode
            title="LWC Generator"
            icon={<Sparkles className="w-6 h-6 text-fuchsia-400" />}
            color="from-fuchsia-600 to-purple-500"
            bgColor="bg-fuchsia-950/50"
            borderColor="border-fuchsia-600/50"
            id="lwc-gen"
            description="Generates Lightning Web Components"
            onToggleExpand={setExpandedNode}
          />

          <BlockNode
            title="Test Generator"
            icon={<Sparkles className="w-6 h-6 text-fuchsia-400" />}
            color="from-fuchsia-600 to-purple-500"
            bgColor="bg-fuchsia-950/50"
            borderColor="border-fuchsia-600/50"
            id="test-gen"
            description="Generates comprehensive test classes"
            onToggleExpand={setExpandedNode}
          />
        </motion.div>

        <Connector color="bg-blue-500" />

        {/* Generated Code Layer (3 columns) */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-3 gap-4 mb-4"
        >
          <BlockNode
            title="Apex Code"
            icon={<Code2 className="w-6 h-6 text-blue-400" />}
            color="from-blue-600 to-cyan-500"
            bgColor="bg-blue-950/50"
            borderColor="border-blue-600/50"
            id="apex-code"
            description="Generated Apex code ready for presentation"
            onToggleExpand={setExpandedNode}
          />

          <BlockNode
            title="LWC Code"
            icon={<Blocks className="w-6 h-6 text-blue-400" />}
            color="from-blue-600 to-cyan-500"
            bgColor="bg-blue-950/50"
            borderColor="border-blue-600/50"
            id="lwc-code"
            description="Generated Lightning Web Component code"
            onToggleExpand={setExpandedNode}
          />

          <BlockNode
            title="Test Code"
            icon={<TestTube2 className="w-6 h-6 text-green-400" />}
            color="from-green-600 to-emerald-500"
            bgColor="bg-green-950/50"
            borderColor="border-green-600/50"
            id="test-code"
            description="Generated test classes with assertions"
            onToggleExpand={setExpandedNode}
          />
        </motion.div>

        <Connector color="bg-blue-500" />

        {/* LLM Layer */}
        <motion.div variants={itemVariants} className="mb-4">
          <BlockNode
            title="IBM Granite 3.2 LLM"
            icon={<Server className="w-6 h-6 text-blue-400" />}
            color="from-blue-600 to-blue-800"
            bgColor="bg-blue-950/50"
            borderColor="border-blue-600/50"
            id="llm"
            description="Large Language Model that powers the code generation"
            onToggleExpand={setExpandedNode}
          />
        </motion.div>

        <Connector color="bg-green-500" />

        {/* Response */}
        <motion.div variants={itemVariants}>
          <BlockNode
            title="Response"
            icon={<Server className="w-6 h-6 text-green-400" />}
            color="from-green-600 to-green-800"
            bgColor="bg-green-900/30"
            borderColor="border-green-700"
            id="response"
            description="The formatted code response ready for evaluation"
            onToggleExpand={setExpandedNode}
          />
        </motion.div>
      </motion.div>
    </div>
  );

  const renderRetrievalDiagram = () => (
    <div className="p-6 max-w-5xl mx-auto">
      <motion.div
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Analysis Result */}
        <motion.div variants={itemVariants} className="mb-4">
          <BlockNode
            title="Analysis Result"
            icon={<Brain className="w-6 h-6 text-indigo-400" />}
            color="from-indigo-600 to-blue-500"
            bgColor="bg-indigo-950/50"
            borderColor="border-indigo-600/50"
            id="analysis-result"
            description="The detailed analysis of what context is needed"
            onToggleExpand={setExpandedNode}
          />
        </motion.div>

        <Connector color="bg-purple-500" />

        {/* Retrieval Agents Layer (3 columns) */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-3 gap-4 mb-4"
        >
          <BlockNode
            title="Apex Retrieval"
            icon={<Search className="w-6 h-6 text-purple-400" />}
            color="from-purple-600 to-indigo-500"
            bgColor="bg-purple-950/50"
            borderColor="border-purple-600/50"
            id="apex-retrieval"
            description="Retrieves relevant Apex code from the vector database"
            onToggleExpand={setExpandedNode}
          />

          <BlockNode
            title="LWC Retrieval"
            icon={<Search className="w-6 h-6 text-purple-400" />}
            color="from-purple-600 to-indigo-500"
            bgColor="bg-purple-950/50"
            borderColor="border-purple-600/50"
            id="lwc-retrieval"
            description="Retrieves Lightning Web Component code"
            onToggleExpand={setExpandedNode}
          />

          <BlockNode
            title="Test Retrieval"
            icon={<Search className="w-6 h-6 text-purple-400" />}
            color="from-purple-600 to-indigo-500"
            bgColor="bg-purple-950/50"
            borderColor="border-purple-600/50"
            id="test-retrieval"
            description="Retrieves test code patterns and examples"
            onToggleExpand={setExpandedNode}
          />
        </motion.div>

        <Connector color="bg-gray-500" />

        {/* Vector Database */}
        <motion.div variants={itemVariants} className="mb-4">
          <BlockNode
            title="Milvus Vector Database"
            icon={<Database className="w-6 h-6 text-gray-400" />}
            color="from-gray-600 to-gray-700"
            bgColor="bg-gray-900"
            borderColor="border-gray-700"
            id="vector-db"
            description="Vector database storing embeddings of Salesforce code and documentation"
            onToggleExpand={setExpandedNode}
          />
        </motion.div>

        <Connector color="bg-blue-500" />

        {/* Retrieved Content Layer (3 columns) */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-3 gap-4 mb-4"
        >
          <BlockNode
            title="Apex Content"
            icon={<Code2 className="w-6 h-6 text-blue-400" />}
            color="from-blue-600 to-cyan-500"
            bgColor="bg-blue-950/50"
            borderColor="border-blue-600/50"
            id="apex-content"
            description="Retrieved Apex code context for response generation"
            onToggleExpand={setExpandedNode}
          />

          <BlockNode
            title="LWC Content"
            icon={<Blocks className="w-6 h-6 text-blue-400" />}
            color="from-blue-600 to-cyan-500"
            bgColor="bg-blue-950/50"
            borderColor="border-blue-600/50"
            id="lwc-content"
            description="Retrieved Lightning Web Component code and patterns"
            onToggleExpand={setExpandedNode}
          />

          <BlockNode
            title="Test Content"
            icon={<TestTube2 className="w-6 h-6 text-green-400" />}
            color="from-green-600 to-emerald-500"
            bgColor="bg-green-950/50"
            borderColor="border-green-600/50"
            id="test-content"
            description="Retrieved test classes and testing patterns"
            onToggleExpand={setExpandedNode}
          />
        </motion.div>

        <Connector color="bg-fuchsia-500" />

        {/* Generator */}
        <motion.div variants={itemVariants}>
          <BlockNode
            title="Code Generator"
            icon={<Sparkles className="w-6 h-6 text-fuchsia-400" />}
            color="from-fuchsia-600 to-purple-500"
            bgColor="bg-fuchsia-950/50"
            borderColor="border-fuchsia-600/50"
            id="generator"
            description="Uses the retrieved context to create code responses"
            onToggleExpand={setExpandedNode}
          />
        </motion.div>
      </motion.div>
    </div>
  );

  const renderProcessingDiagram = () => (
    <div className="p-6 max-w-5xl mx-auto">
      <motion.div
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Retrieved Context */}
        <motion.div variants={itemVariants} className="mb-4">
          <BlockNode
            title="Retrieved Context"
            icon={<Database className="w-6 h-6 text-gray-400" />}
            color="from-gray-600 to-gray-800"
            bgColor="bg-gray-900"
            borderColor="border-gray-700"
            id="context"
            description="The context retrieved from the vector database"
            onToggleExpand={setExpandedNode}
          />
        </motion.div>

        <Connector color="bg-indigo-500" />

        {/* Analysis Layer (3 columns) */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-3 gap-4 mb-4"
        >
          <BlockNode
            title="Apex Analysis"
            icon={<Brain className="w-6 h-6 text-indigo-400" />}
            color="from-indigo-600 to-blue-500"
            bgColor="bg-indigo-950/50"
            borderColor="border-indigo-600/50"
            id="apex-analysis"
            description="Analyzes requirements for Apex code generation"
            onToggleExpand={setExpandedNode}
          />

          <BlockNode
            title="LWC Analysis"
            icon={<Brain className="w-6 h-6 text-indigo-400" />}
            color="from-indigo-600 to-blue-500"
            bgColor="bg-indigo-950/50"
            borderColor="border-purple-600/50"
            id="context-analyzer"
            description="Determines what context is needed for code generation"
            onToggleExpand={setExpandedNode}
          />
        </motion.div>

        <Connector color="bg-purple-500" />

        {/* Next Stage */}
        <motion.div variants={itemVariants}>
          <BlockNode
            title="Next Agent"
            icon={<ArrowRight className="w-6 h-6 text-purple-400" />}
            color="from-purple-600 to-indigo-500"
            bgColor="bg-purple-950/50"
            borderColor="border-purple-600/50"
            id="next-agent"
            description="Routes to appropriate specialized retrieval or generation agent"
            onToggleExpand={setExpandedNode}
          />
        </motion.div>
      </motion.div>
    </div>
  );

  const renderEvaluationDiagram = () => (
    <div className="p-6 max-w-5xl mx-auto">
      <motion.div
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Generated Response */}
        <motion.div variants={itemVariants} className="mb-4">
          <BlockNode
            title="Generated Response"
            icon={<Code2 className="w-6 h-6 text-fuchsia-400" />}
            color="from-fuchsia-600 to-purple-500"
            bgColor="bg-fuchsia-950/50"
            borderColor="border-fuchsia-600/50"
            id="generated-response"
            description="The initial generated code response"
            onToggleExpand={setExpandedNode}
          />
        </motion.div>

        <Connector color="bg-orange-500" />

        {/* Evaluator Agent */}
        <motion.div variants={itemVariants} className="mb-4">
          <BlockNode
            title="Evaluator Agent"
            icon={<Sparkles className="w-6 h-6 text-orange-400" />}
            color="from-orange-600 to-amber-500"
            bgColor="bg-orange-950/50"
            borderColor="border-orange-600/50"
            id="evaluator"
            description="Evaluates response quality and correctness"
            onToggleExpand={setExpandedNode}
          />
        </motion.div>

        {/* Conditional paths based on evaluation */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-2 gap-8 mb-4"
        >
          <div className="space-y-4">
            <div className="text-center text-sm text-gray-400">
              Quality Check
            </div>
            <Connector color="bg-green-500" />
            <BlockNode
              title="Good Response"
              icon={<Sparkles className="w-6 h-6 text-green-400" />}
              color="from-green-600 to-emerald-500"
              bgColor="bg-green-950/50"
              borderColor="border-green-600/50"
              id="good-response"
              description="Validated response meeting quality standards"
              onToggleExpand={setExpandedNode}
            />
          </div>

          <div className="space-y-4">
            <div className="text-center text-sm text-gray-400">Error Check</div>
            <Connector color="bg-red-500" />
            <BlockNode
              title="Error Response"
              icon={<Sparkles className="w-6 h-6 text-red-400" />}
              color="from-red-600 to-rose-500"
              bgColor="bg-red-950/50"
              borderColor="border-red-600/50"
              id="error-response"
              description="Error message explaining what went wrong"
              onToggleExpand={setExpandedNode}
            />
          </div>
        </motion.div>

        <Connector color="bg-blue-500" />

        {/* Final Response */}
        <motion.div variants={itemVariants} className="mb-4">
          <BlockNode
            title="Final Response"
            icon={<Server className="w-6 h-6 text-blue-400" />}
            color="from-blue-600 to-blue-800"
            bgColor="bg-blue-950/50"
            borderColor="border-blue-600/50"
            id="final"
            description="Final formatted response with explanation"
            onToggleExpand={setExpandedNode}
          />
        </motion.div>

        <Connector color="bg-gray-500" />

        {/* User */}
        <motion.div variants={itemVariants}>
          <BlockNode
            title="User"
            icon={<Database className="w-6 h-6 text-gray-400" />}
            color="from-gray-600 to-gray-800"
            bgColor="bg-gray-900"
            borderColor="border-gray-700"
            id="user"
            description="The user receives the generated Salesforce code"
            onToggleExpand={setExpandedNode}
          />
        </motion.div>
      </motion.div>
    </div>
  );

  // Function to get the appropriate diagram based on the current step
  const getDiagramComponent = () => {
    switch (steps[currentStep].id) {
      case "overview":
        return renderOverviewDiagram();
      case "query":
        return renderQueryDiagram();
      case "retrieval":
        return renderRetrievalDiagram();
      case "processing":
        return renderProcessingDiagram();
      case "evaluation":
        return renderEvaluationDiagram();
      default:
        return renderOverviewDiagram();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        className="relative w-full max-w-7xl max-h-[90vh] overflow-auto bg-black border border-gray-800 rounded-xl shadow-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-black/90 backdrop-blur-md border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              ISC-CodeConnect Architecture
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-800 transition-colors"
          >
            <X className="w-6 h-6 text-gray-400 hover:text-white" />
          </button>
        </div>

        {/* Diagram content */}
        <div className="p-6">
          {/* Step Navigation */}
          <div className="flex justify-center mb-6 overflow-x-auto pb-2">
            <div className="flex space-x-1">
              {steps.map((step, index) => (
                <button
                  key={step.id}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                    ${
                      currentStep === index
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                        : "bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800"
                    }`}
                  onClick={() => setCurrentStep(index)}
                >
                  {step.title}
                </button>
              ))}
            </div>
          </div>

          {/* Title and description */}
          <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-white mb-2">
              {steps[currentStep].title}
            </h3>
            <p className="text-gray-400 max-w-3xl mx-auto">
              {currentStep === 0 &&
                "Overview of the ISC-CodeConnect multi-agent architecture and workflow."}
              {currentStep === 1 &&
                "How the system analyzes and routes user queries to the appropriate agents."}
              {currentStep === 2 &&
                "How relevant Salesforce code context is retrieved from the vector database."}
              {currentStep === 3 &&
                "How the system generates Apex, LWC, and Test code using IBM Granite LLM."}
              {currentStep === 4 &&
                "How responses are evaluated and refined before being presented to the user."}
            </p>
          </div>

          {/* Current diagram */}
          <AnimatePresence mode="wait">
            <motion.div
              key={steps[currentStep].id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-gray-950 rounded-lg border border-gray-800 shadow-xl overflow-hidden"
            >
              {getDiagramComponent()}
            </motion.div>
          </AnimatePresence>

          {/* Controls */}
          <div className="flex justify-between items-center mt-6">
            <button
              className="px-4 py-2 bg-gray-900 rounded-lg text-gray-400 hover:text-white transition-colors"
              onClick={() =>
                setCurrentStep((prev) =>
                  prev > 0 ? prev - 1 : steps.length - 1
                )
              }
            >
              Previous
            </button>

            <button
              className={`px-4 py-2 rounded-lg transition-colors
                ${
                  autoPlay
                    ? "bg-purple-600 text-white"
                    : "bg-gray-900 text-gray-400 hover:text-white"
                }`}
              onClick={() => setAutoPlay(!autoPlay)}
            >
              {autoPlay ? "Pause Auto-Play" : "Auto-Play"}
            </button>

            <button
              className="px-4 py-2 bg-gray-900 rounded-lg text-gray-400 hover:text-white transition-colors"
              onClick={() =>
                setCurrentStep((prev) =>
                  prev < steps.length - 1 ? prev + 1 : 0
                )
              }
            >
              Next
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ArchitectureDiagram;
