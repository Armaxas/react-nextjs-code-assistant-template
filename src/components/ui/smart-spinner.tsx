import { ModernSpinner } from "@/components/ui/modern-spinners";

// Context-aware spinner selection
export type SpinnerContext =
  | "ai-processing"
  | "code-generation"
  | "data-analysis"
  | "system-operation"
  | "thinking"
  | "general";

export function getSpinnerVariant(context: SpinnerContext) {
  switch (context) {
    case "ai-processing":
      return "neural" as const;
    case "code-generation":
      return "code" as const;
    case "data-analysis":
      return "orbital" as const;
    case "system-operation":
      return "matrix" as const;
    case "thinking":
      return "quantum" as const;
    case "general":
    default:
      return "dna" as const;
  }
}

// Smart spinner component that automatically selects variant based on context
interface SmartSpinnerProps {
  context: SpinnerContext;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function SmartSpinner({
  context,
  size = "md",
  className,
}: SmartSpinnerProps) {
  const variant = getSpinnerVariant(context);
  return <ModernSpinner variant={variant} size={size} className={className} />;
}

// Preset spinner components for common use cases
export function AIProcessingSpinner({
  size = "md",
  className,
}: Omit<SmartSpinnerProps, "context">) {
  return (
    <SmartSpinner context="ai-processing" size={size} className={className} />
  );
}

export function CodeGenerationSpinner({
  size = "md",
  className,
}: Omit<SmartSpinnerProps, "context">) {
  return (
    <SmartSpinner context="code-generation" size={size} className={className} />
  );
}

export function DataAnalysisSpinner({
  size = "md",
  className,
}: Omit<SmartSpinnerProps, "context">) {
  return (
    <SmartSpinner context="data-analysis" size={size} className={className} />
  );
}

export function ThinkingSpinner({
  size = "md",
  className,
}: Omit<SmartSpinnerProps, "context">) {
  return <SmartSpinner context="thinking" size={size} className={className} />;
}
