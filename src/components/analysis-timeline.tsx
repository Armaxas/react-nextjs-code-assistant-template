"use client";

import React from "react";
import { ProgressUpdate } from "@/types/requirement-analyzer";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  AlertCircle,
  Check,
  Clock,
  ChevronRight,
  ChevronDown,
  FileText,
  Database,
  Code,
  ListTodo,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import useLocalStorage from "@/hooks/use-local-storage";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ModernSpinner } from "@/components/ui/modern-spinners";

// Helper function to get icon for step
function getStepIcon(step: string) {
  if (step.includes("initial_analysis")) return FileText;
  if (step.includes("context_evaluation")) return Database;
  if (step.includes("task_generation")) return Code;
  if (step.includes("final_analysis")) return Sparkles;
  return Clock;
}

interface AnalysisTimelineProps {
  progressUpdates: ProgressUpdate[];
  currentProgress: ProgressUpdate | null;
  originalRequirement?: string;
  error?: string;
}

export function AnalysisTimeline({
  progressUpdates,
  currentProgress,
  originalRequirement,
  error,
}: AnalysisTimelineProps) {
  const [expandedSteps, setExpandedSteps] = useLocalStorage<
    Record<string, boolean>
  >("analysis-timeline-expanded-steps", {});

  const toggleStep = (step: string) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [step]: !prev[step],
    }));
  };

  const isStepExpanded = (step: string) => !!expandedSteps[step];

  if (error) {
    return (
      <Card className="border-red-500/20 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-red-500">
            <AlertCircle className="h-6 w-6" />
            <div>
              <h3 className="font-medium">Analysis Error</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!progressUpdates.length) {
    return (
      <Card className="border-blue-500/20 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-blue-500" />
            <div>
              <h3 className="font-medium">Preparing Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Getting ready to analyze your requirement...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Consider analysis complete if percentage is 100% or the step is explicitly "complete"
  const isComplete =
    (currentProgress?.progress_percentage || 0) >= 100 ||
    currentProgress?.step === "complete";
  const progressValue = currentProgress?.progress_percentage || 0;
  const description = currentProgress?.description || "Analyzing...";

  return (
    <div className="flex flex-col gap-4">
      {/* Original requirement if provided */}
      {originalRequirement && (
        <Card className="border-blue-500/20 shadow-sm bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10">
          <CardContent className="pt-6 pb-6 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-blue-100/50 p-1.5 rounded-full">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <h3 className="font-medium text-lg">Original Requirement</h3>
            </div>
            <div className="bg-white/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-md p-3">
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {originalRequirement}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current progress header */}
      <Card className="border-blue-500/20 shadow-sm bg-gradient-to-b from-blue-50/5 to-transparent">
        <CardContent className="pt-6 pb-6 space-y-4">
          <div className="flex items-center gap-3">
            {isComplete ? (
              <div className="bg-green-100/20 p-2 rounded-full">
                <Check className="h-6 w-6 text-green-500" />
              </div>
            ) : (
              <div className="bg-blue-100/20 p-2 rounded-full">
                <ModernSpinner
                  variant="orbital"
                  size="md"
                  className="text-blue-500"
                />
              </div>
            )}
            <div>
              <h3 className="font-medium text-lg">
                {isComplete ? "Analysis Complete" : "Analysis in Progress"}
              </h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">
                {currentProgress?.step
                  ? currentProgress.step
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())
                  : "Starting"}
              </span>
              <span
                className={
                  isComplete
                    ? "text-green-600 font-medium"
                    : "text-blue-600 font-medium"
                }
              >
                {Math.round(progressValue)}%
              </span>
            </div>
            <Progress
              value={progressValue}
              className={`h-2 transition-all duration-500 ${
                isComplete ? "bg-green-100" : "bg-blue-100"
              }`}
            />
          </div>
        </CardContent>
      </Card>

      {/* Timeline of all steps */}
      <Card className="border-blue-500/20 shadow-sm">
        <CardContent className="pt-6 pb-4">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <ListTodo className="h-4 w-4 text-blue-500" />
            Analysis Timeline
          </h3>

          <ScrollArea className="h-[400px] pr-4">
            <div className="flex flex-col gap-2">
              {progressUpdates.map((update, index) => {
                const StepIcon = getStepIcon(update.step);
                const isLast = index === progressUpdates.length - 1;
                const hasDetails =
                  update.details && Object.keys(update.details).length > 0;

                return (
                  <div key={`${update.step}_${index}`} className="relative">
                    <div
                      className={cn(
                        "flex flex-col gap-1 pb-4 pl-8",
                        !isLast &&
                          "before:absolute before:left-4 before:top-10 before:h-full before:w-px before:bg-blue-100 dark:before:bg-blue-900/30"
                      )}
                    >
                      <div
                        className={cn(
                          "absolute left-0 top-2 h-8 w-8 rounded-full flex items-center justify-center",
                          update.step.includes("complete")
                            ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
                        )}
                      >
                        <StepIcon className="h-4 w-4" />
                      </div>

                      <div
                        className={cn(
                          "p-3 rounded-lg cursor-pointer",
                          hasDetails
                            ? "bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/40 dark:hover:bg-slate-900/60"
                            : ""
                        )}
                        onClick={() => hasDetails && toggleStep(update.step)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {update.step
                                  .replace(/_/g, " ")
                                  .replace(/\b\w/g, (l) => l.toUpperCase())}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {Math.round(update.progress_percentage)}%
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {update.description}
                            </p>
                          </div>
                          {hasDetails && (
                            <div>
                              {isStepExpanded(update.step) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </div>
                          )}
                        </div>

                        {hasDetails && isStepExpanded(update.step) && (
                          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 text-sm">
                            {update.step === "initial_analysis_complete" &&
                              typeof update.details === "object" &&
                              "requirement_summary" in update.details && (
                                <div className="space-y-3">
                                  <div>
                                    <p className="font-medium text-xs text-slate-600 dark:text-slate-300 mb-1">
                                      Initial Summary:
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                      {String(
                                        update.details.requirement_summary
                                      )}
                                    </p>
                                  </div>

                                  {Array.isArray(
                                    update.details.key_components
                                  ) &&
                                    update.details.key_components.length >
                                      0 && (
                                      <div>
                                        <p className="font-medium text-xs text-slate-600 dark:text-slate-300 mb-1">
                                          Key Components:
                                        </p>
                                        <ul className="list-disc pl-5 text-xs text-slate-500 dark:text-slate-400">
                                          {update.details.key_components.map(
                                            (component: string, i: number) => (
                                              <li key={i}>{component}</li>
                                            )
                                          )}
                                        </ul>
                                      </div>
                                    )}

                                  {Array.isArray(
                                    update.details.potential_code_areas
                                  ) &&
                                    update.details.potential_code_areas.length >
                                      0 && (
                                      <div>
                                        <p className="font-medium text-xs text-slate-600 dark:text-slate-300 mb-1">
                                          Potential Code Areas:
                                        </p>
                                        <ul className="list-disc pl-5 text-xs text-slate-500 dark:text-slate-400">
                                          {update.details.potential_code_areas.map(
                                            (area: string, i: number) => (
                                              <li key={i}>{area}</li>
                                            )
                                          )}
                                        </ul>
                                      </div>
                                    )}
                                </div>
                              )}

                            {update.step.includes("context_evaluation") &&
                              typeof update.details === "object" &&
                              "reasoning" in update.details && (
                                <div className="space-y-3">
                                  <div>
                                    <p className="font-medium text-xs text-slate-600 dark:text-slate-300 mb-1">
                                      Context Evaluation:
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                      {String(update.details.reasoning)}
                                    </p>
                                  </div>

                                  {"is_sufficient" in update.details && (
                                    <div className="flex items-center gap-2">
                                      <Badge
                                        className={
                                          update.details.is_sufficient
                                            ? "bg-green-100 text-green-800"
                                            : "bg-amber-100 text-amber-800"
                                        }
                                      >
                                        {update.details.is_sufficient
                                          ? "Sufficient Information"
                                          : "Insufficient Information"}
                                      </Badge>

                                      {"iteration" in update.details &&
                                        "max_iterations" in update.details && (
                                          <Badge
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            Iteration{" "}
                                            {String(update.details.iteration)}/
                                            {String(
                                              update.details.max_iterations
                                            )}
                                          </Badge>
                                        )}
                                    </div>
                                  )}

                                  {Array.isArray(
                                    update.details.missing_information
                                  ) &&
                                    update.details.missing_information.length >
                                      0 && (
                                      <div>
                                        <p className="font-medium text-xs text-slate-600 dark:text-slate-300 mb-1">
                                          Missing Information:
                                        </p>
                                        <ul className="list-disc pl-5 text-xs text-slate-500 dark:text-slate-400">
                                          {Array.isArray(
                                            update.details.missing_information
                                          ) &&
                                            update.details.missing_information.map(
                                              (info: unknown, i: number) => (
                                                <li key={i}>{String(info)}</li>
                                              )
                                            )}
                                        </ul>
                                      </div>
                                    )}

                                  {Array.isArray(
                                    update.details.next_retrievals
                                  ) &&
                                    update.details.next_retrievals.length >
                                      0 && (
                                      <div>
                                        <p className="font-medium text-xs text-slate-600 dark:text-slate-300 mb-1">
                                          Next Retrievals:
                                        </p>
                                        <ul className="list-disc pl-5 text-xs text-slate-500 dark:text-slate-400">
                                          {update.details.next_retrievals.map(
                                            (
                                              retrieval: {
                                                collection: unknown;
                                                query: unknown;
                                              },
                                              i: number
                                            ) => (
                                              <li key={i}>
                                                <strong>
                                                  {String(retrieval.collection)}
                                                  :
                                                </strong>{" "}
                                                {String(retrieval.query)}
                                              </li>
                                            )
                                          )}
                                        </ul>
                                      </div>
                                    )}
                                </div>
                              )}

                            {update.step === "task_generation_complete" &&
                              typeof update.details === "object" &&
                              "task_count" in update.details && (
                                <div className="space-y-3">
                                  <div>
                                    <p className="font-medium text-xs text-slate-600 dark:text-slate-300 mb-1">
                                      Task Generation Complete:
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                      Generated{" "}
                                      {String(update.details.task_count)}{" "}
                                      development tasks
                                    </p>
                                  </div>

                                  {Array.isArray(update.details.task_preview) &&
                                    update.details.task_preview.length > 0 && (
                                      <div>
                                        <p className="font-medium text-xs text-slate-600 dark:text-slate-300 mb-1">
                                          Task Preview:
                                        </p>
                                        <ul className="list-disc pl-5 text-xs text-slate-500 dark:text-slate-400">
                                          {update.details.task_preview.map(
                                            (
                                              task: {
                                                id?: number;
                                                title: string;
                                                complexity?: string;
                                              },
                                              i: number
                                            ) => (
                                              <li
                                                key={i}
                                                className="flex items-start gap-2"
                                              >
                                                <span className="font-medium">
                                                  Task {task.id || i + 1}:
                                                </span>
                                                <span>{task.title}</span>
                                                {task.complexity && (
                                                  <Badge className="ml-auto text-[10px]">
                                                    {task.complexity}
                                                  </Badge>
                                                )}
                                              </li>
                                            )
                                          )}
                                        </ul>
                                      </div>
                                    )}
                                </div>
                              )}

                            {update.step === "final_analysis_complete" &&
                              typeof update.details === "object" && (
                                <div className="space-y-3">
                                  {"requirement_summary" in update.details && (
                                    <div>
                                      <p className="font-medium text-xs text-slate-600 dark:text-slate-300 mb-1">
                                        Final Summary:
                                      </p>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {String(
                                          update.details.requirement_summary
                                        )}
                                      </p>
                                    </div>
                                  )}

                                  {"key_components_count" in update.details && (
                                    <div className="flex gap-3">
                                      <div className="flex items-center gap-1">
                                        <Badge
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          Components:{" "}
                                          {String(
                                            update.details.key_components_count
                                          )}
                                        </Badge>
                                      </div>

                                      {"tasks_count" in update.details && (
                                        <div className="flex items-center gap-1">
                                          <Badge
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            Tasks:{" "}
                                            {String(update.details.tasks_count)}
                                          </Badge>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
