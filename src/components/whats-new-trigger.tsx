"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Star, Zap, Gift, Rocket, Crown, Gem } from "lucide-react";
import { useWhatsNew } from "@/hooks/use-whats-new";
import { WhatsNewModal } from "./whats-new-modal";
import { cn } from "@/lib/utils";

interface WhatsNewTriggerProps {
  variant?: "button" | "badge" | "enhanced" | "floating" | "mega" | "royal";
  className?: string;
}

export function WhatsNewTrigger({
  variant = "enhanced",
  className = "",
}: WhatsNewTriggerProps) {
  const { isModalOpen, hasSeenVersion, showModal, hideModal, markAsSeen } =
    useWhatsNew();

  if (variant === "badge" && hasSeenVersion) {
    return null; // Don't show badge if user has already seen the updates
  }

  return (
    <>
      {variant === "mega" ? (
        /* Ultra-enhanced mega button with maximum visual impact */
        <div className="relative group">
          {/* Multiple layered glow effects */}
          <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 via-pink-600 via-blue-600 to-cyan-600 rounded-xl blur-lg opacity-40 group-hover:opacity-70 animate-pulse"></div>
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-pink-500 via-blue-500 to-cyan-500 rounded-lg blur opacity-50 group-hover:opacity-80 animate-glow"></div>

          <Button
            onClick={showModal}
            className={cn(
              "relative bg-gradient-to-r from-purple-600 via-pink-600 via-blue-600 to-cyan-600 hover:from-purple-700 hover:via-pink-700 hover:via-blue-700 hover:to-cyan-700",
              "text-white border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-110 hover:-translate-y-1",
              "px-6 py-3 font-bold text-sm rounded-lg overflow-hidden",
              "animate-float",
              className
            )}
          >
            {/* Shimmer overlay effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 animate-shimmer"></div>

            {/* Multiple sparkle animations at different positions */}
            <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping opacity-75"></div>
              <div className="absolute top-1 left-2 w-1.5 h-1.5 bg-white/80 rounded-full animate-pulse delay-75"></div>
              <div className="absolute bottom-1 right-3 w-2 h-2 bg-white/60 rounded-full animate-bounce delay-150"></div>
              <div className="absolute top-2 right-1/2 w-1 h-1 bg-white/90 rounded-full animate-ping delay-300"></div>
              <div className="absolute bottom-2 left-3 w-1.5 h-1.5 bg-white/70 rounded-full animate-pulse delay-500"></div>
            </div>

            {/* Icon with enhanced animation */}
            <Rocket className="h-5 w-5 mr-3 animate-wiggle" />

            {/* Text with enhanced styling */}
            <span className="relative z-10 bg-gradient-to-r from-white via-yellow-100 to-white bg-clip-text tracking-wide">
              What&apos;s NEW
            </span>

            {/* Enhanced MVP2 badge with glow */}
            <div className="relative ml-3">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur-sm opacity-60 animate-pulse"></div>
              <Badge
                variant="secondary"
                className="relative bg-gradient-to-r from-yellow-400 to-orange-500 text-black border-0 text-xs font-bold animate-bounce-slow shadow-lg"
              >
                MVP2 🚀
              </Badge>
            </div>

            {/* Notification indicators for unseen */}
            {!hasSeenVersion && (
              <>
                {/* Primary notification dot */}
                <div className="absolute -top-2 -right-2 h-4 w-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-ping"></div>
                <div className="absolute -top-2 -right-2 h-4 w-4 bg-red-500 rounded-full shadow-lg">
                  <div className="absolute inset-0.5 bg-white rounded-full animate-pulse"></div>
                </div>

                {/* Secondary glow ring */}
                <div className="absolute -top-3 -right-3 h-6 w-6 border-2 border-red-400 rounded-full animate-ping opacity-50"></div>
              </>
            )}
          </Button>
        </div>
      ) : variant === "royal" ? (
        /* Royal/Premium variant with crown and luxury feel */
        <div className="relative group">
          {/* Royal glow with golden tones */}
          <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 rounded-xl blur-lg opacity-30 group-hover:opacity-60 animate-glow"></div>
          <div className="absolute -inset-1 bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 rounded-lg blur opacity-40 group-hover:opacity-70 animate-pulse-slow"></div>

          <Button
            onClick={showModal}
            className={cn(
              "relative bg-gradient-to-r from-yellow-500 via-amber-600 to-orange-600 hover:from-yellow-600 hover:via-amber-700 hover:to-orange-700",
              "text-white border-2 border-yellow-300/50 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105",
              "px-5 py-2.5 font-semibold text-sm rounded-lg",
              className
            )}
          >
            {/* Royal sparkles */}
            <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
              <Gem className="absolute top-1 left-1 h-2 w-2 text-yellow-200 animate-pulse" />
              <Star className="absolute bottom-1 right-1 h-2 w-2 text-yellow-200 animate-spin-slow" />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-yellow-200 rounded-full animate-ping"></div>
            </div>

            {/* Crown icon */}
            <Crown className="h-4 w-4 mr-2 animate-float" />

            {/* Royal text */}
            <span className="relative z-10 bg-gradient-to-r from-yellow-100 to-white bg-clip-text">
              What&apos;s New
            </span>

            {/* MVP2 badge */}
            <Badge
              variant="secondary"
              className="ml-2 bg-white/20 text-yellow-100 border-yellow-300/30 text-xs font-medium animate-pulse"
            >
              MVP2 ✨
            </Badge>

            {/* Royal notification */}
            {!hasSeenVersion && (
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-bounce">
                <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-pink-400 rounded-full animate-ping"></div>
              </div>
            )}
          </Button>
        </div>
      ) : variant === "enhanced" ? (
        /* Enhanced gradient button with animations */
        <div className="relative group">
          {/* Enhanced animated glow effect */}
          <div className="absolute -inset-1.5 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-lg blur opacity-40 group-hover:opacity-70 transition duration-1000 group-hover:duration-200 animate-pulse-slow"></div>
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-md blur-sm opacity-60 group-hover:opacity-90 animate-glow"></div>

          <Button
            onClick={showModal}
            className={cn(
              "relative bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105",
              "px-4 py-2 font-semibold overflow-hidden",
              className
            )}
            size="sm"
          >
            {/* Enhanced shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-shimmer"></div>

            {/* Enhanced sparkle animation */}
            <div className="absolute inset-0 overflow-hidden rounded-md pointer-events-none">
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-ping opacity-75"></div>
              <div className="absolute top-1 left-1 w-1 h-1 bg-white/60 rounded-full animate-pulse delay-75"></div>
              <div className="absolute bottom-1 right-2 w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce delay-150"></div>
              <div className="absolute top-2 right-1/3 w-1 h-1 bg-white/80 rounded-full animate-ping delay-300"></div>
            </div>

            {/* Icon with enhanced animation */}
            <Sparkles className="h-4 w-4 mr-2 animate-spin-slow" />

            {/* Text with gradient and glow */}
            <span className="relative z-10 bg-gradient-to-r from-white to-white/90 bg-clip-text font-medium">
              What&apos;s New
            </span>

            {/* Enhanced MVP2 badge */}
            <Badge
              variant="secondary"
              className="ml-2 bg-white/20 text-white border-white/30 text-xs animate-bounce-slow shadow-sm"
            >
              MVP2 ✨
            </Badge>

            {/* Enhanced notification dot for unseen */}
            {!hasSeenVersion && (
              <>
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-ping"></div>
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full shadow-lg">
                  <div className="absolute inset-0.5 bg-white rounded-full animate-pulse"></div>
                </div>
              </>
            )}
          </Button>
        </div>
      ) : variant === "floating" ? (
        /* Enhanced floating action button style */
        <div className="fixed bottom-6 right-6 z-50 group">
          {/* Multi-layer glow effect */}
          <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full blur-xl opacity-40 group-hover:opacity-70 animate-pulse-slow"></div>
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur-lg opacity-60 group-hover:opacity-90 animate-glow"></div>

          <Button
            onClick={showModal}
            size="lg"
            className={cn(
              "relative h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600",
              "text-white border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-110 hover:-translate-y-2",
              "animate-float overflow-hidden",
              className
            )}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 animate-shimmer"></div>

            {/* Floating sparkles */}
            <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
              <div className="absolute top-2 left-2 w-1 h-1 bg-white rounded-full animate-ping delay-100"></div>
              <div className="absolute bottom-3 right-2 w-1.5 h-1.5 bg-white/80 rounded-full animate-pulse delay-200"></div>
              <div className="absolute top-3 right-3 w-1 h-1 bg-white/60 rounded-full animate-bounce delay-300"></div>
            </div>

            <Gift className="h-7 w-7 animate-wiggle" />

            {/* Enhanced notification for unseen */}
            {!hasSeenVersion && (
              <>
                <div className="absolute -top-2 -right-2 h-5 w-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-bounce shadow-lg">
                  <div className="absolute inset-0.5 bg-white rounded-full animate-pulse"></div>
                </div>
                <div className="absolute -top-3 -right-3 h-7 w-7 border-2 border-red-400 rounded-full animate-ping opacity-50"></div>
              </>
            )}
          </Button>

          {/* Enhanced tooltip with animation */}
          <div className="absolute bottom-full right-0 mb-3 px-4 py-2 bg-gradient-to-r from-black to-gray-800 text-white text-sm rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap shadow-xl transform group-hover:scale-105">
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
            ✨ Discover MVP2 Features! 🚀
          </div>
        </div>
      ) : variant === "button" ? (
        /* Enhanced original button with premium effects */
        <div className="relative">
          {/* Subtle background glow */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 rounded-lg blur-sm opacity-20 group-hover:opacity-40 transition-all duration-300"></div>

          <Button
            onClick={showModal}
            variant="outline"
            size="sm"
            className={cn(
              "relative border-2 border-dashed border-purple-400 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all duration-300 group",
              "hover:shadow-lg hover:shadow-purple-500/25 transform hover:scale-105 overflow-hidden",
              !hasSeenVersion && "animate-pulse-slow",
              className
            )}
          >
            {/* Subtle shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-100/20 to-transparent transform -skew-x-12 opacity-0 group-hover:opacity-100 animate-shimmer"></div>

            <Sparkles className="h-4 w-4 mr-2 text-purple-500 animate-spin-slow" />
            <span className="font-medium">What&apos;s New</span>

            {!hasSeenVersion && (
              <>
                <Zap className="h-3 w-3 ml-1 text-yellow-500 animate-bounce" />
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-ping"></div>
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full shadow-sm">
                  <div className="absolute inset-0.5 bg-white rounded-full animate-pulse"></div>
                </div>
              </>
            )}
          </Button>
        </div>
      ) : (
        /* Enhanced badge variant with premium styling */
        <div className="relative group">
          {/* Multi-layer glow effects */}
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full blur opacity-50 group-hover:opacity-70 animate-pulse-slow"></div>
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 rounded-full blur-sm opacity-60 group-hover:opacity-90 animate-glow"></div>

          <Badge
            variant="secondary"
            className={cn(
              "relative cursor-pointer bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white border-0",
              "hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-xl",
              "px-4 py-2 font-bold text-sm overflow-hidden",
              className
            )}
            onClick={showModal}
          >
            {/* Shimmer overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 animate-shimmer"></div>

            {/* Sparkle effects */}
            <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
              <div className="absolute top-0.5 left-1 w-1 h-1 bg-white/80 rounded-full animate-ping delay-100"></div>
              <div className="absolute bottom-0.5 right-1 w-1 h-1 bg-white/60 rounded-full animate-pulse delay-200"></div>
            </div>

            <Star className="h-3 w-3 mr-1.5 animate-spin-slow" />
            <span className="relative z-10">New Features</span>
            <div className="ml-2 h-2 w-2 bg-white rounded-full animate-bounce-slow" />

            {/* Notification dot for badge */}
            {!hasSeenVersion && (
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-ping shadow-lg">
                <div className="absolute inset-0.5 bg-white rounded-full animate-pulse"></div>
              </div>
            )}
          </Badge>
        </div>
      )}

      <WhatsNewModal
        isOpen={isModalOpen}
        onClose={hideModal}
        onMarkAsSeen={markAsSeen}
      />
    </>
  );
}
