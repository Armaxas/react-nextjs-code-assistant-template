"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import ArchitectureDiagram from "@/components/ArchitectureDiagram";

import { useSession } from "next-auth/react";

export default function ArchitecturePage() {
  // Add a null check with the optional chaining operator
  const { data: session } = useSession() || {};
  // Initialize to false so when user arrives on the page, they see the content first
  const [showDiagram, setShowDiagram] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar
        session={session}
        showArchitecture={showDiagram}
        setShowArchitecture={setShowDiagram}
      />

      <div className="container mx-auto px-4 pt-20 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-5xl mx-auto mt-20"
        >
          {/* Page Title */}
          <div className="flex flex-col items-center justify-center mb-12">
            <motion.div
              className="flex items-center space-x-3 mb-4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Sparkles className="w-10 h-10 text-blue-400" />
              <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                Architecture Overview
              </h1>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              className="text-lg text-gray-300 text-center max-w-xl mb-8"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              Explore the multi-agent LangGraph architecture powering
              ISC-CodeConnect Salesforce code assistant
            </motion.p>

            {/* Description */}
            <motion.div
              className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 mb-8"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <p className="text-gray-300 mb-4">
                ISC-CodeConnect utilizes a sophisticated multi-agent
                architecture powered by LangGraph and LangChain to provide
                intelligent Salesforce development assistance. The system routes
                user queries through specialized agents for context retrieval,
                analysis, code generation, and evaluation.
              </p>
              <p className="text-gray-300">
                The platform leverages IBM Granite 3.2 LLM for code generation
                and Milvus vector database for efficient retrieval of relevant
                Salesforce code patterns and documentation.
              </p>
            </motion.div>

            {/* Architecture Diagram CTA */}
            {!showDiagram && (
              <motion.button
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowDiagram(true)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4 }}
              >
                <span>Explore Interactive Architecture</span>
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Architecture Diagram */}
      {showDiagram && (
        <ArchitectureDiagram onClose={() => setShowDiagram(false)} />
      )}
    </div>
  );
}
