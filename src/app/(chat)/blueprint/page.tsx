"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { RequirementBlueprint } from "@/components/requirement-blueprint";
import { useTheme } from "next-themes";

export default function BlueprintPage() {
  const router = useRouter();
  const { theme, systemTheme } = useTheme();
  const selectedTheme = theme !== "system" ? theme : systemTheme;

  const [activeQuery, setActiveQuery] = useState<string | undefined>();
  const [completedQueries, setCompletedQueries] = useState<string[]>([]);

  const handleQuerySelect = (query: string) => {
    if (activeQuery) {
      setCompletedQueries([...completedQueries, activeQuery]);
      setActiveQuery(undefined);
    }
    // Execute immediately when a query is selected
    router.push(`/chat?query=${encodeURIComponent(query)}`);
  };

  return (
    <div
      className={cn(
        "flex h-screen flex-col overflow-hidden bg-background",
        selectedTheme === "light" ? "bg-light-background" : "bg-dark-background"
      )}
    >
      {/* Blueprint Header with View Mode Toggle */}
      {/* <BlueprintHeader currentMode="blueprint" /> */}

      {/* Main Content */}
      <div className="flex-1 overflow-auto relative flex">
        {/* Blueprint Column */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <RequirementBlueprint onQuerySelect={handleQuerySelect} />
        </div>
      </div>
    </div>
  );
}
