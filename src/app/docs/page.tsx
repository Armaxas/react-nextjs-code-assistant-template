"use client";

import React from "react";
import { BackgroundGradientAnimation } from "@/components/ui/aceternity/background-gradient-animation";
import { Navbar } from "@/components/Navbar";
import Documentation from "@/components/Documentation";
import { useSession } from "next-auth/react"; // Import useSession hook

const DocumentationPage = () => {
  // Add fallback for server-side rendering
  const { data: session } = useSession() || {};

  return (
    <BackgroundGradientAnimation>
      <Navbar session={session} />
      <div className="min-h-screen relative overflow-hidden bg-dark-gradient">
        <div className="container mx-auto px-4 pt-20 pb-32">
          {/* Header section with consistent styling */}
          <div className="relative mb-8 mt-10">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 blur-3xl" />
            {/* <h1 className="relative text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400 font-display tracking-tight text-center mb-8">
              Documentation
            </h1> */}
          </div>

          {/* Documentation component with session prop */}
          <Documentation />
        </div>
      </div>
    </BackgroundGradientAnimation>
  );
};

export default DocumentationPage;
