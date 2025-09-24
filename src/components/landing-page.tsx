"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  FileText,
  Brain,
  Github,
  Bot,
  Heart,
  Settings,
  Users,
  CheckCircle,
  ArrowRight,
  Star,
  Search,
  MessageSquare,
  Target,
  Layers,
} from "lucide-react";
import { signInW3id, signOutFormAction } from "@/app/(auth)/actions";
import { Session } from "next-auth";

// Import existing components
import { HeroIllustration } from "@/components/hero";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { KeyBenefits } from "@/components/sections/KeyBenefits";
import { Navbar } from "@/components/Navbar";
import { FAQ } from "@/components/FAQ";
import ArchitectureDiagram from "@/components/ArchitectureDiagram";

const SignIn: React.FC = () => {
  return (
    <form action={signInW3id}>
      <motion.button
        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
        type="submit"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Sign in with IBM Github
      </motion.button>
    </form>
  );
};

function SignOut(): React.JSX.Element {
  return (
    <form action={signOutFormAction}>
      <motion.button
        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
        type="submit"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Sign out
      </motion.button>
    </form>
  );
}

interface TypewriterTextProps {
  phrases: string[];
  interval?: number;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({ phrases }) => {
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const typeText = () => {
      const current = phrases[currentPhrase];
      if (!isDeleting) {
        if (text.length < current.length) {
          timeout = setTimeout(() => {
            setText(current.substring(0, text.length + 1));
          }, 50);
        } else {
          timeout = setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        if (text.length > 0) {
          timeout = setTimeout(() => {
            setText(current.substring(0, text.length - 1));
          }, 30);
        } else {
          setIsDeleting(false);
          setCurrentPhrase((prev) => (prev + 1) % phrases.length);
        }
      }
    };

    typeText();
    return () => clearTimeout(timeout);
  }, [text, isDeleting, currentPhrase, phrases]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full px-4 py-6"
    >
      <div className="relative">
        {/* Background glow effect */}
        <div className="absolute -inset-2 bg-gradient-to-r from-blue-600/20 via-violet-600/20 to-purple-600/20 blur-xl rounded-lg" />

        {/* Text container */}
        <div className="relative p-2">
          <span className="text-3xl md:text-4xl font-bold inline-block w-full text-center">
            {/* Gradient background for text */}
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400 text-transparent bg-clip-text">
              {text}
            </span>
            {/* Animated cursor */}
            <span className="animate-pulse ml-1 font-light text-blue-400">
              _
            </span>
          </span>
        </div>
      </div>
    </motion.div>
  );
};

interface LandingPageProps {
  session: Session | null;
}

