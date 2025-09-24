"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Workflow,
  BrainCircuit,
  GitPullRequest,
  ChevronRight,
  Users,
  Target,
  Heart,
  Settings,
  Zap,
  MessageSquare,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { BenefitModal } from "./BenefitModal";

// Define the Benefit interface
interface Benefit {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}

export const KeyBenefits: React.FC = () => {
  const [selectedBenefit, setSelectedBenefit] = useState<Benefit | null>(null);

  const benefits: Benefit[] = [
    {
      icon: <BrainCircuit className="w-8 h-8 text-white" />,
      title: "Code Intelligence Hub",
      description:
        "AI-powered repository analysis with PR summaries, commit insights, and dependency mapping for comprehensive code understanding",
      gradient: "from-purple-600 to-violet-500",
    },
    {
      icon: <Users className="w-8 h-8 text-white" />,
      title: "Multi-Agent Orchestration",
      description:
        "Supervisor agent coordinates specialized AI agents including RAG-powered research agents for complex task handling",
      gradient: "from-indigo-600 to-blue-500",
    },
    {
      icon: <Target className="w-8 h-8 text-white" />,
      title: "Smart Requirement Analysis",
      description:
        "Transform Salesforce ideas into structured blueprints with AI-powered analysis and implementation planning",
      gradient: "from-orange-600 to-red-500",
    },
    {
      icon: <Heart className="w-8 h-8 text-white" />,
      title: "Enhanced Feedback System",
      description:
        "Create JIRA sub-tasks directly from feedback with comprehensive usability metrics and tracking dashboard",
      gradient: "from-teal-600 to-cyan-500",
    },
    {
      icon: <Settings className="w-8 h-8 text-white" />,
      title: "Agent Transparency",
      description:
        "Visualize AI reasoning processes with step-by-step thought processes and decision-making transparency",
      gradient: "from-amber-600 to-yellow-500",
    },
    {
      icon: <GitPullRequest className="w-8 h-8 text-white" />,
      title: "Seamless GitHub Integration",
      description:
        "Enhanced repository browsing with branch selection, IBMSC access, and comprehensive development workflow integration",
      gradient: "from-gray-600 to-slate-500",
    },
    {
      icon: <Workflow className="w-8 h-8 text-white" />,
      title: "Unified JIRA Workflow",
      description:
        "Complete integration with JIRA for sub-task creation, status tracking, and seamless project management",
      gradient: "from-blue-600 to-indigo-500",
    },
    {
      icon: <MessageSquare className="w-8 h-8 text-white" />,
      title: "Advanced Chat Sharing",
      description:
        "Share conversations, build team knowledge bases, and collaborate effectively with persistent chat history",
      gradient: "from-pink-600 to-rose-500",
    },
    {
      icon: <Zap className="w-8 h-8 text-white" />,
      title: "Enhanced Performance",
      description:
        "50% faster navigation, modern UI with WCAG compliance, and optimized user experience across all features",
      gradient: "from-green-600 to-emerald-500",
    },
  ];

  const handleLearnMore = (benefit: Benefit) => {
    setSelectedBenefit(benefit);
  };

  const closeModal = () => {
    setSelectedBenefit(null);
  };

  return (
    <section className="py-20 relative">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 blur-3xl" />

      {/* Section header */}
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400 mb-4">
          💎 Key Benefits
        </h2>
        <p className="text-xl text-gray-400 max-w-3xl mx-auto">
          Experience the transformative power of MVP2 with advanced AI
          capabilities, seamless integrations, and enhanced developer
          productivity
        </p>
      </div>

      {/* Benefits grid */}
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative group h-full"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-r ${benefit.gradient} opacity-10 blur-xl rounded-2xl group-hover:opacity-20 transition-opacity duration-300`}
              />

              <Card className="relative backdrop-blur-sm bg-black/40 border-gray-800/50 group-hover:border-gray-700/50 p-8 rounded-2xl overflow-hidden h-full flex flex-col">
                <div className="flex items-center space-x-4 mb-4">
                  <div
                    className={`p-3 rounded-xl bg-gradient-to-r ${benefit.gradient} transform group-hover:scale-110 transition-transform duration-300`}
                  >
                    {benefit.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-200">
                    {benefit.title}
                  </h3>
                </div>

                <p className="text-gray-400 mt-auto">{benefit.description}</p>

                <div className="mt-4 pt-4 border-t border-gray-800">
                  <button
                    onClick={() => handleLearnMore(benefit)}
                    className={`text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r ${benefit.gradient} flex items-center hover:opacity-80 transition-opacity`}
                  >
                    Learn more
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Modal for showing benefit details */}
      <BenefitModal
        isOpen={!!selectedBenefit}
        onClose={closeModal}
        benefit={selectedBenefit}
      />
    </section>
  );
};

export default KeyBenefits;
