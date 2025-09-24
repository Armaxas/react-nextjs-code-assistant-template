import React from "react";
import { ProgressUpdate } from "@/types/requirement-analyzer";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Check, Clock } from "lucide-react";
import { ModernSpinner } from "@/components/ui/modern-spinners";

interface AnalysisProgressProps {
  progress: ProgressUpdate | null;
  error?: string;
}

export function AnalysisProgress({ progress, error }: AnalysisProgressProps) {
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

  if (!progress) {
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

  const isComplete = progress.progress_percentage >= 100;

  return (
    <Card className="border-blue-500/20 shadow-sm">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-3">
          {isComplete ? (
            <Check className="h-6 w-6 text-green-500" />
          ) : (
            <ModernSpinner
              variant="matrix"
              size="md"
              className="text-blue-500"
            />
          )}
          <div>
            <h3 className="font-medium">
              {isComplete ? "Analysis Complete" : "Analysis in Progress"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {progress.description}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>
              {progress.step
                .replace(/_/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase())}
            </span>
            <span>{Math.round(progress.progress_percentage)}%</span>
          </div>
          <Progress value={progress.progress_percentage} className="h-2" />
        </div>

        {progress.details && progress.step.includes("_complete") && (
          <div className="bg-blue-50/10 rounded-md p-3 text-sm">
            {progress.step === "initial_analysis_complete" &&
              typeof progress.details === "object" &&
              "requirement_summary" in progress.details && (
                <div className="space-y-2">
                  <p className="font-medium">Initial Summary:</p>
                  <p className="text-muted-foreground">
                    {String(progress.details.requirement_summary)}
                  </p>

                  {Array.isArray(progress.details.key_components) &&
                    progress.details.key_components.length > 0 && (
                      <div>
                        <p className="font-medium mt-3">Key Components:</p>
                        <ul className="list-disc pl-5 text-muted-foreground">
                          {progress.details.key_components.map(
                            (component: string, index: number) => (
                              <li key={index}>{component}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                </div>
              )}

            {progress.step === "context_evaluation_0_complete" &&
              typeof progress.details === "object" &&
              "reasoning" in progress.details && (
                <div className="space-y-2">
                  <p className="font-medium">Context Evaluation:</p>
                  <p className="text-muted-foreground">
                    {String(progress.details.reasoning)}
                  </p>

                  {Array.isArray(progress.details.missing_information) &&
                    progress.details.missing_information.length > 0 && (
                      <div>
                        <p className="font-medium mt-3">Missing Information:</p>
                        <ul className="list-disc pl-5 text-muted-foreground">
                          {progress.details.missing_information.map(
                            (info: string, index: number) => (
                              <li key={index}>{info}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                </div>
              )}

            {progress.step === "task_generation_complete" &&
              typeof progress.details === "object" &&
              "task_count" in progress.details && (
                <div className="space-y-2">
                  <p className="font-medium">Task Generation Complete:</p>
                  <p className="text-muted-foreground">
                    Generated {String(progress.details.task_count)} development
                    tasks
                  </p>

                  {Array.isArray(progress.details.task_preview) &&
                    progress.details.task_preview.length > 0 && (
                      <div>
                        <p className="font-medium mt-3">Task Preview:</p>
                        <ul className="list-disc pl-5 text-muted-foreground">
                          {progress.details.task_preview.map(
                            (task: { title: string }, index: number) => (
                              <li key={index}>{task.title}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                </div>
              )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
