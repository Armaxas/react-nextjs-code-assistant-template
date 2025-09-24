"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Workflow,
  Cpu,
  CheckCircle,
  Users,
  Search,
} from "lucide-react";

const steps = [
  {
    id: 1,
    title: "Input Your Request",
    description: "Describe your development needs in natural language",
    icon: MessageSquare,
    color: "from-blue-600 to-blue-400",
    example: {
      type: "user-input",
      content:
        "Generate an Apex trigger to update related contacts when an account's rating changes",
    },
  },
  {
    id: 2,
    title: "Supervisor Agent Analysis",
    description:
      "AI Supervisor breaks down complex queries into multiple stages and orchestrates execution",
    icon: Users,
    color: "from-indigo-600 to-purple-400",
    example: {
      type: "processing",
      content:
        "Supervisor Agent Planning:\n- Stage 1: Analyze trigger requirements\n- Stage 2: Research metadata context\n- Stage 3: Generate optimized code\n- Stage 4: Create test coverage",
    },
  },
  {
    id: 3,
    title: "RAG-Powered Research",
    description:
      "Research Agent identifies classes, functions, objects, and fields to provide accurate metadata context",
    icon: Search,
    color: "from-purple-600 to-pink-400",
    example: {
      type: "research",
      content:
        "Research Agent Analysis:\n- Account object fields & relationships\n- Contact object metadata\n- Trigger best practices\n- Bulk processing patterns\n- Error handling frameworks",
    },
  },
  {
    id: 4,
    title: "Multi-Agent Collaboration",
    description:
      "Specialized agents work together using enriched metadata context to generate solutions",
    icon: Workflow,
    color: "from-pink-600 to-red-400",
    example: {
      type: "collaboration",
      content:
        "Agent Collaboration:\n- Code Generator: Using metadata context\n- Logic Analyzer: Optimizing with field data\n- Test Writer: Covering all scenarios\n- Quality Checker: Ensuring best practices",
    },
  },
  {
    id: 5,
    title: "Production-Ready Code",
    description:
      "Receive optimized code with proper error handling and comprehensive metadata awareness",
    icon: CheckCircle,
    color: "from-green-600 to-green-400",
    example: {
      type: "code",
      content: `trigger AccountRatingTrigger on Account (after update) {
    // Metadata-aware implementation
    // Bulk-optimized with field context
    // Comprehensive error handling
    // Full test coverage included`,
    },
  },
];

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  example: {
    type: string;
    content: string;
  };
}

const StepCard = ({
  step,
  isActive,
  onClick,
}: {
  step: Step;
  isActive: boolean;
  onClick: () => void;
}) => (
  <div className="relative">
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 rounded-xl bg-gray-800/60 backdrop-blur-sm border border-gray-700"
        />
      )}
    </AnimatePresence>
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative cursor-pointer rounded-xl p-6 bg-gray-900/40 hover:bg-gray-800/40"
      onClick={onClick}
      layout
    >
      <div className="flex items-start gap-4">
        <div className={`rounded-lg p-3 bg-gradient-to-r ${step.color}`}>
          <step.icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white mb-2">
            {step.title}
          </h3>
          <p className="text-gray-400 text-sm">{step.description}</p>
        </div>
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-800 text-gray-400">
          {step.id}
        </div>
      </div>
    </motion.div>
  </div>
);

const CodeExample = ({ step }: { step: Step }) => (
  <AnimatePresence mode="wait">
    <motion.div
      key={step.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-gray-800"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between text-gray-400">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5" />
            <span>ISC-CodeConnect</span>
          </div>
          <div className="text-sm">Step {step.id}/5</div>
        </div>
        <div className="font-mono text-sm text-gray-300 bg-gray-950/50 rounded-lg p-4">
          <pre className="whitespace-pre-wrap">{step.example.content}</pre>
          <div className="mt-2 h-2 w-20 bg-blue-500/20 rounded animate-pulse" />
        </div>
      </div>
    </motion.div>
  </AnimatePresence>
);

export const HowItWorks = () => {
  const [activeStep, setActiveStep] = useState(1);

  return (
    <section className="py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4"
      >
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 mb-4">
            How It Works
          </h2>
          <p className="text-gray-400 text-lg max-w-3xl mx-auto">
            Experience advanced AI-powered Salesforce development with our
            Supervisor Agent orchestrating multi-stage workflows and RAG-powered
            Research Agents providing comprehensive metadata context
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Steps */}
          <div className="lg:col-span-3 space-y-4">
            {steps.map((step) => (
              <StepCard
                key={step.id}
                step={step}
                isActive={activeStep === step.id}
                onClick={() => setActiveStep(step.id)}
              />
            ))}
          </div>

          {/* Interactive Example */}
          <div className="lg:col-span-2">
            <CodeExample
              step={steps.find((s) => s.id === activeStep) || steps[0]}
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
};