export default function LandingPage({ session }: LandingPageProps) {
  const [showArchitecture, setShowArchitecture] = useState<boolean>(false);
  const user = session?.user?.email;

  const phrases: string[] = [
    "Code Intelligence Hub",
    "Requirement Blueprints",
    "Multi-Agent Collaboration",
    "GitHub Integration",
    "JIRA Workflow",
    "Agent Scratchpad",
    "Enhanced Feedback",
    "IBM Granite Models",
    "Chat Sharing",
    "Modern UI Experience",
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar
        session={session}
        showArchitecture={showArchitecture}
        setShowArchitecture={setShowArchitecture}
      />

      <div className="min-h-screen relative overflow-hidden">
        <div className="container mx-auto px-4 pt-20 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-5xl mx-auto mt-20"
          >
            {/* Main Title with Icon */}
            <div className="flex flex-col items-center justify-center">
              <motion.div
                className="flex items-center space-x-3 mb-6"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Sparkles className="w-10 h-10 text-blue-400" />
                <h1 className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                  ISC-CodeConnect
                </h1>
              </motion.div>

              {/* Subtitle - centered */}
              <motion.p
                className="text-lg text-gray-300 text-center max-w-2xl mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
              >
                The next-generation AI-powered assistant for Salesforce
                developers. Experience MVP2 with advanced multi-agent systems,
                code intelligence, and comprehensive JIRA integration.
              </motion.p>

              {/* Knowledge Base Update Notice */}
              <motion.div
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full mb-8"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Star className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-blue-300 font-medium">
                  Knowledge base updated through July 16, 2025
                </span>
              </motion.div>
            </div>

            {/* Add Typewriter Animation in a container */}
            <div className="relative mb-16 w-full max-w-4xl mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-violet-500/10 blur-xl rounded-3xl" />

              <div className="backdrop-blur-md bg-black/30 rounded-xl border border-gray-800/50 shadow-2xl">
                <TypewriterText phrases={phrases} />
              </div>
            </div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-6 mb-16"
            >
              <div className="mt-4">{user ? <SignOut /> : <SignIn />}</div>

              {/* Release Notes Button */}
              <motion.a
                href="/release-notes-mvp2.html"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-blue-500/25 transition-all duration-300 mt-4"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FileText className="w-5 h-5" />
                MVP2 Release Notes
              </motion.a>
            </motion.div>

            {/* MVP2 Features Showcase */}
            <motion.div
              className="mb-20"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-4">
                  🚀 MVP2 Key Features
                </h2>
                <p className="text-gray-300 max-w-2xl mx-auto">
                  Discover 11 powerful new features and enhancements designed to
                  revolutionize your development workflow
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {/* Repository Intelligence Hub */}
                <motion.div
                  className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-6 hover:border-purple-400/40 transition-all duration-300"
                  whileHover={{ scale: 1.02, y: -5 }}
                >
                  <Brain className="w-8 h-8 text-purple-400 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Repository Intelligence Hub
                  </h3>
                  <p className="text-gray-300 text-sm mb-3">
                    AI-powered repository analysis with PR insights, commit
                    summaries, and development workflow intelligence
                  </p>
                  <div className="flex items-center text-purple-400 text-xs">
                    <span className="bg-purple-500/20 px-2 py-1 rounded">
                      Beta
                    </span>
                  </div>
                </motion.div>

                {/* Requirement Blueprint */}
                <motion.div
                  className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-xl p-6 hover:border-orange-400/40 transition-all duration-300"
                  whileHover={{ scale: 1.02, y: -5 }}
                >
                  <FileText className="w-8 h-8 text-orange-400 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Requirement Blueprint
                  </h3>
                  <p className="text-gray-300 text-sm mb-3">
                    Transform Salesforce ideas into structured blueprints with
                    AI-powered analysis
                  </p>
                  <div className="flex items-center text-orange-400 text-xs">
                    <span className="bg-orange-500/20 px-2 py-1 rounded">
                      Beta
                    </span>
                  </div>
                </motion.div>

                {/* Multi-Agent System */}
                <motion.div
                  className="bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border border-indigo-500/20 rounded-xl p-6 hover:border-indigo-400/40 transition-all duration-300"
                  whileHover={{ scale: 1.02, y: -5 }}
                >
                  <Users className="w-8 h-8 text-indigo-400 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Multi-Agent System
                  </h3>
                  <p className="text-gray-300 text-sm mb-3">
                    Coordinated AI agents with supervisor and researcher
                    capabilities
                  </p>
                  <div className="flex items-center text-indigo-400 text-xs">
                    <span className="bg-indigo-500/20 px-2 py-1 rounded">
                      Multi-Agent
                    </span>
                  </div>
                </motion.div>

                {/* Enhanced Feedback */}
                <motion.div
                  className="bg-gradient-to-br from-teal-500/10 to-blue-500/10 border border-teal-500/20 rounded-xl p-6 hover:border-teal-400/40 transition-all duration-300"
                  whileHover={{ scale: 1.02, y: -5 }}
                >
                  <Heart className="w-8 h-8 text-teal-400 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Enhanced Feedback Dashboard
                  </h3>
                  <p className="text-gray-300 text-sm mb-3">
                    Create JIRA sub-tasks directly from feedback with usability
                    metrics
                  </p>
                  <div className="flex items-center text-teal-400 text-xs">
                    <span className="bg-teal-500/20 px-2 py-1 rounded">
                      Feedback
                    </span>
                  </div>
                </motion.div>

                {/* GitHub Integration */}
                <motion.div
                  className="bg-gradient-to-br from-gray-600/10 to-gray-800/10 border border-gray-600/20 rounded-xl p-6 hover:border-gray-500/40 transition-all duration-300"
                  whileHover={{ scale: 1.02, y: -5 }}
                >
                  <Github className="w-8 h-8 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Advanced Repository Analytics
                  </h3>
                  <p className="text-gray-300 text-sm mb-3">
                    Cross-PR impact analysis, historical context engine,
                    deployment risk assessment, and code quality trends
                  </p>
                  <div className="flex items-center text-gray-400 text-xs gap-1">
                    <span className="bg-gray-500/20 px-2 py-1 rounded">
                      Advanced Analytics
                    </span>
                    <span className="bg-green-500/20 px-2 py-1 rounded text-green-400">
                      New
                    </span>
                  </div>
                </motion.div>

                {/* Agent Scratchpad */}
                <motion.div
                  className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-xl p-6 hover:border-amber-400/40 transition-all duration-300"
                  whileHover={{ scale: 1.02, y: -5 }}
                >
                  <Settings className="w-8 h-8 text-amber-400 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Agent Scratchpad
                  </h3>
                  <p className="text-gray-300 text-sm mb-3">
                    Visualize AI thinking processes with step-by-step reasoning
                    transparency
                  </p>
                  <div className="flex items-center text-amber-400 text-xs">
                    <span className="bg-amber-500/20 px-2 py-1 rounded">
                      Transparency
                    </span>
                  </div>
                </motion.div>
              </div>

              {/* View All Features Link */}
              <motion.div
                className="text-center mt-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                <motion.a
                  href="/release-notes-mvp2.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors duration-200"
                  whileHover={{ x: 5 }}
                >
                  <span>View all 11 features in detail</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.a>
              </motion.div>
            </motion.div>

            {/* Architecture Modal */}
            <AnimatePresence>
              {showArchitecture && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-sm"
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="fixed inset-0 z-50 overflow-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ArchitectureDiagram
                      onClose={() => setShowArchitecture(false)}
                    />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mb-20">
              <HeroIllustration />
            </div>
          </motion.div>

          {/* Advanced Repository Analytics Section */}
          <motion.div
            className="mt-20 mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 mb-6">
                🔬 Advanced Repository Analytics
              </h2>
              <p className="text-gray-300 max-w-3xl mx-auto text-lg leading-relaxed">
                Cutting-edge insights that go beyond basic repository
                statistics. Understand your development patterns, predict
                conflicts, and make informed decisions with AI-powered
                analytics.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {/* Cross-PR Impact Analysis */}
              <motion.div
                className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-8 hover:border-cyan-400/40 transition-all duration-300"
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🔄</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white">
                    Cross-PR Impact Analysis
                  </h3>
                </div>
                <p className="text-gray-300 mb-4">
                  Identify potential conflicts between open PRs before they
                  become merge problems. Visualize critical path overlaps and
                  get intelligent merge recommendations.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full text-sm">
                    Conflict Detection
                  </span>
                  <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm">
                    Critical Path Analysis
                  </span>
                </div>
              </motion.div>

              {/* Historical Context Engine */}
              <motion.div
                className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-xl p-8 hover:border-purple-400/40 transition-all duration-300"
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📚</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white">
                    Historical Context Engine
                  </h3>
                </div>
                <p className="text-gray-300 mb-4">
                  Trace the &ldquo;why&rdquo; behind your code. Link current
                  changes to historical decisions, design discussions, and
                  evolution patterns to understand the complete story.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-sm">
                    Design History
                  </span>
                  <span className="bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-sm">
                    Evolution Tracking
                  </span>
                </div>
              </motion.div>

              {/* Code Quality Trends */}
              <motion.div
                className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-8 hover:border-green-400/40 transition-all duration-300"
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📈</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white">
                    Code Quality Trends
                  </h3>
                </div>
                <p className="text-gray-300 mb-4">
                  Monitor testing patterns, bug fix frequency, and refactoring
                  trends over time. Get actionable insights to improve your
                  development practices.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">
                    Quality Metrics
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-sm">
                    Trend Analysis
                  </span>
                </div>
              </motion.div>

              {/* Deployment Risk Assessment */}
              <motion.div
                className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-xl p-8 hover:border-orange-400/40 transition-all duration-300"
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white">
                    Deployment Risk Assessment
                  </h3>
                </div>
                <p className="text-gray-300 mb-4">
                  Evaluate deployment readiness with AI-powered risk analysis.
                  Get recommendations based on recent changes, testing patterns,
                  and repository health metrics.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-sm">
                    Risk Scoring
                  </span>
                  <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm">
                    Safety Recommendations
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Feature Highlight */}
            <motion.div
              className="mt-12 text-center"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-6 max-w-4xl mx-auto">
                <h4 className="text-lg font-semibold text-white mb-2">
                  🚀 Powered by Advanced AI Analytics
                </h4>
                <p className="text-gray-300">
                  These features leverage machine learning algorithms and
                  pattern recognition to provide insights that traditional
                  repository tools simply cannot offer. Make smarter decisions
                  with data-driven development intelligence.
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Include the proper sections with consistent spacing */}

          {/* Core Capabilities Section */}
          <motion.div
            className="mt-20 mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-6">
                🎯 Core AI Capabilities
              </h2>
              <p className="text-gray-300 max-w-3xl mx-auto text-lg leading-relaxed">
                Experience the power of advanced AI with IBM Granite models,
                multi-agent collaboration, intelligent code analysis, and
                comprehensive development support
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto mb-16">
              {/* Multi-Agent Orchestration */}
              <motion.div
                className="text-center bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border border-indigo-500/20 rounded-xl p-6 hover:border-indigo-400/40 transition-all duration-300"
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <div className="bg-gradient-to-br from-indigo-500/20 to-blue-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Multi-Agent System
                </h3>
                <p className="text-gray-300 text-sm">
                  Supervisor agent coordinates specialized AI agents for complex
                  tasks
                </p>
              </motion.div>

              {/* Repository Intelligence */}
              <motion.div
                className="text-center bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-500/20 rounded-xl p-6 hover:border-purple-400/40 transition-all duration-300"
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <div className="bg-gradient-to-br from-purple-500/20 to-violet-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Repository Intelligence
                </h3>
                <p className="text-gray-300 text-sm">
                  AI-powered repository analysis, PR insights, commit summaries,
                  and development workflow intelligence
                </p>
              </motion.div>

              {/* RAG-Powered Research */}
              <motion.div
                className="text-center bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-6 hover:border-emerald-400/40 transition-all duration-300"
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  RAG Research Agent
                </h3>
                <p className="text-gray-300 text-sm">
                  Retrieval-augmented generation for accurate, context-aware
                  responses
                </p>
              </motion.div>

              {/* IBM Granite Models */}
              <motion.div
                className="text-center bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-6 hover:border-blue-400/40 transition-all duration-300"
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  IBM Granite Models
                </h3>
                <p className="text-gray-300 text-sm">
                  Multiple specialized AI models optimized for development tasks
                </p>
              </motion.div>

              {/* Requirement Analysis */}
              <motion.div
                className="text-center bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-xl p-6 hover:border-orange-400/40 transition-all duration-300"
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Smart Requirements
                </h3>
                <p className="text-gray-300 text-sm">
                  Transform ideas into structured blueprints with AI analysis
                </p>
              </motion.div>

              {/* Conversational AI */}
              <motion.div
                className="text-center bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-500/20 rounded-xl p-6 hover:border-pink-400/40 transition-all duration-300"
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <div className="bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-pink-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Conversational AI
                </h3>
                <p className="text-gray-300 text-sm">
                  Natural language interaction with context-aware responses
                </p>
              </motion.div>

              {/* Agent Transparency */}
              <motion.div
                className="text-center bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-xl p-6 hover:border-amber-400/40 transition-all duration-300"
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <div className="bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Settings className="w-8 h-8 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Agent Transparency
                </h3>
                <p className="text-gray-300 text-sm">
                  Visualize AI reasoning with step-by-step thought processes
                </p>
              </motion.div>

              {/* Workflow Integration */}
              <motion.div
                className="text-center bg-gradient-to-br from-slate-500/10 to-gray-500/10 border border-slate-500/20 rounded-xl p-6 hover:border-slate-400/40 transition-all duration-300"
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <div className="bg-gradient-to-br from-slate-500/20 to-gray-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Layers className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Workflow Integration
                </h3>
                <p className="text-gray-300 text-sm">
                  Seamless integration with GitHub, JIRA, and development tools
                </p>
              </motion.div>
            </div>

            {/* Stats Section */}
            <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl border border-blue-500/20 p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <motion.div whileHover={{ scale: 1.05 }}>
                  <div className="text-3xl font-bold text-blue-400 mb-2">
                    11
                  </div>
                  <div className="text-gray-300">
                    New Features & Enhancements
                  </div>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }}>
                  <div className="text-3xl font-bold text-purple-400 mb-2">
                    50%
                  </div>
                  <div className="text-gray-300">Faster Navigation</div>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }}>
                  <div className="text-3xl font-bold text-pink-400 mb-2">
                    July 2025
                  </div>
                  <div className="text-gray-300">Latest Knowledge Base</div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          <div className="mt-20 mb-20">
            <HowItWorks />
          </div>

          <div className="mt-20 mb-20">
            <KeyBenefits />
          </div>

          {/* Enhanced CTA Section */}
          <motion.div
            className="mt-20 mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-3xl border border-blue-500/30 p-12 text-center">
              <motion.div
                initial={{ scale: 0.9 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <Sparkles className="w-16 h-16 text-blue-400 mx-auto mb-6" />
                <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-6">
                  Ready to Experience MVP2?
                </h2>
                <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
                  Join the future of Salesforce development with our AI-powered
                  assistant. Get started today and experience all 11 new
                  features.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-6">
                  <div>{user ? <SignOut /> : <SignIn />}</div>

                  <motion.a
                    href="/release-notes-mvp2.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-white/10 border border-white/20 text-white px-6 py-3 rounded-lg hover:bg-white/20 transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FileText className="w-5 h-5" />
                    Explore MVP2 Features
                  </motion.a>
                </div>

                {/* Feature highlights */}
                <div className="flex flex-wrap items-center justify-center gap-4 mt-8 text-sm text-gray-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>Code Intelligence Hub</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>Multi-Agent System</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>JIRA Integration</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>Enhanced Feedback</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          <div className="mt-20 mb-20">
            <FAQ />
          </div>
        </div>
      </div>
    </div>
  );
}
