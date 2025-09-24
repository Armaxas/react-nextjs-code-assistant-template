"use client";
import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Code2 } from "lucide-react";

export const HeroIllustration = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
    className="relative w-full max-w-2xl mx-auto mt-8"
  >
    <div className="relative">
      {/* Terminal Window */}
      <div className="rounded-xl bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 overflow-hidden shadow-2xl">
        {/* Terminal Header */}
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-800/50 border-b border-gray-700/50">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex-1 text-center">
            <span className="text-sm text-gray-400">ISC-CodeConnect</span>
          </div>
        </div>

        {/* Terminal Content */}
        <div className="p-4 space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-start gap-3"
          >
            <Sparkles className="w-6 h-6 text-blue-400 mt-1" />
            <div className="flex-1">
              <div className="text-gray-300 bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                How can I assist with your Salesforce development today?
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex items-start gap-3 justify-end"
          >
            <div className="flex-1">
              <div className="text-gray-300 bg-purple-500/10 rounded-lg p-3 border border-purple-500/20">
                Generate an Apex class for handling custom object triggers
              </div>
            </div>
            <Code2 className="w-6 h-6 text-purple-400 mt-1" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="flex items-start gap-3"
          >
            <Sparkles className="w-6 h-6 text-blue-400 mt-1" />
            <div className="flex-1">
              <div className="text-gray-300 bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                <div className="typing-animation">
                  Generating Apex class with best practices...
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute -z-10 inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-violet-500/20 blur-3xl" />
    </div>
  </motion.div>
);
