"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModernSpinner } from "@/components/ui/modern-spinners";

export function SpinnerShowcase() {
  const spinners = [
    {
      variant: "neural" as const,
      name: "Neural Network",
      description: "Perfect for AI processing and machine learning tasks",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      variant: "code" as const,
      name: "Code Pulse",
      description: "Ideal for coding assistance and development tasks",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      variant: "quantum" as const,
      name: "Quantum Dots",
      description: "Modern ripple effect for complex computations",
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
    },
    {
      variant: "orbital" as const,
      name: "Orbital Motion",
      description: "Scientific orbital animation for analysis tasks",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      variant: "matrix" as const,
      name: "Matrix Rain",
      description: "Tech-themed animation for data processing",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      variant: "dna" as const,
      name: "DNA Helix",
      description: "Biological helix for advanced computations",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {spinners.map((spinner, index) => (
        <motion.div
          key={spinner.variant}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="h-full hover:shadow-lg transition-all duration-300 group">
            <CardHeader className="text-center">
              <CardTitle className="text-lg">{spinner.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Large spinner display */}
              <div
                className={`flex items-center justify-center h-20 rounded-lg ${spinner.bgColor} transition-all duration-300 group-hover:scale-105`}
              >
                <ModernSpinner
                  variant={spinner.variant}
                  size="lg"
                  className={spinner.color}
                />
              </div>

              {/* Size variants */}
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <div className="mb-1">
                    <ModernSpinner
                      variant={spinner.variant}
                      size="sm"
                      className={spinner.color}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">Small</span>
                </div>
                <div className="text-center">
                  <div className="mb-1">
                    <ModernSpinner
                      variant={spinner.variant}
                      size="md"
                      className={spinner.color}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">Medium</span>
                </div>
                <div className="text-center">
                  <div className="mb-1">
                    <ModernSpinner
                      variant={spinner.variant}
                      size="lg"
                      className={spinner.color}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">Large</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground text-center">
                {spinner.description}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
