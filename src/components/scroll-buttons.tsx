"use client";

import { useRef, useEffect, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

export default function ScrollButtons({
  targetRef,
}: {
  targetRef: React.RefObject<HTMLDivElement | null>;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isVisibleTop, setIsVisibleTop] = useState(false);
  const [isVisibleBottom, setIsVisibleBottom] = useState(false);

  useEffect(() => {
    const scrollableEle = targetRef.current;
    const parentEle = targetRef.current?.parentElement;

    if (!scrollableEle) {
      return;
    }

    if (!parentEle) {
      return;
    }

    const handleScrollToTop = () => {
      const atTop = parentEle.scrollTop <= 50;
      setIsVisibleTop(!atTop);
    };
    handleScrollToTop();
    setTimeout(handleScrollToTop, 100); // Delay to ensure correct measurements
    parentEle.addEventListener("scroll", handleScrollToTop);
    window.addEventListener("resize", handleScrollToTop); // Handle viewport resizing

    const handleScrollToBottom = () => {
      const atBottom =
        parentEle.scrollHeight - parentEle.scrollTop <=
        parentEle.clientHeight + 50;
      setIsVisibleBottom(!atBottom);
    };
    handleScrollToBottom();
    setTimeout(handleScrollToBottom, 100); // Delay to ensure correct measurements
    parentEle.addEventListener("scroll", handleScrollToBottom);
    window.addEventListener("resize", handleScrollToBottom); // Handle viewport resizing

    return () => {
      parentEle.removeEventListener("scroll", handleScrollToTop);
      window.removeEventListener("resize", handleScrollToTop);
      parentEle.removeEventListener("scroll", handleScrollToBottom);
      window.removeEventListener("resize", handleScrollToBottom);
    };
  }, [targetRef]);

  const scrollToTop = () => {
    if (!buttonRef) return;
    buttonRef.current?.parentElement?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToBottom = () => {
    if (!targetRef) return;
    targetRef?.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  };

  return (
    <>
      <Button
        ref={buttonRef}
        className={cn(
          "absolute cursor-pointer rounded-full bg-clip-padding border text-secondary-foreground right-1/2 translate-x-1/2 w-8 h-8 dark:bg-zinc-900 dark:hover:bg-zinc-800 bg-white hover:bg-gray-200 transition-all",
          isVisibleTop ? "opacity-100" : "opacity-0 pointer-events-none",
          isVisibleBottom ? "bottom-32" : "bottom-24"
        )}
        onClick={scrollToTop}
      >
        <ArrowUp size={14} />
      </Button>
      <Button
        ref={buttonRef}
        className={cn(
          "absolute bottom-16 cursor-pointer rounded-full bg-clip-padding border text-secondary-foreground right-1/2 translate-x-1/2 w-8 h-8 dark:bg-zinc-900 dark:hover:bg-zinc-800 bg-white hover:bg-gray-200 transition-all",
          isVisibleBottom ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={scrollToBottom}
      >
        <ArrowDown size={14} />
      </Button>
    </>
  );
}
