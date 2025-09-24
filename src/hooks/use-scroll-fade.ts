"use client";

import { useEffect, RefObject } from "react";

// This hook adds scroll-aware classes to elements
// It helps the scrollbar appear when actively scrolling and fade out when not scrolling
export function useScrollFade(ref: RefObject<HTMLElement>) {
  useEffect(() => {
    if (!ref.current) return;

    const element = ref.current;

    let scrollTimer: NodeJS.Timeout | null = null;
    let isScrolling = false;

    const handleScroll = () => {
      // If we're not already in scrolling state, add class immediately for responsive UI
      if (!isScrolling) {
        element.classList.add("is-scrolling");
        isScrolling = true;
      }

      // Clear existing timeout
      if (scrollTimer) {
        clearTimeout(scrollTimer);
      }

      // Set timeout to remove the class after scrolling stops
      scrollTimer = setTimeout(() => {
        element.classList.remove("is-scrolling");
        isScrolling = false;
      }, 800); // 0.8 second timeout - slightly faster for a more responsive feel
    };

    // Initial touch to show scrollbar on page load if needed
    if (element.scrollHeight > element.clientHeight) {
      element.classList.add("has-scrollbar");
    }

    // Add event listener
    element.addEventListener("scroll", handleScroll, { passive: true });

    // Handle window resize to check if scrollbar is needed
    const handleResize = () => {
      if (element.scrollHeight > element.clientHeight) {
        element.classList.add("has-scrollbar");
      } else {
        element.classList.remove("has-scrollbar");
      }
    };

    window.addEventListener("resize", handleResize, { passive: true });

    // Cleanup
    return () => {
      if (scrollTimer) {
        clearTimeout(scrollTimer);
      }
      element.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [ref]);
}
