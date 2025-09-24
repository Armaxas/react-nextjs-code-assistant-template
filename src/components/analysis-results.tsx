import React, { useState } from "react";
import { AnalysisResult, AnalysisTask } from "@/types/requirement-analyzer";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProcessingMetrics } from "@/types/metrics";
import { Button } from "@/components/ui/button";
import {
  Copy,
  FileCode,
  FileText,
  Info,
  Lightbulb,
  Puzzle,
  Scale,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Target,
  BookOpen,
  TrendingUp,
  ArrowRight,
  Timer,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";

interface AnalysisResultsProps {
  analysis: AnalysisResult;
  originalRequirement?: string;
  metrics?: ProcessingMetrics;
  onSelectTask?: (taskPrompt: string) => void;
}

export function AnalysisResults({
  analysis,
  originalRequirement,
  metrics,
  onSelectTask,
}: AnalysisResultsProps) {
  const [copiedTaskId, setCopiedTaskId] = useState<number | null>(null);

  // Debug logging for data types
  React.useEffect(() => {
    console.log("AnalysisResults - analysis:", analysis);
    console.log(
      "AnalysisResults - analysis.tasks type:",
      typeof analysis.tasks,
      Array.isArray(analysis.tasks)
    );
    if (Array.isArray(analysis.tasks)) {
      analysis.tasks.forEach((task, index) => {
        console.log(`Task ${index}:`, {
          task_id: typeof task.task_id,
          title: typeof task.title,
          description: typeof task.description,
          estimated_complexity: typeof task.estimated_complexity,
          affected_files: typeof task.affected_files,
          references: typeof task.references,
        });
      });
    }
  }, [analysis]);

  const copyTaskPrompt = (task: AnalysisTask) => {
    // Extract the RAG-optimized prompt from the implementation details
    const implementationDetails = safeToString(task.implementation_details);
    const ragPromptMatch = implementationDetails.match(
      /RAG-OPTIMIZED PROMPT:\s*([\s\S]+?)(?:\n\n|$)/
    );
    const prompt = ragPromptMatch
      ? ragPromptMatch[1].trim()
      : safeToString(task.description);

    navigator.clipboard.writeText(prompt);
    setCopiedTaskId(task.task_id);
    toast.success("Task prompt copied to clipboard");

    setTimeout(() => {
      setCopiedTaskId(null);
    }, 2000);

    if (onSelectTask) {
      onSelectTask(prompt);
    }
  };

  // Helper function to safely convert any value to string
  const safeToString = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number") return value.toString();
    if (typeof value === "boolean") return value.toString();
    if (typeof value === "object") {
      try {
        return JSON.stringify(value);
      } catch {
        return "[Object]";
      }
    }
    return String(value);
  };

  const getComplexityColor = (complexity: string) => {
    const complexityStr = safeToString(complexity).toLowerCase();
    switch (complexityStr) {
      case "low":
        return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700";
      case "medium":
        return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700";
      case "high":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700";
    }
  };

  const getComplexityIcon = (complexity: string) => {
    const complexityStr = safeToString(complexity).toLowerCase();
    switch (complexityStr) {
      case "low":
        return (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        );
      case "medium":
        return (
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
        );
      case "high":
        return <Zap className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />;
      default:
        return (
          <Target className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
        );
    }
  };

  const getTaskGradient = (index: number) => {
    const gradients = [
      "from-blue-500 to-indigo-600",
      "from-purple-500 to-pink-600",
      "from-emerald-500 to-teal-600",
      "from-orange-500 to-red-600",
      "from-indigo-500 to-purple-600",
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Rich Professional Header */}
      <div className="relative bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-950/20 dark:to-indigo-950/20 border-b border-gray-200 dark:border-gray-800 p-4 mb-0">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] dark:opacity-[0.05]"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-2 w-2 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Analysis Complete
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {Array.isArray(analysis.tasks) ? analysis.tasks.length : 0}{" "}
                implementation tasks • Ready for development
              </p>
            </div>
          </div>
          {metrics && (
            <div className="text-right">
              <div className="inline-flex items-center gap-1.5 bg-white dark:bg-gray-800 rounded-lg px-2.5 py-1.5 shadow-sm border border-gray-200 dark:border-gray-700">
                <Timer className="h-3.5 w-3.5 text-blue-500" />
                <div>
                  <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {metrics.execution_time.toFixed(1)}s
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Processing time
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="summary" className="flex-1 flex flex-col">
        <div className="border-b border-gray-200 dark:border-gray-800 px-6">
          <TabsList className="bg-transparent p-0 h-auto">
            <TabsTrigger
              value="summary"
              className="relative px-4 py-3 font-medium text-gray-600 dark:text-gray-400 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-500 rounded-none"
            >
              Summary
            </TabsTrigger>
            <TabsTrigger
              value="tasks"
              className="relative px-4 py-3 font-medium text-gray-600 dark:text-gray-400 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-500 rounded-none"
            >
              <span>Tasks</span>
              <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                {Array.isArray(analysis.tasks) ? analysis.tasks.length : 0}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="details"
              className="relative px-4 py-3 font-medium text-gray-600 dark:text-gray-400 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-500 rounded-none"
            >
              Details
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent
          value="summary"
          className="m-0 h-full flex-1 overflow-hidden"
        >
          <ScrollArea className="flex-1 h-full px-6">
            <div className="space-y-8 py-8">
              {/* Original Requirement */}
              {originalRequirement && (
                <div className="group">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl opacity-20 scale-110 group-hover:scale-125 transition-transform duration-300"></div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        Original Requirement
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Your development request as submitted
                      </p>
                    </div>
                  </div>
                  <div className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800/30 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                      {originalRequirement}
                    </p>
                  </div>
                </div>
              )}

              {/* AI Analysis */}
              <div className="group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Lightbulb className="h-5 w-5 text-white" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl opacity-20 scale-110 group-hover:scale-125 transition-transform duration-300"></div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      AI Analysis Summary
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Intelligent breakdown and insights
                    </p>
                  </div>
                </div>
                <div className="relative bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-cyan-950/20 rounded-2xl p-6 border border-emerald-100 dark:border-emerald-800/30 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="absolute top-4 right-4 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                    {safeToString(analysis.requirement_summary)}
                  </p>
                </div>
              </div>

              {/* Key Components */}
              <div className="group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Puzzle className="h-5 w-5 text-white" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl opacity-20 scale-110 group-hover:scale-125 transition-transform duration-300"></div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      Key Components
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Core elements for implementation
                    </p>
                  </div>
                </div>
                <div className="relative bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-purple-950/20 dark:via-pink-950/20 dark:to-rose-950/20 rounded-2xl p-6 border border-purple-100 dark:border-purple-800/30 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="absolute top-4 right-4 w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <div className="grid gap-4">
                    {Array.isArray(analysis.key_components) &&
                      analysis.key_components.map((component, index) => (
                        <div
                          key={index}
                          className="group/item relative flex items-start gap-4 p-4 rounded-xl bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 hover:bg-white/90 dark:hover:bg-gray-800/70 transition-all duration-200"
                        >
                          <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                          <span className="text-gray-800 dark:text-gray-200 font-medium leading-relaxed">
                            {safeToString(component)}
                          </span>
                          <div className="absolute inset-0 rounded-xl ring-1 ring-purple-500/20 opacity-0 group-hover/item:opacity-100 transition-opacity duration-200"></div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>{" "}
        <TabsContent
          value="tasks"
          className="m-0 h-full flex-1 overflow-hidden"
        >
          <ScrollArea className="h-full flex-1 px-4">
            <div className="py-6">
              <div className="space-y-3">
                <Accordion type="multiple" className="space-y-2">
                  {Array.isArray(analysis.tasks) &&
                    analysis.tasks.map((task, index) => (
                      <Card
                        key={task.task_id}
                        className="group relative overflow-hidden border-0 bg-white dark:bg-gray-800 shadow-sm hover:shadow-lg transition-all duration-300 rounded-xl"
                      >
                        {/* Gradient border effect */}
                        <div
                          className={`absolute inset-0 bg-gradient-to-r ${getTaskGradient(index)} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-xl`}
                        ></div>
                        <div className="absolute inset-[1px] bg-white dark:bg-gray-800 rounded-xl"></div>

                        <AccordionItem
                          value={safeToString(task.task_id)}
                          className="border-0 relative z-10"
                        >
                          <AccordionTrigger className="px-5 py-3 hover:no-underline">
                            <div className="flex items-center gap-3 text-left flex-1">
                              {/* Compact Task Number */}
                              <div className="relative">
                                <div
                                  className={`w-8 h-8 bg-gradient-to-br ${getTaskGradient(index)} rounded-lg text-white text-sm font-bold flex items-center justify-center shadow-sm`}
                                >
                                  {task.task_id}
                                </div>
                                <div className="absolute -inset-0.5 bg-gradient-to-br from-white/20 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge
                                    className={`${getComplexityColor(safeToString(task.estimated_complexity))} flex items-center gap-1 font-medium px-2 py-0.5 shadow-sm text-xs`}
                                  >
                                    {getComplexityIcon(
                                      safeToString(task.estimated_complexity)
                                    )}
                                    {safeToString(task.estimated_complexity)
                                      .charAt(0)
                                      .toUpperCase() +
                                      safeToString(
                                        task.estimated_complexity
                                      ).slice(1)}
                                  </Badge>
                                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                                    <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                                    {index + 1} of {analysis.tasks.length}
                                  </div>
                                </div>
                                <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1 leading-tight">
                                  {safeToString(task.title)}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed overflow-hidden text-ellipsis line-clamp-2">
                                  {safeToString(task.description).length > 90
                                    ? safeToString(task.description).substring(
                                        0,
                                        90
                                      ) + "..."
                                    : safeToString(task.description)}
                                </p>
                              </div>

                              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                                <ArrowRight className="h-3.5 w-3.5 text-gray-500 group-hover:text-blue-500 transition-colors" />
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="px-5 pb-4 space-y-4">
                              <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent"></div>

                              {/* Enhanced Description */}
                              <div className="relative">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                  <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                    <Info className="h-3 w-3 text-white" />
                                  </div>
                                  Implementation Details
                                </h4>
                                <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30">
                                  <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                                  <p className="text-gray-800 dark:text-gray-200 leading-relaxed text-sm">
                                    {safeToString(task.description)}
                                  </p>
                                </div>
                              </div>

                              {/* Enhanced Files Section */}
                              {Array.isArray(task.affected_files) &&
                                task.affected_files.length > 0 && (
                                  <div className="relative">
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                      <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                                        <FileCode className="h-3 w-3 text-white" />
                                      </div>
                                      Files to Modify
                                      <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                                        ({task.affected_files.length})
                                      </span>
                                    </h4>
                                    <div className="grid gap-2">
                                      {task.affected_files.map((file, idx) => (
                                        <div
                                          key={idx}
                                          className="group/file relative flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg border border-purple-100 dark:border-purple-800/30 hover:shadow-sm transition-all duration-200"
                                        >
                                          <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-md flex items-center justify-center shadow-sm">
                                            <FileCode className="h-3 w-3 text-white" />
                                          </div>
                                          <span className="text-gray-800 dark:text-gray-200 font-mono font-medium flex-1 text-sm">
                                            {safeToString(file)}
                                          </span>
                                          <div className="absolute inset-0 rounded-xl ring-1 ring-purple-500/20 opacity-0 group-hover/file:opacity-100 transition-opacity duration-200"></div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                              {/* Enhanced References */}
                              {Array.isArray(task.references) &&
                                task.references.length > 0 && (
                                  <div className="relative">
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                      <div className="w-5 h-5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                                        <BookOpen className="h-3 w-3 text-white" />
                                      </div>
                                      References & Documentation
                                    </h4>
                                    <div className="grid gap-3">
                                      {task.references.map((ref, idx) => {
                                        // Try to parse JSON references
                                        let parsedRef = null;
                                        try {
                                          if (typeof ref === "string") {
                                            const trimmedRef = ref.trim();
                                            if (
                                              trimmedRef.startsWith("{") &&
                                              trimmedRef.endsWith("}")
                                            ) {
                                              parsedRef =
                                                JSON.parse(trimmedRef);
                                            }
                                          } else if (
                                            typeof ref === "object" &&
                                            ref !== null
                                          ) {
                                            // If it's already an object, use it directly
                                            parsedRef = ref;
                                          }
                                        } catch {
                                          // If parsing fails, treat as plain text
                                        }

                                        // Helper function to generate fallback links for common Salesforce topics
                                        const generateFallbackLink = (
                                          title: string
                                        ) => {
                                          const titleLower =
                                            title.toLowerCase();

                                          if (
                                            titleLower.includes("apex") &&
                                            titleLower.includes("guide")
                                          ) {
                                            return "https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/";
                                          }
                                          if (titleLower.includes("rest api")) {
                                            return "https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/";
                                          }
                                          if (titleLower.includes("soql")) {
                                            return "https://developer.salesforce.com/docs/atlas.en-us.soql_sosl.meta/soql_sosl/";
                                          }
                                          if (
                                            titleLower.includes("lwc") ||
                                            titleLower.includes(
                                              "lightning web component"
                                            )
                                          ) {
                                            return "https://developer.salesforce.com/docs/component-library/documentation/en/lwc/";
                                          }
                                          if (
                                            titleLower.includes("apex") &&
                                            (titleLower.includes("test") ||
                                              titleLower.includes("testing"))
                                          ) {
                                            return "https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_testing.htm";
                                          }
                                          if (
                                            titleLower.includes("apex") &&
                                            titleLower.includes(
                                              "best practices"
                                            )
                                          ) {
                                            return "https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_classes_best_practices.htm";
                                          }
                                          if (
                                            titleLower.includes("exception") ||
                                            titleLower.includes(
                                              "error handling"
                                            )
                                          ) {
                                            return "https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_exception_methods.htm";
                                          }
                                          if (titleLower.includes("trigger")) {
                                            return "https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_triggers.htm";
                                          }
                                          if (
                                            titleLower.includes("data binding")
                                          ) {
                                            return "https://developer.salesforce.com/docs/component-library/documentation/en/lwc/lwc.data_binding";
                                          }
                                          if (
                                            titleLower.includes("country") &&
                                            titleLower.includes("api")
                                          ) {
                                            return "https://developer.salesforce.com/docs/atlas.en-us.api.meta/api/field_country_iso_code.htm";
                                          }
                                          if (
                                            titleLower.includes("dynamic") &&
                                            titleLower.includes("rendering")
                                          ) {
                                            return "https://developer.salesforce.com/docs/component-library/documentation/en/lwc/lwc.create_components_conditional";
                                          }

                                          // Default to Salesforce Developer documentation
                                          return "https://developer.salesforce.com/docs/";
                                        };

                                        if (parsedRef && parsedRef.title) {
                                          // Use provided link or generate fallback
                                          const link =
                                            parsedRef.link ||
                                            generateFallbackLink(
                                              parsedRef.title
                                            );
                                          const hasOriginalLink =
                                            !!parsedRef.link;

                                          return (
                                            <div
                                              key={idx}
                                              className="group/ref relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600 transition-all duration-300 hover:shadow-lg"
                                            >
                                              <div className="p-4">
                                                <div className="flex items-start gap-3">
                                                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                                                    <BookOpen className="h-4 w-4 text-white" />
                                                  </div>
                                                  <div className="flex-1 min-w-0">
                                                    <a
                                                      href={link}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="block text-gray-900 dark:text-gray-100 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium text-sm leading-tight transition-colors group/link"
                                                    >
                                                      <span className="group-hover/link:underline decoration-emerald-500 underline-offset-2">
                                                        {parsedRef.title}
                                                      </span>
                                                      <svg
                                                        className="inline-block ml-1 w-3 h-3 opacity-60 group-hover/link:opacity-100 transition-opacity"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                      >
                                                        <path
                                                          strokeLinecap="round"
                                                          strokeLinejoin="round"
                                                          strokeWidth={2}
                                                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                                        />
                                                      </svg>
                                                    </a>
                                                    {(parsedRef.type ||
                                                      !hasOriginalLink) && (
                                                      <div className="mt-2 flex items-center gap-2">
                                                        {parsedRef.type && (
                                                          <Badge
                                                            variant="secondary"
                                                            className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700"
                                                          >
                                                            {parsedRef.type}
                                                          </Badge>
                                                        )}
                                                        {!hasOriginalLink && (
                                                          <Badge
                                                            variant="outline"
                                                            className="text-xs text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600"
                                                          >
                                                            Auto-linked
                                                          </Badge>
                                                        )}
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/5 to-teal-500/5 opacity-0 group-hover/ref:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                                            </div>
                                          );
                                        } else {
                                          // Render as plain text for non-JSON references
                                          return (
                                            <div
                                              key={idx}
                                              className="group/ref relative bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
                                            >
                                              <div className="flex items-start gap-3">
                                                <div className="w-6 h-6 bg-gray-400 dark:bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                                </div>
                                                <span className="text-gray-800 dark:text-gray-200 leading-relaxed text-sm">
                                                  {safeToString(ref)}
                                                </span>
                                              </div>
                                            </div>
                                          );
                                        }
                                      })}
                                    </div>
                                  </div>
                                )}

                              {/* Enhanced Action Button */}
                              <div className="flex justify-end pt-4">
                                <Button
                                  className={`gap-2 bg-gradient-to-r ${getTaskGradient(index)} hover:shadow-lg text-white font-semibold px-5 py-2.5 rounded-xl transform hover:scale-105 transition-all duration-200 text-sm`}
                                  onClick={() => copyTaskPrompt(task)}
                                >
                                  {copiedTaskId === task.task_id ? (
                                    <>
                                      <CheckCircle2 className="h-4 w-4" />
                                      Copied Successfully!
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-4 w-4" />
                                      Copy Implementation Prompt
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Card>
                    ))}
                </Accordion>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
        <TabsContent
          value="details"
          className="m-0 h-full flex-1 overflow-hidden"
        >
          <ScrollArea className="h-full px-6">
            <div className="space-y-8 py-8">
              {/* Missing Information */}
              {Array.isArray(analysis.missing_information) &&
                analysis.missing_information.length > 0 && (
                  <div className="group">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                          <AlertTriangle className="h-5 w-5 text-white" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl opacity-20 scale-110 group-hover:scale-125 transition-transform duration-300"></div>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                          Missing Information
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Information that would improve analysis accuracy
                        </p>
                      </div>
                    </div>
                    <div className="relative bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-red-950/20 rounded-2xl p-6 border border-amber-100 dark:border-amber-800/30 shadow-sm hover:shadow-md transition-shadow duration-300">
                      <div className="absolute top-4 right-4 w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                      <div className="grid gap-4">
                        {analysis.missing_information.map((item, index) => (
                          <div
                            key={index}
                            className="group/item relative flex items-start gap-4 p-4 rounded-xl bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 hover:bg-white/90 dark:hover:bg-gray-800/70 transition-all duration-200"
                          >
                            <div className="w-6 h-6 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                              <AlertTriangle className="h-3 w-3 text-white" />
                            </div>
                            <span className="text-gray-800 dark:text-gray-200 font-medium leading-relaxed">
                              {safeToString(item)}
                            </span>
                            <div className="absolute inset-0 rounded-xl ring-1 ring-amber-500/20 opacity-0 group-hover/item:opacity-100 transition-opacity duration-200"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              {/* Assumptions */}
              {Array.isArray(analysis.assumptions) &&
                analysis.assumptions.length > 0 && (
                  <div className="group">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                          <Scale className="h-5 w-5 text-white" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl opacity-20 scale-110 group-hover:scale-125 transition-transform duration-300"></div>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                          Analysis Assumptions
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Assumptions made to provide implementation guidance
                        </p>
                      </div>
                    </div>
                    <div className="relative bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-blue-950/20 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-800/30 shadow-sm hover:shadow-md transition-shadow duration-300">
                      <div className="absolute top-4 right-4 w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                      <div className="grid gap-4">
                        {analysis.assumptions.map((assumption, index) => (
                          <div
                            key={index}
                            className="group/item relative flex items-start gap-4 p-4 rounded-xl bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 hover:bg-white/90 dark:hover:bg-gray-800/70 transition-all duration-200"
                          >
                            <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                              <Scale className="h-3 w-3 text-white" />
                            </div>
                            <span className="text-gray-800 dark:text-gray-200 font-medium leading-relaxed">
                              {safeToString(assumption)}
                            </span>
                            <div className="absolute inset-0 rounded-xl ring-1 ring-indigo-500/20 opacity-0 group-hover/item:opacity-100 transition-opacity duration-200"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              {/* Processing Metrics */}
              {metrics && (
                <div className="group">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-600 to-slate-700 rounded-xl opacity-20 scale-110 group-hover:scale-125 transition-transform duration-300"></div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        Processing Metrics
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Analysis performance and timing information
                      </p>
                    </div>
                  </div>
                  <div className="relative bg-gradient-to-br from-gray-50 via-slate-50 to-zinc-50 dark:from-gray-950/20 dark:via-slate-950/20 dark:to-zinc-950/20 rounded-2xl p-6 border border-gray-100 dark:border-gray-800/30 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="absolute top-4 right-4 w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="group/metric relative flex items-center gap-4 p-4 rounded-xl bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 hover:bg-white/90 dark:hover:bg-gray-800/70 transition-all duration-200">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                          <Timer className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                            Processing Time
                          </p>
                          <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            {metrics.execution_time.toFixed(2)}s
                          </p>
                        </div>
                        <div className="absolute inset-0 rounded-xl ring-1 ring-blue-500/20 opacity-0 group-hover/metric:opacity-100 transition-opacity duration-200"></div>
                      </div>
                      <div className="group/metric relative flex items-center gap-4 p-4 rounded-xl bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 hover:bg-white/90 dark:hover:bg-gray-800/70 transition-all duration-200">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                          <CheckCircle2 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                            Started At
                          </p>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {new Date(metrics.start_time).toLocaleString()}
                          </p>
                        </div>
                        <div className="absolute inset-0 rounded-xl ring-1 ring-emerald-500/20 opacity-0 group-hover/metric:opacity-100 transition-opacity duration-200"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
