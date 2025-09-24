"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain,
  Zap,
  Clock,
  DollarSign,
  Info,
  Settings,
  CheckCircle,
  Sparkles,
  Target,
} from "lucide-react";
import type { ModelSettings } from "@/types/log-analysis";

interface ModelOption {
  id: string;
  name: string;
  provider: string;
  description: string;
  strengths: string[];
  speed: "fast" | "medium" | "slow";
  cost: "low" | "medium" | "high";
  accuracy: "good" | "excellent" | "superior";
  contextWindow: string;
  recommended?: boolean;
}

const MODEL_OPTIONS: ModelOption[] = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    description:
      "Latest and most capable model with excellent reasoning for complex log analysis",
    strengths: [
      "Complex reasoning",
      "Code understanding",
      "Error pattern recognition",
    ],
    speed: "medium",
    cost: "high",
    accuracy: "superior",
    contextWindow: "128K tokens",
    recommended: true,
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    description:
      "Fast and cost-effective model with good performance for routine log analysis",
    strengths: ["Speed", "Cost efficiency", "General debugging"],
    speed: "fast",
    cost: "low",
    accuracy: "excellent",
    contextWindow: "128K tokens",
  },
  {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    description:
      "Excellent at code analysis and providing detailed explanations",
    strengths: ["Code analysis", "Detailed explanations", "Safety"],
    speed: "medium",
    cost: "medium",
    accuracy: "superior",
    contextWindow: "200K tokens",
  },
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    provider: "Google",
    description: "Large context window ideal for analyzing multiple log files",
    strengths: ["Large context", "Multi-file analysis", "Pattern recognition"],
    speed: "medium",
    cost: "medium",
    accuracy: "excellent",
    contextWindow: "2M tokens",
  },
];

interface ModelSelectorProps {
  onSettingsChange: (settings: ModelSettings) => void;
  initialSettings?: ModelSettings;
  disabled?: boolean;
}

