"use client";
import React, { useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import {
  Users,
  Code2,
  AwardIcon,
  RocketIcon,
  GitBranchIcon,
  BookIcon,
  HeartIcon,
  MailIcon,
  BrainCircuitIcon,
  DatabaseIcon,
  Network,
  Workflow,
  GitGraph,
} from "lucide-react";
import { BackgroundGradientAnimation } from "@/components/ui/aceternity/background-gradient-animation";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { useRouter } from "next/navigation";
import TechStackSection from "@/components/TechStackSection";

// Enhanced StatCard with animations
const StatCard = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.05 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg blur group-hover:blur-xl transition-all duration-300" />
      <div className="relative bg-black/40 backdrop-blur-sm rounded-lg p-6 border border-gray-800">
        <motion.div
          animate={{ rotateY: isHovered ? 180 : 0 }}
          transition={{ duration: 0.6 }}
        >
          <Icon className="w-8 h-8 text-blue-400 mb-4" />
        </motion.div>
        <motion.div
          animate={{ scale: isHovered ? 1.1 : 1 }}
          className="text-3xl font-bold text-white mb-2"
        >
          {value}
        </motion.div>
        <div className="text-gray-400">{label}</div>
      </div>
    </motion.div>
  );
};

// Enhanced TechStackCard component
const TechStackCard = ({
  icon: Icon,
  title,
  description,
  delay,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  delay: number;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      viewport={{ once: true }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative group cursor-pointer"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl blur transition-all duration-300 group-hover:blur-xl" />
      <motion.div
        animate={{ scale: isHovered ? 1.02 : 1 }}
        className="relative bg-black/40 backdrop-blur-sm rounded-xl p-6 border border-gray-800 overflow-hidden"
      >
        <motion.div
          animate={{ y: isHovered ? -10 : 0 }}
          className="flex flex-col items-center text-center"
        >
          <Icon className="w-12 h-12 text-blue-400 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <AnimatePresence>
            {isHovered && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-gray-400"
              >
                {description}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

// Architecture Section Component
const ArchitectureSection = () => {
  const architectureComponents = [
    {
      icon: BrainCircuitIcon,
      title: "IBM WatsonX Platform",
      description:
        "Powered by IBM's Flagship Granite 3.0 models for state-of-the-art language understanding and generation.",
    },
    {
      icon: DatabaseIcon,
      title: "Milvus on WatsonX.Data",
      description:
        "Enterprise-grade vector database hosted on WatsonX.Data platform for efficient similarity search and retrieval.",
    },
    {
      icon: Network,
      title: "Advanced Contextual Embedding",
      description:
        "Sophisticated embedding system for enhanced context understanding and relevance.",
    },
    {
      icon: Workflow,
      title: "Context Management",
      description:
        "Advanced system for handling and maintaining extensive conversation context.",
    },
    {
      icon: GitGraph,
      title: "Multi-Agent Architecture",
      description:
        "Built with Langgraph for sophisticated agent coordination and task delegation.",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="mb-20"
    >
      <h2 className="text-3xl font-bold text-white text-center mb-12">
        Technical Architecture
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {architectureComponents.map((component, index) => (
          <TechStackCard
            key={index}
            icon={component.icon}
            title={component.title}
            description={component.description}
            delay={index * 0.1}
          />
        ))}
      </div>
    </motion.div>
  );
};

// Main About Component
const About = () => {
  const router = useRouter();
  const { scrollYProgress } = useScroll();
  const scaleProgress = useTransform(scrollYProgress, [0, 1], [1, 0.8]);
  const session = null; // Replace with actual session from your auth provider if needed

  const stats = [
    { icon: Users, label: "Active Users", value: "5,000+" },
    { icon: Code2, label: "Code Generations", value: "1M+" },
    { icon: AwardIcon, label: "Success Rate", value: "99.9%" },
    { icon: GitBranchIcon, label: "Components", value: "50K+" },
  ];

  const values = [
    {
      icon: RocketIcon,
      title: "Innovation First",
      description:
        "Pushing the boundaries of what's possible in Salesforce development with IBM WatsonX.",
    },
    {
      icon: Users,
      title: "User-Centric",
      description: "Every feature is designed with our users' success in mind.",
    },
    {
      icon: BrainCircuitIcon,
      title: "AI Excellence",
      description:
        "Leveraging IBM's Granite 3.0 models to deliver exceptional results.",
    },
    {
      icon: HeartIcon,
      title: "Quality Commitment",
      description:
        "Uncompromising dedication to code quality and best practices.",
    },
  ];

  return (
    <BackgroundGradientAnimation>
      <Navbar session={session} />
      <div className="min-h-screen">
        <div className="container mx-auto px-4 pt-20 pb-32">
          {/* Enhanced Hero Section */}
          <div className="text-center max-w-4xl mx-auto mb-20 relative">
            <motion.div
              style={{ scale: scaleProgress }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <motion.div
                animate={{
                  background: [
                    "linear-gradient(to right, #3b82f6, #8b5cf6)",
                    "linear-gradient(to right, #8b5cf6, #ec4899)",
                    "linear-gradient(to right, #ec4899, #3b82f6)",
                  ],
                }}
                transition={{ duration: 5, repeat: Infinity }}
                className="absolute inset-0 blur-3xl opacity-20"
              />
              <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400 mb-6">
                About ISC-CodeConnect
              </h1>
              <p className="text-xl text-gray-400">
                Revolutionizing Salesforce development with IBM WatsonX-powered
                assistance and intelligent automation.
              </p>
            </motion.div>

            {/* Buttons moved outside the scaled motion.div */}
            <div className="flex justify-center space-x-4">
              <Button
                onClick={() => router.push("/chat")}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white 
                         hover:from-blue-700 hover:to-purple-700 transition-all duration-300
                         relative z-10" // Added z-index
              >
                Try It Now
              </Button>
              <Button
                onClick={() => router.push("/docs")}
                variant="outline"
                className="border-gray-700 hover:bg-gray-800 transition-all duration-300
                         relative z-10" // Added z-index
              >
                Learn More
              </Button>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            {stats.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </div>

          {/* Architecture Section */}
          <ArchitectureSection />

          {/* Mission Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-20"
          >
            <h2 className="text-3xl font-bold text-white mb-6">Our Mission</h2>
            <p className="text-gray-400 text-lg leading-relaxed">
              We are on a mission to transform Salesforce development by making
              it faster, more efficient, and more accessible through the power
              of IBM WatsonX and Granite 3.0 models. Our platform enables
              developers to focus on innovation while automating routine tasks
              and ensuring best practices.
            </p>
          </motion.div>

          {/* Values Section */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-white text-center mb-12">
              Our Values
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <TechStackCard
                  key={index}
                  icon={value.icon}
                  title={value.title}
                  description={value.description}
                  delay={index * 0.1}
                />
              ))}
            </div>
          </div>

          {/* Technology Stack */}
          <TechStackSection />

          {/* Contact Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl font-bold text-white mb-6">Get In Touch</h2>
            <p className="text-gray-400 mb-8">
              Have questions about our IBM WatsonX-powered solution or want to
              learn more? We would love to hear from you.
            </p>
            <div className="flex justify-center space-x-6">
              <Button
                onClick={() => router.push("/contact")}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white
                         hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
              >
                <MailIcon className="w-5 h-5 mr-2" />
                Contact Us
              </Button>
              <Button
                onClick={() => router.push("/docs")}
                variant="outline"
                className="border-gray-700 hover:bg-gray-800 transition-all duration-300"
              >
                <BookIcon className="w-5 h-5 mr-2" />
                Documentation
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </BackgroundGradientAnimation>
  );
};

export default About;
