"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

const faqs = [
  {
    category: "MVP2 Features",
    questions: [
      {
        id: 1,
        question: "What's new in MVP2?",
        answer:
          "MVP2 introduces 11 major enhancements including Code Intelligence Hub, Multi-Agent Orchestration, Requirement Blueprint, Enhanced Feedback Dashboard, Agent Scratchpad, improved GitHub/JIRA integration, Chat Sharing, IBM Granite models, and a modern UI with 50% faster navigation.",
      },
      {
        id: 2,
        question: "How does the Multi-Agent System work?",
        answer:
          "Our advanced multi-agent system features a Supervisor agent that coordinates specialized AI agents, including RAG-powered research agents. This allows for complex task handling where different agents collaborate to provide comprehensive, accurate solutions tailored to your specific needs.",
      },
      {
        id: 3,
        question: "What is the Code Intelligence Hub?",
        answer:
          "The Code Intelligence Hub provides AI-powered repository analysis with PR summaries, commit insights, dependency mapping, and code quality recommendations. It gives you comprehensive understanding of your codebase structure and development patterns.",
      },
      {
        id: 4,
        question: "How does the Agent Scratchpad work?",
        answer:
          "The Agent Scratchpad provides transparency into AI reasoning by showing step-by-step thought processes, decision-making logic, and how multiple agents collaborate. You can watch the AI work through problems in real-time and understand how it arrives at solutions.",
      },
    ],
  },
  {
    category: "Getting Started",
    questions: [
      {
        id: 5,
        question: "How do I get started with ISC-CodeConnect MVP2?",
        answer:
          "Simply sign in with your IBM w3Id credentials to access all MVP2 features. Start by exploring the Code Intelligence Hub, try the Requirement Blueprint for your next Salesforce project, or use the enhanced chat interface with our new IBM Granite models.",
      },
      {
        id: 6,
        question: "What types of Salesforce development can MVP2 help with?",
        answer:
          "MVP2 supports comprehensive Salesforce development including Apex classes, triggers, Lightning Web Components, automated testing, requirement analysis, architecture planning, and JIRA workflow integration. The new Requirement Blueprint feature helps transform ideas into structured implementation plans.",
      },
      {
        id: 7,
        question: "How do I use the Requirement Blueprint feature?",
        answer:
          "Describe your Salesforce feature idea in natural language, and the Requirement Blueprint will transform it into a structured plan with object models, workflow requirements, integration points, and step-by-step implementation guidance using AI-powered analysis.",
      },
    ],
  },
  {
    category: "Integration & Workflow",
    questions: [
      {
        id: 8,
        question: "How does the enhanced JIRA integration work?",
        answer:
          "MVP2 provides complete JIRA integration allowing you to create sub-tasks directly from feedback, track development progress automatically, manage project status with real-time updates, and maintain seamless visibility from ideation through deployment.",
      },
      {
        id: 9,
        question: "What GitHub capabilities are available?",
        answer:
          "Enhanced GitHub integration includes intelligent repository browsing, branch selection and comparison, secure IBMSC repository access, and integration with development workflows. You can browse repositories with advanced search and seamlessly integrate findings into your development process.",
      },
      {
        id: 10,
        question: "How does Chat Sharing work?",
        answer:
          "Share your AI conversations with team members, build collaborative knowledge bases, maintain persistent chat history with search capabilities, export conversations for documentation, and collaborate effectively with role-based access controls.",
      },
      {
        id: 11,
        question: "Can I integrate MVP2 with my existing development workflow?",
        answer:
          "Absolutely! MVP2 integrates seamlessly with your existing tools including GitHub repositories, JIRA projects, and development pipelines. The enhanced workflow integration maintains your current processes while adding powerful AI capabilities.",
      },
    ],
  },
  {
    category: "Technical & Performance",
    questions: [
      {
        id: 12,
        question: "What are the system requirements for MVP2?",
        answer:
          "MVP2 is a web-based solution that works with any modern browser. No local installation required. You only need your IBM w3Id credentials and appropriate access permissions. The new UI is optimized for performance across desktop and mobile devices.",
      },
      {
        id: 13,
        question: "How much faster is the new interface?",
        answer:
          "MVP2 delivers 50% faster navigation compared to the previous version, with optimized loading times, streamlined workflows, and a modern UI design that reduces cognitive load. The interface is also WCAG compliant for accessibility.",
      },
      {
        id: 14,
        question: "What IBM Granite models are used?",
        answer:
          "MVP2 leverages multiple specialized IBM Granite models optimized for different development tasks including code generation, requirement analysis, research, and reasoning. The multi-agent system automatically selects the best model for each specific task.",
      },
      {
        id: 15,
        question: "How accurate and reliable are the AI-generated solutions?",
        answer:
          "MVP2's multi-agent system with RAG-powered research provides highly accurate, context-aware responses. The AI generates production-ready code following best practices, includes proper error handling, and is optimized for Salesforce environments. Always review generated solutions before deployment.",
      },
    ],
  },
  {
    category: "Access & Security",
    questions: [
      {
        id: 16,
        question: "How is access controlled in MVP2?",
        answer:
          "Access is managed through IBM w3Id authentication with enterprise-grade security. Your permissions align with organizational roles and Salesforce access levels. The enhanced GitHub integration maintains secure access to IBMSC repositories.",
      },
      {
        id: 17,
        question: "Can I share MVP2 features with my team?",
        answer:
          "Yes! MVP2 includes comprehensive sharing capabilities. Share chat conversations, collaborate on requirement blueprints, export solutions for team review, and build shared knowledge bases. All sharing respects your organization's access controls.",
      },
      {
        id: 18,
        question: "How is my data protected?",
        answer:
          "MVP2 follows IBM's enterprise security standards with encrypted data transmission, secure authentication, and compliance with organizational data policies. Your code, conversations, and development data are protected with industry-standard security measures.",
      },
    ],
  },
];

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