export function ModelSelector({
  onSettingsChange,
  initialSettings,
  disabled = false,
}: ModelSelectorProps) {
  const [settings, setSettings] = useState<ModelSettings>(
    initialSettings || {
      selectedModel: "gpt-4o",
      temperature: 0.1,
      maxTokens: 4000,
      streaming: true,
    }
  );

  const updateSettings = (updates: Partial<ModelSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const selectedModelOption = MODEL_OPTIONS.find(
    (m) => m.id === settings.selectedModel
  );

  const getSpeedIcon = (speed: string) => {
    switch (speed) {
      case "fast":
        return <Zap className="h-3 w-3 text-green-500" />;
      case "medium":
        return <Clock className="h-3 w-3 text-yellow-500" />;
      case "slow":
        return <Clock className="h-3 w-3 text-red-500" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getCostIcon = (cost: string) => {
    switch (cost) {
      case "low":
        return <DollarSign className="h-3 w-3 text-green-500" />;
      case "medium":
        return <DollarSign className="h-3 w-3 text-yellow-500" />;
      case "high":
        return <DollarSign className="h-3 w-3 text-red-500" />;
      default:
        return <DollarSign className="h-3 w-3" />;
    }
  };

  const getAccuracyIcon = (accuracy: string) => {
    switch (accuracy) {
      case "good":
        return <Target className="h-3 w-3 text-blue-500" />;
      case "excellent":
        return <Target className="h-3 w-3 text-green-500" />;
      case "superior":
        return <Sparkles className="h-3 w-3 text-purple-500" />;
      default:
        return <Target className="h-3 w-3" />;
    }
  };

  const resetToDefaults = () => {
    const defaultSettings: ModelSettings = {
      selectedModel: "gpt-4o",
      temperature: 0.1,
      maxTokens: 4000,
      streaming: true,
    };
    setSettings(defaultSettings);
    onSettingsChange(defaultSettings);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Model Configuration
        </CardTitle>
        <CardDescription>
          Choose the AI model and parameters for log analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="model" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="model">Model Selection</TabsTrigger>
            <TabsTrigger value="parameters">Parameters</TabsTrigger>
          </TabsList>

          <TabsContent value="model" className="space-y-4">
            {/* Model Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                AI Model
              </Label>
              <Select
                value={settings.selectedModel}
                onValueChange={(value) =>
                  updateSettings({ selectedModel: value })
                }
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {MODEL_OPTIONS.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center gap-2">
                        <span>{model.name}</span>
                        {model.recommended && (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle className="h-2 w-2 mr-1" />
                            Recommended
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Model Details */}
            {selectedModelOption && (
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      {selectedModelOption.name}
                      {selectedModelOption.recommended && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          <Sparkles className="h-2 w-2 mr-1" />
                          Recommended
                        </Badge>
                      )}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      by {selectedModelOption.provider}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      {getSpeedIcon(selectedModelOption.speed)}
                      {selectedModelOption.speed}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      {getCostIcon(selectedModelOption.cost)}
                      {selectedModelOption.cost}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      {getAccuracyIcon(selectedModelOption.accuracy)}
                      {selectedModelOption.accuracy}
                    </Badge>
                  </div>
                </div>

                <p className="text-sm mb-3">
                  {selectedModelOption.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Strengths:</span>
                    <ul className="mt-1 space-y-1">
                      {selectedModelOption.strengths.map((strength, index) => (
                        <li
                          key={index}
                          className="flex items-center gap-2 text-muted-foreground"
                        >
                          <span className="w-1 h-1 bg-current rounded-full"></span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="font-medium">Context Window:</span>
                    <p className="text-muted-foreground">
                      {selectedModelOption.contextWindow}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Model Comparison */}
            <div className="space-y-3">
              <h4 className="font-medium">Quick Comparison</h4>
              <div className="grid gap-2">
                {MODEL_OPTIONS.map((model) => (
                  <div
                    key={model.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      model.id === settings.selectedModel
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => updateSettings({ selectedModel: model.id })}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            {model.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {model.provider}
                          </span>
                        </div>
                        {model.recommended && (
                          <Badge variant="secondary" className="text-xs">
                            Recommended
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {getSpeedIcon(model.speed)}
                        {getCostIcon(model.cost)}
                        {getAccuracyIcon(model.accuracy)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="parameters" className="space-y-4">
            {/* Temperature */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Temperature
                </Label>
                <Badge variant="outline">{settings.temperature}</Badge>
              </div>
              <Slider
                value={[settings.temperature]}
                onValueChange={(value) =>
                  updateSettings({ temperature: value[0] })
                }
                max={1}
                min={0}
                step={0.1}
                disabled={disabled}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Lower values (0.0-0.3) for more focused, deterministic
                responses. Higher values (0.4-1.0) for more creative analysis.
              </p>
            </div>

            {/* Max Tokens */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Max Tokens</Label>
                <Badge variant="outline">{settings.maxTokens}</Badge>
              </div>
              <Slider
                value={[settings.maxTokens]}
                onValueChange={(value) =>
                  updateSettings({ maxTokens: value[0] })
                }
                max={8000}
                min={1000}
                step={500}
                disabled={disabled}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Maximum number of tokens in the response. Higher values allow
                for more detailed analysis.
              </p>
            </div>

            {/* Streaming */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <div>
                  <Label>Streaming Response</Label>
                  <p className="text-xs text-muted-foreground">
                    Stream the response in real-time for better user experience
                  </p>
                </div>
              </div>
              <Button
                variant={settings.streaming ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  updateSettings({ streaming: !settings.streaming })
                }
                disabled={disabled}
              >
                {settings.streaming ? "On" : "Off"}
              </Button>
            </div>

            {/* Reset to Defaults */}
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                onClick={resetToDefaults}
                disabled={disabled}
              >
                Reset to Defaults
              </Button>
            </div>

            {/* Performance Impact Notice */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Performance Tips:</strong> Lower temperature and fewer
                tokens provide faster, more focused responses. Higher values
                give more comprehensive analysis but take longer.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
