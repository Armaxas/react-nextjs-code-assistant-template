import { cn } from "@/lib/utils";
import { ModernSpinner } from "./modern-spinners";

interface SpinnerProps {
  className?: string;
  variant?: "neural" | "code" | "quantum" | "orbital" | "matrix" | "dna";
  size?: "sm" | "md" | "lg";
}

export function Spinner({
  className,
  variant = "neural",
  size = "md",
}: SpinnerProps) {
  return (
    <ModernSpinner
      className={cn("text-current", className)}
      variant={variant}
      size={size}
    />
  );
}
