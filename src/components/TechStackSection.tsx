import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrainCircuitIcon,
  DatabaseIcon,
  Network,
  GitGraph,
  ArrowRight,
} from "lucide-react";

const TechStackSection = () => {
  const [selectedTech, setSelectedTech] = useState<string | null>(null);

  const technologies = [
    {
      icon: BrainCircuitIcon,
      label: "IBM WatsonX Platform",
      color: "from-blue-500 to-blue-700",
      description:
        "Powered by IBM's Flagship Granite 3.0 models for advanced language understanding and code generation.",
      features: [
        "State-of-the-art language models",
        "Enterprise-grade reliability",
        "Advanced code understanding",
        "Secure and compliant",
      ],
    },
    {
      icon: DatabaseIcon,
      label: "Milvus Vector DB",
      color: "from-purple-500 to-purple-700",
      description:
        "Enterprise-grade vector database hosted on WatsonX.Data platform for efficient similarity search.",
      features: [
        "High-performance vector search",
        "Scalable architecture",
        "Real-time indexing",
        "Cloud-native deployment",
      ],
    },
    {
      icon: GitGraph,
      label: "Langgraph Framework",
      color: "from-green-500 to-green-700",
      description:
        "Advanced multi-agent orchestration framework for complex task handling and delegation.",
      features: [
        "Multi-agent coordination",
        "Dynamic task routing",
        "Flexible agent topology",
        "Advanced workflow control",
      ],
    },
    {
      icon: Network,
      label: "Context Engine",
      color: "from-orange-500 to-orange-700",
      description:
        "Sophisticated context management system for maintaining conversation state and history.",
      features: [
        "Long-term memory",
        "Context preservation",
        "Semantic understanding",
        "Adaptive responses",
      ],
    },
  ];

  interface Tech {
    icon: React.ElementType;
    label: string;
    color: string;
    description: string;
    features: string[];
  }

  const TechCard = ({ tech, index }: { tech: Tech; index: number }) => {
    const isSelected = selectedTech === tech.label;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        whileHover={{ scale: isSelected ? 1 : 1.02 }}
        onClick={() => setSelectedTech(isSelected ? null : tech.label)}
        className={`relative cursor-pointer group ${
          isSelected ? "col-span-2 row-span-2" : ""
        }`}
      >
        <div
          className="absolute inset-0 bg-gradient-to-r blur opacity-20 group-hover:opacity-30 transition-opacity duration-300"
          style={{
            background: `linear-gradient(to right, ${
              tech.color.split(" ")[1]
            }, ${tech.color.split(" ")[3]})`,
          }}
        />

        <div
          className={`relative h-full bg-black/40 backdrop-blur-sm rounded-xl p-6 border border-gray-800 
                      transition-all duration-500 ${
                        isSelected
                          ? "border-blue-500/50"
                          : "hover:border-gray-700"
                      }`}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center mb-4">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className={`p-2 rounded-lg bg-gradient-to-r ${tech.color}`}
              >
                <tech.icon className="w-6 h-6 text-white" />
              </motion.div>
              <h3 className="text-xl font-bold text-white ml-3">
                {tech.label}
              </h3>
            </div>

            <AnimatePresence>
              {isSelected ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex-grow"
                >
                  <p className="text-gray-400 mb-4">{tech.description}</p>
                  <div className="space-y-2">
                    {tech.features.map((feature, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-center text-gray-300"
                      >
                        <ArrowRight className="w-4 h-4 mr-2 text-blue-400" />
                        {feature}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-gray-400 line-clamp-2"
                >
                  {tech.description}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="mb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl font-bold text-white mb-4">Powered By</h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Built on cutting-edge technologies and frameworks to deliver
          enterprise-grade AI solutions.
        </p>
      </motion.div>

      <div
        className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-500 ${
          selectedTech ? "lg:grid-cols-2" : "lg:grid-cols-2"
        }`}
      >
        {technologies.map((tech, index) => (
          <TechCard key={tech.label} tech={tech} index={index} />
        ))}
      </div>
    </div>
  );
};

export default TechStackSection;
