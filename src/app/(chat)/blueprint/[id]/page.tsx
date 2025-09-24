"use client";

import React, { useEffect, useState, useRef } from "react";
import { useChat } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";
import { RequirementBlueprint } from "@/components/requirement-blueprint";

export default function BlueprintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Define interface for the ref
  interface MultimodalInputRef {
    processDroppedFiles: (files: File[]) => Promise<void>;
    setInput: (text: string) => void;
  }

  // Add ref to MultimodalInput component with correct type
  const multimodalInputRef = useRef<MultimodalInputRef>(null);

  const [id, setId] = useState<string>("");

  // Extract id from params
  useEffect(() => {
    params.then(({ id }) => setId(id));
  }, [params]);

  const { isLoading } = useChat({
    api: "/api/chat/stream", // Replace with actual API endpoint from urls
    id,
    userId: undefined,
    initialMessages: [],
    onFinish: () => {},
    onChatResetFinish: () => {},
  });

  // Track active and completed queries
  const [activeQuery, setActiveQuery] = useState<string | undefined>();
  const [completedQueries, setCompletedQueries] = useState<string[]>([]);

  // Handle selection of a query from the blueprint
  const handleQuerySelect = (query: string) => {
    if (multimodalInputRef.current) {
      multimodalInputRef.current.setInput(query);
      const queryId = `query-${completedQueries.length + 1}`;
      setActiveQuery(queryId);
    }
  };

  // Update query status when messages change
  useEffect(() => {
    if (!isLoading && activeQuery) {
      // When loading stops, move active query to completed
      setCompletedQueries((prev) => [...prev, activeQuery]);
      setActiveQuery(undefined);
    }
  }, [isLoading, activeQuery]);

  // Add drag and drop state
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Handle file drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);

    const items = Array.from(e.dataTransfer.items);
    const fileItems = items.filter((item) => item.kind === "file");

    if (fileItems.length && multimodalInputRef.current) {
      const files = fileItems
        .map((item) => item.getAsFile())
        .filter(Boolean) as File[];
      await multimodalInputRef.current.processDroppedFiles(files);
    }
  };

  return (
    <div
      className={cn(
        "relative flex-1 flex flex-col items-stretch h-full w-full overflow-hidden",
        isDraggingOver && "bg-blue-50 dark:bg-blue-950/30"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
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
