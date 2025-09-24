"use client";
import React, { useEffect, useRef } from "react";

interface BackgroundGradientAnimationProps {
  children: React.ReactNode;
  className?: string;
}

export const BackgroundGradientAnimation: React.FC<
  BackgroundGradientAnimationProps
> = ({ children, className = "" }) => {
  const backgroundRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!backgroundRef.current) return;

      const { clientX, clientY } = e;
      const { width, height, left, top } =
        backgroundRef.current.getBoundingClientRect();

      const x = (clientX - left) / width;
      const y = (clientY - top) / height;

      backgroundRef.current.style.setProperty("--mouse-x", `${x * 100}%`);
      backgroundRef.current.style.setProperty("--mouse-y", `${y * 100}%`);
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      ref={backgroundRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        background:
          "radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(14, 165, 233, 0.15), rgba(14, 165, 233, 0) 40%)",
      }}
    >
      <div className="absolute inset-0 bg-[#030712]" />
      <div className="relative z-10">{children}</div>
    </div>
  );
};
