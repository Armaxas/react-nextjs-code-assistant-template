"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useModels } from "@/hooks/use-models";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
  showLabel?: boolean;
  placeholder?: string;
  disabled?: boolean;
  layout?: "vertical" | "horizontal";
}

export function ModelSelector({
  selectedModel,
  onModelChange,
  className,
  size = "md",
  label = "AI Model",
  showLabel = true,
  placeholder = "Select a model",
  disabled = false,
  layout = "vertical",
}: ModelSelectorProps) {
  const { modelOptions, isLoading } = useModels();

  const sizeClasses = {
    sm: "h-8 text-xs",
    md: "h-10 text-sm",
    lg: "h-12 text-base",
  };

  return (
    <div
      className={cn(
        layout === "horizontal" ? "flex items-center space-x-3" : "space-y-2",
        className
      )}
    >
      {showLabel && (
        <Label
          htmlFor="model-selector"
          className="flex items-center gap-2 text-sm font-medium whitespace-nowrap"
        >
          <Sparkles className="h-4 w-4 text-purple-400" />
          {label}
        </Label>
      )}
      <Select
        value={selectedModel}
        onValueChange={onModelChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger
          id="model-selector"
          className={cn(
            "bg-gray-900/50 border-gray-700/50 text-white hover:border-gray-600/70 focus:border-purple-500/50",
            sizeClasses[size],
            layout === "horizontal" ? "w-48" : ""
          )}
        >
          <SelectValue
            placeholder={isLoading ? "Loading models..." : placeholder}
          />
        </SelectTrigger>
        <SelectContent className="bg-gray-900 border-gray-700">
          {modelOptions.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="text-white hover:bg-gray-800 focus:bg-gray-800"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default ModelSelector;
