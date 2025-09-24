"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  CheckCircledIcon,
  CircleIcon,
  Cross2Icon,
} from "@radix-ui/react-icons";

type PlanStep = {
  name: string;
  status: "pending" | "in-progress" | "completed";
};

type ImplementationPlanProps = {
  steps: PlanStep[];
  onClose?: () => void;
};

export function ImplementationPlan({
  steps,
  onClose,
}: ImplementationPlanProps) {
  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex justify-between items-center mb-4">
        <Alert className="flex-1 h-auto">
          <AlertDescription>
            <h3 className="font-semibold">Implementation Plan</h3>
          </AlertDescription>
        </Alert>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="ml-2"
          >
            <Cross2Icon className="h-4 w-4" />
          </Button>
        )}
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start gap-3 text-sm">
              <div className="mt-1">
                {step.status === "completed" ? (
                  <CheckCircledIcon className="h-5 w-5 text-green-500" />
                ) : step.status === "in-progress" ? (
                  <div className="animate-pulse">
                    <CircleIcon className="h-5 w-5 text-blue-500" />
                  </div>
                ) : (
                  <CircleIcon className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <p
                  className={
                    step.status === "completed"
                      ? "text-muted-foreground line-through"
                      : ""
                  }
                >
                  {step.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
