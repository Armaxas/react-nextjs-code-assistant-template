"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface PageContentLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContentLayout({
  children,
  className,
}: PageContentLayoutProps) {
  return (
    <main
      className={cn("py-6 px-6 md:px-10 max-w-full min-h-screen", className)}
    >
      <div className="w-full max-w-7xl mx-auto">{children}</div>
    </main>
  );
}
