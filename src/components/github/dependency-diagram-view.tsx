"use client";

import React from "react";
import { DependencyAnalysisInterface } from "./dependency-analysis-interface";

interface DependencyDiagramViewProps {
  selectedModel?: string;
}

export function DependencyDiagramView({
  selectedModel,
}: DependencyDiagramViewProps) {
  return (
    <div className="flex flex-col h-full">
      <DependencyAnalysisInterface
        initialRepositories={[]}
        selectedModel={selectedModel}
      />
    </div>
  );
}