const FAQItem = ({ question, answer, isOpen, onToggle }: FAQItemProps) => {
  return (
    <div className="border-b border-gray-800">
      <button
        className="w-full py-6 flex justify-between items-center focus:outline-none group"
        onClick={onToggle}
      >
        <span className="text-left text-lg font-medium text-gray-200 group-hover:text-white">
          {question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 ml-4"
        >
          <Plus className="w-5 h-5 text-gray-400 group-hover:text-white" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="pb-6 text-gray-400 leading-relaxed">{answer}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface CategorySectionProps {
  category: string;
  questions: Array<{
    id: number;
    question: string;
    answer: string;
  }>;
}

const CategorySection = ({ category, questions }: CategorySectionProps) => {
  const [openId, setOpenId] = useState<number | null>(null);

  return (
    <div className="mb-12">
      <h3 className="text-2xl font-semibold text-white mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
        {category}
      </h3>
      <div className="space-y-2">
        {questions.map((item) => (
          <FAQItem
            key={item.id}
            question={item.question}
            answer={item.answer}
            isOpen={openId === item.id}
            onToggle={() => setOpenId(openId === item.id ? null : item.id)}
          />
        ))}
      </div>
    </div>
  );
};

export const FAQ = () => {
  return (
    <section className="py-20 relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/10 to-transparent" />

      <div className="container mx-auto px-4 relative">
        <div className="max-w-3xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-400 text-lg">
              Everything you need to know about ISC-CodeConnect MVP2 and its
              powerful new features
            </p>
          </motion.div>

          {/* FAQ Categories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {faqs.map((category) => (
              <CategorySection
                key={category.category}
                category={category.category}
                questions={category.questions}
              />
            ))}
          </motion.div>

          {/* Support Link */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-16 text-center"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 blur-md rounded-xl"></div>
              <div className="relative bg-black/30 backdrop-blur-sm rounded-xl border border-gray-800/50 p-6">
                <h3 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-3">
                  Still have questions?
                </h3>
                <p className="text-gray-400 mb-5">
                  We are here to help. Reach out to our support team for
                  assistance.
                </p>
                <a
                  href="https://ibm.enterprise.slack.com/archives/C08A7F16P7E"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2 rounded-lg hover:shadow-blue-500/20 hover:shadow-lg transition-all duration-300"
                >
                  <span>Contact Support</span>
                  <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"></path>
                    <path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"></path>
                    <path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z"></path>
                    <path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z"></path>
                    <path d="M14 14.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z"></path>
                    <path d="M15.5 19H14v1.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"></path>
                    <path d="M10 9.5C10 8.67 9.33 8 8.5 8h-5C2.67 8 2 8.67 2 9.5S2.67 11 3.5 11h5c.83 0 1.5-.67 1.5-1.5z"></path>
                    <path d="M8.5 5H10V3.5C10 2.67 9.33 2 8.5 2S7 2.67 7 3.5 7.67 5 8.5 5z"></path>
                  </svg>
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
